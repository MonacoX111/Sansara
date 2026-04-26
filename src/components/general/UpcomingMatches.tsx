import type { MouseEvent } from "react";
import { Match, Player, Team } from "../../types";
import { Lang, t } from "../../utils/translations";

type Props = {
  matches: Match[];
  players: Player[];
  teams: Team[];
  lang: Lang;
  handleGlow: (e: MouseEvent<HTMLElement>) => void;
};

export default function UpcomingMatches({
  matches,
  players,
  teams,
  lang,
  handleGlow,
}: Props) {
  const text = t[lang] || t.en;
  const generalText = text.generalPage;
  const commonText = text.common;
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

              return (
                <div
                  key={match.id}
                  className="match-card new"
                  onMouseMove={handleGlow}
                >
                  <div className="match-top">
                    <span className="pill light">
                      {match.round || commonText.match}
                    </span>
                    <span className="pill">
                      {match.bestOf
                        ? `${commonText.bestOfShort}${match.bestOf}`
                        : ""}
                    </span>
                  </div>

                  <div className="match-center">
                    <div className="team-side">
                      <div className="team-side-inner">
                        {leftImage ? (
                          <img
                            src={leftImage}
                            alt={leftName}
                            className="match-side-avatar"
                          />
                        ) : (
                          <div className="match-side-avatar-placeholder">
                            {leftName.charAt(0) || "T"}
                          </div>
                        )}

                        <div className="team-name">{leftName}</div>
                      </div>
                    </div>

                    <div className="vs-big">{commonText.vs}</div>

                    <div className="team-side">
                      <div className="team-side-inner team-side-inner-right">
                        <div className="team-name">{rightName}</div>

                        {rightImage ? (
                          <img
                            src={rightImage}
                            alt={rightName}
                            className="match-side-avatar"
                          />
                        ) : (
                          <div className="match-side-avatar-placeholder">
                            {rightName.charAt(0) || "T"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="match-bottom">{match.date || commonText.tbd}</div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
