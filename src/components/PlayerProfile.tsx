import { Player } from "../types";

type Props = {
  player: Player | null;
};

export default function PlayerProfile({ player }: Props) {
  if (!player) {
    return <div className="card">Select player</div>;
  }

  return (
    <div className="card player-profile">
      <h2 className="player-profile-name">{player.nickname}</h2>

      <div className="player-profile-meta">
        <div className="player-profile-line">
          <span className="player-profile-label">Команда:</span>
          {player.team ? (
            <span className="player-profile-team">{player.team}</span>
          ) : (
            <span className="player-profile-empty">—</span>
          )}
        </div>

        <div className="player-profile-line">
          <span className="player-profile-label">Ігри:</span>
          <span className="player-profile-empty">не брав участі</span>
        </div>
      </div>

      <div className="player-stats">
        <div className="player-stat">
          <span className="player-stat-label">ELO</span>
          <span className="player-stat-value">{player.elo}</span>
        </div>

        <div className="player-stat">
          <span className="player-stat-label">Wins</span>
          <span className="player-stat-value">{player.wins}</span>
        </div>

        <div className="player-stat">
          <span className="player-stat-label">Earnings</span>
          <span className="player-stat-value">{player.earnings} ₴</span>
        </div>
      </div>
    </div>
  );
}
