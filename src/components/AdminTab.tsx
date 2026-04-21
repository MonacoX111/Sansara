import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import {
  Achievement,
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
  participantIds: number[];
  winnerId?: number;
  winnerTeamId?: number;
  mvpId?: number;
  placements: Placement[];
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

type Props = {
  players: Player[];
  teams: Team[];
  tournaments: Tournament[];
  matches: Match[];
  achievements: Achievement[];

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
  addMatch: () => void;
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

export default function AdminTab({
  players,
  teams,
  tournaments,
  matches,
  achievements,
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

  const selectedTournament =
    tournaments.find((tournament) => tournament.id === selectedTournamentId) ||
    null;

  const selectedTournamentParticipants = players.filter((player) =>
    safeTournamentParticipantIds.includes(player.id)
  );

  const selectedTournamentWinnerId =
    typeof tournamentForm.winnerId === "number" &&
    safeTournamentParticipantIds.includes(Number(tournamentForm.winnerId))
      ? Number(tournamentForm.winnerId)
      : "";

  const selectedTournamentParticipantTeams = teams.filter((team) =>
    players.some(
      (player) =>
        safeTournamentParticipantIds.includes(player.id) &&
        player.teamId === team.id
    )
  );

  const selectedTournamentWinnerTeamId =
    typeof tournamentForm.winnerTeamId === "number" &&
    selectedTournamentParticipantTeams.some(
      (team) => team.id === Number(tournamentForm.winnerTeamId)
    )
      ? Number(tournamentForm.winnerTeamId)
      : "";

  const selectedTournamentMvpId =
    typeof tournamentForm.mvpId === "number" &&
    safeTournamentParticipantIds.includes(Number(tournamentForm.mvpId))
      ? Number(tournamentForm.mvpId)
      : "";

  const tournamentPlayerPool =
    matchForm.tournamentId && selectedTournament?.participantIds?.length
      ? players.filter((player) =>
          selectedTournament.participantIds.includes(player.id)
        )
      : players;

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

  const [playerAdminSearch, setPlayerAdminSearch] = useState("");

  const filteredAdminPlayers = players.filter((player) => {
    const q = playerAdminSearch.toLowerCase().trim();
    if (!q) return true;

    return (
      player.nickname.toLowerCase().includes(q) ||
      player.fullName.toLowerCase().includes(q)
    );
  });

  const toggleTournamentParticipant = (playerId: number) => {
    setTournamentForm((prev) => {
      const currentIds = Array.isArray(prev.participantIds)
        ? prev.participantIds.map(Number)
        : [];

      const isSelected = currentIds.includes(playerId);

      const nextParticipantIds = isSelected
        ? currentIds.filter((id) => id !== playerId)
        : [...currentIds, playerId];

      const nextWinnerId =
        typeof prev.winnerId === "number" &&
        nextParticipantIds.includes(Number(prev.winnerId))
          ? Number(prev.winnerId)
          : undefined;

      const nextParticipantTeamIds = Array.from(
        new Set(
          players
            .filter((player) => nextParticipantIds.includes(player.id))
            .map((player) => Number(player.teamId))
            .filter((teamId) => teamId > 0)
        )
      );

      const nextWinnerTeamId =
        typeof prev.winnerTeamId === "number" &&
        nextParticipantTeamIds.includes(Number(prev.winnerTeamId))
          ? Number(prev.winnerTeamId)
          : undefined;

      const nextMvpId =
        typeof prev.mvpId === "number" &&
        nextParticipantIds.includes(Number(prev.mvpId))
          ? Number(prev.mvpId)
          : undefined;

      return {
        ...prev,
        participantIds: nextParticipantIds,
        winnerId: nextWinnerId,
        winnerTeamId: nextWinnerTeamId,
        mvpId: nextMvpId,
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

    if (matchForm.tournamentId === tournamentId || tournamentId === 0) return;

    const nextTournament =
      tournaments.find((tournament) => tournament.id === tournamentId) || null;

    if (!nextTournament) {
      setMatchForm((prev) => ({
        ...prev,
        tournamentId,
        player1: 0,
        player2: 0,
        winnerId: 0,
      }));
      return;
    }

    const participantIds = Array.isArray(nextTournament.participantIds)
      ? nextTournament.participantIds
      : [];

    const player1IsValid = participantIds.includes(matchForm.player1);
    const player2IsValid = participantIds.includes(matchForm.player2);
    const winnerIsValid =
      matchForm.winnerId === matchForm.player1 ||
      matchForm.winnerId === matchForm.player2;

    setMatchForm((prev) => ({
      ...prev,
      tournamentId,
      player1: player1IsValid ? prev.player1 : 0,
      player2: player2IsValid ? prev.player2 : 0,
      winnerId: winnerIsValid ? prev.winnerId : 0,
    }));
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

            <div className="list-col">
              {filteredAdminPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(player.id)}
                  className={`admin-list-btn ${
                    selectedPlayerId === player.id
                      ? "admin-list-btn-active"
                      : ""
                  }`}
                >
                  {player.nickname || "Player"}
                </button>
              ))}

              <button
                className="secondary-btn add-list-btn"
                onClick={addPlayer}
              >
                + Add player
              </button>
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
              <select
                className="input"
                value={playerForm.teamId}
                onChange={(e) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    teamId: Number(e.target.value),
                  }))
                }
              >
                <option value={0}>Без команди</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
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

          <div className="list-col">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`admin-list-btn ${
                  selectedTeamId === team.id ? "admin-list-btn-active" : ""
                }`}
              >
                {team.name || "Team"}
              </button>
            ))}

            <button className="secondary-btn add-list-btn" onClick={addTeam}>
              + Add team
            </button>
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
              <label className="field-label">Logo</label>
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={handleTeamLogoUpload}
              />
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

          <div className="list-col">
            {tournaments.map((tournament) => (
              <button
                key={tournament.id}
                onClick={() => handleTournamentSelect(tournament.id)}
                className={`admin-list-btn ${
                  selectedTournamentId === tournament.id
                    ? "admin-list-btn-active"
                    : ""
                }`}
              >
                {tournament.title || "Tournament"}
              </button>
            ))}

            <button
              className="secondary-btn add-list-btn"
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
                <select
                  className="input"
                  value={tournamentForm.status}
                  onChange={(e) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      status: e.target.value as TournamentStatus,
                    }))
                  }
                >
                  {tournamentStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
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
                {players.map((player) => {
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
                {selectedTournamentParticipants.length > 0
                  ? selectedTournamentParticipants
                      .map((player) => player.nickname)
                      .join(", ")
                  : "No participants selected"}
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">Winner</label>
              <select
                className="input"
                value={selectedTournamentWinnerId}
                onChange={(e) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    winnerId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
              >
                <option value="">Select winner</option>
                {selectedTournamentParticipants.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.nickname}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-block">
              <label className="field-label">Winner Team</label>
              <select
                className="input"
                value={selectedTournamentWinnerTeamId}
                onChange={(e) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    winnerTeamId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
              >
                <option value="">Select winner team</option>
                {selectedTournamentParticipantTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-block">
              <label className="field-label">MVP</label>
              <select
                className="input"
                value={selectedTournamentMvpId}
                onChange={(e) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    mvpId: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              >
                <option value="">Select MVP</option>
                {selectedTournamentParticipants.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.nickname}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-block">
              <label className="field-label">Placements</label>

              <div className="form-col">
                {selectedTournamentParticipants.map((player) => {
                  const placement = Array.isArray(tournamentForm.placements)
                    ? tournamentForm.placements.find(
                        (item) => item.playerId === player.id
                      )
                    : undefined;

                  return (
                    <div key={player.id} className="form-grid two">
                      <div className="field-block">
                        <label className="field-label">{player.nickname}</label>
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
                                        ? { ...item, place: nextPlace }
                                        : item
                                    )
                                  : [
                                      ...safePlacements,
                                      {
                                        playerId: player.id,
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
          <h2 className="panel-title">Matches (admin)</h2>

          <div className="list-col">
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => setSelectedMatchId(match.id)}
                className={`admin-list-btn ${
                  selectedMatchId === match.id ? "admin-list-btn-active" : ""
                }`}
              >
                {getPlayerName(match.player1)} vs {getPlayerName(match.player2)}
              </button>
            ))}

            <button className="secondary-btn add-list-btn" onClick={addMatch}>
              + Add match
            </button>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Edit match</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">Tournament</label>
              <select
                className="input"
                value={matchForm.tournamentId}
                onChange={(e) => {
                  const nextTournamentId = Number(e.target.value);
                  const nextTournament =
                    tournaments.find(
                      (tournament) => tournament.id === nextTournamentId
                    ) || null;

                  const nextParticipantIds =
                    nextTournament &&
                    Array.isArray(nextTournament.participantIds)
                      ? nextTournament.participantIds
                      : [];
                  const nextPlayer1 = nextParticipantIds.includes(
                    matchForm.player1
                  )
                    ? matchForm.player1
                    : 0;

                  const nextPlayer2 = nextParticipantIds.includes(
                    matchForm.player2
                  )
                    ? matchForm.player2
                    : 0;

                  const nextWinnerId =
                    matchForm.winnerId === nextPlayer1 ||
                    matchForm.winnerId === nextPlayer2
                      ? matchForm.winnerId
                      : 0;

                  setMatchForm((prev) => ({
                    ...prev,
                    tournamentId: nextTournamentId,
                    player1: nextPlayer1,
                    player2: nextPlayer2,
                    winnerId: nextWinnerId,
                  }));
                }}
              >
                <option value={0}>No tournament</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {getTournamentName(tournament.id)}
                  </option>
                ))}
              </select>
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

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">Player 1</label>
                <select
                  className="input"
                  value={matchForm.player1}
                  onChange={(e) => {
                    const nextPlayer1 = Number(e.target.value);
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
                >
                  <option value={0}>Select player</option>
                  {availablePlayer1Options.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.nickname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-block">
                <label className="field-label">Player 2</label>
                <select
                  className="input"
                  value={matchForm.player2}
                  onChange={(e) => {
                    const nextPlayer2 = Number(e.target.value);
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
                >
                  <option value={0}>Select player</option>
                  {availablePlayer2Options.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.nickname}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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

            <div className="field-block">
              <label className="field-label">Winner</label>
              <select
                className="input"
                value={
                  selectedWinnerOptions.some(
                    (player) => player.id === matchForm.winnerId
                  )
                    ? matchForm.winnerId
                    : 0
                }
                onChange={(e) =>
                  setMatchForm((prev) => ({
                    ...prev,
                    winnerId: Number(e.target.value),
                  }))
                }
              >
                <option value={0}>Select winner</option>
                {selectedWinnerOptions.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">Status</label>
                <select
                  className="input"
                  value={matchForm.status}
                  onChange={(e) =>
                    setMatchForm((prev) => ({
                      ...prev,
                      status: e.target.value as MatchStatus,
                    }))
                  }
                >
                  {matchStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
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

      <div className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">Achievements (admin)</h2>

          <div className="list-col">
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

            <button
              className="secondary-btn add-list-btn"
              onClick={addAchievement}
            >
              + Add achievement
            </button>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Edit achievements</h2>

          <div className="list-col">
            {selectedAchievement ? (
              <div key={selectedAchievement.id} className="simple-card">
                <div className="form-col">
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

                  <div className="btn-row">
                    <button
                      className="danger-btn"
                      onClick={() => deleteAchievement(selectedAchievement.id)}
                    >
                      Delete achievement
                    </button>
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
    </div>
  );
}
