import { Player, Team } from "../types";
import { Lang, t } from "../utils/translations";

type Props = {
  player: Player | null;
  teams: Team[];
  lang?: Lang;
};

export default function PlayerProfile({ player, teams, lang = "en" }: Props) {
  const text = t[lang] || t.en;
  const playerText = text.playersPage;

  if (!player) {
    return <div className="card">{playerText.profile}</div>;
  }

  const teamName = teams.find((team) => team.id === player.teamId)?.name || "—";

  return (
    <div className="card player-profile">
      <h2 className="player-profile-name">{player.nickname}</h2>

      <div className="player-profile-meta">
        <div className="player-profile-line">
          <span className="player-profile-label">{playerText.team}:</span>
          <span className="player-profile-team">{teamName}</span>
        </div>

        <div className="player-profile-line">
          <span className="player-profile-label">{playerText.games}:</span>
          {player.games.length > 0 ? (
            <span>{player.games.join(", ")}</span>
          ) : (
            <span className="player-profile-empty">{playerText.noGames}</span>
          )}
        </div>
      </div>

      <div className="player-stats">
        <div className="player-stat">
          <span className="player-stat-label">{playerText.elo}</span>
          <span className="player-stat-value">{player.elo}</span>
        </div>

        <div className="player-stat">
          <span className="player-stat-label">{playerText.wins}</span>
          <span className="player-stat-value">{player.wins}</span>
        </div>

        <div className="player-stat">
          <span className="player-stat-label">{playerText.earnings}</span>
          <span className="player-stat-value">{player.earnings} ₴</span>
        </div>
      </div>
    </div>
  );
}
