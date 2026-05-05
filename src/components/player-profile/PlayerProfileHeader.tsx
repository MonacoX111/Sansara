import { ChangeEvent, MouseEvent, useRef } from "react";
import { Player, Team } from "../../types";
import { PlayerRecentMatch } from "../../domain/player/playerStats";

type PlayerProfileHeaderLabels = {
  elo: string;
  rank: string;
  winRate: string;
  currentStreak: string;
  games: string;
  noGames: string;
  achievements: string;
  tournaments: string;
  form: string;
  noMatchesYet: string;
  formWinShort: string;
  formLossShort: string;
};

type Props = {
  player: Player;
  currentTeam: Team | null;
  labels: PlayerProfileHeaderLabels;
  winRate: number;
  streakLabel: string;
  formResults: PlayerRecentMatch[];
  achievementsCount: number;
  tournamentsCount: number;
  canChangeAvatar?: boolean;
  avatarUploadLoading?: boolean;
  avatarUploadError?: string;
  onAvatarChange?: (playerId: number, file: File | null) => void;
};

export default function PlayerProfileHeader({
  player,
  currentTeam,
  labels,
  winRate,
  streakLabel,
  formResults,
  achievementsCount,
  tournamentsCount,
  canChangeAvatar = false,
  avatarUploadLoading = false,
  avatarUploadError = "",
  onAvatarChange,
}: Props) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const handleMiniStatMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onAvatarChange?.(player.id, event.target.files?.[0] || null);
    event.target.value = "";
  };

  return (
    <div className="profile-head">
      <div className="profile-main-info">
        <div className="profile-banner">
          <div className="profile-banner-bg" />
          <div className="profile-banner-content">
            <img
              src={player.avatar}
              alt={player.nickname}
              className="avatar large"
            />

            <div>
              <div className="profile-identity-row">
                <div className="profile-identity-copy">
                  <h3 className="profile-name">{player.nickname}</h3>

                  {currentTeam ? (
                    <div className="profile-current-team-chip">
                      {currentTeam.logo ? (
                        <img src={currentTeam.logo} alt={currentTeam.name} />
                      ) : null}
                      <span>{currentTeam.name}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {player.bio ? (
                <div className="player-role-badge">{player.bio}</div>
              ) : null}

              {canChangeAvatar ? (
                <div className="profile-avatar-actions">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarFileChange}
                  />
                  <button
                    type="button"
                    className="secondary-btn"
                    disabled={avatarUploadLoading}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarUploadLoading ? "Uploading..." : "Change avatar"}
                  </button>
                  {avatarUploadError ? (
                    <div className="admin-error">{avatarUploadError}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="profile-head-stats-bar">
          <div className="profile-head-stat profile-head-stat-elo">
            <span className="profile-head-stat-label">{labels.elo}</span>
            <span className="profile-head-stat-value">{player.elo}</span>
          </div>

          <div className="profile-head-stat">
            <span className="profile-head-stat-label">{labels.rank}</span>
            <span className="profile-head-stat-value">
              {player.rank ? `#${player.rank}` : "â€”"}
            </span>
          </div>

          <div className="profile-head-stat">
            <span className="profile-head-stat-label">{labels.winRate}</span>
            <span className="profile-head-stat-value">{winRate}%</span>
          </div>

          <div className="profile-head-stat">
            <span className="profile-head-stat-label">
              {labels.currentStreak}
            </span>
            <span className="profile-head-stat-value">{streakLabel}</span>
          </div>
        </div>

        <div className="profile-form-strip">
          <span className="profile-form-label">{labels.form}</span>
          {formResults.length > 0 ? (
            <div className="profile-form-list">
              {[...formResults].reverse().map((item) => (
                <span
                  key={item.match.id}
                  className={`profile-form-pill profile-form-pill-${item.result}`}
                >
                  {item.result === "win"
                    ? labels.formWinShort
                    : labels.formLossShort}
                </span>
              ))}
            </div>
          ) : (
            <span className="profile-form-empty">{labels.noMatchesYet}</span>
          )}
        </div>

        <div className="profile-info-box upgraded">
          <div className="profile-info-row column">
            <span className="info-label">{labels.games}</span>

            <div className="profile-games-enhanced">
              {player.games.length > 0 ? (
                player.games.map((game) => (
                  <span key={game} className="profile-game-chip">
                    {game}
                  </span>
                ))
              ) : (
                <span className="muted small">{labels.noGames}</span>
              )}
            </div>
          </div>

          <div className="profile-mini-stats">
            <div className="profile-mini-stat-card" onMouseMove={handleMiniStatMove}>
              <span className="info-label">{labels.achievements}</span>
              <span className="profile-mini-stat-value">
                {achievementsCount}
              </span>
            </div>

            <div className="profile-mini-stat-card" onMouseMove={handleMiniStatMove}>
              <span className="info-label">{labels.tournaments}</span>
              <span className="profile-mini-stat-value">
                {tournamentsCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
