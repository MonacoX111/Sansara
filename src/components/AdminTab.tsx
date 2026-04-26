import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
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
} from "../types";
import { gamesList } from "../data";
import { parseList } from "../utils";
import { t } from "../utils/translations";

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
  eloApplied: boolean;
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

  savePlayer: () => void;
  addPlayer: () => void;
  deletePlayer: () => void;

  saveTeam: () => void;
  addTeam: () => void;
  deleteTeam: () => void;

  saveTournament: () => void;
  addTournament: () => void;
  deleteTournament: () => void;
  reorderTournament: (direction: "up" | "down") => void;

saveMatch: () => void;
addMatch: (tournamentId?: number) => void;
deleteMatch: () => void;
reorderMatch: (direction: "up" | "down", tournamentId: number) => void;

  saveAchievement: (id: number, updates: Partial<Achievement>) => void;
  addAchievement: () => void;
  deleteAchievement: (id: number) => void;
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

function PremiumSelect({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
}: {
  value: number | string;
  options: { value: number | string; label: string }[];
  placeholder: string;
  onChange: (value: number | string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  return (
    <div className="admin-premium-select">
      <button
        type="button"
        className={`admin-premium-select-trigger ${
          isOpen ? "admin-premium-select-trigger-open" : ""
        }`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="admin-premium-select-arrow">⌄</span>
      </button>

      {isOpen && !disabled ? (
        <div className="admin-premium-select-menu">
          <button
            type="button"
            className={`admin-premium-select-option ${
              !selectedOption ? "admin-premium-select-option-active" : ""
            }`}
            onClick={() => {
              onChange(0);
              setIsOpen(false);
            }}
          >
            {placeholder}
          </button>

          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              className={`admin-premium-select-option ${
                String(value) === String(option.value)
                  ? "admin-premium-select-option-active"
                  : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
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

    const quickNavText =
      lang === "ua"
        ? {
            players: "Гравці",
            teams: "Команди",
            tournaments: "Турніри",
            general: "Загальне",
            matches: "Матчі",
            achievements: "Досягнення",
          }
        : {
            players: "Players",
            teams: "Teams",
            tournaments: "Tournaments",
            general: "General",
            matches: "Matches",
            achievements: "Achievements",
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

      return {
        ...prev,
        participantIds: nextParticipantIds,
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

  return (
    <div className="admin-wrap">
      <nav className="admin-quick-nav" aria-label="Admin sections">
        <div className="admin-quick-nav-inner">
          <button
            type="button"
            className="admin-quick-nav-btn"
            onClick={() => scrollToAdminSection("admin-section-players")}
          >
            {quickNavText.players}
          </button>
          <button
            type="button"
            className="admin-quick-nav-btn"
            onClick={() => scrollToAdminSection("admin-section-teams")}
          >
            {quickNavText.teams}
          </button>
          <button
            type="button"
            className="admin-quick-nav-btn"
            onClick={() => scrollToAdminSection("admin-section-tournaments")}
          >
            {quickNavText.tournaments}
          </button>
          <button
            type="button"
            className="admin-quick-nav-btn"
            onClick={() => scrollToAdminSection("admin-section-general")}
          >
            {quickNavText.general}
          </button>
          <button
            type="button"
            className="admin-quick-nav-btn"
            onClick={() => scrollToAdminSection("admin-section-matches")}
          >
            {quickNavText.matches}
          </button>
          <button
            type="button"
            className="admin-quick-nav-btn"
            onClick={() => scrollToAdminSection("admin-section-achievements")}
          >
            {quickNavText.achievements}
          </button>
        </div>
      </nav>

      <div id="admin-section-players" className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">{adminText.players}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.searchPlayer}</label>
              <input
                className="input"
                placeholder={adminText.searchPlaceholder}
                value={playerAdminSearch}
                onChange={(e) => setPlayerAdminSearch(e.target.value)}
              />
            </div>

            <div className="list-col admin-scroll-list">
              <button
                className="secondary-btn add-list-btn add-player-btn-top"
                onClick={addPlayer}
              >
                {adminText.addPlayer}
              </button>

              {filteredAdminPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(player.id)}
                  className={`admin-list-btn ${
                    selectedPlayerId === player.id
                      ? "admin-list-btn-active"
                      : ""
                  } ${player.isFeatured ? "admin-list-btn-featured" : ""}`}
                >
                  <span>{player.nickname || adminText.playerFallback}</span>
                  {player.isFeatured ? (
                    <span className="admin-featured-badge">{adminText.featured}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">{adminText.editPlayer}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.nickname}</label>
              <input
                className="input"
                placeholder={adminText.nickname}
                value={playerForm.nickname}
                onChange={(e) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    nickname: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.fullName}</label>
              <input
                className="input"
                placeholder={adminText.fullName}
                value={playerForm.fullName}
                onChange={(e) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.bio}</label>
              <textarea
                className="input textarea"
                placeholder={adminText.bio}
                value={playerForm.bio}
                onChange={(e) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(playerForm.isFeatured)}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      isFeatured: e.target.checked,
                    }))
                  }
                />
                {adminText.featuredPlayer}
              </label>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.team}</label>
              <PremiumSelect
                value={playerForm.teamId}
                placeholder={adminText.noTeam}
                options={teams.map((team) => ({
                  value: team.id,
                  label: team.name,
                }))}
                onChange={(value) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    teamId: Number(value),
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.games}</label>
              <MultiGamePicker
                value={playerForm.games}
                onChange={(value) =>
                  setPlayerForm((prev) => ({ ...prev, games: value }))
                }
              />
            </div>

            <div className="form-grid">
              <div className="field-block">
                <label className="field-label">{adminText.wins}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.wins}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      wins: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.losses}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.losses}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      losses: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.earnings}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.earnings}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      earnings: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.tournamentsWon}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.tournamentsWon}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      tournamentsWon: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.rank}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.rank}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      rank: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.elo}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.elo}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      elo: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.avatar}</label>
              <input
                type="text"
                className="input"
                placeholder="Avatar URL"
                value={playerForm.avatar || ""}
                onChange={(e) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    avatar: e.target.value,
                  }))
                }
              />

              {playerForm.avatar ? (
                <img
                  src={playerForm.avatar}
                  alt={adminText.avatar}
                  style={{
                    marginTop: 10,
                    width: 88,
                    height: 88,
                    objectFit: "cover",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
              ) : null}
            </div>

<div className="btn-row">
  <button className="primary-btn" onClick={savePlayer}>
    {commonText.save}
  </button>
  <button
    className="danger-btn"
    onClick={() => setConfirmDelete({ open: true, type: "player" })}
  >
    {commonText.delete}
  </button>
</div>
          </div>
        </div>
      </div>

      <div id="admin-section-teams" className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">{adminText.teams}</h2>

          <div className="list-col admin-scroll-list">
            <button
              className="secondary-btn add-list-btn add-team-btn-top"
              onClick={addTeam}
            >
              {adminText.addTeam}
            </button>

            {[...teams]
              .sort((a, b) => {
                if (a.isFeatured && !b.isFeatured) return -1;
                if (!a.isFeatured && b.isFeatured) return 1;
                return 0;
              })
              .map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`admin-list-btn ${
                    selectedTeamId === team.id ? "admin-list-btn-active" : ""
                  } ${team.isFeatured ? "admin-list-btn-featured" : ""}`}
                >
                  <span>{team.name || adminText.teamFallback}</span>
                  {team.isFeatured ? (
                    <span className="admin-featured-badge">{adminText.featured}</span>
                  ) : null}
                </button>
              ))}
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">{adminText.editTeam}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.name}</label>
              <input
                className="input"
                placeholder={adminText.teamNamePlaceholder}
                value={teamForm.name}
                onChange={(e) =>
                  setTeamForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.games}</label>
              <MultiGamePicker
                value={teamForm.games}
                onChange={(value) =>
                  setTeamForm((prev) => ({ ...prev, games: value }))
                }
              />
            </div>

            <div className="form-grid">
              <div className="field-block">
                <label className="field-label">{adminText.wins}</label>
                <input
                  className="input"
                  type="number"
                  value={teamForm.wins}
                  onChange={(e) =>
                    setTeamForm((prev) => ({
                      ...prev,
                      wins: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.earnings}</label>
                <input
                  className="input"
                  type="number"
                  value={teamForm.earnings}
                  onChange={(e) =>
                    setTeamForm((prev) => ({
                      ...prev,
                      earnings: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.description}</label>
              <textarea
                className="input textarea"
                placeholder={adminText.teamDescriptionPlaceholder}
                value={teamForm.description}
                onChange={(e) =>
                  setTeamForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(teamForm.isFeatured)}
                  onChange={(e) =>
                    setTeamForm((prev) => ({
                      ...prev,
                      isFeatured: e.target.checked,
                    }))
                  }
                />
                {adminText.featuredTeam}
              </label>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.logoUrl}</label>
              <input
                className="input"
                type="text"
                placeholder={adminText.logoUrlPlaceholder}
                value={teamForm.logo}
                onChange={(e) =>
                  setTeamForm((prev) => ({
                    ...prev,
                    logo: e.target.value,
                  }))
                }
              />

              {teamForm.logo ? (
                <img
                  src={teamForm.logo}
                  alt={adminText.teamLogoPreviewAlt}
                  style={{
                    marginTop: 10,
                    width: 88,
                    height: 88,
                    objectFit: "cover",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
              ) : null}
            </div>

<div className="btn-row">
  <button className="primary-btn" onClick={saveTeam}>
    {commonText.save}
  </button>
  <button
    className="danger-btn"
    onClick={() => setConfirmDelete({ open: true, type: "team" })}
  >
    {commonText.delete}
  </button>
</div>
          </div>
        </div>
      </div>

      <div id="admin-section-tournaments" className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">{adminText.tournaments}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.selectTournament}</label>
              <PremiumSelect
                value={selectedTournamentId}
                placeholder={adminText.selectTournament}
                options={orderedTournaments.map((tournament) => ({
                  value: tournament.id,
                  label: tournament.title || adminText.tournamentFallback,
                }))}
                onChange={(value) => handleTournamentSelect(Number(value))}
              />
            </div>

            <button
              className="secondary-btn add-list-btn add-tournament-btn-top"
              onClick={addTournament}
            >
              {adminText.addTournament}
            </button>

            <div className="btn-row">
              <button
                className="secondary-btn"
                disabled={
                  orderedTournaments.findIndex(
                    (tournament) => tournament.id === selectedTournamentId
                  ) <= 0
                }
                onClick={() => reorderTournament("up")}
              >
                {adminText.moveUp}
              </button>

              <button
                className="secondary-btn"
                disabled={
                  orderedTournaments.findIndex(
                    (tournament) => tournament.id === selectedTournamentId
                  ) === -1 ||
                  orderedTournaments.findIndex(
                    (tournament) => tournament.id === selectedTournamentId
                  ) >=
                    orderedTournaments.length - 1
                }
                onClick={() => reorderTournament("down")}
              >
                {adminText.moveDown}
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">{adminText.editTournament}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.title}</label>
              <input
                className="input"
                placeholder={adminText.tournamentTitlePlaceholder}
                value={tournamentForm.title}
                onChange={(e) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">{adminText.game}</label>
                <input
                  className="input"
                  placeholder={adminText.game}
                  value={tournamentForm.game}
                  onChange={(e) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      game: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.participantType}</label>
                <PremiumSelect
                  value={tournamentForm.participantType || "player"}
                  placeholder={adminText.playersOption}
                  options={[
                    { value: "player", label: adminText.playersOption },
                    { value: "team", label: adminText.teamsOption },
                    { value: "squad", label: adminText.squadOption },
                  ]}
                  onChange={(value) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      participantType: value as "player" | "team" | "squad",
                      participantIds: [],
                      winnerId: undefined,
                      winnerTeamId: undefined,
                      winnerSquadIds: [],
                      mvpId: undefined,
                      placements: [],
                    }))
                  }
                />
              </div>

<div className="field-block">
  <label className="field-label">{adminText.type}</label>
  <PremiumSelect
    value={tournamentForm.type || "1x1"}
    placeholder={adminText.selectType}
    options={[
      { value: "1x1", label: adminText.oneVsOne },
      { value: "2x2", label: adminText.twoVsTwo },
      { value: "3x3", label: adminText.threeVsThree },
      { value: "5x5", label: adminText.fiveVsFive },
      { value: "custom", label: adminText.customOption },
    ]}
    onChange={(value) =>
      setTournamentForm((prev) => ({
        ...prev,
        type: value as string,
      }))
    }
  />
</div>
            </div>

            <div className="form-grid two">
<div className="field-block">
  <label className="field-label">{adminText.format}</label>
  <PremiumSelect
    value={tournamentForm.format || "playoff"}
    placeholder={adminText.selectFormat}
    options={[
      { value: "playoff", label: adminText.playoffSingleElimination },
      { value: "groups_playoff", label: adminText.groupsPlayoff },
      { value: "groups_only", label: adminText.groupsOnly },
      { value: "swiss", label: adminText.swissSystem },
      { value: "league", label: adminText.leagueRoundRobin },
      { value: "custom", label: adminText.customOption },
    ]}
    onChange={(value) =>
      setTournamentForm((prev) => ({
        ...prev,
        format: value as string,
      }))
    }
  />
</div>

              <div className="field-block">
                <label className="field-label">{adminText.status}</label>
                <PremiumSelect
                  value={tournamentForm.status}
                  placeholder={adminText.selectStatus}
                  options={tournamentStatusOptions.map((status) => ({
                    value: status,
                    label: status,
                  }))}
                  onChange={(value) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      status: value as TournamentStatus,
                    }))
                  }
                />
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.date}</label>
              <input
                className="input"
                type="date"
                value={tournamentForm.date}
                onChange={(e) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.prize}</label>
              <input
                className="input"
                placeholder={adminText.prizePlaceholder}
                value={tournamentForm.prize}
                onChange={(e) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    prize: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.description}</label>
              <textarea
                className="input textarea"
                placeholder={adminText.tournamentDescriptionPlaceholder}
                value={tournamentForm.description}
                onChange={(e) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="field-block">
              <label className="field-label">{adminText.tournamentImage}</label>
              <input
                className="input"
                type="text"
                placeholder={adminText.imageUrlPlaceholder}
                value={tournamentForm.imageUrl || ""}
                onChange={handleTournamentImageUpload}
              />

              {tournamentForm.imageUrl ? (
                <img
                  src={tournamentForm.imageUrl}
                  alt={adminText.tournamentPreviewAlt}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    maxHeight: 160,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
              ) : null}
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.participants}</label>

              <div className="picker-grid compact-grid">
                {tournamentForm.participantType === "team"
                  ? teams.map((team) => {
                      const isSelected = safeTournamentParticipantIds.includes(
                        team.id
                      );

                      return (
                        <button
                          key={team.id}
                          type="button"
                          className={`picker-btn compact ${
                            isSelected ? "picker-btn-active" : ""
                          }`}
                          onClick={() => toggleTournamentParticipant(team.id)}
                        >
                          <span>{team.name}</span>
                        </button>
                      );
                    })
                  : players.map((player) => {
                      const isSelected = safeTournamentParticipantIds.includes(
                        player.id
                      );

                      return (
                        <button
                          key={player.id}
                          type="button"
                          className={`picker-btn compact ${
                            isSelected ? "picker-btn-active" : ""
                          }`}
                          onClick={() => toggleTournamentParticipant(player.id)}
                        >
                          <span>
                            {tournamentForm.participantType === "squad"
                              ? `${adminText.squadMember}: ${player.nickname}`
                              : player.nickname}
                          </span>
                        </button>
                      );
                    })}
              </div>
            </div>

            <div className="match-preview">
              <div className="muted small">
                {adminText.participantsSelected}: {safeTournamentParticipantIds.length}
              </div>
              <div className="muted small">
                {tournamentForm.participantType === "team"
                  ? selectedTournamentTeams.length > 0
                    ? selectedTournamentTeams.map((team) => team.name).join(", ")
                    : adminText.noParticipantsSelected
                  : selectedTournamentPlayers.length > 0
                  ? selectedTournamentPlayers
                      .map((player) => player.nickname)
                      .join(", ")
                  : adminText.noParticipantsSelected}
              </div>
            </div>

            {(tournamentForm.format === "groups_playoff" ||
              tournamentForm.format === "groups_only" ||
              tournamentForm.format === "league" ||
              tournamentForm.format === "swiss") && (
              <div className="field-block">
                <div className="btn-row">
                  <label className="field-label">{adminText.groupsSetup}</label>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={addTournamentGroup}
                  >
                    {adminText.addGroup}
                  </button>
                </div>

                <div className="admin-groups-grid">
                  {(Array.isArray(tournamentForm.groups)
                    ? tournamentForm.groups
                    : []
                  ).map((group) => (
                    <div key={group.id} className="admin-group-card">
                      <div className="btn-row">
                        <input
                          className="input"
                          value={group.name}
                          placeholder={adminText.groupPlaceholder}
                          onChange={(e) =>
                            updateTournamentGroupName(group.id, e.target.value)
                          }
                        />

                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => deleteTournamentGroup(group.id)}
                        >
                          {commonText.delete}
                        </button>
                      </div>

                      <div className="picker-grid compact-grid">
                        {tournamentForm.participantType === "team"
                          ? selectedTournamentTeams.map((team) => {
                              const isSelected = Array.isArray(
                                group.participantIds
                              )
                                ? group.participantIds.includes(team.id)
                                : false;

                              return (
                                <button
                                  key={`${group.id}-${team.id}`}
                                  type="button"
                                  className={`picker-btn compact ${
                                    isSelected ? "picker-btn-active" : ""
                                  }`}
                                  onClick={() =>
                                    toggleTournamentGroupParticipant(
                                      group.id,
                                      team.id
                                    )
                                  }
                                >
                                  <span>{team.name}</span>
                                </button>
                              );
                            })
                          : selectedTournamentPlayers.map((player) => {
                              const isSelected = Array.isArray(
                                group.participantIds
                              )
                                ? group.participantIds.includes(player.id)
                                : false;

                              return (
                                <button
                                  key={`${group.id}-${player.id}`}
                                  type="button"
                                  className={`picker-btn compact ${
                                    isSelected ? "picker-btn-active" : ""
                                  }`}
                                  onClick={() =>
                                    toggleTournamentGroupParticipant(
                                      group.id,
                                      player.id
                                    )
                                  }
                                >
                                  <span>{player.nickname}</span>
                                </button>
                              );
                            })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="field-block">
              <label className="field-label">{adminText.mvp}</label>
              <PremiumSelect
                value={selectedTournamentMvpId || 0}
                placeholder={adminText.selectMvp}
                options={selectedTournamentMvpPlayers.map((player) => ({
                  value: player.id,
                  label: player.nickname,
                }))}
                onChange={(value) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    mvpId: Number(value) > 0 ? Number(value) : undefined,
                  }))
                }
              />
            </div>

            {tournamentForm.participantType === "team" && (
              <div className="field-block">
                <label className="field-label">{adminText.winnerTeam}</label>
                <PremiumSelect
                  value={selectedTournamentWinnerTeamId || 0}
                  placeholder={adminText.selectWinnerTeam}
                  options={selectedTournamentTeams.map((team) => ({
                    value: team.id,
                    label: team.name,
                  }))}
                  onChange={(value) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      winnerTeamId:
                        Number(value) > 0 ? Number(value) : undefined,
                    }))
                  }
                />
              </div>
            )}

            {tournamentForm.participantType === "player" && (
              <div className="field-block">
                <label className="field-label">{adminText.winnerPlayer}</label>
                <PremiumSelect
                  value={selectedTournamentWinnerId || 0}
                  placeholder={adminText.selectWinnerPlayer}
                  options={selectedTournamentPlayers.map((player) => ({
                    value: player.id,
                    label: player.nickname,
                  }))}
                  onChange={(value) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      winnerId: Number(value) > 0 ? Number(value) : undefined,
                      winnerTeamId: undefined,
                      winnerSquadIds: [],
                    }))
                  }
                />
              </div>
            )}

            {tournamentForm.participantType === "squad" && (
              <div className="field-block">
                <label className="field-label">{adminText.winnerSquadPlayers}</label>

                <div className="picker-grid compact-grid">
                  {selectedTournamentPlayers.map((player) => {
                    const winnerSquadIds = Array.isArray(
                      tournamentForm.winnerSquadIds
                    )
                      ? tournamentForm.winnerSquadIds
                      : [];

                    const isSelected = winnerSquadIds.includes(player.id);

                    return (
                      <button
                        key={`winner-squad-${player.id}`}
                        type="button"
                        className={`picker-btn compact ${
                          isSelected ? "picker-btn-active" : ""
                        }`}
                        onClick={() =>
                          setTournamentForm((prev) => {
                            const currentIds = Array.isArray(
                              prev.winnerSquadIds
                            )
                              ? prev.winnerSquadIds
                              : [];

                            const nextWinnerSquadIds = currentIds.includes(
                              player.id
                            )
                              ? currentIds.filter((id) => id !== player.id)
                              : [...currentIds, player.id];

                            return {
                              ...prev,
                              winnerSquadIds: nextWinnerSquadIds,
                              winnerId: undefined,
                              winnerTeamId: undefined,
                            };
                          })
                        }
                      >
                        <span>{player.nickname}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="muted small">
                  {adminText.selectedWinners}:{" "}
                  {Array.isArray(tournamentForm.winnerSquadIds) &&
                  tournamentForm.winnerSquadIds.length > 0
                    ? tournamentForm.winnerSquadIds
                        .map((id) => getPlayerName(id))
                        .join(" / ")
                    : adminText.noSquadWinnersSelected}
                </div>
              </div>
            )}

            <div className="field-block">
              <label className="field-label">{adminText.placements}</label>

              <div className="form-col">
                {tournamentForm.participantType === "team"
                  ? selectedTournamentTeams.map((team) => {
                      const placement = Array.isArray(tournamentForm.placements)
                        ? tournamentForm.placements.find(
                            (item) => item.teamId === team.id
                          )
                        : undefined;

                      return (
                        <div key={team.id} className="form-grid two">
                          <div className="field-block">
                            <label className="field-label">{team.name}</label>
                            <input
                              className="input"
                              type="number"
                              min={1}
                              placeholder={adminText.place}
                              value={placement ? placement.place : ""}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                const nextPlace = Number(rawValue);

                                setTournamentForm((prev) => {
                                  const safePlacements = Array.isArray(
                                    prev.placements
                                  )
                                    ? prev.placements
                                    : [];

                                  if (!rawValue || nextPlace <= 0) {
                                    return {
                                      ...prev,
                                      placements: safePlacements.filter(
                                        (item) => item.teamId !== team.id
                                      ),
                                    };
                                  }

                                  const exists = safePlacements.some(
                                    (item) => item.teamId === team.id
                                  );

                                  return {
                                    ...prev,
                                    placements: exists
                                      ? safePlacements.map((item) =>
                                          item.teamId === team.id
                                            ? {
                                                ...item,
                                                teamId: team.id,
                                                playerId: undefined,
                                                place: nextPlace,
                                              }
                                            : item
                                        )
                                      : [
                                          ...safePlacements,
                                          {
                                            teamId: team.id,
                                            playerId: undefined,
                                            place: nextPlace,
                                          },
                                        ],
                                  };
                                });
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  : selectedTournamentPlayers.map((player) => {
                      const placement = Array.isArray(tournamentForm.placements)
                        ? tournamentForm.placements.find(
                            (item) => item.playerId === player.id
                          )
                        : undefined;

                      return (
                        <div key={player.id} className="form-grid two">
                          <div className="field-block">
                            <label className="field-label">
                              {player.nickname}
                            </label>
                            <input
                              className="input"
                              type="number"
                              min={1}
                              placeholder={adminText.place}
                              value={placement ? placement.place : ""}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                const nextPlace = Number(rawValue);

                                setTournamentForm((prev) => {
                                  const safePlacements = Array.isArray(
                                    prev.placements
                                  )
                                    ? prev.placements
                                    : [];

                                  if (!rawValue || nextPlace <= 0) {
                                    return {
                                      ...prev,
                                      placements: safePlacements.filter(
                                        (item) => item.playerId !== player.id
                                      ),
                                    };
                                  }

                                  const exists = safePlacements.some(
                                    (item) => item.playerId === player.id
                                  );

                                  return {
                                    ...prev,
                                    placements: exists
                                      ? safePlacements.map((item) =>
                                          item.playerId === player.id
                                            ? {
                                                ...item,
                                                playerId: player.id,
                                                teamId: undefined,
                                                place: nextPlace,
                                              }
                                            : item
                                        )
                                      : [
                                          ...safePlacements,
                                          {
                                            playerId: player.id,
                                            teamId: undefined,
                                            place: nextPlace,
                                          },
                                        ],
                                  };
                                });
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>

            <div className="field-block">
              <label className="field-label checkbox-label">
                <input
                  type="checkbox"
                  checked={tournamentForm.isPublished}
                  onChange={(e) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      isPublished: e.target.checked,
                    }))
                  }
                />
                <span>{adminText.published}</span>
              </label>
            </div>

            <div className="btn-row">
<button className="primary-btn" onClick={saveTournament}>
  {commonText.save}
</button>
<button
  className="danger-btn"
  onClick={() => setConfirmDelete({ open: true, type: "tournament" })}
>
  {commonText.delete}
</button>
            </div>
          </div>
        </div>
      </div>

      <div id="admin-section-general" className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">{adminText.homeAnnouncement}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.title}</label>
              <input
                className="input"
                placeholder={adminText.tournamentTitlePlaceholder}
                value={homeAnnouncementForm.title}
                onChange={(e) =>
                  setHomeAnnouncementForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.subtitle}</label>
              <input
                className="input"
                placeholder={adminText.subtitlePlaceholder}
                value={homeAnnouncementForm.subtitle}
                onChange={(e) =>
                  setHomeAnnouncementForm((prev) => ({
                    ...prev,
                    subtitle: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.bannerImageUrl}</label>
              <input
                className="input"
                type="text"
                placeholder={adminText.imageUrlPlaceholder}
                value={homeAnnouncementForm.imageUrl || ""}
                onChange={handleHomeAnnouncementImageChange}
              />

              {homeAnnouncementForm.imageUrl ? (
                <img
                  src={homeAnnouncementForm.imageUrl}
                  alt={adminText.homeBannerPreviewAlt}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
              ) : null}
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">{adminText.date}</label>
                <input
                  className="input"
                  type="date"
                  value={homeAnnouncementForm.date}
                  onChange={(e) =>
                    setHomeAnnouncementForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>

<div className="field-block">
  <label className="field-label">{adminText.participantsCount}</label>
  <input
    className="input"
    type="number"
    min={0}
    value={homeAnnouncementForm.participantCount}
    onChange={(e) =>
      setHomeAnnouncementForm((prev) => ({
        ...prev,
        participantCount: Number(e.target.value),
      }))
    }
  />
</div>

<div className="field-block">
  <label className="field-label">{adminText.participantType}</label>
  <PremiumSelect
    value={homeAnnouncementForm.participantLabelType || "players"}
    placeholder={adminText.playersOption}
    options={[
      { value: "players", label: adminText.playersOption },
      { value: "teams", label: adminText.teamsOption },
    ]}
    onChange={(value) =>
      setHomeAnnouncementForm((prev) => ({
        ...prev,
        participantLabelType: value as "players" | "teams",
      }))
    }
  />
</div>
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">{adminText.format}</label>
                <input
                  className="input"
                  placeholder={adminText.format}
                  value={homeAnnouncementForm.format}
                  onChange={(e) =>
                    setHomeAnnouncementForm((prev) => ({
                      ...prev,
                      format: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.status}</label>
                <input
                  className="input"
                  placeholder={adminText.statusPlaceholder}
                  value={homeAnnouncementForm.status}
                  onChange={(e) =>
                    setHomeAnnouncementForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.prize}</label>
              <input
                className="input"
                placeholder={adminText.prize}
                value={homeAnnouncementForm.prize}
                onChange={(e) =>
                  setHomeAnnouncementForm((prev) => ({
                    ...prev,
                    prize: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.linkedTournament}</label>
              <PremiumSelect
                value={homeAnnouncementForm.tournamentId || 0}
                placeholder={adminText.noLinkedTournament}
                options={[...tournaments]
                  .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id))
                  .map((tournament) => ({
                    value: tournament.id,
                    label: tournament.title || adminText.tournamentFallback,
                  }))}
                onChange={(value) =>
                  setHomeAnnouncementForm((prev) => ({
                    ...prev,
                    tournamentId: Number(value) > 0 ? Number(value) : undefined,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.description}</label>
              <textarea
                className="input textarea"
                placeholder={adminText.announcementDescriptionPlaceholder}
                value={homeAnnouncementForm.description}
                onChange={(e) =>
                  setHomeAnnouncementForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(homeAnnouncementForm.isVisible)}
                  onChange={(e) =>
                    setHomeAnnouncementForm((prev) => ({
                      ...prev,
                      isVisible: e.target.checked,
                    }))
                  }
                />
                <span>{adminText.showOnHome}</span>
              </label>
            </div>

            <div className="btn-row">
              <button className="primary-btn" onClick={saveHomeAnnouncement}>
                {adminText.saveHomeAnnouncement}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="admin-section-matches" className="two-col">
        <div className="panel">
          <h2 className="panel-title">{adminText.matches}</h2>

          <div className="field-block">
            <label className="field-label">{adminText.selectTournament}</label>
            <PremiumSelect
              value={matchTournamentFilterId}
              placeholder={adminText.selectTournament}
              options={tournaments.map((tournament) => ({
                value: tournament.id,
                label: tournament.title || adminText.tournamentFallback,
              }))}
              onChange={(value) => {
                const nextTournamentId = Number(value);
                const nextTournament =
                  tournaments.find(
                    (tournament) => tournament.id === nextTournamentId
                  ) || null;

                setMatchTournamentFilterId(nextTournamentId);
                setSelectedMatchId(0);

setMatchForm({
  stage: "group",
  groupName: "",
  roundLabel: "",
  seriesId: "",
  nextSeriesId: "",
game: nextTournament?.game || "",
                  matchType:
                    nextTournament?.participantType === "team"
                      ? "team"
                      : "player",
                  player1: 0,
                  player2: 0,
                  team1: 0,
                  team2: 0,
                  score: "",
                  winnerId: 0,
                  winnerTeamId: 0,
                  tournamentId: nextTournamentId,
                  date: "",
                  status: "scheduled",
                  round: "",
                  bestOf: 1,
                  notes: "",
                  eloApplied: false,
                });
              }}
            />
          </div>

          <div className="list-col admin-scroll-list">
<div className="btn-row">
  <button
    className="secondary-btn add-list-btn add-match-btn-top"
    onClick={() => addMatch(matchTournamentFilterId)}
  >
    {adminText.addMatch}
  </button>

<button
  className="primary-btn auto-bracket-btn"
  disabled={!matchTournamentFilterId}
  onClick={() => autoGenerateBracket(matchTournamentFilterId)}
>
  {adminText.autoGenerateBracket}
</button>
</div>

<div className="btn-row">
  <button
    className="secondary-btn"
    disabled={!selectedMatchId}
    onClick={() => reorderMatch("up", matchTournamentFilterId)}
  >
    {adminText.moveUp}
  </button>

  <button
    className="secondary-btn"
    disabled={!selectedMatchId}
    onClick={() => reorderMatch("down", matchTournamentFilterId)}
  >
    {adminText.moveDown}
  </button>
</div>

            {[...matches]
              .filter((match) =>
                matchTournamentFilterId
                  ? match.tournamentId === matchTournamentFilterId
                  : match.tournamentId === 0
              )
              .sort((a, b) => b.id - a.id)
              .map((match) => (
                <button
                  key={match.id}
                  onClick={() => {
                    setSelectedMatchId(match.id);
                    setMatchTournamentFilterId(match.tournamentId || 0);
                  }}
                  className={`admin-list-btn ${
                    selectedMatchId === match.id ? "admin-list-btn-active" : ""
                  }`}
                >
                  {match.matchType === "team"
                    ? `${getTeamName(match.team1 || 0)} vs ${getTeamName(
                        match.team2 || 0
                      )}`
                    : `${getPlayerName(match.player1 || 0)} vs ${getPlayerName(
                        match.player2 || 0
                      )}`}
                </button>
              ))}
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">{adminText.editMatch}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.matchType}</label>
              <PremiumSelect
                value={
                  selectedMatchTournament?.participantType ||
                  matchForm.matchType
                }
                placeholder={adminText.matchType}
                disabled={Boolean(selectedMatchTournament)}
                options={[
                  { value: "player", label: adminText.playerVsPlayer },
                  { value: "team", label: adminText.teamVsTeam },
                ]}
                onChange={(value) =>
                  setMatchForm((prev) => ({
                    ...prev,
                    matchType: value as "player" | "team",
                    player1: 0,
                    player2: 0,
                    team1: 0,
                    team2: 0,
                    winnerId: 0,
                    winnerTeamId: 0,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.tournament}</label>
              <div className="admin-premium-select admin-premium-select-disabled">
                <div className="admin-premium-select-trigger admin-premium-select-trigger-disabled">
                  <span>
                    {getTournamentName(matchForm.tournamentId) ||
                      adminText.noTournament}
                  </span>
                  <span className="admin-premium-select-arrow">⌄</span>
                </div>
              </div>
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">{adminText.game}</label>
                <input
                  className="input"
                  placeholder={adminText.game}
                  value={matchForm.game}
                  onChange={(e) =>
                    setMatchForm((prev) => ({
                      ...prev,
                      game: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.date}</label>
                <input
                  className="input"
                  type="date"
                  value={matchForm.date}
                  onChange={(e) =>
                    setMatchForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {matchForm.matchType === "player" ? (
              <div className="form-grid two">
                <div className="field-block">
                  <label className="field-label">{adminText.player1}</label>
                  <PremiumSelect
                    value={matchForm.player1}
                    placeholder={adminText.selectPlayer}
                    options={availablePlayer1Options.map((player) => ({
                      value: player.id,
                      label: player.nickname,
                    }))}
                    onChange={(value) => {
                      const nextPlayer1 = Number(value);
                      const nextWinnerId =
                        matchForm.winnerId === nextPlayer1 ||
                        matchForm.winnerId === matchForm.player2
                          ? matchForm.winnerId
                          : 0;

                      setMatchForm((prev) => ({
                        ...prev,
                        player1: nextPlayer1,
                        winnerId: nextWinnerId,
                      }));
                    }}
                  />
                </div>

                <div className="field-block">
                  <label className="field-label">{adminText.player2}</label>
                  <PremiumSelect
                    value={matchForm.player2}
                    placeholder={adminText.selectPlayer}
                    options={availablePlayer2Options.map((player) => ({
                      value: player.id,
                      label: player.nickname,
                    }))}
                    onChange={(value) => {
                      const nextPlayer2 = Number(value);
                      const nextWinnerId =
                        matchForm.winnerId === nextPlayer2 ||
                        matchForm.winnerId === matchForm.player1
                          ? matchForm.winnerId
                          : 0;

                      setMatchForm((prev) => ({
                        ...prev,
                        player2: nextPlayer2,
                        winnerId: nextWinnerId,
                      }));
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="form-grid two">
                <div className="field-block">
                  <label className="field-label">{adminText.team1}</label>
<PremiumSelect
  value={matchForm.team1}
  placeholder={adminText.selectTeam}
  options={availableTeam1Options.map((team) => ({
    value: team.id,
    label: team.name,
  }))}
  onChange={(value) => {
    const nextTeam1 = Number(value);
    const nextWinnerTeamId =
      matchForm.winnerTeamId === nextTeam1 ||
      matchForm.winnerTeamId === matchForm.team2
        ? matchForm.winnerTeamId
        : 0;

    setMatchForm((prev) => ({
      ...prev,
      team1: nextTeam1,
      winnerTeamId: nextWinnerTeamId,
    }));
  }}
/>
                </div>

                <div className="field-block">
                  <label className="field-label">{adminText.team2}</label>
<PremiumSelect
  value={matchForm.team2}
  placeholder={adminText.selectTeam}
  options={availableTeam2Options.map((team) => ({
    value: team.id,
    label: team.name,
  }))}
  onChange={(value) => {
    const nextTeam2 = Number(value);
    const nextWinnerTeamId =
      matchForm.winnerTeamId === nextTeam2 ||
      matchForm.winnerTeamId === matchForm.team1
        ? matchForm.winnerTeamId
        : 0;

    setMatchForm((prev) => ({
      ...prev,
      team2: nextTeam2,
      winnerTeamId: nextWinnerTeamId,
    }));
  }}
/>
                </div>
              </div>
            )}

            <div className="field-block">
              <label className="field-label">{adminText.score}</label>
              <input
                className="input"
                placeholder="2:1"
                value={matchForm.score}
                onChange={(e) =>
                  setMatchForm((prev) => ({
                    ...prev,
                    score: e.target.value,
                  }))
                }
              />
            </div>

            {matchForm.matchType === "player" ? (
              <div className="field-block">
                <label className="field-label">{adminText.winner}</label>
                <PremiumSelect
                  value={
                    selectedWinnerOptions.some(
                      (player) => player.id === matchForm.winnerId
                    )
                      ? matchForm.winnerId
                      : 0
                  }
                  placeholder={adminText.selectWinner}
                  options={selectedWinnerOptions.map((player) => ({
                    value: player.id,
                    label: player.name,
                  }))}
                  onChange={(value) =>
                    setMatchForm((prev) => ({
                      ...prev,
                      winnerId: Number(value),
                    }))
                  }
                />
              </div>
            ) : (
              <div className="field-block">
                <label className="field-label">{adminText.winningTeam}</label>
<PremiumSelect
  value={
    selectedWinnerTeamOptions.some(
      (team) => team.id === matchForm.winnerTeamId
    )
      ? matchForm.winnerTeamId
      : 0
  }
  placeholder={adminText.selectWinningTeam}
  options={selectedWinnerTeamOptions.map((team) => ({
    value: team.id,
    label: team.name,
  }))}
  onChange={(value) =>
    setMatchForm((prev) => ({
      ...prev,
      winnerTeamId: Number(value),
    }))
  }
/>
              </div>
            )}

<div className="form-grid two">
  <div className="field-block">
    <label className="field-label">{adminText.status}</label>
    <PremiumSelect
      value={matchForm.status}
      placeholder={adminText.selectStatus}
      options={matchStatusOptions.map((status) => ({
        value: status,
        label: status,
      }))}
      onChange={(value) =>
        setMatchForm((prev) => ({
          ...prev,
          status: value as MatchStatus,
        }))
      }
    />
  </div>

  <div className="field-block">
    <label className="field-label">{adminText.stage}</label>
    <PremiumSelect
      value={matchForm.stage}
      placeholder={adminText.selectStage}
      options={[
        { value: "group", label: adminText.groupStage },
        { value: "playoff", label: adminText.playoffStage },
        { value: "final", label: adminText.finalStage },
        { value: "showmatch", label: adminText.showmatchStage },
      ]}
      onChange={(value) =>
        setMatchForm((prev) => ({
          ...prev,
          stage: value as "group" | "playoff" | "final" | "showmatch",
          groupName: value === "group" ? prev.groupName : "",
        }))
      }
    />
  </div>
</div>

<div className="form-grid two">
<div className="field-block">
  <label className="field-label">{adminText.group}</label>
  <PremiumSelect
    value={matchForm.groupName || ""}
    placeholder={adminText.selectGroup}
    disabled={matchForm.stage !== "group"}
    options={(selectedMatchTournament?.groups || []).map((group) => ({
      value: group.name,
      label: group.name,
    }))}
    onChange={(value) =>
      setMatchForm((prev) => ({
        ...prev,
        groupName: String(value),
      }))
    }
  />
</div>

  <div className="field-block">
    <label className="field-label">{adminText.roundLabel}</label>
    <input
      className="input"
      placeholder={adminText.roundLabelPlaceholder}
      value={matchForm.roundLabel}
      onChange={(e) =>
        setMatchForm((prev) => ({
          ...prev,
          roundLabel: e.target.value,
          round: e.target.value,
        }))
      }
    />
  </div>
</div>

<div className="field-block">
  <label className="field-label">{adminText.seriesId}</label>
  <div className="field-block">
  <label className="field-label">{adminText.nextSeries}</label>
  <input
    className="input"
    placeholder={adminText.nextSeriesPlaceholder}
    value={matchForm.nextSeriesId || ""}
    onChange={(e) =>
      setMatchForm((prev) => ({
        ...prev,
        nextSeriesId: e.target.value,
      }))
    }
  />
</div>
  <input
    className="input"
    placeholder={adminText.seriesIdPlaceholder}
    value={matchForm.seriesId || ""}
    onChange={(e) =>
      setMatchForm((prev) => ({
        ...prev,
        seriesId: e.target.value,
      }))
    }
  />
</div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">{adminText.bestOf}</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={matchForm.bestOf}
                  onChange={(e) =>
                    setMatchForm((prev) => ({
                      ...prev,
                      bestOf: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label checkbox-label">
                  <input
                    type="checkbox"
                    checked={matchForm.eloApplied}
                    onChange={(e) =>
                      setMatchForm((prev) => ({
                        ...prev,
                        eloApplied: e.target.checked,
                      }))
                    }
                  />
                  <span>{adminText.eloApplied}</span>
                </label>
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.notes}</label>
              <textarea
                className="input textarea"
                placeholder={adminText.notes}
                value={matchForm.notes}
                onChange={(e) =>
                  setMatchForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </div>

            <div className="btn-row">
<button className="primary-btn" onClick={saveMatch}>
  {commonText.save}
</button>
<button
  className="danger-btn"
  onClick={() => setConfirmDelete({ open: true, type: "match" })}
>
  {commonText.delete}
</button>
            </div>
          </div>
        </div>
      </div>
      <div id="admin-section-achievements" className="panel">
        <h2 className="panel-title">{adminText.achievements}</h2>

        <div className="list-col admin-scroll-list">
          <button
            className="secondary-btn add-list-btn add-achievement-btn-top"
            onClick={addAchievement}
          >
            {adminText.addAchievement}
          </button>

          {achievements.map((achievement) => (
            <button
              key={achievement.id}
              type="button"
              onClick={() => setSelectedAchievementId(achievement.id)}
              className={`admin-list-btn ${
                selectedAchievementId === achievement.id
                  ? "admin-list-btn-active"
                  : ""
              }`}
            >
              {achievement.title || adminText.achievementFallback}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">{adminText.editAchievements}</h2>

        <div className="list-col admin-scroll-list">
          {selectedAchievement ? (
            <div key={selectedAchievement.id} className="simple-card">
              <div className="form-col">
<button
  className="danger-btn delete-achievement-btn-top"
  onClick={() =>
    setConfirmDelete({
      open: true,
      type: "achievement",
      achievementId: selectedAchievement.id,
    })
  }
>
  {adminText.deleteAchievement}
</button>

                <input
                  className="input"
                  value={selectedAchievement.title}
                  onChange={(e) =>
                    saveAchievement(selectedAchievement.id, {
                      title: e.target.value,
                    })
                  }
                  placeholder={adminText.achievementTitlePlaceholder}
                />

                <textarea
                  className="input textarea"
                  value={selectedAchievement.description}
                  onChange={(e) =>
                    saveAchievement(selectedAchievement.id, {
                      description: e.target.value,
                    })
                  }
                  placeholder={adminText.achievementDescriptionPlaceholder}
                />

                <input
                  className="input"
                  type="text"
                  placeholder={adminText.imageUrlPlaceholder}
                  value={selectedAchievement.image || ""}
                  onChange={(e) =>
                    saveAchievement(selectedAchievement.id, {
                      image: e.target.value,
                    })
                  }
                />

                {selectedAchievement.image ? (
                  <img
                    src={selectedAchievement.image}
                    alt={adminText.achievementPreviewAlt}
                    style={{
                      marginTop: 10,
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                ) : null}

                <div className="picker-grid compact-grid achievement-player-picker">
                  {players.map((player) => {
                    const isSelected = safeAchievementPlayerIds(
                      selectedAchievement
                    ).includes(player.id);

                    return (
                      <button
                        key={`${selectedAchievement.id}-${player.id}`}
                        type="button"
                        className={`picker-btn compact ${
                          isSelected ? "picker-btn-active" : ""
                        }`}
                        onClick={() =>
                          toggleAchievementPlayer(
                            selectedAchievement,
                            player.id
                          )
                        }
                      >
                        <span>{player.nickname}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="simple-card">
              <div className="form-col">
                <div className="muted">{adminText.noAchievementSelected}</div>
              </div>
            </div>
          )}
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
                onClick={() => setConfirmDelete({ open: false, type: null })}
              >
                {commonText.cancel}
              </button>

              <button
                className="danger-btn"
                onClick={() => {
                  if (confirmDelete.type === "player") deletePlayer();
                  if (confirmDelete.type === "team") deleteTeam();
                  if (confirmDelete.type === "tournament") deleteTournament();
                  if (confirmDelete.type === "match") deleteMatch();

                  if (
                    confirmDelete.type === "achievement" &&
                    typeof confirmDelete.achievementId === "number"
                  ) {
                    deleteAchievement(confirmDelete.achievementId);
                  }

                  setConfirmDelete({ open: false, type: null });
                }}
              >
                {commonText.delete}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
