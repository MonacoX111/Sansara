import { MouseEvent, useEffect, useState } from "react";
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
  nickname: string;
  fullName: string;
  bio: string;
  avatar: string;
  avatarUrlPlaceholder: string;
  editProfile: string;
  saveProfile: string;
  savingProfile: string;
  cancel: string;
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
  canEditOwnProfile?: boolean;
  profileSaveLoading?: boolean;
  profileSaveError?: string;
  onProfileSave?: (
    playerId: number,
    updates: Pick<Player, "nickname" | "fullName" | "bio" | "avatar">
  ) => void;
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
  canEditOwnProfile = false,
  profileSaveLoading = false,
  profileSaveError = "",
  onProfileSave,
}: Props) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    nickname: player.nickname || "",
    fullName: player.fullName || "",
    bio: player.bio || "",
    avatar: player.avatar || "",
  });
  const handleMiniStatMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };
  const resetProfileDraft = () => {
    setProfileDraft({
      nickname: player.nickname || "",
      fullName: player.fullName || "",
      bio: player.bio || "",
      avatar: player.avatar || "",
    });
  };

  useEffect(() => {
    resetProfileDraft();
    setIsEditingProfile(false);
  }, [player.id, player.nickname, player.fullName, player.bio, player.avatar]);

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
                  {player.fullName?.trim() ? (
                    <div className="profile-full-name">
                      {player.fullName.trim()}
                    </div>
                  ) : null}

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

              {canEditOwnProfile ? (
                <div className="profile-avatar-actions">
                  {isEditingProfile ? (
                    <div className="profile-avatar-edit-form profile-edit-form">
                      <input
                        type="text"
                        className="input"
                        placeholder={labels.nickname}
                        value={profileDraft.nickname}
                        onChange={(event) =>
                          setProfileDraft((current) => ({
                            ...current,
                            nickname: event.target.value,
                          }))
                        }
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder={labels.fullName}
                        value={profileDraft.fullName}
                        onChange={(event) =>
                          setProfileDraft((current) => ({
                            ...current,
                            fullName: event.target.value,
                          }))
                        }
                      />
                      <textarea
                        className="input textarea"
                        placeholder={labels.bio}
                        value={profileDraft.bio}
                        onChange={(event) =>
                          setProfileDraft((current) => ({
                            ...current,
                            bio: event.target.value,
                          }))
                        }
                      />
                      <input
                        type="url"
                        className="input"
                        placeholder={labels.avatarUrlPlaceholder}
                        value={profileDraft.avatar}
                        onChange={(event) =>
                          setProfileDraft((current) => ({
                            ...current,
                            avatar: event.target.value,
                          }))
                        }
                      />
                      <div className="btn-row">
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={profileSaveLoading}
                          onClick={() => onProfileSave?.(player.id, profileDraft)}
                        >
                          {profileSaveLoading
                            ? labels.savingProfile
                            : labels.saveProfile}
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          disabled={profileSaveLoading}
                          onClick={() => {
                            resetProfileDraft();
                            setIsEditingProfile(false);
                          }}
                        >
                          {labels.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        resetProfileDraft();
                        setIsEditingProfile(true);
                      }}
                    >
                      {labels.editProfile}
                    </button>
                  )}
                  {profileSaveError ? (
                    <div className="admin-error">{profileSaveError}</div>
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
