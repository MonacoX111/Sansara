import type { MouseEvent } from "react";
import { HomeAnnouncement, Match, Player, TabKey, Team, Tournament } from "../types";
import { Lang, t } from "../utils/translations";
import ChampionCard from "./general/ChampionCard";
import FeaturedBanner from "./general/FeaturedBanner";
import RecentResults from "./general/RecentResults";
import TopPlayers from "./general/TopPlayers";
import UpcomingMatches from "./general/UpcomingMatches";

type Props = {
  homeAnnouncement: HomeAnnouncement;
  players: Player[];
  teams: Team[];
  tournaments: Tournament[];
  matches: Match[];
  setSelectedTournamentId: (id: number) => void;
  setActiveTab: (tab: TabKey) => void;
  lang: Lang;
  handleGlow: (e: MouseEvent<HTMLElement>) => void;
};

export default function GeneralTab({
  homeAnnouncement,
  players,
  teams,
  tournaments,
  matches,
  setSelectedTournamentId,
  setActiveTab,
  lang,
  handleGlow,
}: Props) {
  const generalText = (t[lang] || t.en).generalPage;

  return (
    <section className="home-announcement-page">
      {!homeAnnouncement.isVisible ? (
        <div className="panel">
          <h2 className="panel-title">
            {generalText.homeAnnouncementHidden}
          </h2>
          <p className="muted">
            {generalText.homeAnnouncementHiddenDescription}
          </p>
        </div>
      ) : (
        <>
          <FeaturedBanner
            homeAnnouncement={homeAnnouncement}
            setSelectedTournamentId={setSelectedTournamentId}
            setActiveTab={setActiveTab}
            lang={lang}
            handleGlow={handleGlow}
          />

          <div className="home-grid">
            <ChampionCard
              tournaments={tournaments}
              players={players}
              teams={teams}
              matches={matches}
              lang={lang}
              handleGlow={handleGlow}
            />

            <RecentResults
              matches={matches}
              tournaments={tournaments}
              players={players}
              teams={teams}
              lang={lang}
              handleGlow={handleGlow}
            />

            <UpcomingMatches
              matches={matches}
              players={players}
              teams={teams}
              lang={lang}
              handleGlow={handleGlow}
            />

            <TopPlayers players={players} lang={lang} handleGlow={handleGlow} />
          </div>
        </>
      )}
    </section>
  );
}
