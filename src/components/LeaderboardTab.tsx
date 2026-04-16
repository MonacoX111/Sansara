import { Achievement, Player, Team } from "../types";

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
  const getTeamName = (teamId: number) =>
    teams.find((t) => t.id === teamId)?.name || "Без команди";

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
        {leaderboard.map((player, index) => {
          const playerAchievements = getPlayerAchievements(player.id);
          const previewAchievements = playerAchievements.slice(0, 3);
          const hiddenAchievementsCount = Math.max(
            playerAchievements.length - previewAchievements.length,
            0
          );

          return (
            <button
              key={player.id}
              type="button"
              className="leader-row leaderboard-clickable"
              onClick={() => onOpenPlayer(player.id)}
            >
              <div className="leader-left">
                <div className="rank-box">{index + 1}</div>
                <img
                  src={player.avatar}
                  alt={player.nickname}
                  className="avatar"
                />
                <div>
                  <div className="achievement-title">{player.nickname}</div>
                  <div className="muted small">
                    {getTeamName(player.teamId)}
                  </div>

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
        })}
      </div>
    </div>
  );
}
