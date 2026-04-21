import { useMemo, useState } from "react";
import { Match, Player, Tournament } from "../types";

type Props = {
  tournaments: Tournament[];
  players: Player[];
  matches: Match[];
};

export default function TournamentsTab({
  tournaments,
  players,
  matches,
}: Props) {
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    number | null
  >(null);

  const selectedTournament = useMemo(
    () =>
      tournaments.find(
        (tournament) => tournament.id === selectedTournamentId
      ) ?? null,
    [tournaments, selectedTournamentId]
  );

  const getPlayerById = (playerId?: number) =>
    playerId ? players.find((player) => player.id === playerId) : undefined;

  const getPlayerName = (playerId?: number) =>
    getPlayerById(playerId)?.nickname || "—";

  const getParticipantPlayers = (tournament: Tournament) => {
    if (!Array.isArray(tournament.participantIds)) return [];

    return tournament.participantIds
      .map((participantId) =>
        players.find((player) => player.id === participantId)
      )
      .filter(Boolean) as Player[];
  };

  const getPlacementEntries = (tournament: Tournament) => {
    if (!Array.isArray(tournament.placements)) return [];

    return tournament.placements
      .map((placement) => ({
        ...placement,
        player: players.find((player) => player.id === placement.playerId),
      }))
      .filter((entry) => entry.player);
  };

  const selectedParticipants = selectedTournament
    ? getParticipantPlayers(selectedTournament)
    : [];

  const selectedPlacements = selectedTournament
    ? getPlacementEntries(selectedTournament)
    : [];

  const selectedMatches = selectedTournament
    ? matches.filter((match) => match.tournamentId === selectedTournament.id)
    : [];

  return (
    <div className="panel">
      <div className="row-between">
        <h2 className="panel-title">Tournaments and history</h2>

        {selectedTournament ? (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setSelectedTournamentId(null)}
          >
            Back to list
          </button>
        ) : null}
      </div>

      {!selectedTournament ? (
        <div className="tour-grid">
          {tournaments.map((tournament) => (
            <button
              key={tournament.id}
              type="button"
              className="simple-card tournament-card-button"
              onClick={() => setSelectedTournamentId(tournament.id)}
              style={
                tournament.imageUrl
                  ? {
                      backgroundImage: `linear-gradient(rgba(7, 9, 13, 0.7), rgba(7, 9, 13, 0.88)), url(${tournament.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }
                  : undefined
              }
            >
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
                  <span className="muted">Date:</span> {tournament.date || "—"}
                </div>
                <div>
                  <span className="muted">Winner:</span>{" "}
                  {getPlayerName(tournament.winnerId)}
                </div>
                <div>
                  <span className="muted">MVP:</span>{" "}
                  {getPlayerName(tournament.mvpId)}
                </div>
                <div>
                  <span className="muted">Participants:</span>{" "}
                  {Array.isArray(tournament.participantIds)
                    ? tournament.participantIds.length
                    : 0}
                </div>
              </div>

              <div className="tournament-card-footer">
                <span className="pill">Open tournament</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="tournament-public-view">
          <div
            className="tournament-hero"
            style={
              selectedTournament.imageUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(7, 9, 13, 0.78), rgba(7, 9, 13, 0.88)), url(${selectedTournament.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }
                : undefined
            }
          >
            <div className="tournament-hero-main">
              <div className="tournament-hero-label">Tournament</div>
              <h1 className="tournament-hero-title">
                {selectedTournament.title}
              </h1>

              <div className="tournament-hero-subtitle">
                <span>{selectedTournament.game}</span>
                <span>•</span>
                <span>{selectedTournament.type}</span>
                {selectedTournament.format ? (
                  <>
                    <span>•</span>
                    <span>{selectedTournament.format}</span>
                  </>
                ) : null}
              </div>

              {selectedTournament.description ? (
                <p className="tournament-hero-description">
                  {selectedTournament.description}
                </p>
              ) : null}
            </div>

            <div className="tournament-hero-side">
              <div className="tournament-stat-card">
                <div className="muted small">Status</div>
                <div className="achievement-title">
                  {selectedTournament.status || "—"}
                </div>
              </div>

              <div className="tournament-stat-card">
                <div className="muted small">Date</div>
                <div className="achievement-title">
                  {selectedTournament.date || "—"}
                </div>
              </div>

              <div className="tournament-stat-card">
                <div className="muted small">Prize</div>
                <div className="achievement-title">
                  {selectedTournament.prize || "—"}
                </div>
              </div>

              <div className="tournament-stat-card">
                <div className="muted small">Participants</div>
                <div className="achievement-title">
                  {selectedParticipants.length}
                </div>
              </div>
            </div>
          </div>

          {selectedTournament.imageUrl ? (
            <div className="simple-card tournament-section tournament-cover-section">
              <div className="achievement-title">Tournament cover</div>

              <img
                src={selectedTournament.imageUrl}
                alt={selectedTournament.title}
                className="tournament-cover-image"
              />
            </div>
          ) : null}

          <div className="tournament-sections-grid">
            <div className="simple-card tournament-section">
              <div className="achievement-title">Tournament overview</div>

              <div className="tour-meta">
                <div>
                  <span className="muted">Game:</span> {selectedTournament.game}
                </div>
                <div>
                  <span className="muted">Type:</span> {selectedTournament.type}
                </div>
                <div>
                  <span className="muted">Format:</span>{" "}
                  {selectedTournament.format || "—"}
                </div>
                <div>
                  <span className="muted">Status:</span>{" "}
                  {selectedTournament.status || "—"}
                </div>
                <div>
                  <span className="muted">Date:</span>{" "}
                  {selectedTournament.date || "—"}
                </div>
                <div>
                  <span className="muted">Prize:</span>{" "}
                  {selectedTournament.prize || "—"}
                </div>
              </div>
            </div>

            <div className="simple-card tournament-section">
              <div className="achievement-title">Results</div>

              <div className="tour-meta">
                <div>
                  <span className="muted">Winner:</span>{" "}
                  {getPlayerName(selectedTournament.winnerId)}
                </div>
                <div>
                  <span className="muted">MVP:</span>{" "}
                  {getPlayerName(selectedTournament.mvpId)}
                </div>
              </div>

              {selectedPlacements.length > 0 ? (
                <div className="tournament-placements">
                  {selectedPlacements.map((entry) => (
                    <div
                      key={`${selectedTournament.id}-${entry.place}-${entry.playerId}`}
                      className="placement-row"
                    >
                      <span className="pill">#{entry.place}</span>
                      <span>{entry.player?.nickname || "Unknown"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted small">No placements added yet.</div>
              )}
            </div>

            <div className="simple-card tournament-section tournament-section-full">
              <div className="achievement-title">Matches</div>

              {selectedMatches.length > 0 ? (
                <div className="tournament-matches">
                  {selectedMatches.map((match) => (
                    <div key={match.id} className="match-card">
                      <div className="row-between">
                        <div className="achievement-title">
                          {getPlayerName(match.player1)} vs{" "}
                          {getPlayerName(match.player2)}
                        </div>

                        <span className="pill">
                          {match.score || "No score"}
                        </span>
                      </div>

                      <div className="tour-meta">
                        <div>
                          <span className="muted">Round:</span>{" "}
                          {match.round || "—"}
                        </div>
                        <div>
                          <span className="muted">Status:</span>{" "}
                          {match.status || "—"}
                        </div>
                        <div>
                          <span className="muted">Date:</span>{" "}
                          {match.date || "—"}
                        </div>
                        <div>
                          <span className="muted">Winner:</span>{" "}
                          {getPlayerName(match.winnerId)}
                        </div>
                        <div>
                          <span className="muted">Best of:</span>{" "}
                          {match.bestOf || "—"}
                        </div>
                      </div>

                      {match.notes ? (
                        <div className="muted small">{match.notes}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted small">No matches added yet.</div>
              )}
            </div>

            <div className="simple-card tournament-section tournament-section-full">
              <div className="achievement-title">Participants</div>

              {selectedParticipants.length > 0 ? (
                <div className="tournament-participants">
                  {selectedParticipants.map((player) => (
                    <div key={player.id} className="participant-card">
                      <div className="achievement-title">{player.nickname}</div>

                      <div className="muted small">
                        {player.fullName || "Player profile"}
                      </div>

                      <div className="tour-meta">
                        <div>
                          <span className="muted">Wins:</span> {player.wins}
                        </div>
                        <div>
                          <span className="muted">Losses:</span> {player.losses}
                        </div>
                        <div>
                          <span className="muted">ELO:</span> {player.elo}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted small">No participants added yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
