import { Dispatch, SetStateAction, useEffect, useState } from "react";
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
  runAdminAction: (
    key: string,
    action: () => void | Promise<void>
  ) => Promise<void>;
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
  selectedAchievement: Achievement | null;
};

type AchievementFormState = {
  title: string;
  description: string;
  image: string;
  playerIds: number[];
};

const createEmptyAchievementForm = (): AchievementFormState => ({
  title: "",
  description: "",
  image: "",
  playerIds: [],
});

const buildAchievementForm = (
  achievement: Achievement | null,
  safePlayerIds: (achievement: Achievement) => number[]
): AchievementFormState =>
  achievement
    ? {
        title: achievement.title || "",
        description: achievement.description || "",
        image: achievement.image || "",
        playerIds: safePlayerIds(achievement),
      }
    : createEmptyAchievementForm();

export default function AdminAchievements(props: Props) {
  const {
    adminText,
    setConfirmDelete,
    isAdminActionLoading,
    runAdminAction,
    players,
    achievements,
    selectedAchievementId,
    setSelectedAchievementId,
    saveAchievement,
    addAchievement,
    deleteAchievement,
    safeAchievementPlayerIds,
    selectedAchievement,
  } = props;

  const [achievementForm, setAchievementForm] = useState<AchievementFormState>(
    () => buildAchievementForm(selectedAchievement, safeAchievementPlayerIds)
  );

  useEffect(() => {
    setAchievementForm(
      buildAchievementForm(selectedAchievement, safeAchievementPlayerIds)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAchievement?.id]);

  const saveAchievementKey = selectedAchievement
    ? `save-achievement-${selectedAchievement.id}`
    : "save-achievement";
  const isSavingAchievement = isAdminActionLoading(saveAchievementKey);

  const togglePlayerInForm = (playerId: number) => {
    setAchievementForm((prev) => {
      const exists = prev.playerIds.includes(playerId);
      return {
        ...prev,
        playerIds: exists
          ? prev.playerIds.filter((id) => id !== playerId)
          : [...prev.playerIds, playerId],
      };
    });
  };

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
                  value={achievementForm.title}
                  onChange={(e) =>
                    setAchievementForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder={adminText.achievementTitlePlaceholder}
                />

                <textarea
                  className="input textarea"
                  value={achievementForm.description}
                  onChange={(e) =>
                    setAchievementForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder={adminText.achievementDescriptionPlaceholder}
                />

                <input
                  className="input"
                  type="text"
                  placeholder={adminText.imageUrlPlaceholder}
                  value={achievementForm.image}
                  onChange={(e) =>
                    setAchievementForm((prev) => ({
                      ...prev,
                      image: e.target.value,
                    }))
                  }
                />

                {achievementForm.image ? (
                  <img
                    src={achievementForm.image}
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
                    const isSelected = achievementForm.playerIds.includes(
                      player.id
                    );

                    return (
                      <button
                        key={`${selectedAchievement.id}-${player.id}`}
                        type="button"
                        className={`picker-btn compact ${
                          isSelected ? "picker-btn-active" : ""
                        }`}
                        onClick={() => togglePlayerInForm(player.id)}
                      >
                        <span>{player.nickname}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  className="primary-btn"
                  disabled={isSavingAchievement}
                  onClick={() =>
                    runAdminAction(saveAchievementKey, async () => {
                      await saveAchievement(selectedAchievement.id, {
                        title: achievementForm.title,
                        description: achievementForm.description,
                        image: achievementForm.image,
                        playerIds: achievementForm.playerIds,
                      });
                    })
                  }
                >
                  {isSavingAchievement ? "Saving..." : adminText.save || "Save"}
                </button>
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
