import { Achievement, Player, Team } from "../types";

type Props = {
  players: Player[];
  teams: Team[];
  achievements: Achievement[];
  onOpenPlayer: (playerId: number) => void;
  loading: boolean;
};

export default function LeaderboardTab({
  players,
  teams,
  achievements,
  onOpenPlayer,
  loading,
}: Props) {
  const getPlayerTeam = (teamId: number) =>
    teams.find((team) => team.id === teamId) || null;

  const getPlayerAchievements = (playerId: number) =>
    achievements.filter((achievement) =>
      achievement.playerIds.includes(playerId)
    );

  const leaderboard = [...players].sort(
    (a, b) => b.elo - a.elo || b.wins - a.wins
  );

  const topPlayer = leaderboard[0] || null;
  const restPlayers = leaderboard.slice(1);

  const renderAvatar = (player: Player, className: string) =>
    player.avatar ? (
      <img src={player.avatar} alt={player.nickname} className={className} />
    ) : (
      <div className={`${className} premium-leader-avatar-fallback`}>
        {player.nickname.charAt(0)}
      </div>
    );

  return (
    <div className="panel premium-leaderboard-panel">
      <div className="premium-leaderboard-head">
        <div>
          <p className="premium-leaderboard-kicker">Ranked arena</p>
          <h2 className="panel-title premium-leaderboard-title">
            Premium Leaderboard
          </h2>
        </div>

        <div className="premium-leaderboard-count">
          {leaderboard.length} players
        </div>
      </div>

      {loading ? (
        <div className="list-col">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="leader-row skeleton-row" />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-block">No players yet</div>
      ) : (
        <>
          {topPlayer && (
            <button
              type="button"
              className="premium-leader-champion"
              onClick={() => onOpenPlayer(topPlayer.id)}
            >
              <div className="premium-leader-champion-left">
                <div className="premium-crown">#1</div>

                {renderAvatar(topPlayer, "premium-leader-champion-avatar")}

                <div>
                  <div className="premium-leader-label">Current leader</div>
                  <div className="premium-leader-champion-name">
                    {topPlayer.nickname}
                  </div>



<div className="premium-leader-champion-meta">
  <span>{topPlayer.elo} ELO</span>
  <span>{topPlayer.wins} Wins</span>
  <span>{topPlayer.earnings} ₴</span>
</div>

<div className="premium-leader-team-inline">
  {getPlayerTeam(topPlayer.teamId) ? (
    <>
      {getPlayerTeam(topPlayer.teamId)?.logo ? (
        <img
          src={getPlayerTeam(topPlayer.teamId)?.logo}
          alt={getPlayerTeam(topPlayer.teamId)?.name}
          className="premium-leader-team-logo"
        />
      ) : (
        <div className="premium-leader-team-logo premium-leader-avatar-fallback">
          {getPlayerTeam(topPlayer.teamId)?.name.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div>
        <div className="premium-leader-team-name">
          {getPlayerTeam(topPlayer.teamId)?.name}
        </div>
        <div className="premium-leader-team-sub">Active roster</div>
      </div>
    </>
  ) : (
    <>
      <div className="premium-leader-team-logo premium-leader-free-logo">—</div>
      <div>
        <div className="premium-leader-team-name">Free Agent</div>
        <div className="premium-leader-team-sub">No team assigned</div>
      </div>
    </>
  )}
</div>
<div className="premium-leader-champion-achievements">
  {getPlayerAchievements(topPlayer.id).length > 0 ? (
    getPlayerAchievements(topPlayer.id)
      .slice(0, 5)
      .map((achievement) => (
        <img
          key={achievement.id}
          src={achievement.image}
          alt={achievement.title}
          title={achievement.title}
          className="premium-leader-champion-achievement"
        />
      ))
  ) : (
    <span className="premium-leader-muted">Немає досягнень</span>
  )}
</div>
                </div>
              </div>

              <div className="premium-leader-champion-right">
                <div className="premium-leader-big-elo">{topPlayer.elo}</div>
                <div className="premium-leader-big-label">ELO rating</div>
              </div>
            </button>
          )}

          <div className="premium-leader-list">
            {restPlayers.map((player, index) => {
              const realIndex = index + 1;
              const rank = realIndex + 1;
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
                  className={`premium-leader-row premium-leader-rank-${rank}`}
                  style={{ "--i": realIndex } as React.CSSProperties}
                  onClick={() => onOpenPlayer(player.id)}
                >
                  <div className="premium-leader-player">
                    <div className="premium-leader-rank">#{rank}</div>

                    {renderAvatar(player, "premium-leader-avatar")}

                    <div className="premium-leader-info">
                      <div className="premium-leader-name">
                        {player.nickname}
                      </div>

                      <div className="premium-leader-achievements">
                        {previewAchievements.length > 0 ? (
                          <>
                            {previewAchievements.map((achievement) => (
                              <img
                                key={achievement.id}
                                src={achievement.image}
                                alt={achievement.title}
                                title={achievement.title}
                                className="premium-leader-achievement"
                              />
                            ))}

                            {hiddenAchievementsCount > 0 && (
                              <span className="premium-leader-more">
                                +{hiddenAchievementsCount}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="premium-leader-muted">
                            Немає досягнень
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="premium-leader-team">
                    {playerTeam ? (
                      <>
                        {playerTeam.logo ? (
                          <img
                            src={playerTeam.logo}
                            alt={playerTeam.name}
                            className="premium-leader-team-logo"
                          />
                        ) : (
                          <div className="premium-leader-team-logo premium-leader-avatar-fallback">
                            {playerTeam.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="premium-leader-team-name">
                            {playerTeam.name}
                          </div>
                          <div className="premium-leader-team-sub">
                            Active roster
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="premium-leader-team-logo premium-leader-free-logo">
                          —
                        </div>
                        <div>
                          <div className="premium-leader-team-name">
                            Free Agent
                          </div>
                          <div className="premium-leader-team-sub">
                            No team assigned
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="premium-leader-stats">
                    <div>
                      <span>ELO</span>
                      <strong>{player.elo}</strong>
                    </div>
                    <div>
                      <span>Wins</span>
                      <strong>{player.wins}</strong>
                    </div>
                    <div>
                      <span>Earnings</span>
                      <strong>{player.earnings} ₴</strong>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}