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
  Match,
  MatchStatus,
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
  participantIds: number[];
  winnerId?: number;
  mvpId?: number;
  isPublished: boolean;
};

type MatchForm = {
  game: string;
  player1: number;
  player2: number;
  score: string;
  winnerId: number;
  tournamentId: number;
  date: string;
  status: MatchStatus;
  round: string;
  bestOf: number;
  notes: string;
  eloApplied: boolean;
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
  participantIds: [],
  winnerId: undefined,
  mvpId: undefined,
  isPublished: false,
});

const createEmptyMatchForm = (): MatchForm => ({
  game: "",
  player1: 0,
  player2: 0,
  score: "",
  winnerId: 0,
  tournamentId: 0,
  date: "",
  status: "scheduled",
  round: "",
  bestOf: 1,
  notes: "",
  eloApplied: false,
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
    participantIds: Array.isArray(tournament.participantIds)
      ? tournament.participantIds
      : [],
    winnerId: typeof tournament.winnerId === "number" ? tournament.winnerId : 0,
    mvpId: typeof tournament.mvpId === "number" ? tournament.mvpId : 0,
    placements: Array.isArray(tournament.placements)
      ? tournament.placements
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

export default function App() {
  const ADMIN_PASSWORD = "monaco123";

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

  const [activeTab, setActiveTab] = useState<TabKey>("players");

  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(1);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(1);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number>(1);
  const [selectedMatchId, setSelectedMatchId] = useState<number>(1);

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

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

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

  const getSafeTeamId = (teamId: number) =>
    teams.some((team) => team.id === teamId) ? teamId : 0;

  useEffect(() => writeStorage("tm_players", players), [players]);
  useEffect(() => writeStorage("tm_teams", teams), [teams]);
  useEffect(() => writeStorage("tm_tournaments", tournaments), [tournaments]);
  useEffect(() => writeStorage("tm_matches", matches), [matches]);
  useEffect(
    () => writeStorage("tm_achievements", achievements),
    [achievements]
  );

  useEffect(() => {
    let unsubPlayers = () => {};
    let unsubTeams = () => {};
    let unsubTournaments = () => {};
    let unsubMatches = () => {};
    let unsubAchievements = () => {};
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

    if (!matches.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId(matches[0].id);
    }
  }, [matches, selectedMatchId]);

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
      participantIds: Array.isArray(selectedTournament.participantIds)
        ? selectedTournament.participantIds.map(Number)
        : [],
      winnerId:
        typeof selectedTournament.winnerId === "number" &&
        selectedTournament.winnerId > 0
          ? Number(selectedTournament.winnerId)
          : undefined,
      mvpId:
        typeof selectedTournament.mvpId === "number" &&
        selectedTournament.mvpId > 0
          ? Number(selectedTournament.mvpId)
          : undefined,
      isPublished: Boolean(selectedTournament.isPublished),
    });
  }, [selectedTournament]);

  useEffect(() => {
    if (!selectedMatch) {
      setMatchForm(createEmptyMatchForm());
      return;
    }

    setMatchForm({
      game: selectedMatch.game,
      player1: selectedMatch.player1,
      player2: selectedMatch.player2,
      score: selectedMatch.score,
      winnerId: selectedMatch.winnerId,
      tournamentId: selectedMatch.tournamentId,
      date: selectedMatch.date,
      status: selectedMatch.status,
      round: selectedMatch.round,
      bestOf: selectedMatch.bestOf,
      notes: selectedMatch.notes,
      eloApplied: Boolean(selectedMatch.eloApplied),
    });
  }, [selectedMatch]);

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

    setPlayers(nextPlayers);
    setTeams(nextTeams);

    try {
      if (isFirebaseConfigured) {
        await Promise.all([
          deleteItem("teams", deletedId),
          saveItemsBatch("players", nextPlayers),
          saveItemsBatch("teams", nextTeams),
        ]);
      }
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
  };

  const saveTournament = async () => {
    if (!selectedTournament) return;

    const safeParticipantIds = Array.isArray(tournamentForm.participantIds)
      ? tournamentForm.participantIds.map(Number)
      : [];

    const safeWinnerId =
      typeof tournamentForm.winnerId === "number" &&
      safeParticipantIds.includes(Number(tournamentForm.winnerId))
        ? Number(tournamentForm.winnerId)
        : 0;

    const safeMvpId =
      typeof tournamentForm.mvpId === "number" &&
      safeParticipantIds.includes(Number(tournamentForm.mvpId))
        ? Number(tournamentForm.mvpId)
        : 0;

    const updatedTournament: Tournament = {
      ...selectedTournament,
      title: tournamentForm.title,
      game: tournamentForm.game,
      type: tournamentForm.type,
      format: tournamentForm.format,
      status: tournamentForm.status,
      date: tournamentForm.date,
      prize: tournamentForm.prize,
      description: tournamentForm.description,
      participantIds: safeParticipantIds,
      winnerId: safeWinnerId,
      mvpId: safeMvpId,
      placements: Array.isArray(selectedTournament.placements)
        ? selectedTournament.placements
        : [],
      isPublished: Boolean(tournamentForm.isPublished),
    };

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id === selectedTournament.id ? updatedTournament : tournament
      )
    );

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
      id: getNextId(tournaments),
      title: "New Tournament",
      game: "",
      type: "",
      format: "",
      status: "draft",
      date: "",
      prize: "",
      description: "",
      participantIds: [],
      winnerId: 0,
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
      participantIds: [],
      winnerId: undefined,
      mvpId: undefined,
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
      player1: Number(matchForm.player1),
      player2: Number(matchForm.player2),
      score: matchForm.score,
      winnerId: Number(matchForm.winnerId),
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
    } catch (error) {
      console.error("Failed to save match:", error);
    }
  };

  const addMatch = async () => {
    const newMatch: Match = {
      id: getNextId(matches),
      game: "",
      player1: 0,
      player2: 0,
      score: "",
      winnerId: 0,
      tournamentId: 0,
      date: "",
      status: "scheduled",
      round: "",
      bestOf: 1,
      notes: "",
      eloApplied: false,
    };

    setMatches((prev) => [...prev, newMatch]);
    setSelectedMatchId(newMatch.id);
    setMatchForm(createEmptyMatchForm());

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

    try {
      if (isFirebaseConfigured) {
        await saveItem("achievements", newAchievement);
      }
    } catch (error) {
      console.error("Failed to add achievement:", error);
    }
  };

  const deleteAchievement = async (achievementId: number) => {
    setAchievements((prev) =>
      prev.filter((achievement) => achievement.id !== achievementId)
    );

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
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
          />
        )}

        {activeTab === "tournaments" && (
          <TournamentsTab tournaments={tournaments} players={players} />
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
            selectedPlayerId={selectedPlayerId}
            setSelectedPlayerId={setSelectedPlayerId}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
            selectedTournamentId={selectedTournamentId}
            setSelectedTournamentId={setSelectedTournamentId}
            selectedMatchId={selectedMatchId}
            setSelectedMatchId={setSelectedMatchId}
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
          />
        )}

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
