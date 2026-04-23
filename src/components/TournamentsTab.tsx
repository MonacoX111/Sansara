import { useMemo, useState } from "react";
import { Match, Player, Team, Tournament } from "../types";

type Props = {
  tournaments: Tournament[];
  players: Player[];
  teams: Team[];
  matches: Match[];
};

export default function TournamentsTab({
  tournaments,
  players,
  teams,
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

  const getTeamById = (teamId?: number) =>
    teamId ? teams.find((team) => team.id === teamId) : undefined;

  const getPlayerName = (playerId?: number) =>
    getPlayerById(playerId)?.nickname || "—";

  const getTeamName = (teamId?: number) => getTeamById(teamId)?.name || "—";

  const getParticipantEntries = (tournament: Tournament) => {
    if (!Array.isArray(tournament.participantIds)) return [];

    if (tournament.participantType === "team") {
      return tournament.participantIds
        .map((participantId) => teams.find((team) => team.id === participantId))
        .filter(Boolean)
        .map((team) => ({
          id: team!.id,
          name: team!.name,
          image: team!.logo,
          type: "team" as const,
        }));
    }

    return tournament.participantIds
      .map((participantId) =>
        players.find((player) => player.id === participantId)
      )
      .filter(Boolean)
      .map((player) => ({
        id: player!.id,
        name: player!.nickname,
        image: player!.avatar,
        type: "player" as const,
      }));
  };

  const getPlacementEntries = (tournament: Tournament) => {
    if (!Array.isArray(tournament.placements)) return [];

    if (tournament.participantType === "team") {
      return tournament.placements
        .map((placement) => {
          const team = teams.find((team) => team.id === placement.teamId);

          if (!team) return null;

          return {
            place: placement.place,
            entityId: team.id,
            entityName: team.name,
          };
        })
        .filter(Boolean) as {
        place: number;
        entityId: number;
        entityName: string;
      }[];
    }

    return tournament.placements
      .map((placement) => {
        const player = players.find(
          (player) => player.id === placement.playerId
        );

        if (!player) return null;

        return {
          place: placement.place,
          entityId: player.id,
          entityName: player.nickname,
        };
      })
      .filter(Boolean) as {
      place: number;
      entityId: number;
      entityName: string;
    }[];
  };

  const selectedParticipants = selectedTournament
    ? getParticipantEntries(selectedTournament)
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
              className="simple-card tournament-card-button tournament-history-card"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--x",
                  `${e.clientX - rect.left}px`
                );
                e.currentTarget.style.setProperty(
                  "--y",
                  `${e.clientY - rect.top}px`
                );
              }}
              onClick={() => setSelectedTournamentId(tournament.id)}
              style={
                tournament.imageUrl
                  ? {
                      backgroundImage: `linear-gradient(rgba(7, 9, 13, 0.52), rgba(7, 9, 13, 0.86)), url(${tournament.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }
                  : undefined
              }
            >
              <div className="tournament-history-overlay">
                <div className="tournament-history-top">
                  <div className="tournament-history-head">
                    <div className="tournament-history-title">
                      {tournament.title}
                    </div>

                    <div className="tournament-history-subtitle">
                      <span className="history-meta-pill">
                        {tournament.game || "—"}
                      </span>
                      <span className="history-meta-pill">
                        {tournament.type || "—"}
                      </span>
                      {tournament.format ? (
                        <span className="history-meta-pill">
                          {tournament.format}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <span className="pill light tournament-history-prize">
                    {tournament.prize || "No prize"}
                  </span>
                </div>

                <div className="tournament-history-info-grid">
                  <div
                    className="tournament-history-info-card"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty(
                        "--x",
                        `${e.clientX - rect.left}px`
                      );
                      e.currentTarget.style.setProperty(
                        "--y",
                        `${e.clientY - rect.top}px`
                      );
                    }}
                  >
                    <span className="tournament-history-label">Date</span>
                    <span className="tournament-history-value">
                      {tournament.date || "—"}
                    </span>
                  </div>

                  <div
                    className="tournament-history-info-card"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty(
                        "--x",
                        `${e.clientX - rect.left}px`
                      );
                      e.currentTarget.style.setProperty(
                        "--y",
                        `${e.clientY - rect.top}px`
                      );
                    }}
                  >
                    <span className="tournament-history-label">Winner</span>
                    <span className="tournament-history-value">
                      {tournament.participantType === "team"
                        ? getTeamName(tournament.winnerTeamId)
                        : getPlayerName(tournament.winnerId)}
                    </span>
                  </div>

                  <div
                    className="tournament-history-info-card"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty(
                        "--x",
                        `${e.clientX - rect.left}px`
                      );
                      e.currentTarget.style.setProperty(
                        "--y",
                        `${e.clientY - rect.top}px`
                      );
                    }}
                  >
                    <span className="tournament-history-label">MVP</span>
                    <span className="tournament-history-value">
                      {getPlayerName(tournament.mvpId)}
                    </span>
                  </div>

                  <div
                    className="tournament-history-info-card"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty(
                        "--x",
                        `${e.clientX - rect.left}px`
                      );
                      e.currentTarget.style.setProperty(
                        "--y",
                        `${e.clientY - rect.top}px`
                      );
                    }}
                  >
                    <span className="tournament-history-label">
                      Participants
                    </span>
                    <span className="tournament-history-value">
                      {Array.isArray(tournament.participantIds)
                        ? tournament.participantIds.length
                        : 0}
                    </span>
                  </div>
                </div>

                <div className="tournament-card-footer upgraded">
                  <span className="tournament-open-pill">Open tournament</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="tournament-public-view">
          <div
            className="tournament-hero"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty(
                "--x",
                `${e.clientX - rect.left}px`
              );
              e.currentTarget.style.setProperty(
                "--y",
                `${e.clientY - rect.top}px`
              );
            }}
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
              <div
                className="tournament-stat-card"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty(
                    "--x",
                    `${e.clientX - rect.left}px`
                  );
                  e.currentTarget.style.setProperty(
                    "--y",
                    `${e.clientY - rect.top}px`
                  );
                }}
              >
                <div className="muted small">Status</div>
                <div className="achievement-title">
                  {selectedTournament.status || "—"}
                </div>
              </div>

              <div
                className="tournament-stat-card"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty(
                    "--x",
                    `${e.clientX - rect.left}px`
                  );
                  e.currentTarget.style.setProperty(
                    "--y",
                    `${e.clientY - rect.top}px`
                  );
                }}
              >
                <div className="muted small">Date</div>
                <div className="achievement-title">
                  {selectedTournament.date || "—"}
                </div>
              </div>

              <div
                className="tournament-stat-card"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty(
                    "--x",
                    `${e.clientX - rect.left}px`
                  );
                  e.currentTarget.style.setProperty(
                    "--y",
                    `${e.clientY - rect.top}px`
                  );
                }}
              >
                <div className="muted small">Prize</div>
                <div className="achievement-title">
                  {selectedTournament.prize || "—"}
                </div>
              </div>

              <div
                className="tournament-stat-card"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty(
                    "--x",
                    `${e.clientX - rect.left}px`
                  );
                  e.currentTarget.style.setProperty(
                    "--y",
                    `${e.clientY - rect.top}px`
                  );
                }}
              >
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
            <div
              className="simple-card tournament-section"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--x",
                  `${e.clientX - rect.left}px`
                );
                e.currentTarget.style.setProperty(
                  "--y",
                  `${e.clientY - rect.top}px`
                );
              }}
            >
              <div className="achievement-title">Tournament overview</div>

              <div className="tournament-overview-grid">
                <div
                  className="overview-stat-card game"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Game</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.game || "—"}
                  </strong>
                </div>

                <div
                  className="overview-stat-card type"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Type</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.type || "—"}
                  </strong>
                </div>

                <div
                  className="overview-stat-card format"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Format</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.format || "—"}
                  </strong>
                </div>

                <div
                  className="overview-stat-card status"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Status</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.status || "—"}
                  </strong>
                </div>

                <div
                  className="overview-stat-card date"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Date</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.date || "—"}
                  </strong>
                </div>

                <div
                  className="overview-stat-card prize"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Prize</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.prize || "—"}
                  </strong>
                </div>
              </div>
            </div>

            <div
              className="simple-card tournament-section"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--x",
                  `${e.clientX - rect.left}px`
                );
                e.currentTarget.style.setProperty(
                  "--y",
                  `${e.clientY - rect.top}px`
                );
              }}
            >
              <div className="achievement-title">Results</div>

              {(() => {
                const winnerName =
                  selectedTournament.participantType === "team"
                    ? getTeamName(selectedTournament.winnerTeamId)
                    : getPlayerName(selectedTournament.winnerId);

                const winnerImage =
                  selectedTournament.participantType === "team"
                    ? teams.find(
                        (team) => team.id === selectedTournament.winnerTeamId
                      )?.logo || ""
                    : players.find(
                        (player) => player.id === selectedTournament.winnerId
                      )?.avatar || "";

                const mvpName =
                  selectedTournament.participantType === "player"
                    ? getPlayerName(selectedTournament.mvpId)
                    : "";

                return (
                  <div className="results-block-upgraded">
                    <div
                      className="results-winner-card"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
                      <div className="results-winner-head">
                        {winnerImage ? (
                          <img
                            src={winnerImage}
                            alt={winnerName}
                            className="results-winner-avatar"
                          />
                        ) : (
                          <div className="results-winner-avatar-placeholder">
                            {winnerName.charAt(0) || "W"}
                          </div>
                        )}

                        <div className="results-winner-text">
                          <div className="results-label">Champion</div>
                          <div className="results-winner-name">
                            {winnerName}
                          </div>

                          {selectedTournament.participantType === "player" &&
                          mvpName !== "—" ? (
                            <div className="results-subline">
                              MVP: {mvpName}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {selectedPlacements.length > 0 ? (
                      <div className="results-placements-grid">
                        {selectedPlacements
                          .sort((a, b) => a.place - b.place)
                          .map((entry) => (
                            <div
                              key={`${selectedTournament.id}-${entry.place}-${entry.entityId}`}
                              className="results-placement-card"
                              onMouseMove={(e) => {
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                e.currentTarget.style.setProperty(
                                  "--x",
                                  `${e.clientX - rect.left}px`
                                );
                                e.currentTarget.style.setProperty(
                                  "--y",
                                  `${e.clientY - rect.top}px`
                                );
                              }}
                            >
                              <div className="results-placement-place">
                                #{entry.place}
                              </div>
                              <div className="results-placement-name">
                                {entry.entityName}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="results-empty-state">
                        Placements have not been added yet.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div
              className="simple-card tournament-section tournament-section-full"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--x",
                  `${e.clientX - rect.left}px`
                );
                e.currentTarget.style.setProperty(
                  "--y",
                  `${e.clientY - rect.top}px`
                );
              }}
            >
              <div className="achievement-title">Matches</div>

              {selectedMatches.length > 0 ? (
                <div className="tournament-matches upgraded">
                  {[...selectedMatches]
                    .sort((a, b) => {
                      const getPriority = (match: Match) => {
                        const round = (match.round || "").toLowerCase();

                        if (round.includes("final")) return 100;
                        if (round.includes("1/2") || round.includes("semi"))
                          return 90;
                        if (round.includes("1/4") || round.includes("quarter"))
                          return 80;
                        if (round.includes("1/8")) return 70;

                        return 0;
                      };

                      return getPriority(b) - getPriority(a);
                    })
                    .map((match) => {
                      const isTeamMatch = match.matchType === "team";

                      const leftName = isTeamMatch
                        ? getTeamName(match.team1)
                        : getPlayerName(match.player1);

                      const rightName = isTeamMatch
                        ? getTeamName(match.team2)
                        : getPlayerName(match.player2);

                      const winnerName = isTeamMatch
                        ? getTeamName(match.winnerTeamId)
                        : getPlayerName(match.winnerId);

                      const winnerLeft = isTeamMatch
                        ? match.winnerTeamId === match.team1
                        : match.winnerId === match.player1;

                      const winnerRight = isTeamMatch
                        ? match.winnerTeamId === match.team2
                        : match.winnerId === match.player2;

                      const leftImage = isTeamMatch
                        ? teams.find((team) => team.id === match.team1)?.logo ||
                          ""
                        : players.find((player) => player.id === match.player1)
                            ?.avatar || "";

                      const rightImage = isTeamMatch
                        ? teams.find((team) => team.id === match.team2)?.logo ||
                          ""
                        : players.find((player) => player.id === match.player2)
                            ?.avatar || "";

                      return (
                        <div
                          key={match.id}
                          className="tournament-match-card"
                          onMouseMove={(e) => {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            e.currentTarget.style.setProperty(
                              "--x",
                              `${e.clientX - rect.left}px`
                            );
                            e.currentTarget.style.setProperty(
                              "--y",
                              `${e.clientY - rect.top}px`
                            );
                          }}
                        >
                          <div className="tournament-match-top">
                            <div className="tournament-match-badges">
                              <span className="pill light">
                                {match.round || "Match"}
                              </span>
                              <span className="pill">
                                {match.status || "—"}
                              </span>
                              <span className="pill">
                                {match.bestOf ? `BO${match.bestOf}` : "BO—"}
                              </span>
                            </div>
                          </div>

                          <div className="tournament-match-center">
                            <div className="tournament-match-side left">
                              {leftImage ? (
                                <img
                                  src={leftImage}
                                  alt={leftName}
                                  className="tournament-match-avatar"
                                />
                              ) : (
                                <div className="tournament-match-avatar-placeholder">
                                  {leftName.charAt(0) || "L"}
                                </div>
                              )}

                              <div
                                className={`tournament-match-name ${
                                  winnerLeft ? "winner" : ""
                                }`}
                              >
                                {leftName}
                              </div>
                            </div>

                            <div className="tournament-match-middle">
                              <div className="tournament-match-score-top">
                                {match.score
                                  ? (() => {
                                      const [s1, s2] = match.score
                                        .split(":")
                                        .map(Number);

                                      const getColor = (
                                        a: number,
                                        b: number
                                      ) => {
                                        if (a === b) return "#ffffff"; // нічия
                                        return a > b ? "#31d07f" : "#ff3b5f";
                                      };

                                      return (
                                        <>
                                          <span
                                            style={{ color: getColor(s1, s2) }}
                                          >
                                            {s1}
                                          </span>
                                          <span
                                            style={{
                                              margin: "0 6px",
                                              opacity: 0.6,
                                            }}
                                          >
                                            :
                                          </span>
                                          <span
                                            style={{ color: getColor(s2, s1) }}
                                          >
                                            {s2}
                                          </span>
                                        </>
                                      );
                                    })()
                                  : "-"}
                              </div>

                              <div className="tournament-match-vs">VS</div>

                              <div className="tournament-match-winner-bottom">
                                {winnerName !== "—"
                                  ? `Winner: ${winnerName}`
                                  : ""}
                              </div>
                            </div>

                            <div className="tournament-match-side right">
                              <div
                                className={`tournament-match-name ${
                                  winnerRight ? "winner" : ""
                                }`}
                              >
                                {rightName}
                              </div>

                              {rightImage ? (
                                <img
                                  src={rightImage}
                                  alt={rightName}
                                  className="tournament-match-avatar"
                                />
                              ) : (
                                <div className="tournament-match-avatar-placeholder">
                                  {rightName.charAt(0) || "R"}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="tournament-match-bottom">
                            <div className="tournament-match-date">
                              {match.date || "—"}
                            </div>
                          </div>

                          {match.notes ? (
                            <div className="tournament-match-notes">
                              {match.notes}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="muted small">No matches added yet.</div>
              )}
            </div>

            <div
              className="simple-card tournament-section tournament-section-full"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--x",
                  `${e.clientX - rect.left}px`
                );
                e.currentTarget.style.setProperty(
                  "--y",
                  `${e.clientY - rect.top}px`
                );
              }}
            >
              <div className="achievement-title">Participants</div>

              {selectedParticipants.length > 0 ? (
                <div className="tournament-participants">
                  {selectedTournament?.participantType === "team"
                    ? selectedParticipants.map((participant) => {
                        const team = teams.find(
                          (item) => item.id === participant.id
                        );
                        const isWinner =
                          selectedTournament.winnerTeamId === participant.id;

                        return (
                          <div
                            key={participant.id}
                            className={`participant-card ${
                              isWinner ? "participant-card-winner" : ""
                            }`}
                            onMouseMove={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              e.currentTarget.style.setProperty(
                                "--x",
                                `${e.clientX - rect.left}px`
                              );
                              e.currentTarget.style.setProperty(
                                "--y",
                                `${e.clientY - rect.top}px`
                              );
                            }}
                          >
                            <div className="participant-card-head">
                              {participant.image ? (
                                <img
                                  src={participant.image}
                                  alt={participant.name}
                                  className="participant-avatar"
                                />
                              ) : (
                                <div className="participant-avatar-placeholder">
                                  {participant.name.charAt(0) || "T"}
                                </div>
                              )}

                              <div className="participant-head-content">
                                <div className="participant-title-row">
                                  <div className="achievement-title">
                                    {participant.name}
                                  </div>

                                  {isWinner ? (
                                    <span className="participant-winner-badge">
                                      Winner
                                    </span>
                                  ) : null}
                                </div>

                                <div className="muted small">Team profile</div>
                              </div>
                            </div>

                            <div className="participant-stats-grid">
                              <div className="participant-stat-box">
                                <span className="muted">Wins</span>
                                <strong>{team?.wins ?? 0}</strong>
                              </div>

                              <div className="participant-stat-box">
                                <span className="muted">Earnings</span>
                                <strong>{team?.earnings ?? 0}</strong>
                              </div>

                              <div className="participant-stat-box">
                                <span className="muted">Players</span>
                                <strong>{team?.players?.length ?? 0}</strong>
                              </div>
                            </div>

                            <div className="participant-roster">
                              <div className="participant-roster-label">
                                Roster
                              </div>

                              {team?.players?.length ? (
                                <div className="participant-roster-list">
                                  {team.players.map((playerId) => {
                                    const rosterPlayer = players.find(
                                      (item) => item.id === playerId
                                    );

                                    return (
                                      <div
                                        key={`${participant.id}-${playerId}`}
                                        className="participant-roster-item"
                                      >
                                        {rosterPlayer?.avatar ? (
                                          <img
                                            src={rosterPlayer.avatar}
                                            alt={
                                              rosterPlayer.nickname || "Player"
                                            }
                                            className="participant-roster-avatar"
                                          />
                                        ) : (
                                          <div className="participant-roster-avatar-placeholder">
                                            {rosterPlayer?.nickname?.charAt(
                                              0
                                            ) || "P"}
                                          </div>
                                        )}

                                        <span className="participant-roster-name">
                                          {rosterPlayer?.nickname || "Unknown"}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="participant-roster-empty">
                                  No players in roster
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    : selectedParticipants.map((participant) => {
                        const player = players.find(
                          (item) => item.id === participant.id
                        );
                        const isWinner =
                          selectedTournament.winnerId === participant.id;

                        return (
                          <div
                            key={participant.id}
                            className={`participant-card ${
                              isWinner ? "participant-card-winner" : ""
                            }`}
                            onMouseMove={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              e.currentTarget.style.setProperty(
                                "--x",
                                `${e.clientX - rect.left}px`
                              );
                              e.currentTarget.style.setProperty(
                                "--y",
                                `${e.clientY - rect.top}px`
                              );
                            }}
                          >
                            <div className="participant-card-head">
                              {participant.image ? (
                                <img
                                  src={participant.image}
                                  alt={participant.name}
                                  className="participant-avatar"
                                />
                              ) : (
                                <div className="participant-avatar-placeholder">
                                  {participant.name.charAt(0) || "P"}
                                </div>
                              )}

                              <div className="participant-head-content">
                                <div className="participant-title-row">
                                  <div className="achievement-title">
                                    {participant.name}
                                  </div>

                                  {isWinner ? (
                                    <span className="participant-winner-badge">
                                      Winner
                                    </span>
                                  ) : null}
                                </div>

                                <div className="muted small">
                                  Player profile
                                </div>
                              </div>
                            </div>

                            <div className="participant-stats-grid">
                              <div className="participant-stat-box">
                                <span className="muted">Wins</span>
                                <strong>{player?.wins ?? 0}</strong>
                              </div>

                              <div className="participant-stat-box">
                                <span className="muted">Losses</span>
                                <strong>{player?.losses ?? 0}</strong>
                              </div>

                              <div className="participant-stat-box">
                                <span className="muted">ELO</span>
                                <strong>{player?.elo ?? 0}</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
