import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Tabs from "./components/Tabs";
import PlayersTab from "./components/PlayersTab";
import TeamsTab from "./components/TeamsTab";
import TournamentsTab from "./components/TournamentsTab";
import LeaderboardTab from "./components/LeaderboardTab";
import AdminTab from "./components/AdminTab";
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
  TournamentStatus,
} from "./types";
import {
  getNextId,
  parseList,
  readStorage,
  syncTeamPlayers,
  writeStorage,
} from "./utils";
import StatCard from "./components/StatCard";
import { isFirebaseConfigured } from "./firebase";
import {
  deleteItem,
  deleteItemsBatch,
  saveItem,
  saveItemsBatch,
  subscribeCollection,
} from "./firebaseDb";

type PlayerForm = {
  nickname: string;
  fullName: string;
  teamId: number;
  games: string;
  wins: number;
  losses: number;
  earnings: number;
  tournamentsWon: number;
  rank: number;
  elo: number;
  bio: string;
  isFeatured: boolean;
};

type TeamForm = {
  name: string;
  games: string;
  wins: number;
  earnings: number;
  description: string;
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
  participantType: "player" | "team";
  participantIds: number[];
  winnerId?: number;
  winnerTeamId?: number;
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
  bestOf: number;
  notes: string;
  eloApplied: boolean;
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
  tournamentId?: number;
  isVisible: boolean;
};

const createEmptyPlayerForm = (nextRank = 1): PlayerForm => ({
  nickname: "",
  fullName: "",
  teamId: 0,
  games: "",
  wins: 0,
  losses: 0,
  earnings: 0,
  tournamentsWon: 0,
  rank: nextRank,
  elo: 1000,
  bio: "",
  isFeatured: false,
});

const createEmptyTeamForm = (): TeamForm => ({
  name: "",
  games: "",
  wins: 0,
  earnings: 0,
  description: "",
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
  winnerId: undefined,
  winnerTeamId: undefined,
  mvpId: undefined,
  placements: [],
  isPublished: false,
});

const createEmptyMatchForm = (): MatchForm => ({
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
  bestOf: 1,
  notes: "",
  eloApplied: false,
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
  tournamentId: undefined,
  isVisible: true,
});

const normalizePlayers = (items: Player[]): Player[] =>
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
  }));

const normalizeTeams = (items: Team[]): Team[] =>
  items.map((team) => ({
    ...team,
    games: Array.isArray(team.games) ? team.games : [],
    players: Array.isArray(team.players) ? team.players : [],
    logo: team.logo || achievementPlaceholder("T"),
    description: team.description || "",
    earnings: Number(team.earnings || 0),
    wins: Number(team.wins || 0),
  }));

const normalizeTournaments = (items: Tournament[]): Tournament[] =>
  items.map((tournament) => ({
    ...tournament,
    format: tournament.format || "",
    status: tournament.status || "draft",
    description: tournament.description || "",
    participantType: tournament.participantType === "team" ? "team" : "player",
    participantIds: Array.isArray(tournament.participantIds)
      ? tournament.participantIds.map(Number)
      : [],
    winnerId: typeof tournament.winnerId === "number" ? tournament.winnerId : 0,
    winnerTeamId:
      typeof tournament.winnerTeamId === "number" ? tournament.winnerTeamId : 0,
    mvpId: typeof tournament.mvpId === "number" ? tournament.mvpId : 0,
    placements: Array.isArray(tournament.placements)
      ? tournament.placements
          .filter(
            (item) =>
              item &&
              typeof item.playerId === "number" &&
              typeof item.place === "number"
          )
          .map((item) => ({
            playerId: Number(item.playerId),
            place: Number(item.place),
          }))
      : [],
    isPublished: Boolean(tournament.isPublished),
  }));

const normalizeMatches = (items: Match[]): Match[] =>
  items.map((match) => ({
    ...match,
    score: match.score || "",
    winnerId: Number(match.winnerId || 0),
    tournamentId: Number(match.tournamentId || 0),
    status: match.status || "scheduled",
    round: match.round || "",
    bestOf: Number(match.bestOf || 1),
    notes: match.notes || "",
    eloApplied: Boolean(match.eloApplied),
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
  tournamentId:
    typeof item?.tournamentId === "number" ? Number(item.tournamentId) : 0,
  isVisible: typeof item?.isVisible === "boolean" ? item.isVisible : true,
});

export default function App() {
  const ADMIN_PASSWORD = "monaco123";

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--y", `${e.clientY}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

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
  const [homeAnnouncement, setHomeAnnouncement] = useState<HomeAnnouncement>(
    () => normalizeHomeAnnouncement(fallbackHomeAnnouncement)
  );

  const [activeTab, setActiveTab] = useState<TabKey>("home");

  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(1);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(1);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number>(1);
  const [selectedMatchId, setSelectedMatchId] = useState<number>(1);
  const [selectedAchievementId, setSelectedAchievementId] = useState<number>(1);

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
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState("");

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

  const showSaveToast = (text: string) => {
    setSaveMessage(text);

    window.setTimeout(() => {
      setSaveMessage("");
    }, 2000);
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
  useEffect(
    () => writeStorage("tm_home_announcement", homeAnnouncement),
    [homeAnnouncement]
  );

  useEffect(() => {
    let unsubPlayers = () => {};
    let unsubTeams = () => {};
    let unsubTournaments = () => {};
    let unsubMatches = () => {};
    let unsubAchievements = () => {};
    let unsubHomeAnnouncement = () => {};
    let isMounted = true;

    const initFirebase = async () => {
      if (!isFirebaseConfigured) {
        setFirebaseStatus(
          "Firebase env variables are not configured yet. The app is using localStorage."
        );
        setFirebaseReady(true);
        return;
      }

      try {
        if (!isMounted) return;

        unsubPlayers = subscribeCollection<Player>("players", (items) => {
          setPlayers(normalizePlayers(items));
        });

        unsubTeams = subscribeCollection<Team>("teams", (items) => {
          setTeams(normalizeTeams(items));
        });

        unsubTournaments = subscribeCollection<Tournament>(
          "tournaments",
          (items) => {
            setTournaments(normalizeTournaments(items));
          }
        );

        unsubMatches = subscribeCollection<Match>("matches", (items) => {
          setMatches(normalizeMatches(items));
        });

        unsubAchievements = subscribeCollection<Achievement>(
          "achievements",
          (items) => {
            setAchievements(normalizeAchievements(items));
          }
        );

        unsubHomeAnnouncement = subscribeCollection<HomeAnnouncement>(
          "homeAnnouncement",
          (items) => {
            const nextItem =
              Array.isArray(items) && items.length > 0
                ? items[0]
                : fallbackHomeAnnouncement;

            setHomeAnnouncement(normalizeHomeAnnouncement(nextItem));
          }
        );

        setFirebaseStatus("Firestore sync is active.");
      } catch (error) {
        console.error("Firebase init error:", error);
        setFirebaseStatus(
          "Firebase connection failed. The app is still using localStorage backup."
        );
      } finally {
        if (isMounted) {
          setFirebaseReady(true);
        }
      }
    };

    initFirebase();

    return () => {
      isMounted = false;
      unsubPlayers();
      unsubTeams();
      unsubTournaments();
      unsubMatches();
      unsubAchievements();
      unsubHomeAnnouncement();
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

    if (!players.some((player) => player.id === selectedPlayerId)) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  useEffect(() => {
    if (teams.length === 0) {
      setSelectedTeamId(0);
      return;
    }

    if (!teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  useEffect(() => {
    if (tournaments.length === 0) {
      setSelectedTournamentId(0);
      return;
    }

    if (
      !tournaments.some((tournament) => tournament.id === selectedTournamentId)
    ) {
      setSelectedTournamentId(tournaments[0].id);
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
      games: selectedPlayer.games.join(", "),
      wins: selectedPlayer.wins,
      losses: selectedPlayer.losses,
      earnings: selectedPlayer.earnings,
      tournamentsWon: selectedPlayer.tournamentsWon,
      rank: selectedPlayer.rank,
      elo: selectedPlayer.elo,
      bio: selectedPlayer.bio,
      isFeatured: Boolean(selectedPlayer.isFeatured),
    });
  }, [selectedPlayer, teams, players.length]);

  useEffect(() => {
    if (!selectedTeam) {
      setTeamForm(createEmptyTeamForm());
      return;
    }

    setTeamForm({
      name: selectedTeam.name,
      games: selectedTeam.games.join(", "),
      wins: selectedTeam.wins,
      earnings: selectedTeam.earnings,
      description: selectedTeam.description,
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
        selectedTournament.participantType === "team" ? "team" : "player",
      participantIds: Array.isArray(selectedTournament.participantIds)
        ? selectedTournament.participantIds.map(Number)
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
      game: selectedMatch.game,
      matchType: selectedMatch.matchType || "player",
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
      bestOf: selectedMatch.bestOf,
      notes: selectedMatch.notes,
      eloApplied: Boolean(selectedMatch.eloApplied),
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
      tournamentId:
        typeof homeAnnouncement.tournamentId === "number" &&
        homeAnnouncement.tournamentId > 0
          ? Number(homeAnnouncement.tournamentId)
          : undefined,
      isVisible: Boolean(homeAnnouncement.isVisible),
    });
  }, [homeAnnouncement]);

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setActiveTab("admin");
      setShowAdminLogin(false);
      setAdminPassword("");
      setAdminError("");
      return;
    }

    setAdminError("Wrong password");
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setActiveTab("players");
  };

  const openPlayerProfile = (playerId: number) => {
    setSelectedPlayerId(playerId);
    setActiveTab("players");
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
      tournamentId: safeTournamentId,
      isVisible: Boolean(homeAnnouncementForm.isVisible),
    };

    setHomeAnnouncement(nextHomeAnnouncement);

    try {
      if (isFirebaseConfigured) {
        await saveItem("homeAnnouncement", nextHomeAnnouncement);
      }
      showSaveToast("Home announcement saved");
    } catch (error) {
      console.error("Failed to save home announcement:", error);
    }
  };
  const handlePlayerAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPlayer) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;

      const updatedPlayer: Player = {
        ...selectedPlayer,
        avatar: result,
      };

      setPlayers((prev) =>
        prev.map((player) =>
          player.id === selectedPlayer.id ? updatedPlayer : player
        )
      );

      try {
        if (isFirebaseConfigured) {
          await saveItem("players", updatedPlayer);
        }
      } catch (error) {
        console.error("Failed to save player avatar:", error);
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleTeamLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTeam) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;

      const updatedTeam: Team = {
        ...selectedTeam,
        logo: result,
      };

      setTeams((prev) =>
        prev.map((team) => (team.id === selectedTeam.id ? updatedTeam : team))
      );

      try {
        if (isFirebaseConfigured) {
          await saveItem("teams", updatedTeam);
        }
      } catch (error) {
        console.error("Failed to save team logo:", error);
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const savePlayer = async () => {
    if (!selectedPlayer) return;

    const updatedPlayer: Player = {
      ...selectedPlayer,
      nickname: playerForm.nickname,
      fullName: playerForm.fullName,
      teamId: getSafeTeamId(Number(playerForm.teamId)),
      games: parseList(playerForm.games),
      wins: Number(playerForm.wins),
      losses: Number(playerForm.losses),
      earnings: Number(playerForm.earnings),
      tournamentsWon: Number(playerForm.tournamentsWon),
      rank: Number(playerForm.rank),
      elo: Number(playerForm.elo),
      bio: playerForm.bio,
    };

    const nextPlayers = players.map((player) =>
      player.id === selectedPlayer.id ? updatedPlayer : player
    );
    const nextTeams = syncTeamPlayers(nextPlayers, teams);

    setPlayers(nextPlayers);
    setTeams(nextTeams);

    try {
      if (isFirebaseConfigured) {
        await Promise.all([
          saveItem("players", updatedPlayer),
          saveItemsBatch("teams", nextTeams),
        ]);
      }

      showSaveToast("Player saved");
    } catch (error) {
      console.error("Failed to save player:", error);
    }
  };

  const addPlayer = async () => {
    const newPlayer: Player = {
      id: getNextId(players),
      nickname: "New Player",
      fullName: "",
      avatar: achievementPlaceholder("P"),
      teamId: 0,
      games: [],
      wins: 0,
      losses: 0,
      earnings: 0,
      tournamentsWon: 0,
      rank: players.length + 1,
      elo: 1000,
      bio: "",
      isFeatured: false,
    };

    const nextPlayers = [...players, newPlayer];
    const nextTeams = syncTeamPlayers(nextPlayers, teams);

    setPlayers(nextPlayers);
    setTeams(nextTeams);
    setSelectedPlayerId(newPlayer.id);
    setPlayerForm(createEmptyPlayerForm(nextPlayers.length + 1));

    try {
      if (isFirebaseConfigured) {
        await Promise.all([
          saveItem("players", newPlayer),
          saveItemsBatch("teams", nextTeams),
        ]);
      }
    } catch (error) {
      console.error("Failed to add player:", error);
    }
  };

  const deletePlayer = async () => {
    if (!selectedPlayer) return;

    const deletedId = selectedPlayer.id;

    const nextPlayers = players.filter((player) => player.id !== deletedId);

    const nextTeams = syncTeamPlayers(
      nextPlayers,
      teams.map((team) => ({
        ...team,
        players: Array.isArray(team.players)
          ? team.players.filter((playerId) => playerId !== deletedId)
          : [],
      }))
    );

    const nextTournaments = tournaments.map((tournament) => ({
      ...tournament,
      participantIds: Array.isArray(tournament.participantIds)
        ? tournament.participantIds.filter((playerId) => playerId !== deletedId)
        : [],
      winnerId: tournament.winnerId === deletedId ? 0 : tournament.winnerId,
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

    try {
      if (isFirebaseConfigured) {
        await Promise.all([
          deleteItem("players", deletedId),
          saveItemsBatch("teams", nextTeams),
          saveItemsBatch("tournaments", nextTournaments),
          saveItemsBatch("achievements", nextAchievements),
          deleteItemsBatch("matches", deletedMatchIds),
        ]);
      }
    } catch (error) {
      console.error("Failed to delete player:", error);
    }
  };

  const saveTeam = async () => {
    if (!selectedTeam) return;

    const updatedTeam: Team = {
      ...selectedTeam,
      name: teamForm.name,
      games: parseList(teamForm.games),
      wins: Number(teamForm.wins),
      earnings: Number(teamForm.earnings),
      description: teamForm.description,
    };

    setTeams((prev) =>
      prev.map((team) => (team.id === selectedTeam.id ? updatedTeam : team))
    );

    try {
      if (isFirebaseConfigured) {
        await saveItem("teams", updatedTeam);
      }

      showSaveToast("Team saved");
    } catch (error) {
      console.error("Failed to save team:", error);
    }
  };

  const addTeam = async () => {
    const newTeam: Team = {
      id: getNextId(teams),
      name: "",
      logo: achievementPlaceholder("T"),
      games: [],
      earnings: 0,
      wins: 0,
      players: [],
      description: "",
    };

    setTeams((prev) => [...prev, newTeam]);
    setSelectedTeamId(newTeam.id);
    setTeamForm(createEmptyTeamForm());

    try {
      if (isFirebaseConfigured) {
        await saveItem("teams", newTeam);
      }
    } catch (error) {
      console.error("Failed to add team:", error);
    }
  };

  const deleteTeam = async () => {
    if (!selectedTeam) return;

    const deletedId = selectedTeam.id;
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

    try {
      if (isFirebaseConfigured) {
        await Promise.all([
          deleteItem("teams", deletedId),
          saveItemsBatch("players", nextPlayers),
          saveItemsBatch("teams", nextTeams),
          saveItemsBatch("tournaments", nextTournaments),
        ]);
      }
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
  };

  const saveTournament = async () => {
    const updatedTournament: Tournament = {
      id: selectedTournamentId,
      title: tournamentForm.title,
      game: tournamentForm.game,
      type: tournamentForm.type,
      format: tournamentForm.format,
      status: tournamentForm.status,
      date: tournamentForm.date,
      prize: tournamentForm.prize,
      description: tournamentForm.description,
      imageUrl: tournamentForm.imageUrl,
      participantType: tournamentForm.participantType || "player",
      participantIds: Array.isArray(tournamentForm.participantIds)
        ? tournamentForm.participantIds.map(Number)
        : [],
      winnerId:
        tournamentForm.participantType === "player" &&
        tournamentForm.winnerId &&
        tournamentForm.winnerId > 0
          ? Number(tournamentForm.winnerId)
          : undefined,
      winnerTeamId:
        tournamentForm.participantType === "team" &&
        tournamentForm.winnerTeamId &&
        tournamentForm.winnerTeamId > 0
          ? Number(tournamentForm.winnerTeamId)
          : undefined,
      mvpId:
        tournamentForm.participantType === "player" &&
        tournamentForm.mvpId &&
        tournamentForm.mvpId > 0
          ? Number(tournamentForm.mvpId)
          : undefined,
      placements: Array.isArray(tournamentForm.placements)
        ? tournamentForm.placements
        : [],
      isPublished: Boolean(tournamentForm.isPublished),
    };

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id === selectedTournamentId ? updatedTournament : tournament
      )
    );

    showSaveToast("Tournament saved");

    try {
      if (isFirebaseConfigured) {
        await saveItem("tournaments", updatedTournament);
      }
    } catch (error) {
      console.error("Failed to save tournament:", error);
    }
  };

  const addTournament = async () => {
    const newTournament: Tournament = {
      imageUrl: "",
      id: getNextId(tournaments),
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
      winnerId: 0,
      winnerTeamId: 0,
      mvpId: 0,
      placements: [],
      isPublished: false,
    };

    setTournaments((prev) => [...prev, newTournament]);
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
      winnerId: undefined,
      winnerTeamId: undefined,
      mvpId: undefined,
      placements: [],
      isPublished: false,
    });

    try {
      if (isFirebaseConfigured) {
        await saveItem("tournaments", newTournament);
      }
    } catch (error) {
      console.error("Failed to add tournament:", error);
    }
  };

  const deleteTournament = async () => {
    if (!selectedTournament) return;

    const deletedId = selectedTournament.id;
    const nextTournaments = tournaments.filter(
      (tournament) => tournament.id !== deletedId
    );
    const nextMatches = matches.filter(
      (match) => match.tournamentId !== deletedId
    );
    const deletedMatchIds = matches
      .filter((match) => match.tournamentId === deletedId)
      .map((match) => match.id);

    setTournaments(nextTournaments);
    setMatches(nextMatches);

    try {
      if (isFirebaseConfigured) {
        await Promise.all([
          deleteItem("tournaments", deletedId),
          deleteItemsBatch("matches", deletedMatchIds),
        ]);
      }
    } catch (error) {
      console.error("Failed to delete tournament:", error);
    }
  };

  const saveMatch = async () => {
    if (!selectedMatch) return;

    const updatedMatch: Match = {
      ...selectedMatch,
      game: matchForm.game,
      matchType: matchForm.matchType,
      player1: Number(matchForm.player1),
      player2: Number(matchForm.player2),
      team1: Number(matchForm.team1),
      team2: Number(matchForm.team2),
      score: matchForm.score,
      winnerId: Number(matchForm.winnerId),
      winnerTeamId: Number(matchForm.winnerTeamId),
      tournamentId: Number(matchForm.tournamentId),
      date: matchForm.date,
      status: matchForm.status,
      round: matchForm.round,
      bestOf: Number(matchForm.bestOf),
      notes: matchForm.notes,
      eloApplied: Boolean(matchForm.eloApplied),
    };

    setMatches((prev) =>
      prev.map((match) =>
        match.id === selectedMatch.id ? updatedMatch : match
      )
    );

    try {
      if (isFirebaseConfigured) {
        await saveItem("matches", updatedMatch);
      }

      showSaveToast("Match saved");
    } catch (error) {
      console.error("Failed to save match:", error);
    }
  };

  const addMatch = async (tournamentId = 0) => {
    const selectedMatchTournament =
      tournaments.find(
        (tournament) => tournament.id === Number(tournamentId)
      ) || null;

    const newMatch: Match = {
      id: getNextId(matches),
      game: selectedMatchTournament?.game || "",
      matchType: selectedMatchTournament?.participantType || "player",
      player1: 0,
      player2: 0,
      team1: 0,
      team2: 0,
      score: "",
      winnerId: 0,
      winnerTeamId: 0,
      tournamentId: Number(tournamentId || 0),
      date: "",
      status: "scheduled",
      round: "",
      bestOf: 1,
      notes: "",
      eloApplied: false,
    };

    setMatches((prev) => [...prev, newMatch]);
    setSelectedMatchId(newMatch.id);
    setMatchForm({
      game: selectedMatchTournament?.game || "",
      matchType: selectedMatchTournament?.participantType || "player",
      player1: 0,
      player2: 0,
      team1: 0,
      team2: 0,
      score: "",
      winnerId: 0,
      winnerTeamId: 0,
      tournamentId: Number(tournamentId || 0),
      date: "",
      status: "scheduled",
      round: "",
      bestOf: 1,
      notes: "",
      eloApplied: false,
    });

    try {
      if (isFirebaseConfigured) {
        await saveItem("matches", newMatch);
      }
    } catch (error) {
      console.error("Failed to add match:", error);
    }
  };

  const deleteMatch = async () => {
    if (!selectedMatch) return;

    const deletedId = selectedMatch.id;
    setMatches((prev) => prev.filter((match) => match.id !== deletedId));

    try {
      if (isFirebaseConfigured) {
        await deleteItem("matches", deletedId);
      }
    } catch (error) {
      console.error("Failed to delete match:", error);
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

    setAchievements((prev) =>
      prev.map((achievement) =>
        achievement.id === achievementId ? updatedAchievement : achievement
      )
    );

    try {
      if (isFirebaseConfigured) {
        await saveItem("achievements", updatedAchievement);
      }

      showSaveToast("Achievement saved");
    } catch (error) {
      console.error("Failed to save achievement:", error);
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

    setAchievements((prev) => [...prev, newAchievement]);
    setSelectedAchievementId(newAchievement.id);

    try {
      if (isFirebaseConfigured) {
        await saveItem("achievements", newAchievement);
      }
    } catch (error) {
      console.error("Failed to add achievement:", error);
    }
  };

  const deleteAchievement = async (achievementId: number) => {
    const nextAchievements = achievements.filter(
      (achievement) => achievement.id !== achievementId
    );

    setAchievements(nextAchievements);

    if (selectedAchievementId === achievementId) {
      setSelectedAchievementId(nextAchievements[0]?.id || 0);
    }

    try {
      if (isFirebaseConfigured) {
        await deleteItem("achievements", achievementId);
      }
    } catch (error) {
      console.error("Failed to delete achievement:", error);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <div>
            <p className="hero-kicker">Tournament Platform Prototype</p>
            <h1 className="hero-title">Mini site for friends tournaments</h1>
            <h1 className="hero-title">Sansara Tournament Control Center</h1>
            <p className="hero-text">Admin login: Ctrl + Shift + A</p>
            <p className="muted small">
              {firebaseReady ? firebaseStatus : "Connecting data layer..."}
            </p>
          </div>

          <div className="hero-stats">
            <StatCard title="Players" value={players.length} />
            <StatCard title="Teams" value={teams.length} />
            <StatCard title="Matches" value={matches.length} />
            <StatCard
              title="Top ELO"
              value={Math.max(...players.map((p) => p.elo), 0)}
            />
          </div>
        </div>

        <div className="topbar-actions">
          <Tabs
            active={activeTab}
            onChange={setActiveTab}
            showAdmin={isAdmin}
          />

          {isAdmin && (
            <button className="secondary-btn" onClick={handleAdminLogout}>
              Logout admin
            </button>
          )}
        </div>

        {activeTab === "home" && (
          <section className="home-announcement-page">
            {!homeAnnouncement.isVisible ? (
              <div className="panel">
                <h2 className="panel-title">Home announcement is hidden</h2>
                <p className="muted">
                  Turn it on in Admin when you want to show the next tournament.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="home-featured-banner"
                  style={{
                    backgroundImage: homeAnnouncement.imageUrl
                      ? `linear-gradient(90deg, rgba(5, 7, 14, 0.92) 0%, rgba(5, 7, 14, 0.72) 38%, rgba(5, 7, 14, 0.44) 62%, rgba(5, 7, 14, 0.88) 100%), url(${homeAnnouncement.imageUrl})`
                      : "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(76,29,149,0.9) 45%, rgba(190,24,93,0.82) 100%)",
                  }}
                >
                  <div className="home-featured-overlay">
                    <div className="home-featured-content">
                      <p className="home-featured-kicker">Next tournament</p>
                      <h2 className="home-featured-title">
                        {homeAnnouncement.title || "Tournament announcement"}
                      </h2>

                      {homeAnnouncement.subtitle ? (
                        <p className="home-featured-subtitle">
                          {homeAnnouncement.subtitle}
                        </p>
                      ) : null}

                      <div className="home-featured-meta">
                        {homeAnnouncement.date ? (
                          <span className="home-meta-pill">
                            Date: {homeAnnouncement.date}
                          </span>
                        ) : null}
                        {homeAnnouncement.format ? (
                          <span className="home-meta-pill">
                            Format: {homeAnnouncement.format}
                          </span>
                        ) : null}
                        {homeAnnouncement.status ? (
                          <span className="home-meta-pill">
                            Status: {homeAnnouncement.status}
                          </span>
                        ) : null}
                        {homeAnnouncement.prize ? (
                          <span className="home-meta-pill">
                            Prize: {homeAnnouncement.prize}
                          </span>
                        ) : null}
                        {homeAnnouncement.participantCount > 0 ? (
                          <span className="home-meta-pill">
                            Players: {homeAnnouncement.participantCount}
                          </span>
                        ) : null}
                      </div>

                      {homeAnnouncement.description ? (
                        <p className="home-featured-description">
                          {homeAnnouncement.description}
                        </p>
                      ) : null}

                      {homeAnnouncement.tournamentId ? (
                        <div className="btn-row">
                          <button
                            className="primary-btn"
                            onClick={() => {
                              setSelectedTournamentId(
                                Number(homeAnnouncement.tournamentId)
                              );
                              setActiveTab("tournaments");
                            }}
                          >
                            Open tournament
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="home-grid">
                  {tournaments.filter((t) => t.status === "completed").length >
                    0 && (
                    <div className="panel champion-panel">
                      <h2 className="panel-title">Last Champion</h2>

                      {(() => {
                        const lastTournament = [...tournaments]
                          .filter((t) => t.status === "completed")
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime()
                          )[0];

                        const winner =
                          lastTournament.participantType === "team"
                            ? teams.find(
                                (team) =>
                                  team.id === lastTournament.winnerTeamId
                              )
                            : players.find(
                                (player) =>
                                  player.id === lastTournament.winnerId
                              );

                        const winnerName = winner
                          ? "name" in winner
                            ? winner.name
                            : winner.nickname
                          : "Unknown";

                        const winnerImage = winner
                          ? "name" in winner
                            ? winner.logo
                            : winner.avatar
                          : "";

                        const tournamentCompletedMatches = matches.filter(
                          (m) =>
                            m.tournamentId === lastTournament.id &&
                            m.status === "completed"
                        );

                        const explicitFinalMatch =
                          tournamentCompletedMatches.find(
                            (m) =>
                              (m.round || "").toLowerCase().includes("final") &&
                              !(m.round || "").toLowerCase().includes("semi")
                          );

                        const winnerLastMatch = [...tournamentCompletedMatches]
                          .filter((m) =>
                            lastTournament.participantType === "team"
                              ? m.winnerTeamId === lastTournament.winnerTeamId
                              : m.winnerId === lastTournament.winnerId
                          )
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime()
                          )[0];

                        const finalMatch =
                          explicitFinalMatch || winnerLastMatch || null;

                        const opponent =
                          finalMatch &&
                          lastTournament.participantType === "team"
                            ? teams.find(
                                (t) =>
                                  t.id !== finalMatch.winnerTeamId &&
                                  (t.id === finalMatch.team1 ||
                                    t.id === finalMatch.team2)
                              )
                            : finalMatch
                            ? players.find(
                                (p) =>
                                  p.id !== finalMatch.winnerId &&
                                  (p.id === finalMatch.player1 ||
                                    p.id === finalMatch.player2)
                              )
                            : null;

                        const opponentName = opponent
                          ? "name" in opponent
                            ? opponent.name
                            : opponent.nickname
                          : "Unknown";

                        return (
                          <div className="champion-card champion-card-upgraded">
                            <div className="champion-left">
                              {winnerImage ? (
                                <img
                                  src={winnerImage}
                                  alt={winnerName}
                                  className="champion-avatar"
                                />
                              ) : (
                                <div className="champion-avatar-placeholder">
                                  {winnerName.charAt(0) || "C"}
                                </div>
                              )}

                              <div>
                                <div className="champion-name">
                                  {winnerName}
                                </div>

                                <div className="champion-tournament-badge">
                                  {lastTournament.title}
                                </div>

                                <div className="champion-meta-row">
                                  <span className="champion-game-pill">
                                    {lastTournament.game}
                                  </span>

                                  <span className="champion-date-pill">
                                    {lastTournament.date || "TBD"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="champion-right">
                              <div className="champion-badge">🏆</div>

                              {finalMatch && (
                                <>
                                  <div className="champion-score-label">
                                    FINAL RESULT
                                  </div>
                                  <div className="champion-score-big">
                                    {finalMatch.score || "—"}
                                  </div>
                                  <div className="champion-opponent-pill">
                                    vs {opponentName}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="panel home-panel">
                    <h2 className="panel-title">Recent Results</h2>

                    {matches.filter((m) => m.status === "completed").length ===
                    0 ? (
                      <div className="empty-block">No recent results</div>
                    ) : (
                      <div className="list-col">
                        {[...matches]
                          .filter((m) => m.status === "completed")
                          .sort((a, b) => b.id - a.id)
                          .slice(0, 5)
                          .map((match: Match) => {
                            const tournament = tournaments.find(
                              (t) => t.id === match.tournamentId
                            );

                            const isTeamMatch = match.matchType === "team";

                            const leftEntity = isTeamMatch
                              ? teams.find((t) => t.id === match.team1)
                              : players.find((p) => p.id === match.player1);

                            const rightEntity = isTeamMatch
                              ? teams.find((t) => t.id === match.team2)
                              : players.find((p) => p.id === match.player2);

                            const leftName = isTeamMatch
                              ? leftEntity && "name" in leftEntity
                                ? leftEntity.name
                                : "Team 1"
                              : leftEntity && "nickname" in leftEntity
                              ? leftEntity.nickname
                              : "Player 1";

                            const rightName = isTeamMatch
                              ? rightEntity && "name" in rightEntity
                                ? rightEntity.name
                                : "Team 2"
                              : rightEntity && "nickname" in rightEntity
                              ? rightEntity.nickname
                              : "Player 2";

                            const leftImage = isTeamMatch
                              ? leftEntity && "logo" in leftEntity
                                ? leftEntity.logo
                                : ""
                              : leftEntity && "avatar" in leftEntity
                              ? leftEntity.avatar
                              : "";

                            const rightImage = isTeamMatch
                              ? rightEntity && "logo" in rightEntity
                                ? rightEntity.logo
                                : ""
                              : rightEntity && "avatar" in rightEntity
                              ? rightEntity.avatar
                              : "";

                            const winnerLeft = isTeamMatch
                              ? match.winnerTeamId === match.team1
                              : match.winnerId === match.player1;

                            const winnerRight = isTeamMatch
                              ? match.winnerTeamId === match.team2
                              : match.winnerId === match.player2;

                            return (
                              <div
                                key={match.id}
                                className="result-card"
                                style={{
                                  background: tournament?.imageUrl
                                    ? `linear-gradient(
                                        90deg,
                                        rgba(5, 7, 14, 0.96) 0%,
                                        rgba(5, 7, 14, 0.88) 28%,
                                        rgba(5, 7, 14, 0.76) 52%,
                                        rgba(5, 7, 14, 0.9) 100%
                                      ), url(${tournament.imageUrl}) center / cover no-repeat`
                                    : undefined,
                                }}
                              >
                                <div className="result-row">
                                  <div className="result-player-side left">
                                    {leftImage ? (
                                      <img
                                        src={leftImage}
                                        alt={leftName}
                                        className="result-avatar"
                                      />
                                    ) : (
                                      <div className="result-avatar-placeholder">
                                        {leftName.charAt(0) || "P"}
                                      </div>
                                    )}

                                    <div
                                      className={`result-player-name ${
                                        winnerLeft ? "winner" : ""
                                      }`}
                                    >
                                      {leftName}
                                    </div>
                                  </div>

                                  <div className="result-score-wrap">
                                    <div className="result-score">
                                      {match.score || "—"}
                                    </div>
                                  </div>

                                  <div className="result-player-side right">
                                    <div
                                      className={`result-player-name ${
                                        winnerRight ? "winner" : ""
                                      }`}
                                    >
                                      {rightName}
                                    </div>

                                    {rightImage ? (
                                      <img
                                        src={rightImage}
                                        alt={rightName}
                                        className="result-avatar"
                                      />
                                    ) : (
                                      <div className="result-avatar-placeholder">
                                        {rightName.charAt(0) || "P"}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="result-meta">
                                  <span
                                    className={`result-round ${
                                      (match.round || "")
                                        .toLowerCase()
                                        .includes("final")
                                        ? "final"
                                        : ""
                                    }`}
                                  >
                                    {match.round || "Match"}
                                  </span>

                                  <span className="result-date">
                                    {match.date || "TBD"}
                                  </span>
                                </div>

                                <div className="result-tournament">
                                  {tournament?.title || "No tournament"}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <div className="panel home-panel">
                    <h2 className="panel-title">Upcoming Matches</h2>

                    {matches.filter((m) => m.status !== "completed").length ===
                    0 ? (
                      <div className="empty-block">No upcoming matches</div>
                    ) : (
                      <div className="list-col">
                        {matches
                          .filter((m) => m.status !== "completed")
                          .sort(
                            (a, b) =>
                              new Date(a.date).getTime() -
                              new Date(b.date).getTime()
                          )
                          .slice(0, 5)
                          .map((match: Match) => {
                            const isTeamMatch = match.matchType === "team";

                            const leftEntity = isTeamMatch
                              ? teams.find((team) => team.id === match.team1)
                              : players.find(
                                  (player) => player.id === match.player1
                                );

                            const rightEntity = isTeamMatch
                              ? teams.find((team) => team.id === match.team2)
                              : players.find(
                                  (player) => player.id === match.player2
                                );

                            const leftName = isTeamMatch
                              ? leftEntity && "name" in leftEntity
                                ? leftEntity.name
                                : "Team 1"
                              : leftEntity && "nickname" in leftEntity
                              ? leftEntity.nickname
                              : "Player 1";

                            const rightName = isTeamMatch
                              ? rightEntity && "name" in rightEntity
                                ? rightEntity.name
                                : "Team 2"
                              : rightEntity && "nickname" in rightEntity
                              ? rightEntity.nickname
                              : "Player 2";

                            const leftImage = isTeamMatch
                              ? leftEntity && "logo" in leftEntity
                                ? leftEntity.logo
                                : ""
                              : leftEntity && "avatar" in leftEntity
                              ? leftEntity.avatar
                              : "";

                            const rightImage = isTeamMatch
                              ? rightEntity && "logo" in rightEntity
                                ? rightEntity.logo
                                : ""
                              : rightEntity && "avatar" in rightEntity
                              ? rightEntity.avatar
                              : "";

                            return (
                              <div key={match.id} className="match-card new">
                                <div className="match-top">
                                  <span className="pill light">
                                    {match.round || "Match"}
                                  </span>
                                  <span className="pill">
                                    {match.bestOf ? `BO${match.bestOf}` : ""}
                                  </span>
                                </div>

                                <div className="match-center">
                                  <div className="team-side">
                                    <div className="team-side-inner">
                                      {leftImage ? (
                                        <img
                                          src={leftImage}
                                          alt={leftName}
                                          className="match-side-avatar"
                                        />
                                      ) : (
                                        <div className="match-side-avatar-placeholder">
                                          {leftName.charAt(0) || "T"}
                                        </div>
                                      )}

                                      <div className="team-name">
                                        {leftName}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="vs-big">VS</div>

                                  <div className="team-side">
                                    <div className="team-side-inner team-side-inner-right">
                                      <div className="team-name">
                                        {rightName}
                                      </div>

                                      {rightImage ? (
                                        <img
                                          src={rightImage}
                                          alt={rightName}
                                          className="match-side-avatar"
                                        />
                                      ) : (
                                        <div className="match-side-avatar-placeholder">
                                          {rightName.charAt(0) || "T"}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="match-bottom">
                                  {match.date || "TBD"}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <div className="panel home-panel">
                    <h2 className="panel-title">Top Players</h2>

                    <div className="list-col">
                      {[...players]
                        .sort((a, b) => b.elo - a.elo)
                        .slice(0, 5)
                        .map((player: Player, index: number) => (
                          <div
                            key={player.id}
                            className={`player-row new ${
                              index < 3 ? "top-player" : ""
                            }`}
                          >
                            <div className="player-left">
                              <div className="rank-box-small">#{index + 1}</div>

                              {player.avatar ? (
                                <img
                                  src={player.avatar}
                                  alt={player.nickname}
                                  className="top-player-avatar"
                                />
                              ) : (
                                <div className="avatar-placeholder">
                                  {player.nickname.charAt(0)}
                                </div>
                              )}

                              <div className="player-name">
                                {player.nickname}
                              </div>
                            </div>

                            <div className="elo-box">{player.elo}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "players" && (
          <PlayersTab
            players={players}
            teams={teams}
            matches={matches}
            tournaments={tournaments}
            achievements={achievements}
            selectedPlayerId={selectedPlayerId}
            setSelectedPlayerId={setSelectedPlayerId}
            search={search}
            setSearch={setSearch}
            gameFilter={gameFilter}
            setGameFilter={setGameFilter}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            sortMode={sortMode}
            setSortMode={setSortMode}
            gamesList={gamesList}
          />
        )}

        {activeTab === "teams" && (
          <TeamsTab
            teams={teams}
            players={players}
            tournaments={tournaments}
            matches={matches}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
          />
        )}

        {activeTab === "tournaments" && (
          <TournamentsTab
            tournaments={tournaments}
            players={players}
            teams={teams}
            matches={matches}
          />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardTab
            players={players}
            teams={teams}
            achievements={achievements}
            onOpenPlayer={openPlayerProfile}
          />
        )}

        {activeTab === "admin" && isAdmin && (
          <AdminTab
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
            handlePlayerAvatarUpload={handlePlayerAvatarUpload}
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
            saveMatch={saveMatch}
            addMatch={addMatch}
            deleteMatch={deleteMatch}
            saveAchievement={saveAchievement}
            addAchievement={addAchievement}
            deleteAchievement={deleteAchievement}
            selectedAchievement={selectedAchievement}
          />
        )}

        {saveMessage ? <div className="save-toast">{saveMessage}</div> : null}

        {showAdminLogin && (
          <div
            className="admin-overlay"
            onClick={() => {
              setShowAdminLogin(false);
              setAdminPassword("");
              setAdminError("");
            }}
          >
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="panel-title">Admin access</h2>

              <div className="form-col">
                <input
                  type="password"
                  className="input"
                  placeholder="Enter password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAdminLogin();
                    }
                  }}
                  autoFocus
                />

                {adminError ? (
                  <div className="admin-error">{adminError}</div>
                ) : null}

                <div className="btn-row">
                  <button className="primary-btn" onClick={handleAdminLogin}>
                    Login
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setShowAdminLogin(false);
                      setAdminPassword("");
                      setAdminError("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
