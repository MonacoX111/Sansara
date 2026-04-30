import { MouseEvent } from "react";
import { Achievement } from "../../types";

type Props = {
  achievements: Achievement[];
  title: string;
  emptyText: string;
};

export default function PlayerAchievements({
  achievements,
  title,
  emptyText,
}: Props) {
  const handleCardMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  return (
    <div className="section-block">
      <h4>{title}</h4>
      {achievements.length === 0 ? (
        <div className="player-achievement-empty">{emptyText}</div>
      ) : (
        <div className="player-achievement-grid">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="player-achievement-card"
              onMouseMove={handleCardMove}
            >
              <img
                src={achievement.image}
                alt={achievement.title}
                className="player-achievement-icon"
              />
              <div className="player-achievement-content">
                <div className="player-achievement-title">
                  {achievement.title}
                </div>
                {achievement.description ? (
                  <div className="player-achievement-description">
                    {achievement.description}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
