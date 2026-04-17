import { Player, Tournament } from "../types";

type Props = {
  tournaments: Tournament[];
  players: Player[];
};

export default function TournamentsTab({ tournaments, players }: Props) {
  const getPlayerName = (playerId: number) =>
    players.find((p) => p.id === playerId)?.nickname || "Unknown";

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

              <div className="tag-row">
                <span className="pill light">{tournament.prize}</span>
                <span className="pill">{tournament.status}</span>
              </div>
            </div>

            <div className="tour-meta">
              <div>
                <span className="muted">Format:</span>{" "}
                {tournament.format || "—"}
              </div>

              <div>
                <span className="muted">Date:</span> {tournament.date || "—"}
              </div>

              <div>
                <span className="muted">Participants:</span>{" "}
                {tournament.participantIds?.length ?? 0}
              </div>

              <div>
                <span className="muted">Published:</span>{" "}
                {tournament.isPublished ? "Yes" : "No"}
              </div>

              <div>
                <span className="muted">Winner:</span>{" "}
                {tournament.winnerId ? getPlayerName(tournament.winnerId) : "—"}
              </div>

              <div>
                <span className="muted">MVP:</span>{" "}
                {tournament.mvpId ? getPlayerName(tournament.mvpId) : "—"}
              </div>

              {tournament.description ? (
                <div>
                  <span className="muted">Description:</span>{" "}
                  {tournament.description}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
