import { Player, Team, Tournament, Match, TabKey } from "../types";
import { Lang, t } from "../utils/translations";

type Props = {
  players: Player[];
  teams: Team[];
  tournaments: Tournament[];
  matches: Match[];
  setActiveTab: (tab: TabKey) => void;
  lang: Lang;
};

export default function HomeTab({
  players,
  teams,
  tournaments,
  matches,
  setActiveTab,
  lang,
}: Props) {
  const text = t[lang || "en"] || t.en;

  const handleGlow = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  const topElo =
    players.length > 0 ? Math.max(...players.map((p) => p.elo || 0)) : 0;

  return (
    <section className="welcome-page">
      <div className="welcome-hero" onMouseMove={handleGlow}>
        <div className="welcome-noise" />

        <div className="welcome-left">
          <p className="welcome-kicker">{text.heroKicker}</p>
          <h1 className="welcome-title">{text.heroTitle}</h1>
          <p className="welcome-subtitle">{text.heroSubtitle}</p>

          <div className="welcome-actions">
            <button
              className="primary-btn"
              onClick={() => setActiveTab("tournaments")}
            >
              {text.explore}
            </button>

            <button
              className="secondary-btn"
              onClick={() => setActiveTab("leaderboard")}
            >
              {text.leaderboard}
            </button>
          </div>
        </div>

        <div className="welcome-right">
          <div className="welcome-preview-card main">
            <span>{text.platform}</span>
            <strong>{players.length}</strong>
            <p>
              {teams.length} {text.teamsLabel} · {matches.length}{" "}
              {text.matchesLabel}
            </p>
          </div>

          <div className="welcome-preview-grid">
            <div className="welcome-mini-card">
              <span>{text.tournaments}</span>
              <strong>{tournaments.length}</strong>
            </div>

            <div className="welcome-mini-card">
              <span>{text.topElo}</span>
              <strong>{topElo}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="welcome-feature-grid">
        <div className="welcome-feature-card">
          <span>01</span>
          <strong>{text.f1}</strong>
          <p>{text.f1d}</p>
        </div>

        <div className="welcome-feature-card">
          <span>02</span>
          <strong>{text.f2}</strong>
          <p>{text.f2d}</p>
        </div>

        <div className="welcome-feature-card">
          <span>03</span>
          <strong>{text.f3}</strong>
          <p>{text.f3d}</p>
        </div>

        <div className="welcome-feature-card">
          <span>04</span>
          <strong>{text.f4}</strong>
          <p>{text.f4d}</p>
        </div>
      </div>
    </section>
  );
}
