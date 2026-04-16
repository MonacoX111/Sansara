import { Player, Team } from "../types";
import StatCard from "./StatCard";

type Props = {
  teams: Team[];
  players: Player[];
  selectedTeamId: number;
  setSelectedTeamId: (id: number) => void;
};

export default function TeamsTab({
  teams,
  players,
  selectedTeamId,
  setSelectedTeamId,
}: Props) {
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) || null;
  const teamPlayers = players.filter(
    (player) => player.teamId === selectedTeamId
  );

  return (
    <div className="two-col reverse">
      <div className="panel">
        <h2 className="panel-title">Teams</h2>

        <div className="list-col">
          {teams.map((team) => (
            <button
              key={team.id}
              className={`simple-card button-card ${
                selectedTeamId === team.id ? "player-card-active" : ""
              }`}
              onClick={() => setSelectedTeamId(team.id)}
            >
              <div className="player-head">
                <img src={team.logo} alt={team.name} className="logo" />
                <div>
                  <div className="achievement-title">{team.name}</div>
                  <div className="muted small">{team.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTeam && (
        <div className="panel">
          <h2 className="panel-title">Team profile</h2>

          <div className="profile-head">
            <img
              src={selectedTeam.logo}
              alt={selectedTeam.name}
              className="logo big"
            />
            <div>
              <h3 className="profile-name">{selectedTeam.name}</h3>
              <p className="muted">{selectedTeam.description}</p>

              <div className="tag-row">
                {selectedTeam.games.map((game) => (
                  <span key={game} className="pill">
                    {game}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard title="Players" value={teamPlayers.length} />
            <StatCard title="Wins" value={selectedTeam.wins} />
            <StatCard title="Earnings" value={`${selectedTeam.earnings} ₴`} />
            <StatCard title="Games" value={selectedTeam.games.length} />
          </div>
        </div>
      )}
    </div>
  );
}
