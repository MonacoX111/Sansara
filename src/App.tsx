import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { t } from "./utils/translations";
import Tabs from "./components/Tabs";
import PlayersTab from "./components/PlayersTab";
import TeamsTab from "./components/TeamsTab";
import TournamentsTab from "./components/TournamentsTab";
import HomeTab from "./components/HomeTab";
import GeneralTab from "./components/GeneralTab";
import LeaderboardTab from "./components/LeaderboardTab";
import AdminTab from "./components/AdminTab";
import ScrollToTop from "./components/ScrollToTop";
import "./styles.css";
import {
  achievementPlaceholder,
  gamesList,
  initialAchievements,
  initialMatches,
  initialPlayers,
  initialTeams,
  initialTournaments,
} from "./data";
import {
  Achievement,
  HomeAnnouncement,
  Match,
  MatchStatus,
  Placement,
  Player,
  TabKey,
  Team,
  Tournament,
  TournamentGroup,
  TournamentStatus,
  TournamentTeamRoster,
  Transfer,
} from "./types";
import {
  getNextId,
  parseList,
  readStorage,
  syncTeamPlayers,
  writeStorage,
} from "./utils";
import {
  handleSpotlightMove,
  handleSpotlightMoveCapture,
} from "./utils/spotlight";
import { isFirebaseConfigured, auth } from "./firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  deleteItem,
  deleteItemsBatch,
  loadCollection,
  saveItem,
} from "./firebaseDb";
import { generateBracketMatches } from "./domain/match/bracketGeneration";
import {
  getTopOrderForNewMatch,
  normalizeMatches,
  reorderMatchByOrder,
} from "./domain/match/matchOrdering";
import {
  recalculateAllPlayersElo,
  recalculatePlayerRanks,
} from "./domain/player/playerElo";
import { saveTournamentMutation } from "./application/tournamentMutations";
import { saveMatchMutation } from "./application/matchMutations";

type PlayerForm = {
  nickname: string;
  fullName: string;
  teamId: number;
  teamHistory: NonNullable<Player["teamHistory"]>;
  games: string;
  wins: number;
  losses: number;
  earnings: number;
  tournamentsWon: number;
  rank: number;
  elo: number;
  bio: string;
  isFeatured: boolean;
  avatar: string;
};

type TeamForm = {
  name: string;
  logo: string;
  games: string;
  wins: number;
  earnings: number;
  description: string;
  isFeatured: boolean;
};

type TournamentForm = {
  title: string;
  game: string;
  type: string;
  format: string;
  status: TournamentStatus;
  date: string;
  prize: string;
  description: string;
  imageUrl: string;
  participantType: "player" | "team" | "squad";
  participantIds: number[];
  teamRosters?: TournamentTeamRoster[];
  groups: TournamentGroup[];
  winnerId?: number;
  winnerTeamId?: number;
  winnerSquadIds?: number[];
  mvpId?: number;
  placements: Placement[];
  isPublished: boolean;
};

type MatchForm = {
  game: string;
  matchType: "player" | "team";
  player1: number;
  player2: number;
  team1: number;
  team2: number;
  score: string;
  winnerId: number;
  winnerTeamId: number;
  tournamentId: number;
  date: string;
  status: MatchStatus;
  round: string;
  stage: "group" | "playoff" | "final" | "showmatch";
  groupName: string;
  roundLabel: string;

  seriesId?: string;
  nextSeriesId?: string; // ? ??? ?? ???????

  bestOf: number;
  notes: string;
};

type HomeAnnouncementForm = {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  date: string;
  prize: string;
  format: string;
  status: string;
  description: string;
  participantCount: number;
  participantLabelType: "players" | "teams";
  tournamentId?: number;
  isVisible: boolean;
};

const createEmptyPlayerForm = (nextRank = 1): PlayerForm => ({
  nickname: "",
  fullName: "",
  teamId: 0,
  teamHistory: [],
  games: "",
  wins: 0,
  losses: 0,
  earnings: 0,
  tournamentsWon: 0,
  rank: nextRank,
  elo: 1000,
  bio: "",
  isFeatured: false,
  avatar: "",
});

const normalizePlayerTeamHistory = (
  player: Player,
  currentTeamId: number
): NonNullable<Player["teamHistory"]> => {
  const seen = new Set<number>();
  const rawHistory = Array.isArray(player.teamHistory) ? player.teamHistory : [];
  const history =
    rawHistory.length > 0
      ? rawHistory
      : currentTeamId
      ? [{ teamId: currentTeamId, isCurrent: true }]
      : [];

  return history
    .map((item) => ({
      teamId: Number(item.teamId || 0),
      from: item.from,
      to: item.to,
      isCurrent:
        Boolean(item.isCurrent) || Number(item.teamId || 0) === currentTeamId,
    }))
    .filter((item) => {
      if (!item.teamId || seen.has(item.teamId)) return false;
      seen.add(item.teamId);
      return true;
    });
};

const createEmptyTeamForm = (): TeamForm => ({
  name: "",
  logo: "",
  games: "",
  wins: 0,
  earnings: 0,
  description: "",
  isFeatured: false,
});

const createEmptyTournamentForm = (): TournamentForm => ({
  title: "",
  game: "",
  type: "",
  format: "",
  status: "draft",
  date: "",
  prize: "",
  description: "",
  imageUrl: "",
  participantType: "player",
  participantIds: [],
  teamRosters: [],
  groups: [],
  winnerId: undefined,
  winnerTeamId: undefined,
  winnerSquadIds: [],
  mvpId: undefined,
  placements: [],
  isPublished: false,
});

const createEmptyMatchForm = (): MatchForm => ({
  seriesId: "",
  nextSeriesId: "",
  game: "",
  matchType: "player",
  player1: 0,
  player2: 0,
  team1: 0,
  team2: 0,
  score: "",
  winnerId: 0,
  winnerTeamId: 0,
  tournamentId: 0,
  date: "",
  status: "scheduled",
round: "",
stage: "group",
groupName: "",
roundLabel: "",
bestOf: 1,
  notes: "",
});

const createEmptyHomeAnnouncementForm = (): HomeAnnouncementForm => ({
  id: 1,
  title: "",
  subtitle: "",
  imageUrl: "",
  date: "",
  prize: "",
  format: "",
  status: "",
  description: "",
participantCount: 0,
participantLabelType: "players",
tournamentId: undefined,
  isVisible: true,
});

const normalizePlayers = (items: Player[]): Player[] =>
  recalculatePlayerRanks(
    items.map((player) => ({
      ...player,
      games: Array.isArray(player.games) ? player.games : [],
      avatar: player.avatar || achievementPlaceholder("P"),
      bio: player.bio || "",
      teamId: typeof player.teamId === "number" ? player.teamId : 0,
      wins: Number(player.wins || 0),
      losses: Number(player.losses || 0),
      earnings: Number(player.earnings || 0),
      tournamentsWon: Number(player.tournamentsWon || 0),
      rank: Number(player.rank || 0),
      elo: Number(player.elo || 1000),
      isFeatured: Boolean(player.isFeatured),
    }))
  );

const normalizeTeams = (items: Team[]): Team[] =>
  items.map((team) => ({
    ...team,
    games: Array.isArray(team.games) ? team.games : [],
    players: Array.isArray(team.players) ? team.players : [],
    logo: team.logo || achievementPlaceholder("T"),
    description: team.description || "",
    earnings: Number(team.earnings || 0),
    wins: Number(team.wins || 0),
    isFeatured: Boolean(team.isFeatured),
  }));

const normalizeTournaments = (items: Tournament[]): Tournament[] =>
  items.map((tournament, index) => ({
    ...tournament,
    order: typeof tournament.order === "number" ? tournament.order : index,
    format: tournament.format || "",
    status: tournament.status || "draft",
    description: tournament.description || "",
    imageUrl: tournament.imageUrl || "",
    participantType:
      tournament.participantType === "team"
        ? "team"
        : tournament.participantType === "squad"
        ? "squad"
        : "player",
    participantIds: Array.isArray(tournament.participantIds)
      ? tournament.participantIds.map(Number)
      : [],
    teamRosters: Array.isArray(tournament.teamRosters)
      ? tournament.teamRosters
          .filter((roster) => roster && typeof roster.teamId === "number")
          .map((roster) => ({
            teamId: Number(roster.teamId),
            playerIds: Array.isArray(roster.playerIds)
              ? roster.playerIds.map(Number)
              : [],
          }))
: [],
    groups: Array.isArray(tournament.groups)
      ? tournament.groups.map((group, groupIndex) => ({
          id: group.id || `group-${groupIndex + 1}`,
          name: group.name || `Group ${groupIndex + 1}`,
          participantIds: Array.isArray(group.participantIds)
            ? group.participantIds.map(Number)
            : [],
        }))
      : [],
    winnerId: typeof tournament.winnerId === "number" ? tournament.winnerId : 0,
    winnerTeamId:
      typeof tournament.winnerTeamId === "number" ? tournament.winnerTeamId : 0,
    winnerSquadIds: Array.isArray(tournament.winnerSquadIds)
      ? tournament.winnerSquadIds.map(Number)
      : [],
    mvpId: typeof tournament.mvpId === "number" ? tournament.mvpId : 0,
    placements: Array.isArray(tournament.placements)
      ? tournament.placements
          .filter(
            (item) =>
              item &&
              typeof item.place === "number" &&
              (typeof item.playerId === "number" ||
                typeof item.teamId === "number")
          )
          .map((item) => ({
            place: Number(item.place),
            playerId:
              typeof item.playerId === "number"
                ? Number(item.playerId)
                : undefined,
            teamId:
              typeof item.teamId === "number" ? Number(item.teamId) : undefined,
          }))
      : [],
    eloApplied:
      typeof tournament.eloApplied === "boolean"
        ? tournament.eloApplied
        : undefined,
    isPublished: Boolean(tournament.isPublished),
  }));

const normalizeAchievements = (items: Achievement[]): Achievement[] =>
  items.map((achievement) => ({
    ...achievement,
    title: achievement.title || "Achievement",
    description: achievement.description || "",
    image: achievement.image || achievementPlaceholder("A"),
    playerIds: Array.isArray(achievement.playerIds)
      ? achievement.playerIds
      : [],
  }));

const normalizeHomeAnnouncement = (
  item?: Partial<HomeAnnouncement> | null
): HomeAnnouncement => ({
  id: typeof item?.id === "number" ? Number(item.id) : 1,
  title: item?.title || "",
  subtitle: item?.subtitle || "",
  imageUrl: item?.imageUrl || "",
  date: item?.date || "",
  prize: item?.prize || "",
  format: item?.format || "",
  status: item?.status || "",
  description: item?.description || "",
participantCount: Number(item?.participantCount || 0),
participantLabelType:
  item?.participantLabelType === "teams" ? "teams" : "players",
tournamentId:
    typeof item?.tournamentId === "number" ? Number(item.tournamentId) : 0,
  isVisible: typeof item?.isVisible === "boolean" ? item.isVisible : true,
});

const getTabFromPath = (pathname: string): TabKey => {
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (firstSegment === "players") return "players";
  if (firstSegment === "teams") return "teams";
  if (firstSegment === "tournaments") return "tournaments";
  if (firstSegment === "leaderboard") return "leaderboard";
  if (firstSegment === "admin") return "admin";
  if (firstSegment === "general") return "general";

  return "home";
};

const getPathForTab = (tab: TabKey): string => {
  if (tab === "home") return "/";
  if (tab === "general") return "/general";
  return `/${tab}`;
};

const getRouteEntityId = (
  pathname: string,
  segment: "players" | "teams" | "tournaments"
): number | null => {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== segment || !parts[1]) return null;

  const id = Number(parts[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const isRouteListPath = (
  pathname: string,
  segment: "players" | "teams" | "tournaments"
): boolean => {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 1 && parts[0] === segment;
};

const unsafeUiStorageKeys = [
  "lang",
  "activeTab",
  "selectedPlayerId",
  "selectedTeamId",
  "selectedTournamentId",
  "selectedMatchId",
  "selectedAchievementId",
  "playerFilter",
  "gameFilter",
  "teamFilter",
  "sortMode",
];

const clearUnsafeUiStorage = () => {
  try {
    unsafeUiStorageKeys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore storage access failures; UI state should still remain in memory only.
  }
};

const isBrowserReload = (): boolean => {
  const navigationEntry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  return navigationEntry?.type === "reload";
};

export default function App() {
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || "";
  const location = useLocation();
  const navigate = useNavigate();
  const didCheckReloadRedirectRef = useRef(false);

  useEffect(() => {
    clearUnsafeUiStorage();
    document.documentElement.style.setProperty("--x", "50%");
    document.documentElement.style.setProperty("--y", "50%");
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && !ADMIN_PASSWORD) {
      console.warn(
        "REACT_APP_ADMIN_PASSWORD is not set. Admin login is disabled."
      );
    }
  }, [ADMIN_PASSWORD]);

  useEffect(() => {
    if (didCheckReloadRedirectRef.current) return;
    didCheckReloadRedirectRef.current = true;

    if (isBrowserReload() && location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

const handleGlow = handleSpotlightMove;

  const fallbackPlayers = useMemo(
    () => readStorage("tm_players", initialPlayers),
    []
  );
  const fallbackTeams = useMemo(
    () => readStorage("tm_teams", initialTeams),
    []
  );
  const fallbackTournaments = useMemo(
    () => readStorage("tm_tournaments", initialTournaments),
    []
  );
  const fallbackMatches = useMemo(
    () => readStorage("tm_matches", initialMatches),
    []
  );
  const fallbackAchievements = useMemo(
    () => readStorage("tm_achievements", initialAchievements),
    []
  );
  const fallbackHomeAnnouncement = useMemo(
    () =>
      normalizeHomeAnnouncement(
        readStorage("tm_home_announcement", createEmptyHomeAnnouncementForm())
      ),
    []
  );

  const [players, setPlayers] = useState<Player[]>(() =>
    normalizePlayers(fallbackPlayers)
  );
  const [teams, setTeams] = useState<Team[]>(() =>
    normalizeTeams(fallbackTeams)
  );
  const [tournaments, setTournaments] = useState<Tournament[]>(() =>
    normalizeTournaments(fallbackTournaments)
  );
  const [matches, setMatches] = useState<Match[]>(() =>
    normalizeMatches(fallbackMatches)
  );
  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    normalizeAchievements(fallbackAchievements)
  );
  const [transfers, setTransfers] = useState<Transfer[]>(() =>
    readStorage<Transfer[]>("tm_transfers", [])
  );
  const [homeAnnouncement, setHomeAnnouncement] = useState<HomeAnnouncement>(
    () => normalizeHomeAnnouncement(fallbackHomeAnnouncement)
  );

  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    getTabFromPath(location.pathname)
  );

  const [lang, setLang] = useState<"en" | "ua">("ua");

const [isLanguageSwitching, setIsLanguageSwitching] = useState(false);
const langTimerRef = useRef<number | null>(null);

const switchLanguage = (next: "en" | "ua") => {
  if (next === lang) return;
  if (langTimerRef.current !== null) {
    window.clearTimeout(langTimerRef.current);
  }
  setIsLanguageSwitching(true);
  langTimerRef.current = window.setTimeout(() => {
    setLang(next);
    langTimerRef.current = window.setTimeout(() => {
      setIsLanguageSwitching(false);
      langTimerRef.current = null;
    }, 180);
  }, 140);
};

useEffect(() => {
  return () => {
    if (langTimerRef.current !== null) {
      window.clearTimeout(langTimerRef.current);
      langTimerRef.current = null;
    }
  };
}, []);

  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(
    () => getRouteEntityId(location.pathname, "players") || 0
  );
  const [selectedTeamId, setSelectedTeamId] = useState<number>(
    () => getRouteEntityId(location.pathname, "teams") || 0
  );
  const [selectedTournamentId, setSelectedTournamentId] = useState<number>(
    () => getRouteEntityId(location.pathname, "tournaments") || 0
  );
  const [selectedMatchId, setSelectedMatchId] = useState<number>(0);
  const [selectedAchievementId, setSelectedAchievementId] = useState<number>(0);

  useEffect(() => {
    const nextTab = getTabFromPath(location.pathname);
    setActiveTab((currentTab) => (currentTab === nextTab ? currentTab : nextTab));
  }, [location.pathname]);

  useEffect(() => {
    const playerId = getRouteEntityId(location.pathname, "players");
    if (isRouteListPath(location.pathname, "players")) {
      setSelectedPlayerId(0);
    } else if (playerId !== null) {
      setSelectedPlayerId(playerId);
    }

    const teamId = getRouteEntityId(location.pathname, "teams");
    if (isRouteListPath(location.pathname, "teams")) {
      setSelectedTeamId(0);
    } else if (teamId !== null) {
      setSelectedTeamId(teamId);
    }

    const tournamentId = getRouteEntityId(location.pathname, "tournaments");
    if (isRouteListPath(location.pathname, "tournaments")) {
      setSelectedTournamentId(0);
    } else if (tournamentId !== null) {
      setSelectedTournamentId(tournamentId);
    }
  }, [location.pathname]);

  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortMode, setSortMode] = useState("elo");

  const [playerForm, setPlayerForm] = useState<PlayerForm>(
    createEmptyPlayerForm(fallbackPlayers.length + 1)
  );
  const [teamForm, setTeamForm] = useState<TeamForm>(createEmptyTeamForm());
  const [tournamentForm, setTournamentForm] = useState<TournamentForm>(
    createEmptyTournamentForm()
  );
  const [matchForm, setMatchForm] = useState<MatchForm>(createEmptyMatchForm());  
  const [homeAnnouncementForm, setHomeAnnouncementForm] =
    useState<HomeAnnouncementForm>(createEmptyHomeAnnouncementForm());

  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAdmin(!!currentUser);
      });
      return () => unsubscribe();
    }
  }, []);
const [toast, setToast] = useState<{
  text: string;
  type: "success" | "danger" | "warning";
  id: number;
  action?: () => void;
  actionLabel?: string;
} | null>(null);

useEffect(() => {
  if (location.pathname === "/admin" && !isAdmin) {
    setShowAdminLogin(true);
  }
}, [isAdmin, location.pathname]);

const toastTimerRef = useRef<number | null>(null);

const [firebaseReady, setFirebaseReady] = useState(false);
const [firebaseStatus, setFirebaseStatus] = useState("");
const [showLeaderboardSkeleton, setShowLeaderboardSkeleton] = useState(false);

  const selectedPlayer =
    players.find((player) => player.id === selectedPlayerId) || null;
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) || null;
  const selectedTournament =
    tournaments.find((tournament) => tournament.id === selectedTournamentId) ||
    null;
  const selectedMatch =
    matches.find((match) => match.id === selectedMatchId) || null;
  const selectedAchievement =
    achievements.find(
      (achievement) => achievement.id === selectedAchievementId
    ) || null;
  const getSafeTeamId = (teamId: number) =>
    teams.some((team) => team.id === teamId) ? teamId : 0;

const showToast = (
  text: string,
  type: "success" | "danger" | "warning" = "success",
  action?: () => void,
  actionLabel?: string
) => {
  if (toastTimerRef.current) {
    window.clearTimeout(toastTimerRef.current);
  }

  setToast({
    text,
    type,
    id: Date.now(),
    action,
    actionLabel,
  });

  toastTimerRef.current = window.setTimeout(() => {
    setToast(null);
    toastTimerRef.current = null;
  }, 3000);
};

  useEffect(() => writeStorage("tm_players", players), [players]);
  useEffect(() => writeStorage("tm_teams", teams), [teams]);
  useEffect(() => {
    const safeTournaments = tournaments.map((tournament) => ({
      ...tournament,
      imageUrl:
        typeof tournament.imageUrl === "string" &&
        tournament.imageUrl.startsWith("data:")
          ? ""
          : tournament.imageUrl || "",
    }));

    writeStorage("tm_tournaments", safeTournaments);
  }, [tournaments]);
  useEffect(() => writeStorage("tm_matches", matches), [matches]);
  useEffect(
    () => writeStorage("tm_achievements", achievements),
    [achievements]
  );
  useEffect(() => writeStorage("tm_transfers", transfers), [transfers]);
  useEffect(
    () => writeStorage("tm_home_announcement", homeAnnouncement),
    [homeAnnouncement]
  );

useEffect(() => {
  let isMounted = true;

  const skeletonTimer = window.setTimeout(() => {
    if (isMounted) {
      setShowLeaderboardSkeleton(true);
    }
  }, 500);

  const initFirebase = async () => {
    if (!isFirebaseConfigured) {
      setFirebaseStatus(
        "Firebase env variables are not configured yet. The app is using localStorage."
      );
      setFirebaseReady(true);
      return;
    }

    try {
      const [
        loadedPlayers,
        loadedTeams,
        loadedTournaments,
        loadedMatches,
        loadedAchievements,
        loadedTransfers,
        loadedHomeAnnouncement,
      ] = await Promise.all([
        loadCollection<Player>("players"),
        loadCollection<Team>("teams"),
        loadCollection<Tournament>("tournaments"),
        loadCollection<Match>("matches"),
        loadCollection<Achievement>("achievements"),
        loadCollection<Transfer>("transfers"),
        loadCollection<HomeAnnouncement>("homeAnnouncement"),
      ]);

      if (!isMounted) return;

      if (loadedPlayers.length > 0) {
        setPlayers(normalizePlayers(loadedPlayers));
      }

      if (loadedTeams.length > 0) {
        setTeams(normalizeTeams(loadedTeams));
      }

      if (loadedTournaments.length > 0) {
        setTournaments(normalizeTournaments(loadedTournaments));
      }

      if (loadedMatches.length > 0) {
        setMatches(normalizeMatches(loadedMatches));
      }

      if (loadedAchievements.length > 0) {
        setAchievements(normalizeAchievements(loadedAchievements));
      }

      if (loadedTransfers.length > 0) {
        setTransfers(loadedTransfers);
      }

      if (loadedHomeAnnouncement.length > 0) {
        setHomeAnnouncement(
          normalizeHomeAnnouncement(loadedHomeAnnouncement[0])
        );
      }

      setFirebaseStatus("Firestore loaded once. Realtime sync is disabled.");
    } catch (error) {
      console.error("Firebase load error:", error);
      setFirebaseStatus(
        "Firebase load failed. The app is still using localStorage backup."
      );
    } finally {
      if (isMounted) {
        window.clearTimeout(skeletonTimer);
        setFirebaseReady(true);
        setShowLeaderboardSkeleton(false);
      }
    }
  };

  initFirebase();

  return () => {
    isMounted = false;
    window.clearTimeout(skeletonTimer);
  };
}, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isBindPressed =
        event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a";

      if (isBindPressed) {
        event.preventDefault();
        setShowAdminLogin(true);
        setAdminPassword("");
        setAdminError("");
      }

      if (event.key === "Escape") {
        setShowAdminLogin(false);
        setAdminPassword("");
        setAdminError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (players.length === 0) {
      setSelectedPlayerId(0);
      return;
    }

    if (selectedPlayerId === 0) {
      return;
    }

    if (!players.some((player) => player.id === selectedPlayerId)) {
      setSelectedPlayerId(0);
    }
  }, [players, selectedPlayerId]);

  useEffect(() => {
    if (teams.length === 0) {
      setSelectedTeamId(0);
      return;
    }

    if (selectedTeamId === 0) {
      return;
    }

    if (!teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(0);
    }
  }, [teams, selectedTeamId]);

  useEffect(() => {
    if (tournaments.length === 0) {
      setSelectedTournamentId(0);
      return;
    }

    if (selectedTournamentId === 0) {
      return;
    }

    if (
      !tournaments.some((tournament) => tournament.id === selectedTournamentId)
    ) {
      setSelectedTournamentId(0);
    }
  }, [tournaments, selectedTournamentId]);

  useEffect(() => {
    if (matches.length === 0) {
      setSelectedMatchId(0);
      return;
    }

    if (selectedMatchId === 0) {
      return;
    }

    if (!matches.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId(matches[0].id);
    }
  }, [matches, selectedMatchId]);

  useEffect(() => {
    if (achievements.length === 0) {
      setSelectedAchievementId(0);
      return;
    }

    if (
      !achievements.some(
        (achievement) => achievement.id === selectedAchievementId
      )
    ) {
      setSelectedAchievementId(achievements[0].id);
    }
  }, [achievements, selectedAchievementId]);

  useEffect(() => {
    if (!selectedPlayer) {
      setPlayerForm(createEmptyPlayerForm(players.length + 1));
      return;
    }

    setPlayerForm({
      nickname: selectedPlayer.nickname,
      fullName: selectedPlayer.fullName,
      teamId: getSafeTeamId(selectedPlayer.teamId),
      teamHistory: normalizePlayerTeamHistory(
        selectedPlayer,
        getSafeTeamId(selectedPlayer.teamId)
      ),
      games: selectedPlayer.games.join(", "),
      wins: selectedPlayer.wins,
      losses: selectedPlayer.losses,
      earnings: selectedPlayer.earnings,
      tournamentsWon: selectedPlayer.tournamentsWon,
      rank: selectedPlayer.rank,
      elo: selectedPlayer.elo,
      bio: selectedPlayer.bio,
      isFeatured: Boolean(selectedPlayer.isFeatured),
      avatar: selectedPlayer.avatar || "",
    });
  }, [selectedPlayer, teams, players.length]);

  useEffect(() => {
    if (!selectedTeam) {
      setTeamForm(createEmptyTeamForm());
      return;
    }

    setTeamForm({
      name: selectedTeam.name,
      logo: selectedTeam.logo || "",
      games: selectedTeam.games.join(", "),
      wins: selectedTeam.wins,
      earnings: selectedTeam.earnings,
      description: selectedTeam.description,
      isFeatured: Boolean(selectedTeam.isFeatured),
    });
  }, [selectedTeam]);

  useEffect(() => {
    if (!selectedTournament) {
      setTournamentForm(createEmptyTournamentForm());
      return;
    }

    setTournamentForm({
      title: selectedTournament.title,
      game: selectedTournament.game,
      type: selectedTournament.type,
      format: selectedTournament.format || "",
      status: selectedTournament.status || "draft",
      date: selectedTournament.date,
      prize: selectedTournament.prize,
      description: selectedTournament.description || "",
      imageUrl: selectedTournament.imageUrl || "",
      participantType:
        selectedTournament.participantType === "team"
          ? "team"
          : selectedTournament.participantType === "squad"
          ? "squad"
          : "player",
      participantIds: Array.isArray(selectedTournament.participantIds)
        ? selectedTournament.participantIds.map(Number)
        : [],
      teamRosters: Array.isArray(selectedTournament.teamRosters)
        ? selectedTournament.teamRosters.map((roster) => ({
            teamId: Number(roster.teamId),
            playerIds: Array.isArray(roster.playerIds)
              ? roster.playerIds.map(Number)
              : [],
          }))
        : [],
      groups: Array.isArray(selectedTournament.groups)
        ? selectedTournament.groups.map((group, groupIndex) => ({
            id: group.id || `group-${groupIndex + 1}`,
            name: group.name || `Group ${groupIndex + 1}`,
            participantIds: Array.isArray(group.participantIds)
              ? group.participantIds.map(Number)
              : [],
          }))
        : [],
      winnerId:
        typeof selectedTournament.winnerId === "number" &&
        selectedTournament.winnerId > 0
          ? Number(selectedTournament.winnerId)
          : undefined,
      winnerTeamId:
        typeof selectedTournament.winnerTeamId === "number" &&
        selectedTournament.winnerTeamId > 0
          ? Number(selectedTournament.winnerTeamId)
          : undefined,
      winnerSquadIds: Array.isArray(selectedTournament.winnerSquadIds)
        ? selectedTournament.winnerSquadIds.map(Number)
        : [],
      mvpId:
        typeof selectedTournament.mvpId === "number" &&
        selectedTournament.mvpId > 0
          ? Number(selectedTournament.mvpId)
          : undefined,
      placements: Array.isArray(selectedTournament.placements)
        ? selectedTournament.placements
            .filter(
              (item) =>
                item &&
                typeof item.place === "number" &&
                (typeof item.playerId === "number" ||
                  typeof item.teamId === "number")
            )
            .map((item) => ({
              place: Number(item.place),
              playerId:
                typeof item.playerId === "number"
                  ? Number(item.playerId)
                  : undefined,
              teamId:
                typeof item.teamId === "number"
                  ? Number(item.teamId)
                  : undefined,
            }))
        : [],
      isPublished: Boolean(selectedTournament.isPublished),
    });
  }, [selectedTournament]);

  useEffect(() => {
    if (!selectedMatch) {
      return;
    }

    setMatchForm({
      seriesId: selectedMatch.seriesId || "",
      nextSeriesId: selectedMatch.nextSeriesId || "",
      game: selectedMatch.game,
      matchType: selectedMatch.matchType === "team" ? "team" : "player",
      player1: Number(selectedMatch.player1 || 0),
      player2: Number(selectedMatch.player2 || 0),
      team1: Number(selectedMatch.team1 || 0),
      team2: Number(selectedMatch.team2 || 0),
      score: selectedMatch.score,
      winnerId: Number(selectedMatch.winnerId || 0),
      winnerTeamId: Number(selectedMatch.winnerTeamId || 0),
      tournamentId: Number(selectedMatch.tournamentId || 0),
      date: selectedMatch.date,
      status: selectedMatch.status,
round: selectedMatch.round,
stage: selectedMatch.stage || "group",
groupName: selectedMatch.groupName || "",
roundLabel: selectedMatch.roundLabel || "",
bestOf: selectedMatch.bestOf,
      notes: selectedMatch.notes,
    });
  }, [selectedMatch]);

  useEffect(() => {
    setHomeAnnouncementForm({
      id: 1,
      title: homeAnnouncement.title || "",
      subtitle: homeAnnouncement.subtitle || "",
      imageUrl: homeAnnouncement.imageUrl || "",
      date: homeAnnouncement.date || "",
      prize: homeAnnouncement.prize || "",
      format: homeAnnouncement.format || "",
      status: homeAnnouncement.status || "",
      description: homeAnnouncement.description || "",
participantCount: Number(homeAnnouncement.participantCount || 0),
participantLabelType:
  homeAnnouncement.participantLabelType === "teams" ? "teams" : "players",
tournamentId:
        typeof homeAnnouncement.tournamentId === "number" &&
        homeAnnouncement.tournamentId > 0
          ? Number(homeAnnouncement.tournamentId)
          : undefined,
      isVisible: Boolean(homeAnnouncement.isVisible),
    });
  }, [homeAnnouncement]);

  const navigateToTab = (tab: TabKey) => {
    setActiveTab(tab);
    const nextPath = getPathForTab(tab);

    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  const navigateToPlayer = (playerId: number) => {
    setSelectedPlayerId(playerId);
    navigate(playerId > 0 ? `/players/${playerId}` : "/players");
  };

  const navigateToTeam = (teamId: number) => {
    setSelectedTeamId(teamId);
    navigate(teamId > 0 ? `/teams/${teamId}` : "/teams");
  };

  const navigateToTournament = (tournamentId: number | null) => {
    const nextTournamentId = tournamentId || 0;
    setSelectedTournamentId(nextTournamentId);
    navigate(nextTournamentId > 0 ? `/tournaments/${nextTournamentId}` : "/tournaments");
  };

  const handleAdminLogin = async () => {
    if (!auth) {
      setAdminError("Firebase Auth is not configured");
      return;
    }
    
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      navigateToTab("admin");
      setShowAdminLogin(false);
      setAdminEmail("");
      setAdminPassword("");
      setAdminError("");
} catch (error) {
  console.error("Firebase admin login failed:", error);
  setAdminError(t[lang].adminLogin.wrongPassword);
}
  };

  const handleAdminLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setIsAdmin(false);
    navigateToTab("players");
  };

  const openPlayerProfile = (playerId: number) => {
    navigateToPlayer(playerId);
  };

  const openTeamFromPlayerProfile = (teamId: number) => {
    navigateToTeam(teamId);

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const openTournamentFromPlayerProfile = (tournamentId: number) => {
    navigateToTournament(tournamentId);

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const saveHomeAnnouncement = async () => {
    const safeTournamentId =
      typeof homeAnnouncementForm.tournamentId === "number" &&
      tournaments.some(
        (tournament) =>
          tournament.id === Number(homeAnnouncementForm.tournamentId)
      )
        ? Number(homeAnnouncementForm.tournamentId)
        : 0;

    const nextHomeAnnouncement: HomeAnnouncement = {
      id: 1,
      title: homeAnnouncementForm.title,
      subtitle: homeAnnouncementForm.subtitle,
      imageUrl: homeAnnouncementForm.imageUrl,
      date: homeAnnouncementForm.date,
      prize: homeAnnouncementForm.prize,
      format: homeAnnouncementForm.format,
      status: homeAnnouncementForm.status,
      description: homeAnnouncementForm.description,
participantCount: Number(homeAnnouncementForm.participantCount || 0),
participantLabelType:
  homeAnnouncementForm.participantLabelType === "teams" ? "teams" : "players",
tournamentId: safeTournamentId,
      isVisible: Boolean(homeAnnouncementForm.isVisible),
    };

    setHomeAnnouncement(nextHomeAnnouncement);

    try {
      if (isFirebaseConfigured) {
        await saveItem("homeAnnouncement", nextHomeAnnouncement);
      }
      showToast(commonText.homeAnnouncementSaved);
    } catch (error) {
      console.error("Failed to save home announcement:", error);
      showToast("Failed to save announcement", "danger");
    }
  };
  const handleTeamLogoUpload = (_event: ChangeEvent<HTMLInputElement>) => {
    alert(
      text.admin.logoUploadDisabled
    );
  };

  const savePlayer = async () => {
    if (!selectedPlayer) return;

    if (!playerForm.nickname.trim()) {
      showToast("Player nickname is required", "danger");
      return;
    }

    const updatedPlayer: Player = {
      ...selectedPlayer,
      nickname: playerForm.nickname,
      fullName: playerForm.fullName,
      teamId: getSafeTeamId(Number(playerForm.teamId)),
      teamHistory: normalizePlayerTeamHistory(
        {
          ...selectedPlayer,
          teamHistory: playerForm.teamHistory,
        },
        getSafeTeamId(Number(playerForm.teamId))
      ),
      games: parseList(playerForm.games),
      wins: Number(playerForm.wins),
      losses: Number(playerForm.losses),
      earnings: Number(playerForm.earnings),
      tournamentsWon: Number(playerForm.tournamentsWon),
      elo: Number(playerForm.elo),
      bio: playerForm.bio,
      isFeatured: Boolean(playerForm.isFeatured),
      rank: selectedPlayer.rank,
      avatar: playerForm.avatar || achievementPlaceholder("P"),
    };

    const nextPlayers = recalculatePlayerRanks(
      players.map((player) =>
        player.id === selectedPlayer.id ? updatedPlayer : player
      )
    );
    const nextTeams = syncTeamPlayers(nextPlayers, teams);
    const savedPlayer =
      nextPlayers.find((player) => player.id === selectedPlayer.id) ||
      updatedPlayer;
    const previousPlayers = players;
    const previousTeams = teams;

    setPlayers(nextPlayers);
    setTeams(nextTeams);
    writeStorage("tm_players", nextPlayers);
    writeStorage("tm_teams", nextTeams);

    try {
      if (isFirebaseConfigured) {
        const changedTeams = nextTeams.filter((team) => {
          const previous = previousTeams.find((item) => item.id === team.id);
          return previous && JSON.stringify(previous) !== JSON.stringify(team);
        });

        await Promise.all([
          saveItem("players", savedPlayer),
          ...changedTeams.map((team) => saveItem("teams", team)),
        ]);
      }

      showToast(commonText.playerSaved);
    } catch (error) {
      console.error("Failed to save player:", error);
      if (isFirebaseConfigured) {
        setPlayers(previousPlayers);
        setTeams(previousTeams);
        writeStorage("tm_players", previousPlayers);
        writeStorage("tm_teams", previousTeams);
      }
      showToast("Failed to save player", "danger");
    }
  };

  const addPlayer = async () => {
    const newPlayer: Player = {
      id: getNextId(players),
      nickname: "New Player",
      fullName: "",
      avatar: achievementPlaceholder("P"),
      teamId: 0,
      teamHistory: [],
      games: [],
      wins: 0,
      losses: 0,
      earnings: 0,
      tournamentsWon: 0,
      rank: 0,
      elo: 1000,
      bio: "",
      isFeatured: false,
    };

    if (!newPlayer.nickname.trim()) {
      showToast("Player nickname is required", "danger");
      return;
    }

    const nextPlayers = recalculatePlayerRanks([...players, newPlayer]);
    const nextTeams = syncTeamPlayers(nextPlayers, teams);

setPlayers(nextPlayers);
setTeams(nextTeams);
setSelectedPlayerId(newPlayer.id);
setPlayerForm(createEmptyPlayerForm(nextPlayers.length + 1));

try {
if (isFirebaseConfigured) {
  await saveItem("players", newPlayer);
}
      showToast(commonText.playerAdded);
    } catch (error) {
      console.error("Failed to add player:", error);
      showToast("Failed to add player", "danger");
    }
  };

const deletePlayer = async () => {
  if (!selectedPlayer) return;

  const deletedId = selectedPlayer.id;
  const deletedPlayer = selectedPlayer;

  const backupPlayers = players;
  const backupTeams = teams;
  const backupTournaments = tournaments;
  const backupAchievements = achievements;
  const backupMatches = matches;

  const nextPlayers = recalculatePlayerRanks(
    players.filter((player) => player.id !== deletedId)
  );

  const nextTeams = syncTeamPlayers(
    nextPlayers,
    teams
  );

  const nextTournaments = tournaments.map((tournament) => ({
    ...tournament,
    participantIds: Array.isArray(tournament.participantIds)
      ? tournament.participantIds.filter((playerId) => playerId !== deletedId)
      : [],
    winnerId: tournament.winnerId === deletedId ? 0 : tournament.winnerId,
    winnerSquadIds: Array.isArray(tournament.winnerSquadIds)
      ? tournament.winnerSquadIds.filter((playerId) => playerId !== deletedId)
      : [],
    mvpId: tournament.mvpId === deletedId ? 0 : tournament.mvpId,
    placements: Array.isArray(tournament.placements)
      ? tournament.placements.filter((item) => item.playerId !== deletedId)
      : [],
  }));

  const nextAchievements = achievements.map((achievement) => ({
    ...achievement,
    playerIds: Array.isArray(achievement.playerIds)
      ? achievement.playerIds.filter((playerId) => playerId !== deletedId)
      : [],
  }));

  const nextMatches = matches.filter(
    (match) => match.player1 !== deletedId && match.player2 !== deletedId
  );

  const deletedMatchIds = matches
    .filter(
      (match) => match.player1 === deletedId || match.player2 === deletedId
    )
    .map((match) => match.id);

  setPlayers(nextPlayers);
  setTeams(nextTeams);
  setTournaments(nextTournaments);
  setAchievements(nextAchievements);
  setMatches(nextMatches);
  writeStorage("tm_players", nextPlayers);
  writeStorage("tm_teams", nextTeams);
  writeStorage("tm_tournaments", nextTournaments);
  writeStorage("tm_achievements", nextAchievements);
  writeStorage("tm_matches", nextMatches);

  try {
    if (isFirebaseConfigured) {
      const changedTeams = nextTeams.filter((team) => {
        const previous = backupTeams.find((item) => item.id === team.id);
        return previous && JSON.stringify(previous) !== JSON.stringify(team);
      });
      const changedTournaments = nextTournaments.filter((tournament) => {
        const previous = backupTournaments.find((item) => item.id === tournament.id);
        return previous && JSON.stringify(previous) !== JSON.stringify(tournament);
      });
      const changedAchievements = nextAchievements.filter((achievement) => {
        const previous = backupAchievements.find((item) => item.id === achievement.id);
        return previous && JSON.stringify(previous) !== JSON.stringify(achievement);
      });

      await Promise.all([
        deleteItem("players", deletedId),
        deletedMatchIds.length > 0
          ? deleteItemsBatch("matches", deletedMatchIds)
          : Promise.resolve(),
        ...changedTeams.map((team) => saveItem("teams", team)),
        ...changedTournaments.map((tournament) =>
          saveItem("tournaments", tournament)
        ),
        ...changedAchievements.map((achievement) =>
          saveItem("achievements", achievement)
        ),
      ]);
    }
  } catch (error) {
    console.error("Failed to delete player:", error);
    if (isFirebaseConfigured) {
      setPlayers(backupPlayers);
      setTeams(backupTeams);
      setTournaments(backupTournaments);
      setAchievements(backupAchievements);
      setMatches(backupMatches);
      writeStorage("tm_players", backupPlayers);
      writeStorage("tm_teams", backupTeams);
      writeStorage("tm_tournaments", backupTournaments);
      writeStorage("tm_achievements", backupAchievements);
      writeStorage("tm_matches", backupMatches);
    }
    showToast("Failed to delete player", "danger");
    return;
  }

  showToast(
    commonText.playerDeleted,
    "danger",
    () => {
      setPlayers(backupPlayers);
      setTeams(backupTeams);
      setTournaments(backupTournaments);
      setAchievements(backupAchievements);
      setMatches(backupMatches);
      writeStorage("tm_players", backupPlayers);
      writeStorage("tm_teams", backupTeams);
      writeStorage("tm_tournaments", backupTournaments);
      writeStorage("tm_achievements", backupAchievements);
      writeStorage("tm_matches", backupMatches);
      if (isFirebaseConfigured) {
        void Promise.all([
          saveItem("players", deletedPlayer),
          ...backupMatches
            .filter((match) => deletedMatchIds.includes(match.id))
            .map((match) => saveItem("matches", match)),
          ...backupTeams.map((team) => saveItem("teams", team)),
          ...backupTournaments.map((tournament) =>
            saveItem("tournaments", tournament)
          ),
          ...backupAchievements.map((achievement) =>
            saveItem("achievements", achievement)
          ),
        ]).catch((error) => {
          console.error("Failed to undo player delete:", error);
          showToast("Failed to undo player delete", "danger");
        });
      }
    },
    commonText.undo
  );
};

  const saveTeam = async () => {
    if (!selectedTeam) return;

    if (!teamForm.name.trim()) {
      showToast("Team name is required", "danger");
      return;
    }

    const updatedTeam: Team = {
      ...selectedTeam,
      name: teamForm.name,
      logo: teamForm.logo || achievementPlaceholder("T"),
      games: parseList(teamForm.games),
      wins: Number(teamForm.wins),
      earnings: Number(teamForm.earnings),
      description: teamForm.description,
      isFeatured: Boolean(teamForm.isFeatured),
    };

    const previousTeams = teams;

    setTeams((prev) =>
      prev.map((team) => (team.id === selectedTeam.id ? updatedTeam : team))
    );

    try {
      if (isFirebaseConfigured) {
        await saveItem("teams", updatedTeam);
      }

      showToast(commonText.teamSaved);
    } catch (error) {
      console.error("Failed to save team:", error);
      if (isFirebaseConfigured) {
        setTeams(previousTeams);
        writeStorage("tm_teams", previousTeams);
      }
      showToast("Failed to save team", "danger");
    }
  };

  const addTeam = async () => {
    const newTeam: Team = {
      id: getNextId(teams),
      name: "New Team",
      logo: achievementPlaceholder("T"),
      games: [],
      earnings: 0,
      wins: 0,
      players: [],
      description: "",
      isFeatured: false,
    };

    if (!newTeam.name.trim()) {
      showToast("Team name is required", "danger");
      return;
    }

    setTeams((prev) => [...prev, newTeam]);
setSelectedTeamId(newTeam.id);
setTeamForm(createEmptyTeamForm());

try {
      if (isFirebaseConfigured) {
        await saveItem("teams", newTeam);
      }
      showToast(commonText.teamAdded);
    } catch (error) {
      console.error("Failed to add team:", error);
      showToast("Failed to add team", "danger");
    }
  };

const deleteTeam = async () => {
  if (!selectedTeam) return;

  const deletedId = selectedTeam.id;
  const deletedTeam = selectedTeam;

  const backupPlayers = players;
  const backupTeams = teams;
  const backupTournaments = tournaments;

  const nextPlayers = players.map((player) =>
    player.teamId === deletedId ? { ...player, teamId: 0 } : player
  );

  const nextTeams = syncTeamPlayers(
    nextPlayers,
    teams.filter((team) => team.id !== deletedId)
  );

  const nextTournaments = tournaments.map((tournament) => ({
    ...tournament,
    winnerTeamId:
      tournament.winnerTeamId === deletedId ? 0 : tournament.winnerTeamId,
  }));

  setPlayers(nextPlayers);
  setTeams(nextTeams);
  setTournaments(nextTournaments);
  writeStorage("tm_players", nextPlayers);
  writeStorage("tm_teams", nextTeams);
  writeStorage("tm_tournaments", nextTournaments);

  try {
    if (isFirebaseConfigured) {
      const changedPlayers = nextPlayers.filter((player) => {
        const previous = backupPlayers.find((item) => item.id === player.id);
        return previous && JSON.stringify(previous) !== JSON.stringify(player);
      });
      const changedTournaments = nextTournaments.filter((tournament) => {
        const previous = backupTournaments.find((item) => item.id === tournament.id);
        return previous && JSON.stringify(previous) !== JSON.stringify(tournament);
      });

      await Promise.all([
        deleteItem("teams", deletedId),
        ...changedPlayers.map((player) => saveItem("players", player)),
        ...changedTournaments.map((tournament) =>
          saveItem("tournaments", tournament)
        ),
      ]);
    }
  } catch (error) {
    console.error("Failed to delete team:", error);
    if (isFirebaseConfigured) {
      setPlayers(backupPlayers);
      setTeams(backupTeams);
      setTournaments(backupTournaments);
      writeStorage("tm_players", backupPlayers);
      writeStorage("tm_teams", backupTeams);
      writeStorage("tm_tournaments", backupTournaments);
    }
    showToast("Failed to delete team", "danger");
    return;
  }

  showToast(
    commonText.teamDeleted,
    "danger",
    () => {
      setPlayers(backupPlayers);
      setTeams(backupTeams);
      setTournaments(backupTournaments);
      writeStorage("tm_players", backupPlayers);
      writeStorage("tm_teams", backupTeams);
      writeStorage("tm_tournaments", backupTournaments);
      if (isFirebaseConfigured) {
        void Promise.all([
          saveItem("teams", deletedTeam),
          ...backupPlayers.map((player) => saveItem("players", player)),
          ...backupTournaments.map((tournament) =>
            saveItem("tournaments", tournament)
          ),
        ]).catch((error) => {
          console.error("Failed to undo team delete:", error);
          showToast("Failed to undo team delete", "danger");
        });
      }
    },
    commonText.undo
  );
};

  const saveTournament = async (confirmedEloWarning = false) => {
    await saveTournamentMutation({
      confirmedEloWarning,
      tournamentForm,
      selectedTournamentId,
      selectedTournament,
      tournaments,
      players,
      commonText,
      isFirebaseConfigured,
      setTournaments,
      setPlayers,
      showToast,
      writeStorage,
    });
  };

  const addTournament = async () => {
    const newTournament: Tournament = {
      imageUrl: "",
      id: getNextId(tournaments),
      order:
        tournaments.length > 0
          ? Math.max(
              ...tournaments.map((tournament) =>
                typeof tournament.order === "number" ? tournament.order : -1
              )
            ) + 1
          : 0,
      title: "New Tournament",
      game: "",
      type: "",
      format: "",
      status: "draft",
      date: "",
      prize: "",
      description: "",
      participantType: "player",
      participantIds: [],
      teamRosters: [],
      groups: [],
      winnerId: 0,
      winnerTeamId: 0,
      winnerSquadIds: [],
      mvpId: 0,
      placements: [],
      eloApplied: false,
      isPublished: false,
    };

    if (!newTournament.title.trim()) {
      showToast("Tournament title is required", "danger");
      return;
    }

    const nextTournaments = [...tournaments, newTournament];

    const safeTournaments = nextTournaments.map((tournament) => ({
      ...tournament,
      imageUrl:
        typeof tournament.imageUrl === "string" &&
        tournament.imageUrl.startsWith("data:")
          ? ""
          : tournament.imageUrl || "",
    }));

    setTournaments(safeTournaments);
    writeStorage("tm_tournaments", safeTournaments);

    setSelectedTournamentId(newTournament.id);
    setTournamentForm({
      title: newTournament.title,
      game: "",
      type: "",
      format: "",
      status: "draft",
      date: "",
      prize: "",
      description: "",
      imageUrl: "",
      participantType: "player",
      participantIds: [],
      teamRosters: [],
      groups: [],
      winnerId: undefined,
      winnerTeamId: undefined,
      winnerSquadIds: [],
      mvpId: undefined,
      placements: [],
      isPublished: false,
    });

    try {
if (isFirebaseConfigured) {
  await saveItem("tournaments", newTournament);
}
      showToast(commonText.tournamentAdded);
    } catch (error) {
      console.error("Failed to add tournament:", error);
      showToast("Failed to add tournament", "danger");
    }
  };

const deleteTournament = async () => {
  if (!selectedTournament) return;

  const deletedId = selectedTournament.id;
  const deletedTournament = selectedTournament;

  const backupTournaments = tournaments;
  const backupMatches = matches;
  const backupPlayers = players;

  const nextTournaments = tournaments.filter(
    (tournament) => tournament.id !== deletedId
  );

  const nextMatches = matches.filter(
    (match) => match.tournamentId !== deletedId
  );

  const deletedMatchIds = matches
    .filter((match) => match.tournamentId === deletedId)
    .map((match) => match.id);

  const safeTournaments = nextTournaments.map((tournament) => ({
    ...tournament,
    imageUrl:
      typeof tournament.imageUrl === "string" &&
      tournament.imageUrl.startsWith("data:")
        ? ""
        : tournament.imageUrl || "",
  }));

  const recalculatedPlayers = recalculateAllPlayersElo(
    players,
    safeTournaments
  );
  const changedPlayers = recalculatedPlayers.filter((player) => {
    const previous = players.find((item) => item.id === player.id);
    return (
      previous &&
      (previous.elo !== player.elo || previous.rank !== player.rank)
    );
  });

  setTournaments(safeTournaments);
  setMatches(nextMatches);
  setPlayers(recalculatedPlayers);
  writeStorage("tm_tournaments", safeTournaments);
  writeStorage("tm_matches", nextMatches);
  writeStorage("tm_players", recalculatedPlayers);

  try {
    if (isFirebaseConfigured) {
      await Promise.all([
        deleteItem("tournaments", deletedId),
        deletedMatchIds.length > 0
          ? deleteItemsBatch("matches", deletedMatchIds)
          : Promise.resolve(),
        ...changedPlayers.map((player) => saveItem("players", player)),
      ]);
    }
  } catch (error) {
    console.error("Failed to delete tournament:", error);
    if (isFirebaseConfigured) {
      setTournaments(backupTournaments);
      setMatches(backupMatches);
      setPlayers(backupPlayers);
      writeStorage("tm_tournaments", backupTournaments);
      writeStorage("tm_matches", backupMatches);
      writeStorage("tm_players", backupPlayers);
    }
    showToast("Failed to delete tournament", "danger");
    return;
  }

  showToast(
    commonText.tournamentDeleted,
    "danger",
    () => {
      setTournaments(backupTournaments);
      setMatches(backupMatches);
      setPlayers(backupPlayers);
      writeStorage("tm_tournaments", backupTournaments);
      writeStorage("tm_matches", backupMatches);
      writeStorage("tm_players", backupPlayers);
      if (isFirebaseConfigured) {
        void Promise.all([
          saveItem("tournaments", deletedTournament),
          ...backupMatches
            .filter((match) => deletedMatchIds.includes(match.id))
            .map((match) => saveItem("matches", match)),
          ...changedPlayers
            .map((player) => backupPlayers.find((item) => item.id === player.id))
            .filter((player): player is Player => Boolean(player))
            .map((player) => saveItem("players", player)),
        ]).catch((error) => {
          console.error("Failed to undo tournament delete:", error);
          showToast("Failed to undo tournament delete", "danger");
        });
      }
    },
    commonText.undo
  );
};

  const reorderTournament = async (direction: "up" | "down") => {
    const sortedTournaments = [...tournaments].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    const index = sortedTournaments.findIndex(
      (tournament) => tournament.id === selectedTournamentId
    );

    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sortedTournaments.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    const nextTournaments = [...sortedTournaments];
    [nextTournaments[index], nextTournaments[targetIndex]] = [
      nextTournaments[targetIndex],
      nextTournaments[index],
    ];

    const orderedTournaments = nextTournaments.map((tournament, order) => ({
      ...tournament,
      order,
    }));

    setTournaments(orderedTournaments);
    writeStorage("tm_tournaments", orderedTournaments);

    try {
if (isFirebaseConfigured) {
  await Promise.all(
    orderedTournaments.map((tournament) =>
      saveItem("tournaments", tournament)
    )
  );
}

      showToast(commonText.tournamentOrderUpdated);
    } catch (error) {
      console.error("Failed to reorder tournaments:", error);
      showToast("Failed to reorder tournaments", "danger");
    }
  };

const saveMatch = async () => {
  await saveMatchMutation({
    matchForm,
    selectedMatch,
    matches,
    tournaments,
    commonText,
    isFirebaseConfigured,
    setMatches,
    setSelectedMatchId,
    showToast,
    writeStorage,
  });
};

  const addMatch = async (tournamentId = 0) => {
    const selectedTournamentId = Number(tournamentId || 0);
    const selectedMatchTournament =
      tournaments.find(
        (tournament) => tournament.id === selectedTournamentId
      ) || null;
    const nextOrder = getTopOrderForNewMatch(matches, selectedTournamentId);

    const newMatch: Match = {
      seriesId: "",
      nextSeriesId: "",
      id: getNextId(matches),
      game: selectedMatchTournament?.game || "",
      matchType:
        selectedMatchTournament?.participantType === "team" ? "team" : "player",
      player1: 0,
      player2: 0,
      team1: 0,
      team2: 0,
      score: "",
      winnerId: 0,
      winnerTeamId: 0,
      order: nextOrder,
      tournamentId: selectedTournamentId,
      date: "",
      status: "scheduled",
round: "",
stage: "group",
groupName: "",
roundLabel: "",
bestOf: 1,
      notes: "",
    };

    const backupMatches = matches;
    const nextMatches = [...matches, newMatch];

    setMatches(nextMatches);
    writeStorage("tm_matches", nextMatches);
    setSelectedMatchId(newMatch.id);
    setMatchForm({
      seriesId: "",
      nextSeriesId: "",
      game: selectedMatchTournament?.game || "",
      matchType:
        selectedMatchTournament?.participantType === "team" ? "team" : "player",
      player1: 0,
      player2: 0,
      team1: 0,
      team2: 0,
      score: "",
      winnerId: 0,
      winnerTeamId: 0,
      tournamentId: selectedTournamentId,
      date: "",
      status: "scheduled",
round: "",
stage: "group",
groupName: "",
roundLabel: "",
bestOf: 1,
      notes: "",
    });

    try {
      if (isFirebaseConfigured) {
        await saveItem("matches", newMatch);
      }
      showToast(commonText.matchAdded);
    } catch (error) {
      console.error("Failed to add match:", error);
      if (isFirebaseConfigured) {
        setMatches(backupMatches);
        writeStorage("tm_matches", backupMatches);
      }
      showToast(commonText.matchSaveFailed, "danger");
    }
  };

const reorderMatch = async (direction: "up" | "down", tournamentId: number) => {
  const reorderResult = reorderMatchByOrder({
    matches,
    selectedMatchId,
    direction,
    tournamentId,
  });

  if (!reorderResult) return;

  const backupMatches = matches;

  setMatches(reorderResult.matches);
  writeStorage("tm_matches", reorderResult.matches);
  setSelectedMatchId(reorderResult.selectedMatchId);

  try {
    if (isFirebaseConfigured) {
      await Promise.all(
        reorderResult.updatedMatches.map((match) =>
          saveItem("matches", match)
        )
      );
    }

    showToast(commonText.matchOrderUpdated);
  } catch (error) {
    console.error("Failed to reorder matches:", error);
    if (isFirebaseConfigured) {
      setMatches(backupMatches);
      writeStorage("tm_matches", backupMatches);
    }
    showToast(commonText.matchReorderFailed, "danger");
  }
};

const deleteMatch = async () => {
  if (!selectedMatch) return;

  const deletedId = selectedMatch.id;
  const deletedMatch = selectedMatch;

  const backupMatches = matches;
  const nextMatches = matches.filter((match) => match.id !== deletedId);

  setMatches(nextMatches);
  writeStorage("tm_matches", nextMatches);

  try {
    if (isFirebaseConfigured) {
      await deleteItem("matches", deletedId);
    }
  } catch (error) {
    console.error("Failed to delete match:", error);
    if (isFirebaseConfigured) {
      setMatches(backupMatches);
      writeStorage("tm_matches", backupMatches);
    }
    showToast("Failed to delete match", "danger");
    return;
  }

  showToast(
    commonText.matchDeleted,
    "danger",
    () => {
      setMatches(backupMatches);
      writeStorage("tm_matches", backupMatches);
      if (isFirebaseConfigured) {
        void saveItem("matches", deletedMatch).catch((error) => {
          console.error("Failed to undo match delete:", error);
          showToast("Failed to undo match delete", "danger");
        });
      }
    },
    commonText.undo
  );
};

const autoGenerateBracket = async (tournamentId: number) => {
  const bracketResult = generateBracketMatches({ matches, tournamentId });

  if (!bracketResult.ok) {
    const bracketMessage =
      bracketResult.reason === "missing_tournament"
        ? commonText.selectTournamentFirst
        : bracketResult.reason === "no_matches"
        ? commonText.noMatchesForTournament
        : commonText.unsupportedBracketSize;
    showToast(bracketMessage, "warning");
    return;
  }

  const backupMatches = matches;

  setMatches(bracketResult.matches);
  writeStorage("tm_matches", bracketResult.matches);

  try {
    if (isFirebaseConfigured) {
      await Promise.all(
        bracketResult.updatedMatches.map((match) => saveItem("matches", match))
      );
    }

    showToast(commonText.bracketGenerated);
  } catch (error) {
    console.error("Failed to save generated bracket:", error);
    if (isFirebaseConfigured) {
      setMatches(backupMatches);
      writeStorage("tm_matches", backupMatches);
    }
    showToast(commonText.bracketFirebaseFailed, "warning");
  }
};


  const saveAchievement = async (
    achievementId: number,
    updates: Partial<Achievement>
  ) => {
    const currentAchievement = achievements.find(
      (achievement) => achievement.id === achievementId
    );
    if (!currentAchievement) return;

    const updatedAchievement: Achievement = {
      ...currentAchievement,
      ...updates,
      playerIds: Array.isArray(updates.playerIds)
        ? updates.playerIds
        : currentAchievement.playerIds,
    };

    if (!updatedAchievement.title.trim()) {
      showToast("Achievement title is required", "danger");
      return;
    }

    setAchievements((prev) =>
      prev.map((achievement) =>
        achievement.id === achievementId ? updatedAchievement : achievement
      )
    );

    try {
      if (isFirebaseConfigured) {
        await saveItem("achievements", updatedAchievement);
      }

showToast(commonText.achievementSaved);
    } catch (error) {
      console.error("Failed to save achievement:", error);
      showToast("Failed to save achievement", "danger");
    }
  };

  const addAchievement = async () => {
    const newAchievement: Achievement = {
      id: getNextId(achievements),
      title: "New Achievement",
      description: "",
      image: achievementPlaceholder("A"),
      playerIds: [],
    };

if (!newAchievement.title.trim()) {
  showToast("Achievement title is required", "danger");
  return;
}

setAchievements((prev) => [...prev, newAchievement]);
setSelectedAchievementId(newAchievement.id);

try {
      if (isFirebaseConfigured) {
        await saveItem("achievements", newAchievement);
      }
      showToast(commonText.achievementAdded);
    } catch (error) {
      console.error("Failed to add achievement:", error);
      showToast("Failed to add achievement", "danger");
    }
  };

const deleteAchievement = async (achievementId: number) => {
  const backupAchievements = achievements;
  const backupSelectedAchievementId = selectedAchievementId;
  const deletedAchievement = achievements.find(
    (achievement) => achievement.id === achievementId
  );

  const nextAchievements = achievements.filter(
    (achievement) => achievement.id !== achievementId
  );

  setAchievements(nextAchievements);
  writeStorage("tm_achievements", nextAchievements);

  if (selectedAchievementId === achievementId) {
    setSelectedAchievementId(nextAchievements[0]?.id || 0);
  }

  try {
    if (isFirebaseConfigured) {
      await deleteItem("achievements", achievementId);
    }
  } catch (error) {
    console.error("Failed to delete achievement:", error);
    if (isFirebaseConfigured) {
      setAchievements(backupAchievements);
      setSelectedAchievementId(backupSelectedAchievementId);
      writeStorage("tm_achievements", backupAchievements);
    }
    showToast("Failed to delete achievement", "danger");
    return;
  }

  showToast(
    commonText.achievementDeleted,
    "danger",
    () => {
      setAchievements(backupAchievements);
      setSelectedAchievementId(backupSelectedAchievementId);
      writeStorage("tm_achievements", backupAchievements);
      if (isFirebaseConfigured && deletedAchievement) {
        void saveItem("achievements", deletedAchievement).catch((error) => {
          console.error("Failed to undo achievement delete:", error);
          showToast("Failed to undo achievement delete", "danger");
        });
      }
    },
    commonText.undo
  );
};

  const addTransfer = async (input: Omit<Transfer, "id">) => {
    if (!Number(input.playerId)) {
      showToast("Transfer player is required", "danger");
      return;
    }

    if (!input.date.trim()) {
      showToast("Transfer date is required", "danger");
      return;
    }

    const newTransfer: Transfer = {
      id: getNextId(transfers),
      playerId: Number(input.playerId),
      fromTeamId: input.fromTeamId ?? null,
      toTeamId: input.toTeamId ?? null,
      date: input.date,
      type: input.type ?? "transfer",
    };

    setTransfers((prev) => [...prev, newTransfer]);

    try {
      if (isFirebaseConfigured) {
        await saveItem("transfers", newTransfer);
      }
      showToast(commonText.transferAdded);
    } catch (error) {
      console.error("Failed to add transfer:", error);
      showToast("Failed to add transfer", "danger");
    }
  };

  const deleteTransfer = async (transferId: number) => {
    const backup = transfers;
    setTransfers((prev) => prev.filter((tr) => tr.id !== transferId));

    try {
      if (isFirebaseConfigured) {
        await deleteItem("transfers", transferId);
      }
      showToast(commonText.transferDeleted);
    } catch (error) {
      console.error("Failed to delete transfer:", error);
      setTransfers(backup);
      showToast("Failed to delete transfer", "danger");
    }
  };

  const text = t[lang] || t.en;
  const commonText = text.common;
  const routeTournamentId = getRouteEntityId(location.pathname, "tournaments");
  const publicSelectedTournamentId = isRouteListPath(
    location.pathname,
    "tournaments"
  )
    ? null
    : routeTournamentId;

  return (
    <div className="page" onMouseMoveCapture={handleSpotlightMoveCapture}>
      <ScrollToTop />
      <div className={`container ${isLanguageSwitching ? "language-transitioning" : ""}`}>

<div className="topbar-actions">
<Tabs
  active={activeTab}
  onChange={navigateToTab}
  showAdmin={isAdmin}
  lang={lang}
/>

  <div className="topbar-right">
    <div className="lang-switch">
<button
  type="button"
  className={lang === "ua" ? "active" : ""}
  onClick={() => switchLanguage("ua")}
>
        UA
      </button>
<button
  type="button"
  className={lang === "en" ? "active" : ""}
  onClick={() => switchLanguage("en")}
>
        EN
      </button>
    </div>

    <a
      href="https://www.instagram.com/sansara_zal/"
      target="_blank"
      rel="noopener noreferrer"
      className="instagram-btn"
      aria-label="Instagram"
      title="Instagram"
    >
      Instagram
    </a>

    {isAdmin && (
      <button className="secondary-btn" onClick={handleAdminLogout}>
        {commonText.logoutAdmin}
      </button>
    )}
  </div>
</div>

{activeTab === "home" && (
<HomeTab
  key={lang}
  players={players}
  teams={teams}
  tournaments={tournaments}
  matches={matches}
  transfers={transfers}
  setActiveTab={navigateToTab}
  lang={lang}
/>
)}

{activeTab === "general" && (
  <GeneralTab
    homeAnnouncement={homeAnnouncement}
    players={players}
    teams={teams}
    tournaments={tournaments}
    matches={matches}
    setSelectedTournamentId={setSelectedTournamentId}
    setActiveTab={navigateToTab}
    lang={lang}
    handleGlow={handleGlow}
  />
)}

        {activeTab === "players" && (
<PlayersTab
  players={players}
  teams={teams}
  matches={matches}
  tournaments={tournaments}
  achievements={achievements}
  selectedPlayerId={selectedPlayerId}
  setSelectedPlayerId={navigateToPlayer}
  search={search}
  setSearch={setSearch}
  gameFilter={gameFilter}
  setGameFilter={setGameFilter}
  teamFilter={teamFilter}
  setTeamFilter={setTeamFilter}
  sortMode={sortMode}
  setSortMode={setSortMode}
  gamesList={gamesList}
  onOpenTeam={openTeamFromPlayerProfile}
  onOpenTournament={openTournamentFromPlayerProfile}
  lang={lang}
/>
        )}

{activeTab === "teams" && (
  <TeamsTab
    teams={teams}
    players={players}
    tournaments={tournaments}
    matches={matches}
    selectedTeamId={selectedTeamId}
    setSelectedTeamId={navigateToTeam}
    lang={lang}
  />
)}

        {activeTab === "tournaments" && (
<TournamentsTab
  tournaments={tournaments}
  players={players}
  teams={teams}
  matches={matches}
  selectedTournamentId={publicSelectedTournamentId}
  setSelectedTournamentId={navigateToTournament}
  lang={lang}
/>
        )}

        {activeTab === "leaderboard" && (
<LeaderboardTab
  players={players}
  teams={teams}
  achievements={achievements}
  onOpenPlayer={openPlayerProfile}
  loading={showLeaderboardSkeleton}
  lang={lang}
/>
        )}

        {activeTab === "admin" && isAdmin && (
          <AdminTab
          autoGenerateBracket={autoGenerateBracket}
            players={players}
            teams={teams}
            tournaments={tournaments}
            matches={matches}
            achievements={achievements}
            homeAnnouncementForm={homeAnnouncementForm}
            setHomeAnnouncementForm={setHomeAnnouncementForm}
            saveHomeAnnouncement={saveHomeAnnouncement}
            selectedPlayerId={selectedPlayerId}
            setSelectedPlayerId={setSelectedPlayerId}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
            selectedTournamentId={selectedTournamentId}
            setSelectedTournamentId={setSelectedTournamentId}
            selectedMatchId={selectedMatchId}
            setSelectedMatchId={setSelectedMatchId}
            selectedAchievementId={selectedAchievementId}
            setSelectedAchievementId={setSelectedAchievementId}
            playerForm={playerForm}
            setPlayerForm={setPlayerForm}
            teamForm={teamForm}
            setTeamForm={setTeamForm}
            tournamentForm={tournamentForm}
            setTournamentForm={setTournamentForm}
            matchForm={matchForm}
            setMatchForm={setMatchForm}
            handleTeamLogoUpload={handleTeamLogoUpload}
            savePlayer={savePlayer}
            addPlayer={addPlayer}
            deletePlayer={deletePlayer}
            saveTeam={saveTeam}
            addTeam={addTeam}
            deleteTeam={deleteTeam}
            saveTournament={saveTournament}
            addTournament={addTournament}
            deleteTournament={deleteTournament}
            reorderTournament={reorderTournament}
            saveMatch={saveMatch}
            addMatch={addMatch}
deleteMatch={deleteMatch}
reorderMatch={reorderMatch}
saveAchievement={saveAchievement}
addAchievement={addAchievement}
deleteAchievement={deleteAchievement}
selectedAchievement={selectedAchievement}
transfers={transfers}
addTransfer={addTransfer}
deleteTransfer={deleteTransfer}
lang={lang}
/>
        )}

{toast ? (
  <div key={toast.id} className={`save-toast save-toast-${toast.type}`}>
    <span>{toast.text}</span>

    {toast.action && (
      <button
        className="toast-action"
        onClick={() => {
          toast.action?.();
          setToast(null);
        }}
      >
        {toast.actionLabel || commonText.undo}
      </button>
    )}
  </div>
) : null}

      </div>

      {showAdminLogin && (
        <div
          className="admin-overlay"
            onClick={() => {
              setShowAdminLogin(false);
              setAdminEmail("");
              setAdminPassword("");
              setAdminError("");
            }}
          >
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="panel-title">{t[lang].adminLogin.title}</h2>

              <div className="form-col">
                <input
                  type="email"
                  className="input"
                  placeholder="Email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAdminLogin();
                    }
                  }}
                  autoFocus
                />
                <input
                  type="password"
                  className="input"
                  placeholder={t[lang].adminLogin.placeholder}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAdminLogin();
                    }
                  }}
                />

                {adminError ? (
                  <div className="admin-error">{adminError}</div>
                ) : null}

<div className="btn-row">
  <button className="primary-btn" onClick={handleAdminLogin}>
    {t[lang].adminLogin.login}
  </button>
  <button
    className="secondary-btn"
    onClick={() => {
      setShowAdminLogin(false);
      setAdminEmail("");
      setAdminPassword("");
      setAdminError("");
    }}
  >
{t[lang].adminLogin.cancel}
  </button>
</div>
              </div>
            </div>
          </div>
      )}

    </div>
  );
}
