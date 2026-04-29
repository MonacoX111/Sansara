import { useMemo } from "react";
import { Player, Team, Tournament, Match, TabKey } from "../types";
import { Lang, t } from "../utils/translations";
import {
  getBiggestUpset,
  getFeaturedMatch,
  getHotPlayer,
  getRivalry,
} from "../domain/highlights/smartHighlights";

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
  const biggestUpset = useMemo(
    () => getBiggestUpset({ matches, players, teams, tournaments }),
    [matches, players, teams, tournaments]
  );
  const hotPlayer = useMemo(
    () => getHotPlayer({ matches, players, tournaments }),
    [matches, players, tournaments]
  );
  const featuredMatch = useMemo(
    () => getFeaturedMatch({ matches, players, teams, tournaments }),
    [matches, players, teams, tournaments]
  );
  const rivalry = useMemo(
    () => getRivalry({ matches, players, teams }),
    [matches, players, teams]
  );
  const featuredMatchStage =
    featuredMatch?.match.roundLabel ||
    featuredMatch?.match.stage ||
    featuredMatch?.match.round ||
    text.common.match;
  const featuredMatchStatus = featuredMatch?.match.status || text.common.tbd;
  const getFeaturedParticipantVisual = (side: "left" | "right") => {
    if (!featuredMatch) return null;

    const match = featuredMatch.match;
    const fallbackName =
      side === "left"
        ? featuredMatch.participantAName
        : featuredMatch.participantBName;

    if (match.matchType === "team") {
      const teamId = side === "left" ? match.team1 : match.team2;
      const team = teams.find((item) => item.id === teamId);

      return {
        name: team?.name || fallbackName,
        image: team?.logo || "",
      };
    }

    const playerId = side === "left" ? match.player1 : match.player2;
    const player = players.find((item) => item.id === playerId);

    return {
      name: player?.nickname || fallbackName,
      image: player?.avatar || "",
    };
  };
  const featuredParticipantA = getFeaturedParticipantVisual("left");
  const featuredParticipantB = getFeaturedParticipantVisual("right");
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

  const getMatchWinnerName = (match: Match) => {
    if (match.matchType === "team" && match.winnerTeamId) {
      return teams.find((team) => team.id === match.winnerTeamId)?.name || "";
    }

    if (match.winnerId) {
      return players.find((player) => player.id === match.winnerId)?.nickname || "";
    }

    return "";
  };

  const getActivityStatus = (match: Match) => {
    const status = String(match.status);

    if (status === "ongoing") {
      return {
        label: text.recentActivity.live,
        tone: "live",
      };
    }

    if (status === "completed" || status === "finished") {
      return {
        label: text.recentActivity.finished,
        tone: "finished",
      };
    }

    return {
      label: text.recentActivity.upcoming,
      tone: "upcoming",
    };
  };

  const getActivityStage = (match: Match) =>
    match.roundLabel || match.stage || match.round || text.common.match;

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

        <div className="welcome-right home-hover-sync-group">
          <button
            type="button"
            className="welcome-preview-card welcome-stat-card home-hover-sync-card main"
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
              className="welcome-mini-card welcome-stat-card home-hover-sync-card"
              onMouseMove={handleGlow}
              onClick={() => setActiveTab("tournaments")}
              aria-label="Open tournaments"
            >
              <span>{text.tournaments}</span>
              <strong>{tournaments.length}</strong>
            </button>

            <button
              type="button"
              className="welcome-mini-card welcome-stat-card home-hover-sync-card"
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

        <div className="welcome-nav-grid home-hover-sync-group">
          {quickLinks.map((item) => (
            <button
              key={item.tab}
              type="button"
              className={`welcome-nav-card home-hover-sync-card ${
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

      <div className="welcome-section welcome-smart-section">
        <div className="welcome-section-head">
          <span>{text.smartHighlights}</span>
          <p className="welcome-info-label">
            {text.smartHighlightsSubtitle}
          </p>
        </div>

        <div className="welcome-smart-grid home-hover-sync-group">
          <div
            className="welcome-smart-highlight-card home-hover-sync-card"
            onMouseMove={handleGlow}
          >
            <div className="welcome-smart-highlight-main">
              <span className="welcome-smart-kicker">{text.biggestUpset}</span>
              {biggestUpset ? (
                <>
                  <strong>
                    {biggestUpset.winnerName} {text.common.vs}{" "}
                    {biggestUpset.loserName}
                  </strong>
                  <p>{text.biggestUpsetDescription}</p>
                </>
              ) : (
                <>
                  <strong>{text.noUpsetFoundYet}</strong>
                  <p>{text.biggestUpsetDescription}</p>
                </>
              )}
            </div>

            {biggestUpset ? (
              <div className="welcome-smart-highlight-meta">
                <div className="welcome-upset-diff">
                  +{biggestUpset.eloDifference}
                  <span>{text.eloDifference}</span>
                </div>
                <div className="welcome-upset-details">
                  <span>
                    {text.winner}: {biggestUpset.winnerName}
                  </span>
                  <span>
                    {text.loser}: {biggestUpset.loserName}
                  </span>
                  <small>
                    {text.tournament}:{" "}
                    {biggestUpset.tournamentName ||
                      text.generalPage.noTournament}
                  </small>
                  <small>
                    {text.score}: {biggestUpset.score || text.noScore}
                  </small>
                </div>
              </div>
            ) : (
              <div className="welcome-smart-highlight-meta">
                <div className="welcome-upset-diff muted-state">
                  --
                  <span>{text.eloDifference}</span>
                </div>
              </div>
            )}
          </div>

          <div
            className="welcome-smart-highlight-card welcome-smart-highlight-card-fire home-hover-sync-card"
            onMouseMove={handleGlow}
          >
            <div className="welcome-smart-highlight-main">
              <span className="welcome-smart-kicker">{text.playerOnFire}</span>
              {hotPlayer ? (
                <>
                  <strong>{hotPlayer.player.nickname}</strong>
                  <p>{text.playerOnFireDescription}</p>
                </>
              ) : (
                <>
                  <strong>{text.noHotPlayerYet}</strong>
                  <p>{text.playerOnFireDescription}</p>
                </>
              )}
            </div>

            {hotPlayer ? (
              <div className="welcome-smart-highlight-meta">
                <div className="welcome-upset-diff welcome-fire-streak">
                  {hotPlayer.streakCount}
                  <span>{text.winStreak}</span>
                </div>
                <div className="welcome-upset-details">
                  <span>
                    {hotPlayer.streakCount} {text.winsInARow}
                  </span>
                  <small>
                    {text.tournament}:{" "}
                    {hotPlayer.tournamentName || text.generalPage.noTournament}
                  </small>
                </div>
              </div>
            ) : (
              <div className="welcome-smart-highlight-meta">
                <div className="welcome-upset-diff muted-state">
                  --
                  <span>{text.winStreak}</span>
                </div>
              </div>
            )}
          </div>

          <div
            className="welcome-smart-highlight-card smart-highlight-card--featured home-hover-sync-card"
            onMouseMove={handleGlow}
          >
            <div className="featured-left">
              <div className="welcome-smart-highlight-main">
                <span className="welcome-smart-kicker">
                  {text.highlights.featuredMatch}
                </span>
                {featuredMatch ? (
                  <>
                    <strong>
                      {featuredMatch.participantAName} {text.common.vs}{" "}
                      {featuredMatch.participantBName}
                    </strong>
                    <span className="welcome-featured-match-subinfo">
                      {featuredMatchStage} -{" "}
                      {featuredMatch.tournamentName ||
                        text.generalPage.noTournament}
                    </span>
                    <p>{text.highlights.featuredMatchDesc}</p>
                  </>
                ) : (
                  <>
                    <strong>{text.highlights.noFeaturedMatch}</strong>
                    <p>{text.highlights.featuredMatchDesc}</p>
                  </>
                )}
              </div>

              {featuredMatch && featuredParticipantA && featuredParticipantB ? (
                <div className="featured-vs">
                  <div className="featured-player">
                    {featuredParticipantA.image ? (
                      <img
                        src={featuredParticipantA.image}
                        alt={featuredParticipantA.name}
                      />
                    ) : (
                      <div className="featured-player-placeholder">
                        {featuredParticipantA.name.charAt(0)}
                      </div>
                    )}
                    <span>{featuredParticipantA.name}</span>
                  </div>

                  <div className="featured-vs-text">
                    {text.tournamentsPage.vs}
                  </div>

                  <div className="featured-player">
                    {featuredParticipantB.image ? (
                      <img
                        src={featuredParticipantB.image}
                        alt={featuredParticipantB.name}
                      />
                    ) : (
                      <div className="featured-player-placeholder">
                        {featuredParticipantB.name.charAt(0)}
                      </div>
                    )}
                    <span>{featuredParticipantB.name}</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="featured-right">
              {featuredMatch ? (
                <div className="featured-right-inner">
                  <div className="welcome-upset-diff welcome-featured-score">
                    {featuredMatch.score || "--"}
                    <span>{text.highlights.score}</span>
                  </div>
                  <div className="featured-divider" />
                  <div className="welcome-upset-details welcome-featured-details featured-meta">
                    {featuredMatch.winnerName ? (
                      <span>
                        {text.highlights.winner}: {featuredMatch.winnerName}
                      </span>
                    ) : null}
                    <small>
                      {text.admin.stage}: {featuredMatchStage}
                    </small>
                    <small>
                      {text.playersPage.status}: {featuredMatchStatus}
                    </small>
                    <small>
                      {text.highlights.tournament}:{" "}
                      {featuredMatch.tournamentName ||
                        text.generalPage.noTournament}
                    </small>
                  </div>
                </div>
              ) : (
                <div className="featured-right-inner">
                  <div className="welcome-upset-diff muted-state">
                    --
                    <span>{text.highlights.score}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className="welcome-smart-highlight-card home-hover-sync-card"
            onMouseMove={handleGlow}
          >
            <div className="welcome-smart-highlight-main">
              <span className="welcome-smart-kicker">
                {text.highlights.rivalry}
              </span>
              {rivalry ? (
                <>
                  <strong>
                    {rivalry.participantA.name} {text.common.vs}{" "}
                    {rivalry.participantB.name}
                  </strong>
                  <p>{text.highlights.rivalryDesc}</p>
                </>
              ) : (
                <>
                  <strong>{text.highlights.noRivalry}</strong>
                  <p>{text.highlights.rivalryDesc}</p>
                </>
              )}
            </div>

            {rivalry ? (
              <div className="welcome-smart-highlight-meta">
                <div className="welcome-upset-diff">
                  {rivalry.totalMatches}
                  <span>{text.highlights.matches}</span>
                </div>
                <div className="welcome-upset-details">
                  <span>
                    {text.highlights.series}: {rivalry.winsA}-
                    {rivalry.winsB}
                  </span>
                  <small>
                    {text.highlights.tournament}:{" "}
                    {tournaments.find(
                      (tournament) =>
                        tournament.id === rivalry.lastMatch.tournamentId
                    )?.title || text.generalPage.noTournament}
                  </small>
                </div>
              </div>
            ) : (
              <div className="welcome-smart-highlight-meta">
                <div className="welcome-upset-diff muted-state">
                  --
                  <span>{text.highlights.matches}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="welcome-section welcome-activity-section">
        <div className="welcome-section-head">
          <span>{text.recentActivity.title}</span>
          <p className="welcome-info-label">{text.recentActivitySubtitle}</p>
        </div>

        {recentMatches.length === 0 ? (
          <div className="welcome-empty">{text.recentActivity.noRecentMatches}</div>
        ) : (
          <div className="recent-activity-wrapper">
            <div className="recent-activity-line" />
            <div className="welcome-activity-list home-hover-sync-group">
            {recentMatches.map((match, index) => {
              const tournament = tournaments.find(
                (item) => item.id === match.tournamentId
              );
              const leftName = getMatchSide(match, "left");
              const rightName = getMatchSide(match, "right");
              const winnerName = getMatchWinnerName(match);
              const activityStatus = getActivityStatus(match);
              const activityStage = getActivityStage(match);

              return (
                <div
                  key={match.id}
                  className={[
                    "welcome-activity-row",
                    "recent-match-card",
                    "home-hover-sync-card",
                    index === 0 ? "recent-match-card--primary" : "",
                    index % 2 === 0
                      ? "recent-match-card--left"
                      : "recent-match-card--right",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseMove={handleGlow}
                >
                  <div className="recent-dot" />
                  <div className="welcome-activity-main">
                    <div className="welcome-activity-topline">
                      <span
                        className={`welcome-activity-status welcome-activity-status-${activityStatus.tone}`}
                      >
                        {activityStatus.label}
                      </span>
                      <span className="welcome-activity-context">
                        {tournament?.title || text.generalPage.noTournament}
                        <small>
                          {text.recentActivity.stage}: {activityStage}
                        </small>
                      </span>
                    </div>
                    <strong>
                      {leftName} {text.common.vs} {rightName}
                    </strong>
                    {winnerName ? (
                      <p className="welcome-activity-winner">
                        {text.recentActivity.winner}:{" "}
                        <span className="winner">{winnerName}</span>
                      </p>
                    ) : null}
                  </div>

                  <div className="welcome-activity-meta">
                    <div className="welcome-score-badge">
                      <span>{match.score || "—"}</span>
                    </div>
                    <small>{text.recentActivity.score}</small>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      <div className="welcome-feature-grid home-hover-sync-group">
        <div
          className="welcome-feature-card home-hover-sync-card"
          onMouseMove={handleGlow}
        >
          <span>01</span>
          <strong>{text.f1}</strong>
          <p>{text.f1d}</p>
        </div>

        <div
          className="welcome-feature-card home-hover-sync-card"
          onMouseMove={handleGlow}
        >
          <span>02</span>
          <strong>{text.f2}</strong>
          <p>{text.f2d}</p>
        </div>

        <div
          className="welcome-feature-card home-hover-sync-card"
          onMouseMove={handleGlow}
        >
          <span>03</span>
          <strong>{text.f3}</strong>
          <p>{text.f3d}</p>
        </div>

        <div
          className="welcome-feature-card home-hover-sync-card"
          onMouseMove={handleGlow}
        >
          <span>04</span>
          <strong>{text.f4}</strong>
          <p>{text.f4d}</p>
        </div>
      </div>
    </section>
  );
}
