import { ChangeEvent, Dispatch, SetStateAction, useRef, useState } from "react";
import {
  Achievement,
  HomeAnnouncement,
  Match,
  MatchStatus,
  Placement,
  Player,
  Team,
  Tournament,
  TournamentGroup,
  TournamentStatus,
  TournamentTeamRoster,
} from "../types";
import { gamesList } from "../data";
import { parseList } from "../utils";
import { t } from "../utils/translations";
import AdminPlayers from "./admin/AdminPlayers";
import AdminTeams from "./admin/AdminTeams";
import AdminTournaments from "./admin/AdminTournaments";
import AdminMatches from "./admin/AdminMatches";
import AdminAchievements from "./admin/AdminAchievements";
import AdminGeneral from "./admin/AdminGeneral";
import PremiumSelect from "./ui/PremiumSelect";

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
  nextSeriesId?: string; // 🔥 ДОДАЙ

  bestOf: number;
  notes: string;
};

type HomeAnnouncementForm = HomeAnnouncement;

type Props = {
  players: Player[];
  teams: Team[];
  tournaments: Tournament[];
  matches: Match[];
  achievements: Achievement[];
  homeAnnouncementForm: HomeAnnouncementForm;
  setHomeAnnouncementForm: Dispatch<SetStateAction<HomeAnnouncementForm>>;
  saveHomeAnnouncement: () => void;

  selectedPlayerId: number;
  setSelectedPlayerId: (id: number) => void;

  selectedTeamId: number;
  setSelectedTeamId: (id: number) => void;

  selectedTournamentId: number;
  setSelectedTournamentId: (id: number) => void;

  selectedMatchId: number;
  setSelectedMatchId: (id: number) => void;

  selectedAchievementId: number;
  setSelectedAchievementId: (id: number) => void;

  playerForm: PlayerForm;
  setPlayerForm: Dispatch<SetStateAction<PlayerForm>>;

  teamForm: TeamForm;
  setTeamForm: Dispatch<SetStateAction<TeamForm>>;

  tournamentForm: TournamentForm;
  setTournamentForm: Dispatch<SetStateAction<TournamentForm>>;

  matchForm: MatchForm;
  setMatchForm: Dispatch<SetStateAction<MatchForm>>;

  handleTeamLogoUpload: (event: ChangeEvent<HTMLInputElement>) => void;

  savePlayer: () => void | Promise<void>;
  addPlayer: () => void | Promise<void>;
  deletePlayer: () => void | Promise<void>;

  saveTeam: () => void | Promise<void>;
  addTeam: () => void | Promise<void>;
  deleteTeam: () => void | Promise<void>;

  saveTournament: () => void | Promise<void>;
  addTournament: () => void | Promise<void>;
  deleteTournament: () => void | Promise<void>;
  reorderTournament: (direction: "up" | "down") => void;

saveMatch: () => void | Promise<void>;
addMatch: (tournamentId?: number) => void | Promise<void>;
deleteMatch: () => void | Promise<void>;
reorderMatch: (direction: "up" | "down", tournamentId: number) => void;

  saveAchievement: (
    id: number,
    updates: Partial<Achievement>
  ) => void | Promise<void>;
  addAchievement: () => void | Promise<void>;
  deleteAchievement: (id: number) => void | Promise<void>;
  selectedAchievement: Achievement | null;
autoGenerateBracket: (tournamentId: number) => void;
lang: "en" | "ua";
};

const tournamentStatusOptions: TournamentStatus[] = [
  "draft",
  "upcoming",
  "ongoing",
  "completed",
];

const matchStatusOptions: MatchStatus[] = [
  "scheduled",
  "ongoing",
  "completed",
  "cancelled",
];

function MultiGamePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedGames = value ? parseList(value) : [];

  return (
    <div className="picker-grid">
      {gamesList.map((game) => {
        const isSelected = selectedGames.includes(game.name);

        return (
          <button
            key={game.id}
            type="button"
            className={`picker-btn ${isSelected ? "picker-btn-active" : ""}`}
            onClick={() => {
              const nextGames = isSelected
                ? selectedGames.filter((g) => g !== game.name)
                : [...selectedGames, game.name];
              onChange(nextGames.join(", "));
            }}
          >
            <img src={game.icon} alt={game.name} className="picker-icon" />
            <span>{game.name}</span>
          </button>
        );
      })}
    </div>
  );
}


export default function AdminTab({
  lang,
  autoGenerateBracket,
  players,
  teams,
  tournaments,
  matches,
  achievements,
  homeAnnouncementForm,
  setHomeAnnouncementForm,
  saveHomeAnnouncement,
  selectedPlayerId,
  setSelectedPlayerId,
  selectedTeamId,
  setSelectedTeamId,
  selectedTournamentId,
  setSelectedTournamentId,
  selectedMatchId,
  setSelectedMatchId,
  selectedAchievementId,
  setSelectedAchievementId,
  playerForm,
  setPlayerForm,
  teamForm,
  setTeamForm,
  tournamentForm,
  setTournamentForm,
  matchForm,
  setMatchForm,
  handleTeamLogoUpload,
  savePlayer,
  addPlayer,
  deletePlayer,
  saveTeam,
  addTeam,
  deleteTeam,
  saveTournament,
  addTournament,
  deleteTournament,
  reorderTournament,
saveMatch,
addMatch,
deleteMatch,
reorderMatch,
  saveAchievement,
  addAchievement,
  deleteAchievement,
  selectedAchievement,
}: Props) {
  const safeTournamentParticipantIds = Array.isArray(
    tournamentForm.participantIds
  )
    ? tournamentForm.participantIds.map(Number)
    : [];

    const text = t[lang] || t.en;
    const adminText = text.admin;
    const commonText = text.common;
    const quickNavText = {
      players: text.nav.players,
      teams: text.nav.teams,
      tournaments: text.nav.tournaments,
      general: text.nav.general,
      matches: adminText.quickMatches,
      achievements: adminText.quickAchievements,
    };

  const safeAchievementPlayerIds = (achievement: Achievement) =>
    Array.isArray(achievement.playerIds) ? achievement.playerIds : [];

  const getPlayerName = (playerId: number) =>
    players.find((player) => player.id === playerId)?.nickname || adminText.unknown;

  const getTournamentName = (tournamentId: number) =>
    tournaments.find((tournament) => tournament.id === tournamentId)?.title ||
    adminText.noTournament;

  const getTeamName = (teamId: number) =>
    teams.find((team) => team.id === teamId)?.name || adminText.unknownTeam;

  const orderedTournaments = [...tournaments].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const selectedTournament =
    selectedTournamentId === 0
      ? null
      : tournaments.find((t) => t.id === selectedTournamentId) || null;

  const selectedTournamentPlayers = players.filter((player) =>
    safeTournamentParticipantIds.includes(player.id)
  );

  const selectedTournamentTeams = teams.filter((team) =>
    safeTournamentParticipantIds.includes(team.id)
  );

  const selectedTournamentMvpPlayers =
    tournamentForm.participantType === "team"
      ? players.filter((player) =>
          selectedTournamentTeams.some(
            (team) => team.id === Number(player.teamId)
          )
        )
      : selectedTournamentPlayers;

  const selectedTournamentWinnerId =
    tournamentForm.participantType === "player" &&
    typeof tournamentForm.winnerId === "number" &&
    safeTournamentParticipantIds.includes(Number(tournamentForm.winnerId))
      ? Number(tournamentForm.winnerId)
      : "";

  const selectedTournamentWinnerTeamId =
    tournamentForm.participantType === "team" &&
    typeof tournamentForm.winnerTeamId === "number" &&
    safeTournamentParticipantIds.includes(Number(tournamentForm.winnerTeamId))
      ? Number(tournamentForm.winnerTeamId)
      : "";

  const selectedTournamentMvpId =
    typeof tournamentForm.mvpId === "number" &&
    selectedTournamentMvpPlayers.some(
      (player) => player.id === Number(tournamentForm.mvpId)
    )
      ? Number(tournamentForm.mvpId)
      : "";

  const [playerAdminSearch, setPlayerAdminSearch] = useState("");
  const [matchTournamentFilterId, setMatchTournamentFilterId] = useState(0);

  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    type: "player" | "team" | "tournament" | "match" | "achievement" | null;
    achievementId?: number;
  }>({
    open: false,
    type: null,
  });
  const [adminActionLoading, setAdminActionLoading] = useState<
    Record<string, boolean>
  >({});
  const adminActionLoadingRef = useRef<Record<string, boolean>>({});

  const isAdminActionLoading = (key: string) =>
    Boolean(adminActionLoading[key] || adminActionLoadingRef.current[key]);

const ADMIN_ACTION_LOCK_MS = 3000;

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const runAdminAction = async (
  key: string,
  action: () => void | Promise<void>
) => {
  if (adminActionLoadingRef.current[key]) return;

  adminActionLoadingRef.current = {
    ...adminActionLoadingRef.current,
    [key]: true,
  };
  setAdminActionLoading((prev) => ({ ...prev, [key]: true }));

  try {
    await action();
    await wait(ADMIN_ACTION_LOCK_MS);
  } finally {
    const nextLoading = { ...adminActionLoadingRef.current };
    delete nextLoading[key];
    adminActionLoadingRef.current = nextLoading;

    setAdminActionLoading((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }
};

  const selectedMatchTournament =
    tournaments.find(
      (tournament) => tournament.id === matchTournamentFilterId
    ) || null;

  const tournamentPlayerPool =
    selectedMatchTournament?.participantType === "player" &&
    selectedMatchTournament?.participantIds?.length
      ? players.filter((player) =>
          selectedMatchTournament.participantIds.includes(player.id)
        )
      : players;

  const tournamentTeamPool =
    selectedMatchTournament?.participantType === "team" &&
    selectedMatchTournament?.participantIds?.length
      ? teams.filter((team) =>
          selectedMatchTournament.participantIds.includes(team.id)
        )
      : teams;

  const availablePlayer1Options = tournamentPlayerPool.filter(
    (player) => player.id !== matchForm.player2
  );

  const availablePlayer2Options = tournamentPlayerPool.filter(
    (player) => player.id !== matchForm.player1
  );

  const selectedWinnerOptions = [matchForm.player1, matchForm.player2]
    .filter(
      (playerId, index, arr) =>
        playerId !== 0 && arr.indexOf(playerId) === index
    )
    .map((playerId) => ({
      id: playerId,
      name: getPlayerName(playerId),
    }));

  const availableTeam1Options = tournamentTeamPool.filter(
    (team) => team.id !== matchForm.team2
  );

  const availableTeam2Options = tournamentTeamPool.filter(
    (team) => team.id !== matchForm.team1
  );

  const selectedWinnerTeamOptions = [matchForm.team1, matchForm.team2]
    .filter(
      (teamId, index, arr) => teamId !== 0 && arr.indexOf(teamId) === index
    )
    .map((teamId) => ({
      id: teamId,
      name: getTeamName(teamId),
    }));

  const filteredAdminPlayers = [...players]
    .filter((player) => {
      const q = playerAdminSearch.toLowerCase().trim();
      if (!q) return true;

      return (
        player.nickname.toLowerCase().includes(q) ||
        player.fullName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });

  const toggleTournamentParticipant = (id: number) => {
    setTournamentForm((prev) => {
      const currentIds = Array.isArray(prev.participantIds)
        ? prev.participantIds.map(Number)
        : [];

      const isSelected = currentIds.includes(id);

      const nextParticipantIds = isSelected
        ? currentIds.filter((itemId) => itemId !== id)
        : [...currentIds, id];

      const nextGroups = Array.isArray(prev.groups)
        ? prev.groups.map((group) => ({
            ...group,
            participantIds: Array.isArray(group.participantIds)
              ? group.participantIds.filter((participantId) =>
                  nextParticipantIds.includes(participantId)
                )
              : [],
          }))
        : [];
      const safeTeamRosters = Array.isArray(prev.teamRosters)
        ? prev.teamRosters
        : [];
      const nextTeamRosters =
        prev.participantType === "team"
          ? nextParticipantIds.map((teamId) => {
              const existingRoster = safeTeamRosters.find(
                (roster) => Number(roster.teamId) === Number(teamId)
              );

              return existingRoster
                ? {
                    teamId,
                    playerIds: Array.isArray(existingRoster.playerIds)
                      ? existingRoster.playerIds.map(Number)
                      : [],
                  }
                : { teamId, playerIds: [] };
            })
          : undefined;

      return {
        ...prev,
        participantIds: nextParticipantIds,
        teamRosters: nextTeamRosters,
        groups: nextGroups,
        winnerId: undefined,
        winnerTeamId: undefined,
        winnerSquadIds: Array.isArray(prev.winnerSquadIds)
          ? prev.winnerSquadIds.filter((winnerId) =>
              nextParticipantIds.includes(winnerId)
            )
          : [],
        mvpId: undefined,
      };
    });
  };

  const toggleTournamentRosterPlayer = (teamId: number, playerId: number) => {
    setTournamentForm((prev) => {
      const currentRosters = Array.isArray(prev.teamRosters)
        ? prev.teamRosters
        : [];
      const safeParticipantIds = Array.isArray(prev.participantIds)
        ? prev.participantIds.map(Number)
        : [];
      const hasRoster = currentRosters.some(
        (roster) => Number(roster.teamId) === Number(teamId)
      );
      const baseRosters = hasRoster
        ? currentRosters
        : [...currentRosters, { teamId, playerIds: [] }];

      return {
        ...prev,
        teamRosters: baseRosters
          .filter((roster) => safeParticipantIds.includes(Number(roster.teamId)))
          .map((roster) => {
            if (Number(roster.teamId) !== Number(teamId)) {
              return {
                teamId: Number(roster.teamId),
                playerIds: Array.isArray(roster.playerIds)
                  ? roster.playerIds.map(Number)
                  : [],
              };
            }

            const currentPlayerIds = Array.isArray(roster.playerIds)
              ? roster.playerIds.map(Number)
              : [];
            const nextPlayerIds = currentPlayerIds.includes(playerId)
              ? currentPlayerIds.filter((id) => id !== playerId)
              : [...currentPlayerIds, playerId];

            return {
              teamId: Number(roster.teamId),
              playerIds: nextPlayerIds,
            };
          }),
      };
    });
  };

  const addTournamentGroup = () => {
    setTournamentForm((prev) => {
      const currentGroups = Array.isArray(prev.groups) ? prev.groups : [];
      const nextIndex = currentGroups.length + 1;
      const nextLetter = String.fromCharCode(64 + nextIndex);

      return {
        ...prev,
        groups: [
          ...currentGroups,
          {
            id: `group-${Date.now()}`,
            name: `Group ${nextLetter}`,
            participantIds: [],
          },
        ],
      };
    });
  };

  const updateTournamentGroupName = (groupId: string, name: string) => {
    setTournamentForm((prev) => ({
      ...prev,
      groups: Array.isArray(prev.groups)
        ? prev.groups.map((group) =>
            group.id === groupId ? { ...group, name } : group
          )
        : [],
    }));
  };

  const deleteTournamentGroup = (groupId: string) => {
    setTournamentForm((prev) => ({
      ...prev,
      groups: Array.isArray(prev.groups)
        ? prev.groups.filter((group) => group.id !== groupId)
        : [],
    }));
  };

  const toggleTournamentGroupParticipant = (
    groupId: string,
    participantId: number
  ) => {
    setTournamentForm((prev) => {
      const currentGroups = Array.isArray(prev.groups) ? prev.groups : [];

      return {
        ...prev,
        groups: currentGroups.map((group) => {
          if (group.id !== groupId) {
            return group;
          }

          const currentIds = Array.isArray(group.participantIds)
            ? group.participantIds.map(Number)
            : [];

          const isSelected = currentIds.includes(participantId);

          return {
            ...group,
            participantIds: isSelected
              ? currentIds.filter((id) => id !== participantId)
              : [...currentIds, participantId],
          };
        }),
      };
    });
  };

  const toggleAchievementPlayer = (
    achievement: Achievement,
    playerId: number
  ) => {
    const currentIds = safeAchievementPlayerIds(achievement);
    const isSelected = currentIds.includes(playerId);

    const nextPlayerIds = isSelected
      ? currentIds.filter((id) => id !== playerId)
      : [...currentIds, playerId];

    saveAchievement(achievement.id, { playerIds: nextPlayerIds });
  };

  const handleTournamentSelect = (tournamentId: number) => {
    setSelectedTournamentId(tournamentId);
  };
  const handleAchievementImageUpload =
    (achievementId: number) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        if (!result) return;

        saveAchievement(achievementId, { image: result });
      };

      reader.readAsDataURL(file);
      event.target.value = "";
    };

  const handleTournamentImageUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    setTournamentForm((prev) => ({
      ...prev,
      imageUrl: value,
    }));
  };

  const handleHomeAnnouncementImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    setHomeAnnouncementForm((prev) => ({
      ...prev,
      imageUrl: value,
    }));
  };

  const scrollToAdminSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const confirmDeleteActionKey = confirmDelete.type
    ? `delete-${confirmDelete.type}`
    : "";

const adminPlayersProps = {
  adminText,
  commonText,
  PremiumSelect,
  MultiGamePicker,
  setConfirmDelete,
  isAdminActionLoading,
  players,
  teams,
  selectedPlayerId,
  setSelectedPlayerId,
  playerForm,
  setPlayerForm,
  savePlayer: () => runAdminAction("save-player", savePlayer),
  addPlayer: () => runAdminAction("create-player", addPlayer),
  playerAdminSearch,
  setPlayerAdminSearch,
  filteredAdminPlayers,
};

const adminTeamsProps = {
  adminText,
  commonText,
  MultiGamePicker,
  setConfirmDelete,
  isAdminActionLoading,
  teams,
  selectedTeamId,
  setSelectedTeamId,
  teamForm,
  setTeamForm,
  saveTeam: () => runAdminAction("save-team", saveTeam),
  addTeam: () => runAdminAction("create-team", addTeam),
};

const adminTournamentsProps = {
  adminText,
  commonText,
  PremiumSelect,
  setConfirmDelete,
  isAdminActionLoading,
  players,
  teams,
  tournaments,
  selectedTournamentId,
  tournamentForm,
  setTournamentForm,
  saveTournament: () => runAdminAction("save-tournament", saveTournament),
  addTournament: () => runAdminAction("create-tournament", addTournament),
  reorderTournament,
  handleTournamentImageUpload,
  handleTournamentSelect,
  orderedTournaments,
  safeTournamentParticipantIds,
  selectedTournamentPlayers,
  selectedTournamentTeams,
  selectedTournamentMvpPlayers,
  selectedTournamentWinnerId,
  selectedTournamentWinnerTeamId,
  selectedTournamentMvpId,
  toggleTournamentParticipant,
  addTournamentGroup,
  updateTournamentGroupName,
  deleteTournamentGroup,
  toggleTournamentGroupParticipant,
  toggleTournamentRosterPlayer,
  getPlayerName,
};

const adminGeneralProps = {
  adminText,
  PremiumSelect,
  players,
  teams,
  tournaments,
  homeAnnouncementForm,
  setHomeAnnouncementForm,
  saveHomeAnnouncement: () =>
    runAdminAction("save-home-announcement", saveHomeAnnouncement),
  isAdminActionLoading,
  handleHomeAnnouncementImageChange,
};

const adminMatchesProps = {
  adminText,
  commonText,
  PremiumSelect,
  setConfirmDelete,
  isAdminActionLoading,
  tournaments,
  matches,
  selectedMatchId,
  setSelectedMatchId,
  matchForm,
  setMatchForm,
  saveMatch: () => runAdminAction("save-match", saveMatch),
  addMatch: (tournamentId?: number) =>
    runAdminAction("create-match", () => addMatch(tournamentId)),
  reorderMatch,
  autoGenerateBracket,
  matchTournamentFilterId,
  setMatchTournamentFilterId,
  selectedMatchTournament,
  availablePlayer1Options,
  availablePlayer2Options,
  selectedWinnerOptions,
  availableTeam1Options,
  availableTeam2Options,
  selectedWinnerTeamOptions,
  getPlayerName,
  getTeamName,
  getTournamentName,
};

const adminAchievementsProps = {
  adminText,
  setConfirmDelete,
  isAdminActionLoading,
  players,
  achievements,
  selectedAchievementId,
  setSelectedAchievementId,
  saveAchievement,
  addAchievement: () => runAdminAction("create-achievement", addAchievement),
  deleteAchievement,
  safeAchievementPlayerIds,
  toggleAchievementPlayer,
  selectedAchievement,
};


  return (
    <div className="admin-wrap">
      <div className="admin-layout">
        <nav className="admin-quick-nav" aria-label={adminText.adminSections}>
          <div className="admin-quick-nav-inner">
            <button type="button" className="admin-quick-nav-btn" onClick={() => scrollToAdminSection("admin-section-players")}>{quickNavText.players}</button>
            <button type="button" className="admin-quick-nav-btn" onClick={() => scrollToAdminSection("admin-section-teams")}>{quickNavText.teams}</button>
            <button type="button" className="admin-quick-nav-btn" onClick={() => scrollToAdminSection("admin-section-tournaments")}>{quickNavText.tournaments}</button>
            <button type="button" className="admin-quick-nav-btn" onClick={() => scrollToAdminSection("admin-section-general")}>{quickNavText.general}</button>
            <button type="button" className="admin-quick-nav-btn" onClick={() => scrollToAdminSection("admin-section-matches")}>{quickNavText.matches}</button>
            <button type="button" className="admin-quick-nav-btn" onClick={() => scrollToAdminSection("admin-section-achievements")}>{quickNavText.achievements}</button>
          </div>
        </nav>

        <div className="admin-content">
          <AdminPlayers {...adminPlayersProps} />
          <AdminTeams {...adminTeamsProps} />
          <AdminTournaments {...adminTournamentsProps} />
          <AdminGeneral {...adminGeneralProps} />
          <AdminMatches {...adminMatchesProps} />
          <AdminAchievements {...adminAchievementsProps} />
        </div>
      </div>

      {confirmDelete.open ? (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>{adminText.confirmDeletion}</h3>
            <p>
              {adminText.confirmDeletePrefix}{" "}
              <strong>{confirmDelete.type}</strong>?
            </p>

            <div className="confirm-actions">
              <button
                className="secondary-btn"
                disabled={Boolean(
                  confirmDeleteActionKey &&
                    isAdminActionLoading(confirmDeleteActionKey)
                )}
                onClick={() => setConfirmDelete({ open: false, type: null })}
              >
                {commonText.cancel}
              </button>

              <button
                className="danger-btn"
                disabled={Boolean(
                  confirmDeleteActionKey &&
                    isAdminActionLoading(confirmDeleteActionKey)
                )}
                onClick={() => {
                  if (!confirmDeleteActionKey) return;

                  runAdminAction(confirmDeleteActionKey, async () => {
                    if (confirmDelete.type === "player") {
                      await deletePlayer();
                    }
                    if (confirmDelete.type === "team") {
                      await deleteTeam();
                    }
                    if (confirmDelete.type === "tournament") {
                      await deleteTournament();
                    }
                    if (confirmDelete.type === "match") {
                      await deleteMatch();
                    }

                    if (
                      confirmDelete.type === "achievement" &&
                      typeof confirmDelete.achievementId === "number"
                    ) {
                      await deleteAchievement(confirmDelete.achievementId);
                    }

                    setConfirmDelete({ open: false, type: null });
                  });
                }}
              >
                {confirmDeleteActionKey &&
                isAdminActionLoading(confirmDeleteActionKey)
                  ? "Deleting..."
                  : commonText.delete}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
