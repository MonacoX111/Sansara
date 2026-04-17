import { ChangeEvent, Dispatch, SetStateAction } from "react";
import {
  Achievement,
  Match,
  MatchStatus,
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

  saveTournament: (formOverride?: TournamentForm) => void;
  addTournament: () => void;
  deleteTournament: () => void;

  saveMatch: () => void;
  addMatch: () => void;
  deleteMatch: () => void;

  saveAchievement: (id: number, updates: Partial<Achievement>) => void;
  addAchievement: () => void;
  deleteAchievement: (id: number) => void;
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
}: Props) {
  const safeTournamentParticipantIds = Array.isArray(
    tournamentForm.participantIds
  )
    ? tournamentForm.participantIds
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

  const toggleTournamentParticipant = (playerId: number) => {
    setTournamentForm((prev) => {
      const currentIds = Array.isArray(prev.participantIds)
        ? prev.participantIds
        : [];

      const isSelected = currentIds.includes(playerId);

      const nextParticipantIds = isSelected
        ? currentIds.filter((id) => id !== playerId)
        : [...currentIds, playerId];

      return {
        ...prev,
        participantIds: nextParticipantIds,
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

  return (
    <div className="admin-wrap">
      <div className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">Players (admin)</h2>

          <div className="list-col">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayerId(player.id)}
                className={`admin-list-btn ${
                  selectedPlayerId === player.id ? "admin-list-btn-active" : ""
                }`}
              >
                {player.nickname || "Player"}
              </button>
            ))}

            <button className="secondary-btn add-list-btn" onClick={addPlayer}>
              + Add player
            </button>
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
              <label className="field-label">Team Name</label>
              <input
                className="input"
                placeholder="Team name"
                value={teamForm.name}
                onChange={(e) =>
                  setTeamForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">Description</label>
              <textarea
                className="input textarea"
                placeholder="Description"
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
              <label className="field-label">Games</label>
              <MultiGamePicker
                value={teamForm.games}
                onChange={(value) =>
                  setTeamForm((prev) => ({ ...prev, games: value }))
                }
              />
            </div>

            <div className="form-grid two">
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
              <label className="field-label">Logo</label>
              <input
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
                placeholder="Prize"
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
              <label className="field-label">Participants</label>
              <div className="picker-grid">
                {players.map((player) => {
                  const isSelected = safeTournamentParticipantIds.includes(
                    player.id
                  );

                  return (
                    <button
                      key={player.id}
                      type="button"
                      className={`picker-btn ${
                        isSelected ? "picker-btn-active" : ""
                      }`}
                      onClick={() => toggleTournamentParticipant(player.id)}
                    >
                      <img
                        src={player.avatar}
                        alt={player.nickname}
                        className="picker-icon"
                      />
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
              <button
                className="primary-btn"
                onClick={() =>
                  saveTournament({
                    ...tournamentForm,
                    participantIds: Array.isArray(tournamentForm.participantIds)
                      ? tournamentForm.participantIds.map(Number)
                      : [],
                  })
                }
              >
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
                    {tournament.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-block">
              <label className="field-label">Game</label>
              <input
                className="input"
                placeholder="Game"
                value={matchForm.game}
                onChange={(e) =>
                  setMatchForm((prev) => ({ ...prev, game: e.target.value }))
                }
              />
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

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">Score</label>
                <input
                  className="input"
                  placeholder="3:1"
                  value={matchForm.score}
                  onChange={(e) =>
                    setMatchForm((prev) => ({ ...prev, score: e.target.value }))
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
                <label className="field-label">Date</label>
                <input
                  className="input"
                  type="date"
                  value={matchForm.date}
                  onChange={(e) =>
                    setMatchForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">Round</label>
                <input
                  className="input"
                  placeholder="Final / Semi-final / Group A / Swiss Round 3"
                  value={matchForm.round}
                  onChange={(e) =>
                    setMatchForm((prev) => ({ ...prev, round: e.target.value }))
                  }
                />
              </div>

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
                      bestOf: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                />
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">Notes</label>
              <textarea
                className="input textarea"
                placeholder="Match notes"
                value={matchForm.notes}
                onChange={(e) =>
                  setMatchForm((prev) => ({ ...prev, notes: e.target.value }))
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

            <div className="match-preview">
              <div className="muted small">
                {getPlayerName(matchForm.player1)} vs{" "}
                {getPlayerName(matchForm.player2)}
              </div>
              <div className="muted small">
                {getTournamentName(matchForm.tournamentId)}
              </div>
              <div className="muted small">
                {matchForm.status} • {matchForm.round || "No round"} • BO
                {matchForm.bestOf || 1}
              </div>
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
            {achievements.map((achievement) => {
              const currentIds = safeAchievementPlayerIds(achievement);
              const linkedPlayers = players.filter((player) =>
                currentIds.includes(player.id)
              );

              return (
                <div key={achievement.id} className="achievement-admin-card">
                  <div className="field-block">
                    <label className="field-label">Title</label>
                    <input
                      className="input"
                      value={achievement.title}
                      onChange={(e) =>
                        saveAchievement(achievement.id, {
                          title: e.target.value,
                        })
                      }
                      placeholder="Achievement title"
                    />
                  </div>

                  <div className="field-block">
                    <label className="field-label">Description</label>
                    <textarea
                      className="input textarea"
                      value={achievement.description}
                      onChange={(e) =>
                        saveAchievement(achievement.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="Achievement description"
                    />
                  </div>

                  <div className="field-block">
                    <label className="field-label">Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAchievementImageUpload(achievement.id)}
                    />
                    {achievement.image ? (
                      <img
                        src={achievement.image}
                        alt={achievement.title}
                        className="achievement-img"
                      />
                    ) : null}
                  </div>

                  <div className="field-block">
                    <label className="field-label">Linked players</label>
                    <div className="picker-grid">
                      {players.map((player) => {
                        const isSelected = currentIds.includes(player.id);

                        return (
                          <button
                            key={player.id}
                            type="button"
                            className={`picker-btn ${
                              isSelected ? "picker-btn-active" : ""
                            }`}
                            onClick={() =>
                              toggleAchievementPlayer(achievement, player.id)
                            }
                          >
                            <img
                              src={player.avatar}
                              alt={player.nickname}
                              className="picker-icon"
                            />
                            <span>{player.nickname}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="achievement-admin-meta">
                    <span className="muted small">
                      Players linked: {currentIds.length}
                    </span>
                    <span className="muted small">
                      {linkedPlayers.length > 0
                        ? linkedPlayers
                            .map((player) => player.nickname)
                            .join(", ")
                        : "Нікого не прив’язано"}
                    </span>
                  </div>

                  <div className="btn-row">
                    <button
                      className="danger-btn"
                      onClick={() => deleteAchievement(achievement.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              className="secondary-btn add-list-btn"
              onClick={addAchievement}
            >
              + Add achievement
            </button>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Achievements info</h2>
          <p className="achievement-admin-note">
            Тут уже можна редагувати назву, опис, картинку та прив’язувати
            досягнення до гравців напряму з адмінки.
          </p>
        </div>
      </div>
    </div>
  );
}
