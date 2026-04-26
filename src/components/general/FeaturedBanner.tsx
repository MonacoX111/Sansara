import type { MouseEvent } from "react";
import { HomeAnnouncement, TabKey } from "../../types";
import { Lang, t } from "../../utils/translations";

type Props = {
  homeAnnouncement: HomeAnnouncement;
  setSelectedTournamentId: (id: number) => void;
  setActiveTab: (tab: TabKey) => void;
  lang: Lang;
  handleGlow: (e: MouseEvent<HTMLElement>) => void;
};

export default function FeaturedBanner({
  homeAnnouncement,
  setSelectedTournamentId,
  setActiveTab,
  lang,
  handleGlow,
}: Props) {
  const generalText = (t[lang] || t.en).generalPage;

  return (
    <div
      className="home-featured-banner"
      onMouseMove={handleGlow}
      style={{
        backgroundImage: homeAnnouncement.imageUrl
          ? `linear-gradient(90deg, rgba(5, 7, 14, 0.92) 0%, rgba(5, 7, 14, 0.72) 38%, rgba(5, 7, 14, 0.44) 62%, rgba(5, 7, 14, 0.88) 100%), url(${homeAnnouncement.imageUrl})`
          : "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(76,29,149,0.9) 45%, rgba(190,24,93,0.82) 100%)",
      }}
    >
      <div className="home-featured-overlay">
        <div className="home-featured-content">
          <p className="home-featured-kicker">{generalText.nextTournament}</p>
          <h2 className="home-featured-title">
            {homeAnnouncement.title || generalText.tournamentAnnouncement}
          </h2>

          {homeAnnouncement.subtitle ? (
            <p className="home-featured-subtitle">
              {homeAnnouncement.subtitle}
            </p>
          ) : null}

          <div className="home-featured-meta">
            {homeAnnouncement.date ? (
              <span className="home-meta-pill">
                {generalText.date}: {homeAnnouncement.date}
              </span>
            ) : null}
            {homeAnnouncement.format ? (
              <span className="home-meta-pill">
                {generalText.format}: {homeAnnouncement.format}
              </span>
            ) : null}
            {homeAnnouncement.status ? (
              <span className="home-meta-pill">
                {generalText.status}: {homeAnnouncement.status}
              </span>
            ) : null}
            {homeAnnouncement.prize ? (
              <span className="home-meta-pill">
                {generalText.prize}: {homeAnnouncement.prize}
              </span>
            ) : null}
            {homeAnnouncement.participantCount > 0 ? (
              <span className="home-meta-pill">
                {generalText.players}: {homeAnnouncement.participantCount}
              </span>
            ) : null}
          </div>

          {homeAnnouncement.description ? (
            <p className="home-featured-description">
              {homeAnnouncement.description}
            </p>
          ) : null}

          {homeAnnouncement.tournamentId ? (
            <div className="btn-row">
              <button
                className="primary-btn"
                onClick={() => {
                  setSelectedTournamentId(Number(homeAnnouncement.tournamentId));
                  setActiveTab("tournaments");
                }}
              >
                {generalText.openTournament}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
