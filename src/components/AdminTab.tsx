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
  TournamentStatus,
} from "../types";
import { gamesList } from "../data";
import { parseList } from "../utils";

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

  handlePlayerAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => void;
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

  saveMatch: () => void;
  addMatch: (tournamentId?: number) => void;
  deleteMatch: () => void;

  saveAchievement: (id: number, updates: Partial<Achievement>) => void;
  addAchievement: () => void;
  deleteAchievement: (id: number) => void;
  selectedAchievement: Achievement | null;
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
  handlePlayerAvatarUpload,
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
  saveMatch,
  addMatch,
  deleteMatch,
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

  const safeAchievementPlayerIds = (achievement: Achievement) =>
    Array.isArray(achievement.playerIds) ? achievement.playerIds : [];

  const getPlayerName = (playerId: number) =>
    players.find((player) => player.id === playerId)?.nickname || "Unknown";

  const getTournamentName = (tournamentId: number) =>
    tournaments.find((tournament) => tournament.id === tournamentId)?.title ||
    "No tournament";

  const getTeamName = (teamId: number) =>
    teams.find((team) => team.id === teamId)?.name || "Unknown team";

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

      return {
        ...prev,
        participantIds: nextParticipantIds,
        winnerId: undefined,
        winnerTeamId: undefined,
        mvpId: undefined,
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

  return (
    <div className="admin-wrap">
      <div className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">Players (admin)</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">Search player</label>
              <input
                className="input"
                placeholder="Search by nickname or full name"
                value={playerAdminSearch}
                onChange={(e) => setPlayerAdminSearch(e.target.value)}
              />
            </div>

            <div className="list-col admin-scroll-list">
              <button
                className="secondary-btn add-list-btn add-player-btn-top"
                onClick={addPlayer}
              >
                + Add player
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
                  <span>{player.nickname || "Player"}</span>
                  {player.isFeatured ? (
                    <span className="admin-featured-badge">Featured</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Edit player</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">Nickname</label>
              <input
                className="input"
                placeholder="Nickname"
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
              <label className="field-label">Full Name</label>
              <input
                className="input"
                placeholder="Full name"
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
              <label className="field-label">Bio</label>
              <textarea
                className="input textarea"
                placeholder="Bio"
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
                Featured player
              </label>
            </div>

            <div className="field-block">
              <label className="field-label">Team</label>
              <PremiumSelect
                value={playerForm.teamId}
                placeholder="Без команди"
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
              <label className="field-label">Games</label>
              <MultiGamePicker
                value={playerForm.games}
                onChange={(value) =>
                  setPlayerForm((prev) => ({ ...prev, games: value }))
                }
              />
            </div>

            <div className="form-grid">
              <div className="field-block">
                <label className="field-label">Wins</label>
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
                <label className="field-label">Losses</label>
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
                <label className="field-label">Earnings</label>
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
                <label className="field-label">Tournaments Won</label>
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
                <label className="field-label">Rank</label>
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
                <label className="field-label">ELO</label>
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
              <label className="field-label">Avatar</label>
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={handlePlayerAvatarUpload}
              />
            </div>

            <div className="btn-row">
              <button className="primary-btn" onClick={savePlayer}>
                Save
              </button>
              <button className="danger-btn" onClick={deletePlayer}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">Teams (admin)</h2>

          <div className="list-col admin-scroll-list">
            <button
              className="secondary-btn add-list-btn add-team-btn-top"
              onClick={addTeam}
            >
              + Add team
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
                  <span>{team.name || "Team"}</span>
                  {team.isFeatured ? (
                    <span className="admin-featured-badge">Featured</span>
                  ) : null}
                </button>
              ))}
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Edit team</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">Name</label>
              <input
                className="input"
                placeholder="Team name"
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
              <label className="field-label">Games</label>
              <MultiGamePicker
                value={teamForm.games}
                onChange={(value) =>
                  setTeamForm((prev) => ({ ...prev, games: value }))
                }
              />
            </div>

            <div className="form-grid">
              <div className="field-block">
                <label className="field-label">Wins</label>
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
                <label className="field-label">Earnings</label>
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
              <label className="field-label">Description</label>
              <textarea
                className="input textarea"
                placeholder="Team description"
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
                Featured team
              </label>
            </div>

            <div className="field-block">
              <label className="field-label">Logo URL</label>
              <input
                className="input"
                type="text"
                placeholder="Paste logo URL..."
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
                  alt="Team logo preview"
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
                Save
              </button>
              <button className="danger-btn" onClick={deleteTeam}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">Tournaments (admin)</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">Select tournament</label>
              <PremiumSelect
                value={selectedTournamentId}
                placeholder="Select tournament"
                options={tournaments.map((tournament) => ({
                  value: tournament.id,
                  label: tournament.title || "Tournament",
                }))}
                onChange={(value) => handleTournamentSelect(Number(value))}
              />
            </div>

            <button
              className="secondary-btn add-list-btn add-tournament-btn-top"
              onClick={addTournament}
            >
              + Add tournament
            </button>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Edit tournament</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">Title</label>
              <input
                className="input"
                placeholder="Tournament title"
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
                <label className="field-label">Game</label>
                <input
                  className="input"
                  placeholder="Game"
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
                <label className="field-label">Participant type</label>
                <PremiumSelect
                  value={tournamentForm.participantType || "player"}
                  placeholder="Players"
                  options={[
                    { value: "player", label: "Players" },
                    { value: "team", label: "Teams" },
                  ]}
                  onChange={(value) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      participantType: value as "player" | "team",
                      participantIds: [],
                      winnerId: undefined,
                      winnerTeamId: undefined,
                      mvpId: undefined,
                      placements: [],
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">Type</label>
                <input
                  className="input"
                  placeholder="Type"
                  value={tournamentForm.type}
                  onChange={(e) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">Format</label>
                <input
                  className="input"
                  placeholder="Single Elimination / Swiss / Groups + Playoff"
                  value={tournamentForm.format}
                  onChange={(e) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      format: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">Status</label>
                <PremiumSelect
                  value={tournamentForm.status}
                  placeholder="Select status"
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
              <label className="field-label">Date</label>
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
              <label className="field-label">Prize</label>
              <input
                className="input"
                placeholder="Prize pool or reward"
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
              <label className="field-label">Description</label>
              <textarea
                className="input textarea"
                placeholder="Tournament description"
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
              <label className="field-label">Tournament Image</label>
              <input
                className="input"
                type="text"
                placeholder="Paste image URL..."
                value={tournamentForm.imageUrl || ""}
                onChange={handleTournamentImageUpload}
              />

              {tournamentForm.imageUrl ? (
                <img
                  src={tournamentForm.imageUrl}
                  alt="Tournament preview"
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
              <label className="field-label">Participants</label>

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
                          <span>{player.nickname}</span>
                        </button>
                      );
                    })}
              </div>
            </div>

            <div className="match-preview">
              <div className="muted small">
                Participants selected: {safeTournamentParticipantIds.length}
              </div>
              <div className="muted small">
                {tournamentForm.participantType === "team"
                  ? selectedTournamentTeams.length > 0
                    ? selectedTournamentTeams
                        .map((team) => team.name)
                        .join(", ")
                    : "No participants selected"
                  : selectedTournamentPlayers.length > 0
                  ? selectedTournamentPlayers
                      .map((player) => player.nickname)
                      .join(", ")
                  : "No participants selected"}
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">MVP</label>
              <PremiumSelect
                value={selectedTournamentMvpId || 0}
                placeholder="Select MVP"
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
                <label className="field-label">Winner Team</label>
                <PremiumSelect
                  value={selectedTournamentWinnerTeamId || 0}
                  placeholder="Select winner team"
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
                <label className="field-label">Winner Player</label>
                <PremiumSelect
                  value={selectedTournamentWinnerId || 0}
                  placeholder="Select winner player"
                  options={selectedTournamentPlayers.map((player) => ({
                    value: player.id,
                    label: player.nickname,
                  }))}
                  onChange={(value) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      winnerId: Number(value) > 0 ? Number(value) : undefined,
                    }))
                  }
                />
              </div>
            )}

            <div className="field-block">
              <label className="field-label">Placements</label>

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
                              placeholder="Place"
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
                              placeholder="Place"
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
                <span>Published</span>
              </label>
            </div>

            <div className="btn-row">
              <button className="primary-btn" onClick={saveTournament}>
                Save
              </button>
              <button className="danger-btn" onClick={deleteTournament}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">Home page announcement</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">Title</label>
              <input
                className="input"
                placeholder="Tournament title"
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
              <label className="field-label">Subtitle</label>
              <input
                className="input"
                placeholder="Game + type / short subtitle"
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
              <label className="field-label">Banner image URL</label>
              <input
                className="input"
                type="text"
                placeholder="Paste image URL..."
                value={homeAnnouncementForm.imageUrl || ""}
                onChange={handleHomeAnnouncementImageChange}
              />

              {homeAnnouncementForm.imageUrl ? (
                <img
                  src={homeAnnouncementForm.imageUrl}
                  alt="Home banner preview"
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
                <label className="field-label">Date</label>
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
                <label className="field-label">Participants count</label>
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
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">Format</label>
                <input
                  className="input"
                  placeholder="Format"
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
                <label className="field-label">Status</label>
                <input
                  className="input"
                  placeholder="upcoming / registrations open / etc"
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
              <label className="field-label">Prize</label>
              <input
                className="input"
                placeholder="Prize"
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
              <label className="field-label">Linked tournament</label>
              <PremiumSelect
                value={homeAnnouncementForm.tournamentId || 0}
                placeholder="No linked tournament"
                options={tournaments.map((tournament) => ({
                  value: tournament.id,
                  label: tournament.title || "Tournament",
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
              <label className="field-label">Description</label>
              <textarea
                className="input textarea"
                placeholder="Announcement description"
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
                <span>Show on home page</span>
              </label>
            </div>

            <div className="btn-row">
              <button className="primary-btn" onClick={saveHomeAnnouncement}>
                Save home announcement
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <h2 className="panel-title">Matches (admin)</h2>

          <div className="field-block">
            <label className="field-label">Select tournament</label>
            <PremiumSelect
              value={matchTournamentFilterId}
              placeholder="Select tournament"
              options={tournaments.map((tournament) => ({
                value: tournament.id,
                label: tournament.title || "Tournament",
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
                  game: nextTournament?.game || "",
                  matchType: nextTournament?.participantType || "player",
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
            <button
              className="secondary-btn add-list-btn add-match-btn-top"
              onClick={() => addMatch(matchTournamentFilterId)}
            >
              + Add match
            </button>

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
          <h2 className="panel-title">Edit match</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">Match type</label>
              <PremiumSelect
                value={
                  selectedMatchTournament?.participantType ||
                  matchForm.matchType
                }
                placeholder="Match type"
                disabled={Boolean(selectedMatchTournament)}
                options={[
                  { value: "player", label: "Player vs Player" },
                  { value: "team", label: "Team vs Team" },
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
              <label className="field-label">Tournament</label>
              <div className="admin-premium-select admin-premium-select-disabled">
                <div className="admin-premium-select-trigger admin-premium-select-trigger-disabled">
                  <span>
                    {getTournamentName(matchForm.tournamentId) ||
                      "No tournament"}
                  </span>
                  <span className="admin-premium-select-arrow">⌄</span>
                </div>
              </div>
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">Game</label>
                <input
                  className="input"
                  placeholder="Game"
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
                <label className="field-label">Date</label>
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
                  <label className="field-label">Player 1</label>
                  <PremiumSelect
                    value={matchForm.player1}
                    placeholder="Select player"
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
                  <label className="field-label">Player 2</label>
                  <PremiumSelect
                    value={matchForm.player2}
                    placeholder="Select player"
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
                  <label className="field-label">Team 1</label>
                  <select
                    className="input"
                    value={matchForm.team1}
                    onChange={(e) => {
                      const nextTeam1 = Number(e.target.value);
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
                  >
                    <option value={0}>Select team</option>
                    {availableTeam1Options.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-block">
                  <label className="field-label">Team 2</label>
                  <select
                    className="input"
                    value={matchForm.team2}
                    onChange={(e) => {
                      const nextTeam2 = Number(e.target.value);
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
                  >
                    <option value={0}>Select team</option>
                    {availableTeam2Options.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="field-block">
              <label className="field-label">Score</label>
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
                <label className="field-label">Winner</label>
                <PremiumSelect
                  value={
                    selectedWinnerOptions.some(
                      (player) => player.id === matchForm.winnerId
                    )
                      ? matchForm.winnerId
                      : 0
                  }
                  placeholder="Select winner"
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
                <label className="field-label">Winning team</label>
                <select
                  className="input"
                  value={
                    selectedWinnerTeamOptions.some(
                      (team) => team.id === matchForm.winnerTeamId
                    )
                      ? matchForm.winnerTeamId
                      : 0
                  }
                  onChange={(e) =>
                    setMatchForm((prev) => ({
                      ...prev,
                      winnerTeamId: Number(e.target.value),
                    }))
                  }
                >
                  <option value={0}>Select winning team</option>
                  {selectedWinnerTeamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">Status</label>
                <PremiumSelect
                  value={matchForm.status}
                  placeholder="Select status"
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
                <label className="field-label">Round</label>
                <input
                  className="input"
                  placeholder="Quarterfinal / Swiss 1"
                  value={matchForm.round}
                  onChange={(e) =>
                    setMatchForm((prev) => ({
                      ...prev,
                      round: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">Best Of</label>
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
                  <span>ELO applied</span>
                </label>
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">Notes</label>
              <textarea
                className="input textarea"
                placeholder="Notes"
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
                Save
              </button>
              <button className="danger-btn" onClick={deleteMatch}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="panel">
        <h2 className="panel-title">Achievements (admin)</h2>

        <div className="list-col admin-scroll-list">
          <button
            className="secondary-btn add-list-btn add-achievement-btn-top"
            onClick={addAchievement}
          >
            + Add achievement
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
              {achievement.title || "Achievement"}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Edit achievements</h2>

        <div className="list-col admin-scroll-list">
          {selectedAchievement ? (
            <div key={selectedAchievement.id} className="simple-card">
              <div className="form-col">
                <button
                  className="danger-btn delete-achievement-btn-top"
                  onClick={() => deleteAchievement(selectedAchievement.id)}
                >
                  Delete achievement
                </button>

                <input
                  className="input"
                  value={selectedAchievement.title}
                  onChange={(e) =>
                    saveAchievement(selectedAchievement.id, {
                      title: e.target.value,
                    })
                  }
                  placeholder="Achievement title"
                />

                <textarea
                  className="input textarea"
                  value={selectedAchievement.description}
                  onChange={(e) =>
                    saveAchievement(selectedAchievement.id, {
                      description: e.target.value,
                    })
                  }
                  placeholder="Achievement description"
                />

                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={handleAchievementImageUpload(
                    selectedAchievement.id
                  )}
                />

                <div className="picker-grid compact-grid">
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
                <div className="muted">No achievement selected</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
