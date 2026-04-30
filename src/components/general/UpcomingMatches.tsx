import type { MouseEvent } from "react";
import { Match, Player, Team, Tournament } from "../../types";
import { Lang, getMatchStageLabel, t } from "../../utils/translations";

type Props = {
  matches: Match[];
  tournaments: Tournament[];
  players: Player[];
  teams: Team[];
  lang: Lang;
  handleGlow: (e: MouseEvent<HTMLElement>) => void;
};

export default function UpcomingMatches({
  matches,
  tournaments,
  players,
  teams,
  lang,
  handleGlow,
}: Props) {
  const text = t[lang] || t.en;
  const generalText = text.generalPage;
  const commonText = text.common;
  const formatStageLabel = (stage?: string) => getMatchStageLabel(stage, lang);
  const upcomingMatches = matches.filter((match) => match.status !== "completed");

  return (
    <div className="panel home-panel">
      <h2 className="panel-title">{generalText.upcomingMatches}</h2>

      {upcomingMatches.length === 0 ? (
        <div className="empty-block">{generalText.noUpcomingMatches}</div>
      ) : (
        <div className="list-col">
          {[...upcomingMatches]
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .slice(0, 5)
            .map((match) => {
              const tournament = tournaments.find(
                (item) => item.id === match.tournamentId
              );
              const isTeamMatch = match.matchType === "team";

              const leftEntity = isTeamMatch
                ? teams.find((team) => team.id === match.team1)
                : players.find((player) => player.id === match.player1);

              const rightEntity = isTeamMatch
                ? teams.find((team) => team.id === match.team2)
                : players.find((player) => player.id === match.player2);

              const leftName = isTeamMatch
                ? leftEntity && "name" in leftEntity
                  ? leftEntity.name
                  : generalText.team1
                : leftEntity && "nickname" in leftEntity
                ? leftEntity.nickname
                : generalText.player1;

              const rightName = isTeamMatch
                ? rightEntity && "name" in rightEntity
                  ? rightEntity.name
                  : generalText.team2
                : rightEntity && "nickname" in rightEntity
                ? rightEntity.nickname
                : generalText.player2;

              const leftImage = isTeamMatch
                ? leftEntity && "logo" in leftEntity
                  ? leftEntity.logo
                  : ""
                : leftEntity && "avatar" in leftEntity
                ? leftEntity.avatar
                : "";

              const rightImage = isTeamMatch
                ? rightEntity && "logo" in rightEntity
                  ? rightEntity.logo
                  : ""
                : rightEntity && "avatar" in rightEntity
                ? rightEntity.avatar
                : "";
              const matchStage =
                match.roundLabel ||
                match.round ||
                formatStageLabel(match.stage) ||
                commonText.match;
              const isFinalStage = String(matchStage)
                .toLowerCase()
                .includes("final");

              return (
                <div
                  key={match.id}
                  className="result-card result-card-upcoming"
                  onMouseMove={handleGlow}
                  style={{
                    background: tournament?.imageUrl
                      ? `linear-gradient(
                                        90deg,
                                        rgba(5, 7, 14, 0.96) 0%,
                                        rgba(5, 7, 14, 0.88) 28%,
                                        rgba(5, 7, 14, 0.76) 52%,
                                        rgba(5, 7, 14, 0.9) 100%
                                      ), url(${tournament.imageUrl}) center / cover no-repeat`
                      : undefined,
                  }}
                >
                  <div className="result-row">
                    <div className="result-player-side left">
                      {leftImage ? (
                        <img src={leftImage} alt={leftName} className="result-avatar" />
                      ) : (
                        <div className="result-avatar-placeholder">
                          {leftName.charAt(0) || "P"}
                        </div>
                      )}

                      <div className="result-player-name">{leftName}</div>
                    </div>

                    <div className="result-score-wrap">
                      <div className="result-score result-score-upcoming">
                        {match.bestOf ? (
                          <span className="result-score-kicker">
                            {commonText.bestOfShort}
                            {match.bestOf}
                          </span>
                        ) : null}
                        <strong>{commonText.vs}</strong>
                        <span className="result-score-status">{match.status}</span>
                      </div>
                    </div>

                    <div className="result-player-side right">
                      <div className="result-player-name">{rightName}</div>

                      {rightImage ? (
                        <img src={rightImage} alt={rightName} className="result-avatar" />
                      ) : (
                        <div className="result-avatar-placeholder">
                          {rightName.charAt(0) || "P"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="result-meta">
                    <span className={`result-round ${isFinalStage ? "final" : ""}`}>
                      {matchStage}
                    </span>

                    <span className="result-date">
                      {match.date || commonText.tbd}
                    </span>
                  </div>

                  <div className="result-tournament">
                    {tournament?.title || generalText.noTournament}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
