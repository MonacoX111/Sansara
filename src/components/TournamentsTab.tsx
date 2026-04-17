import { Player, Tournament } from "../types";

type Props = {
  tournaments: Tournament[];
  players: Player[];
};

export default function TournamentsTab({ tournaments, players }: Props) {
  const getPlayerName = (playerId?: number) =>
    playerId
      ? players.find((p) => p.id === playerId)?.nickname || "Unknown"
      : "—";

  return (
    <div className="panel">
      <h2 className="panel-title">Tournaments and history</h2>

      <div className="tour-grid">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="simple-card">
            <div className="row-between">
              <div>
                <div className="achievement-title">{tournament.title}</div>
                <div className="muted small">
                  {tournament.game} • {tournament.type}
                </div>
              </div>
              <span className="pill light">{tournament.prize}</span>
            </div>

            <div className="tour-meta">
              <div>
                <span className="muted">Date:</span> {tournament.date}
              </div>
              <div>
                <span className="muted">Winner:</span>{" "}
                {getPlayerName(tournament.winnerId)}
              </div>
              <div>
                <span className="muted">MVP:</span>{" "}
                {getPlayerName(tournament.mvpId)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
