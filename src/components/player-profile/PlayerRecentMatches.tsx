import { MouseEvent } from "react";

type PlayerRecentMatchResult = "win" | "loss" | "pending";

export type PlayerRecentMatchRow = {
  id: number;
  result: PlayerRecentMatchResult;
  firstParticipantName: string;
  secondParticipantName: string;
  game: string;
  roundLabel?: string;
  round?: string;
  score: string;
  tournamentName: string;
};

type Props = {
  title: string;
  emptyText: string;
  vsText: string;
  matches: PlayerRecentMatchRow[];
};

export default function PlayerRecentMatches({
  title,
  emptyText,
  vsText,
  matches,
}: Props) {
  const handleMatchMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  return (
    <div className="section-block">
      <h4>{title}</h4>

      {matches.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <div className="player-recent-matches">
          {matches.map((match) => (
            <div
              key={match.id}
              className="player-match-row"
              onMouseMove={handleMatchMove}
            >
              <div className="player-match-left">
                <span
                  className={`player-match-result player-match-result-${match.result}`}
                >
                  {match.result === "win"
                    ? "W"
                    : match.result === "loss"
                    ? "L"
                    : "-"}
                </span>
              </div>

              <div className="player-match-center">
                <div className="player-match-title">
                  <span>{match.firstParticipantName}</span>
                  <span className="player-match-vs">{vsText}</span>
                  <span>{match.secondParticipantName}</span>
                </div>
                <div className="player-match-meta">
                  {match.game}
                  {match.roundLabel || match.round ? (
                    <> {" "}• {match.roundLabel || match.round}</>
                  ) : null}
                </div>
              </div>

              <div className="player-match-right">
                <div className="player-match-score">{match.score || "-"}</div>
                <div className="player-match-tournament">
                  {match.tournamentName}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
