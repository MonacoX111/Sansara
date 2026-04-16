import { Player, Team } from "../types";

type Props = {
  players: Player[];
  teams: Team[];
};

export default function LeaderboardTab({ players, teams }: Props) {
  const getTeamName = (teamId: number) =>
    teams.find((t) => t.id === teamId)?.name || "Без команди";

  const leaderboard = [...players].sort(
    (a, b) => b.elo - a.elo || b.wins - a.wins
  );

  return (
    <div className="panel">
      <h2 className="panel-title">Leaderboard</h2>

      <div className="list-col">
        {leaderboard.map((player, index) => (
          <div key={player.id} className="leader-row">
            <div className="leader-left">
              <div className="rank-box">{index + 1}</div>
              <img
                src={player.avatar}
                alt={player.nickname}
                className="avatar"
              />
              <div>
                <div className="achievement-title">{player.nickname}</div>
                <div className="muted small">{getTeamName(player.teamId)}</div>
              </div>
            </div>

            <div className="leader-stats">
              <div>
                <span className="muted small">ELO</span>
                <div>{player.elo}</div>
              </div>
              <div>
                <span className="muted small">Wins</span>
                <div>{player.wins}</div>
              </div>
              <div>
                <span className="muted small">Earnings</span>
                <div>{player.earnings} ₴</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
