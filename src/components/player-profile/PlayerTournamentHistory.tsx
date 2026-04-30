import { KeyboardEvent, MouseEvent } from "react";

export type PlayerTournamentHistoryEloDetail = {
  key: string;
  elo: number;
  sourceLabel: string;
  teamName?: string;
  placement: number;
  previousElo: number | null;
  totalElo: number | null;
};

export type PlayerTournamentHistoryPill = {
  key: string;
  label: string;
  className: string;
};

export type PlayerTournamentHistoryItem = {
  id: number;
  title: string;
  game: string;
  format?: string;
  type: string;
  place: number | string;
  placementTone: string;
  placementCardClass: string;
  isWinner: boolean;
  isMvp: boolean;
  eloPills: PlayerTournamentHistoryPill[];
  sourcePills: PlayerTournamentHistoryPill[];
  playedTeamPill?: PlayerTournamentHistoryPill;
  eloDetails: PlayerTournamentHistoryEloDetail[];
};

type Labels = {
  title: string;
  emptyText: string;
  place: string;
  winner: string;
  mvp: string;
  eloHistory: string;
  showEloHistory: string;
  hideEloHistory: string;
  eloGain: string;
  source: string;
  team: string;
  totalElo: string;
};

type Props = {
  tournaments: PlayerTournamentHistoryItem[];
  labels: Labels;
  expandedEloTournamentId: number | null;
  onToggleEloTournament: (tournamentId: number) => void;
  onOpenTournament?: (tournamentId: number) => void;
};

export default function PlayerTournamentHistory({
  tournaments,
  labels,
  expandedEloTournamentId,
  onToggleEloTournament,
  onOpenTournament,
}: Props) {
  const handleCardMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    tournamentId: number
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpenTournament?.(tournamentId);
  };

  return (
    <div className="section-block">
      <h4>{labels.title}</h4>

      {tournaments.length === 0 ? (
        <p className="muted">{labels.emptyText}</p>
      ) : (
        <div className="list-col">
          {tournaments.map((tournament) => {
            const isEloExpanded = expandedEloTournamentId === tournament.id;

            return (
              <div
                key={tournament.id}
                className={`simple-card tournament-history-click-card ${tournament.placementCardClass}`}
                role="button"
                tabIndex={0}
                aria-label={`Open ${tournament.title}`}
                onClick={() => onOpenTournament?.(tournament.id)}
                onKeyDown={(event) => handleCardKeyDown(event, tournament.id)}
                onMouseMove={handleCardMove}
              >
                <div className="player-tournament-card-main">
                  <div className="player-tournament-info">
                    <div className="achievement-title tournament-history-open-title player-tournament-title">
                      {tournament.title}
                    </div>
                    <div className="muted small">
                      {tournament.game} •{" "}
                      {tournament.format || tournament.type}
                    </div>
                  </div>

                  <div className="player-tournament-actions">
                    <div className="player-tournament-pills">
                      <div className="player-tournament-pills-row player-tournament-pills-row-info">
                        <span
                          className={`player-tournament-pill player-tournament-pill-place ${
                            tournament.placementTone === "gold"
                              ? "player-tournament-pill-place-1"
                              : tournament.placementTone === "silver"
                              ? "player-tournament-pill-place-2"
                              : tournament.placementTone === "bronze"
                              ? "player-tournament-pill-place-3"
                              : ""
                          }`}
                        >
                          {labels.place}: {String(tournament.place)}
                        </span>
                        {tournament.isWinner &&
                        tournament.placementTone !== "gold" ? (
                          <span className="player-tournament-pill player-tournament-pill-info">
                            {labels.winner}
                          </span>
                        ) : null}
                        {tournament.isMvp ? (
                          <span className="player-tournament-pill player-tournament-pill-info">
                            {labels.mvp}
                          </span>
                        ) : null}
                        {tournament.eloPills.map((pill) => (
                          <span key={pill.key} className={pill.className}>
                            {pill.label}
                          </span>
                        ))}
                        {tournament.sourcePills.map((pill) => (
                          <span key={pill.key} className={pill.className}>
                            {pill.label}
                          </span>
                        ))}
                        {tournament.playedTeamPill ? (
                          <span
                            key={tournament.playedTeamPill.key}
                            className={tournament.playedTeamPill.className}
                          >
                            {tournament.playedTeamPill.label}
                          </span>
                        ) : null}
                      </div>

                      {tournament.eloDetails.length > 0 ? (
                        <div className="player-tournament-pills-row player-tournament-pills-row-actions">
                          <button
                            type="button"
                            className="player-tournament-pill player-tournament-pill-action"
                            aria-expanded={isEloExpanded}
                            title={
                              isEloExpanded
                                ? labels.hideEloHistory
                                : labels.showEloHistory
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleEloTournament(tournament.id);
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            {labels.eloHistory}
                            <span
                              className="player-tournament-pill-action-indicator"
                              aria-hidden="true"
                            >
                              &rsaquo;
                            </span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <span
                      className="click-card-arrow player-tournament-expand"
                      aria-hidden="true"
                    >
                      &gt;
                    </span>
                  </div>
                </div>

                {isEloExpanded ? (
                  <div
                    className="player-tournament-elo-details"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {tournament.eloDetails.map((item) => (
                      <div
                        key={item.key}
                        className="player-tournament-elo-entry"
                      >
                        <div className="player-tournament-elo-row">
                          <span>{labels.eloGain}</span>
                          <span className="player-tournament-elo-value">
                            +{item.elo}
                          </span>
                        </div>
                        <div className="player-tournament-elo-row">
                          <span>{labels.source}</span>
                          <span className="player-tournament-elo-value">
                            {item.sourceLabel}
                          </span>
                        </div>
                        {item.teamName ? (
                          <div className="player-tournament-elo-row">
                            <span>{labels.team}</span>
                            <span className="player-tournament-elo-value">
                              {item.teamName}
                            </span>
                          </div>
                        ) : null}
                        <div className="player-tournament-elo-row">
                          <span>{labels.place}</span>
                          <span className="player-tournament-elo-value">
                            {item.placement}
                          </span>
                        </div>
                        {item.totalElo !== null ? (
                          <div className="player-tournament-elo-row">
                            <span>{labels.totalElo}</span>
                            <span className="player-tournament-elo-value">
                              {item.previousElo} → {item.totalElo}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
