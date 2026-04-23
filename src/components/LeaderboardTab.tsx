import { Achievement, Player, Team } from "../types";
import { useEffect, useState } from "react";

type Props = {
  players: Player[];
  teams: Team[];
  achievements: Achievement[];
  onOpenPlayer: (playerId: number) => void;
};

export default function LeaderboardTab({
  players,
  teams,
  achievements,
  onOpenPlayer,
}: Props) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800); // можна 500–1000

    return () => clearTimeout(timer);
  }, []);
  const getPlayerTeam = (teamId: number) =>
    teams.find((team) => team.id === teamId) || null;

  const getPlayerAchievements = (playerId: number) =>
    achievements.filter((achievement) =>
      achievement.playerIds.includes(playerId)
    );

  const leaderboard = [...players].sort(
    (a, b) => b.elo - a.elo || b.wins - a.wins
  );

  return (
    <div className="panel">
      <h2 className="panel-title">Leaderboard</h2>

      <div className="list-col">
        {loading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="leader-row skeleton-row" />
            ))}
          </>
        ) : (
          leaderboard.map((player, index) => {
            const playerAchievements = getPlayerAchievements(player.id);
            const previewAchievements = playerAchievements.slice(0, 3);
            const hiddenAchievementsCount = Math.max(
              playerAchievements.length - previewAchievements.length,
              0
            );
            const playerTeam = getPlayerTeam(player.teamId);

            return (
              <button
                key={player.id}
                type="button"
                className={`leader-row leaderboard-clickable ${
                  index === 0 ? "leader-top" : ""
                }`}
                onClick={() => onOpenPlayer(player.id)}
              >
                <div className="leader-left">
                  <div className="rank-box">{index + 1}</div>

                  <img
                    src={player.avatar}
                    alt={player.nickname}
                    className="avatar"
                  />

                  <div className="leader-main-info">
                    <div className="achievement-title">{player.nickname}</div>

                    <div className="tag-row compact">
                      {previewAchievements.length > 0 ? (
                        <>
                          {previewAchievements.map((achievement) => (
                            <img
                              key={achievement.id}
                              src={achievement.image}
                              alt={achievement.title}
                              title={achievement.title}
                              className="achievement-img"
                            />
                          ))}

                          {hiddenAchievementsCount > 0 ? (
                            <span className="pill">
                              +{hiddenAchievementsCount}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="muted small">Немає досягнень</span>
                      )}
                    </div>
                  </div>

                  <div className="leader-team-side">
                    <div className="leader-team-card">
                      <div className="leader-team-label">TEAM</div>

                      {playerTeam ? (
                        <div className="leader-team-content">
                          {playerTeam.logo ? (
                            <img
                              src={playerTeam.logo}
                              alt={playerTeam.name}
                              className="leader-team-logo-large"
                            />
                          ) : (
                            <div className="leader-team-logo-large leader-team-logo-fallback-large">
                              {playerTeam.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="leader-team-texts">
                            <div className="leader-team-name-strong">
                              {playerTeam.name}
                            </div>
                            <div className="leader-team-subtle">
                              Active roster
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="leader-team-content leader-team-content--empty">
                          <div className="leader-team-logo-large leader-team-empty-logo">
                            —
                          </div>

                          <div className="leader-team-texts">
                            <div className="leader-team-name-strong">
                              Free Agent
                            </div>
                            <div className="leader-team-subtle">
                              No team assigned
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
