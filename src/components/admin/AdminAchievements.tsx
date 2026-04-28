import { Dispatch, SetStateAction } from "react";
import { Achievement, Player } from "../../types";

type ConfirmDeleteState = {
  open: boolean;
  type: "player" | "team" | "tournament" | "match" | "achievement" | null;
  achievementId?: number;
};

type Props = {
  adminText: Record<string, string>;
  setConfirmDelete: Dispatch<SetStateAction<ConfirmDeleteState>>;
  isAdminActionLoading: (key: string) => boolean;
  players: Player[];
  achievements: Achievement[];
  selectedAchievementId: number;
  setSelectedAchievementId: (id: number) => void;
  saveAchievement: (
    id: number,
    updates: Partial<Achievement>
  ) => void | Promise<void>;
  addAchievement: () => void | Promise<void>;
  deleteAchievement: (id: number) => void | Promise<void>;
  safeAchievementPlayerIds: (achievement: Achievement) => number[];
  toggleAchievementPlayer: (achievement: Achievement, playerId: number) => void;
  selectedAchievement: Achievement | null;
};

export default function AdminAchievements(props: Props) {
  const {
    adminText,
    setConfirmDelete,
    isAdminActionLoading,
    players,
    achievements,
    selectedAchievementId,
    setSelectedAchievementId,
    saveAchievement,
    addAchievement,
    deleteAchievement,
    safeAchievementPlayerIds,
    toggleAchievementPlayer,
    selectedAchievement,
  } = props;

  return (
<>
      <div id="admin-section-achievements" className="panel">
        <h2 className="panel-title">{adminText.achievements}</h2>

        <div className="list-col admin-scroll-list">
          <button
            className="secondary-btn add-list-btn admin-create-btn"
            disabled={isAdminActionLoading("create-achievement")}
            onClick={addAchievement}
          >
            {isAdminActionLoading("create-achievement")
              ? "Creating..."
              : adminText.addAchievement}
          </button>

          {achievements.map((achievement: Achievement) => (
            <button
              key={achievement.id}
              type="button"
              onClick={() => setSelectedAchievementId(achievement.id)}
              className={`admin-list-btn ${
                selectedAchievementId === achievement.id
                  ? "admin-list-btn-active"
                  : ""
              }`}
            >
              {achievement.title || adminText.achievementFallback}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">{adminText.editAchievements}</h2>

        <div className="list-col admin-scroll-list">
          {selectedAchievement ? (
            <div key={selectedAchievement.id} className="simple-card">
              <div className="form-col">
<button
  className="danger-btn delete-achievement-btn-top"
  onClick={() =>
    setConfirmDelete({
      open: true,
      type: "achievement",
      achievementId: selectedAchievement.id,
    })
  }
>
  {adminText.deleteAchievement}
</button>

                <input
                  className="input"
                  value={selectedAchievement.title}
                  onChange={(e) =>
                    saveAchievement(selectedAchievement.id, {
                      title: e.target.value,
                    })
                  }
                  placeholder={adminText.achievementTitlePlaceholder}
                />

                <textarea
                  className="input textarea"
                  value={selectedAchievement.description}
                  onChange={(e) =>
                    saveAchievement(selectedAchievement.id, {
                      description: e.target.value,
                    })
                  }
                  placeholder={adminText.achievementDescriptionPlaceholder}
                />

                <input
                  className="input"
                  type="text"
                  placeholder={adminText.imageUrlPlaceholder}
                  value={selectedAchievement.image || ""}
                  onChange={(e) =>
                    saveAchievement(selectedAchievement.id, {
                      image: e.target.value,
                    })
                  }
                />

                {selectedAchievement.image ? (
                  <img
                    src={selectedAchievement.image}
                    alt={adminText.achievementPreviewAlt}
                    style={{
                      marginTop: 10,
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                ) : null}

                <div className="picker-grid compact-grid achievement-player-picker">
                  {players.map((player: Player) => {
                    const isSelected = safeAchievementPlayerIds(
                      selectedAchievement
                    ).includes(player.id);

                    return (
                      <button
                        key={`${selectedAchievement.id}-${player.id}`}
                        type="button"
                        className={`picker-btn compact ${
                          isSelected ? "picker-btn-active" : ""
                        }`}
                        onClick={() =>
                          toggleAchievementPlayer(
                            selectedAchievement,
                            player.id
                          )
                        }
                      >
                        <span>{player.nickname}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="simple-card">
              <div className="form-col">
                <div className="muted">{adminText.noAchievementSelected}</div>
              </div>
            </div>
          )}
        </div>
      </div>
</>
  );
}
