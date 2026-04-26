import type { CSSProperties, MouseEvent } from "react";
import { Player } from "../../types";
import { Lang, t } from "../../utils/translations";

type Props = {
  players: Player[];
  lang: Lang;
  handleGlow: (e: MouseEvent<HTMLElement>) => void;
};

export default function TopPlayers({ players, lang, handleGlow }: Props) {
  const generalText = (t[lang] || t.en).generalPage;

  return (
    <div className="panel home-panel">
      <h2 className="panel-title">{generalText.topPlayers}</h2>

      <div className="list-col">
        {[...players]
          .sort((a, b) => b.elo - a.elo)
          .slice(0, 5)
          .map((player, index) => (
            <div
              key={player.id}
              className={`player-row new ${index < 3 ? "top-player" : ""}`}
              style={{ "--i": index } as CSSProperties}
              onMouseMove={handleGlow}
            >
              <div className="player-left">
                <div className="rank-box-small">#{index + 1}</div>

                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.nickname}
                    className="top-player-avatar"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {player.nickname.charAt(0)}
                  </div>
                )}

                <div className="player-name">{player.nickname}</div>
              </div>

              <div className="elo-box">{player.elo}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
