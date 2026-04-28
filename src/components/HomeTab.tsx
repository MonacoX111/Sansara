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

  const handleGlow = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  const topElo =
    players.length > 0 ? Math.max(...players.map((p) => p.elo || 0)) : 0;
  const recentMatches = [...matches]
    .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id))
    .slice(0, 5);

  const getMatchSide = (match: Match, side: "left" | "right") => {
    const isTeamMatch = match.matchType === "team";
    const id = isTeamMatch
      ? side === "left"
        ? match.team1
        : match.team2
      : side === "left"
      ? match.player1
      : match.player2;

    const entity = isTeamMatch
      ? teams.find((team) => team.id === id)
      : players.find((player) => player.id === id);

    if (!entity) {
      return isTeamMatch
        ? side === "left"
          ? text.generalPage.team1
          : text.generalPage.team2
        : side === "left"
        ? text.generalPage.player1
        : text.generalPage.player2;
    }

    return "name" in entity ? entity.name : entity.nickname;
  };

  const quickLinks: {
    tab: TabKey;
    label: string;
    description: string;
    count: number;
    accent: string;
    tone: string;
  }[] = [
    {
      tab: "players",
      label: text.nav.players,
      description: text.quickPlayersDescription,
      count: players.length,
      accent: "01",
      tone: "players",
    },
    {
      tab: "teams",
      label: text.nav.teams,
      description: text.quickTeamsDescription,
      count: teams.length,
      accent: "02",
      tone: "teams",
    },
    {
      tab: "tournaments",
      label: text.nav.tournaments,
      description: text.quickTournamentsDescription,
      count: tournaments.length,
      accent: "03",
      tone: "tournaments",
    },
    {
      tab: "leaderboard",
      label: text.nav.leaderboard,
      description: text.quickLeaderboardDescription,
      count: topElo,
      accent: "04",
      tone: "leaderboard",
    },
  ];

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
              {text.viewTopPlayers}
            </button>
          </div>
        </div>

        <div className="welcome-right">
          <button
            type="button"
            className="welcome-preview-card welcome-stat-card main"
            onMouseMove={handleGlow}
            onClick={() => setActiveTab("players")}
            aria-label="Open players"
          >
            <span>{text.platform}</span>
            <strong>
              {players.length} {text.platformPlayers}
            </strong>
            <p>
              {teams.length} {text.teamsLabel} · {tournaments.length}{" "}
              {text.tournamentsLabel}
            </p>
          </button>

          <div className="welcome-preview-grid">
            <button
              type="button"
              className="welcome-mini-card welcome-stat-card"
              onMouseMove={handleGlow}
              onClick={() => setActiveTab("tournaments")}
              aria-label="Open tournaments"
            >
              <span>{text.tournaments}</span>
              <strong>{tournaments.length}</strong>
            </button>

            <button
              type="button"
              className="welcome-mini-card welcome-stat-card"
              onMouseMove={handleGlow}
              onClick={() => setActiveTab("leaderboard")}
              aria-label="Open leaderboard"
            >
              <span>{text.topElo}</span>
              <strong>{topElo}</strong>
            </button>
          </div>
        </div>
      </div>

      <div className="welcome-section">
        <div className="welcome-section-head">
          <span>{text.quickNavigation}</span>
          <p className="welcome-info-label">{text.quickNavigationSubtitle}</p>
        </div>

        <div className="welcome-nav-grid">
          {quickLinks.map((item) => (
            <button
              key={item.tab}
              type="button"
              className={`welcome-nav-card ${
                item.tab === "tournaments" ? "welcome-nav-card-primary" : ""
              } welcome-nav-card-${item.tone}`}
              onMouseMove={handleGlow}
              onClick={() => setActiveTab(item.tab)}
            >
              <div className="welcome-nav-card-top">
                <span>{item.label}</span>
                <small>{item.accent}</small>
              </div>

              <div className="welcome-nav-card-main">
                <strong>{item.count}</strong>
                <i aria-hidden="true">→</i>
              </div>

              <p>{item.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="welcome-section welcome-activity-section">
        <div className="welcome-section-head">
          <span>{text.recentActivity}</span>
          <p className="welcome-info-label">{text.recentActivitySubtitle}</p>
        </div>

        {recentMatches.length === 0 ? (
          <div className="welcome-empty">{text.noRecentActivity}</div>
        ) : (
          <div className="welcome-activity-list">
            {recentMatches.map((match) => {
              const tournament = tournaments.find(
                (item) => item.id === match.tournamentId
              );
              const leftName = getMatchSide(match, "left");
              const rightName = getMatchSide(match, "right");

              return (
                <div
                  key={match.id}
                  className="welcome-activity-row"
                  onMouseMove={handleGlow}
                >
                  <div className="welcome-activity-main">
                    <span className="welcome-activity-status">
                      {match.status}
                    </span>
                    <strong>
                      {leftName} {text.common.vs} {rightName}
                    </strong>
                    <p>
                      {tournament?.title || text.generalPage.noTournament}
                      <span>{match.date || text.common.tbd}</span>
                    </p>
                  </div>

                  <div className="welcome-activity-meta">
                    <div className="welcome-score-badge">
                      <span>{match.score || "—"}</span>
                    </div>
                    <small>{match.round || text.common.match}</small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="welcome-feature-grid">
        <div className="welcome-feature-card" onMouseMove={handleGlow}>
          <span>01</span>
          <strong>{text.f1}</strong>
          <p>{text.f1d}</p>
        </div>

        <div className="welcome-feature-card" onMouseMove={handleGlow}>
          <span>02</span>
          <strong>{text.f2}</strong>
          <p>{text.f2d}</p>
        </div>

        <div className="welcome-feature-card" onMouseMove={handleGlow}>
          <span>03</span>
          <strong>{text.f3}</strong>
          <p>{text.f3d}</p>
        </div>

        <div className="welcome-feature-card" onMouseMove={handleGlow}>
          <span>04</span>
          <strong>{text.f4}</strong>
          <p>{text.f4d}</p>
        </div>
      </div>
    </section>
  );
}
