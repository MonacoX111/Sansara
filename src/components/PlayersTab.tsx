import { useRef, useState } from "react";
import { Achievement, Match, Player, Team, Tournament } from "../types";
import {
  getPlayerMatchResult,
  getPlayerMatches,
  getPlayerParticipatedTournaments,
  getPlayerRecentMatches,
  getPlayerStreakFromVisibleForm,
  getPlayerWinRate,
} from "../domain/player/playerStats";
import {
  getPlayerAllTeamIds,
  getPlayerCurrentTeam,
  getPlayerTeamHistory,
} from "../domain/player/playerTeams";
import {
  getPlayerEloTimeline,
  getPlayerTournamentEloHistory,
} from "../domain/player/playerEloHistory";
import { BASE_ELO } from "../domain/player/playerElo";
import {
  getTournamentTeamRoster,
  isPlayerInTournamentTeamRoster,
} from "../domain/tournament/tournamentRosters";
import {
  Lang,
  formatTournamentLabel as formatStoredTournamentLabel,
  getTournamentFormatLabel,
  t,
} from "../utils/translations";
import PremiumSelect from "./ui/PremiumSelect";
import StatCard from "./StatCard";
import PlayerProfileHeader from "./player-profile/PlayerProfileHeader";
import PlayerAchievements from "./player-profile/PlayerAchievements";
import PlayerRecentMatches from "./player-profile/PlayerRecentMatches";
import PlayerTournamentHistory from "./player-profile/PlayerTournamentHistory";

type Props = {
  players: Player[];
  teams: Team[];
  matches: Match[];
  tournaments: Tournament[];
  achievements: Achievement[];
  selectedPlayerId: number;
  setSelectedPlayerId: (id: number) => void;
  search: string;
  setSearch: (value: string) => void;
  gameFilter: string;
  setGameFilter: (value: string) => void;
  teamFilter: string;
  setTeamFilter: (value: string) => void;
  sortMode: string;
  setSortMode: (value: string) => void;
  gamesList: { id: string; name: string; icon: string }[];
  onOpenTeam?: (teamId: number) => void;
  onOpenTournament?: (tournamentId: number) => void;
  profileOnly?: boolean;
  canChangeAvatar?: boolean;
  avatarSaveLoading?: boolean;
  avatarSaveError?: string;
  onAvatarSave?: (playerId: number, avatarUrl: string) => void;
  lang: Lang;
};

export default function PlayersTab({
  players,
  teams,
  matches,
  tournaments,
  achievements,
  selectedPlayerId,
  setSelectedPlayerId,
  search,
  setSearch,
  gameFilter,
  setGameFilter,
  teamFilter,
  setTeamFilter,
  sortMode,
  setSortMode,
  gamesList,
  onOpenTeam,
  onOpenTournament,
  profileOnly = false,
  canChangeAvatar = false,
  avatarSaveLoading = false,
  avatarSaveError = "",
  onAvatarSave,
  lang = "en",
}: Props) {
  const text = t[lang] || t.en;
  const playerText = text.playersPage;
  const commonText = text.common;
  const formatTournamentLabel = (format?: string) =>
    getTournamentFormatLabel(format, lang);
  const [expandedEloTournamentId, setExpandedEloTournamentId] = useState<
    number | null
  >(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  // Remembers the page scroll position of the player list right before the
  // user tapped a card on mobile, so the "Back to list" button can restore it.
  const savedScrollYRef = useRef<number | null>(null);

  // Mobile-only: scroll the profile panel into view after selecting a player.
  // Desktop behaviour (two-column side-by-side layout) is unchanged because
  // the viewport check (≤ 768px) matches the CSS breakpoint that stacks
  // the directory panel above the profile panel.
  const handleSelectPlayer = (playerId: number) => {
    setSelectedPlayerId(playerId);

    if (typeof window === "undefined") return;
    if (window.innerWidth > 768) return;

    // Remember current list scroll position so we can jump back to it later.
    savedScrollYRef.current = window.scrollY;

    // Defer to the next frame so the profile panel has rendered
    // (it is conditionally mounted when `selectedPlayer` becomes truthy).
    window.requestAnimationFrame(() => {
      profileRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // Mobile-only: restore the saved list scroll position. Does NOT touch
  // selectedPlayerId — the profile stays mounted so the user can re-open it
  // simply by scrolling back down, and state is preserved.
  const handleBackToList = () => {
    if (typeof window === "undefined") return;
    const targetY = savedScrollYRef.current ?? 0;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  const getTeamName = (teamId?: number) =>
    teams.find((t) => t.id === Number(teamId || 0))?.name || "";

  const getPlayerName = (playerId?: number) =>
    players.find((player) => player.id === Number(playerId || 0))?.nickname ||
    playerText.unknown;

  const getTeamLogo = (teamId: number) =>
    teams.find((t) => t.id === teamId)?.logo || "";

  const getPlayerAchievements = (playerId: number) =>
    achievements.filter((achievement) =>
      achievement.playerIds.includes(playerId),
    );

  const selectedPlayer =
    players.find((player) => player.id === selectedPlayerId) || null;
  const selectedPlayerCurrentTeam = selectedPlayer
    ? getPlayerCurrentTeam(selectedPlayer, teams)
    : null;
  const selectedPlayerTeamHistory = selectedPlayer
    ? getPlayerTeamHistory(selectedPlayer, teams)
    : [];
  const selectedPlayerTeamIds = selectedPlayer
    ? getPlayerAllTeamIds(selectedPlayer)
    : [];
  const selectedPlayerTeamIdSet = new Set(selectedPlayerTeamIds);

const isSelectedPlayerInTournamentTeam = (
  tournament: Tournament,
  teamId: number,
) => {
  const hasExplicitRosters =
    Array.isArray(tournament.teamRosters) &&
    tournament.teamRosters.length > 0;

  if (hasExplicitRosters) {
    return isPlayerInTournamentTeamRoster(
      tournament,
      teamId,
      selectedPlayerId,
      players,
    );
  }

  // Only fall back to team membership when no rosters exist at all
  return selectedPlayerTeamIdSet.has(Number(teamId));
};

const getSelectedPlayerTournamentTeamId = (tournament: Tournament) => {
  if (tournament.participantType !== "team") return undefined;

  const rosters = Array.isArray(tournament.teamRosters)
    ? tournament.teamRosters
    : [];

  if (rosters.length > 0) {
    // Roster-first: only match via roster
    const roster = rosters.find((item) =>
      Array.isArray(item.playerIds)
        ? item.playerIds.map(Number).includes(Number(selectedPlayerId))
        : false,
    );

    return roster ? Number(roster.teamId) : undefined;
  }

  // Only fall back when no rosters exist at all
  const participantIds = Array.isArray(tournament.participantIds)
    ? tournament.participantIds.map(Number)
    : [];

  return participantIds.find((teamId) => selectedPlayerTeamIdSet.has(teamId));
};

  const getTournamentPlacementForSelectedPlayer = (tournament: Tournament) => {
    if (!Array.isArray(tournament.placements)) return undefined;

    return tournament.placements.find(
      (item) =>
        Number(item.playerId) === Number(selectedPlayerId) ||
        (typeof item.teamId === "number" &&
          isSelectedPlayerInTournamentTeam(tournament, Number(item.teamId))),
    );
  };

  // Use the canonical single-source-of-truth function for participation
  const participatedTournamentIds = selectedPlayer
    ? new Set(
        getPlayerParticipatedTournaments(selectedPlayer, tournaments, players).map(
          (t) => t.id,
        ),
      )
    : new Set<number>();

  const isSelectedPlayerTournament = (tournament: Tournament) => {
    if (!selectedPlayer) return false;
    return participatedTournamentIds.has(tournament.id);
  };

  const compareTournamentsLatestFirst = (a: Tournament, b: Tournament) => {
    const aTime = Date.parse(a.date);
    const bTime = Date.parse(b.date);
    const dateDiff =
      (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);

    if (dateDiff !== 0) return dateDiff;
    return (a.order ?? a.id) - (b.order ?? b.id);
  };

  const playerTournaments = selectedPlayer
    ? tournaments.filter(isSelectedPlayerTournament)
    : [];

  const filteredPlayers = [...players]
    .filter((player) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        player.nickname.toLowerCase().includes(q) ||
        player.games.some((game) => game.toLowerCase().includes(q))
      );
    })
    .filter((player) =>
      gameFilter === "all" ? true : player.games.includes(gameFilter),
    )
    .filter((player) =>
      teamFilter === "all" ? true : String(player.teamId) === teamFilter,
    )
    .sort((a, b) => {
      const aFeatured = Boolean(a.isFeatured);
      const bFeatured = Boolean(b.isFeatured);

      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;

      if (sortMode === "elo") return b.elo - a.elo;
      if (sortMode === "wins") return b.wins - a.wins;
      if (sortMode === "earnings") return b.earnings - a.earnings;
      return a.nickname.localeCompare(b.nickname);
    });

const playerMatches = getPlayerMatches(matches, selectedPlayerId, players);
const playerRecentMatches = getPlayerRecentMatches({
  matches,
  players,
  tournaments,
  playerId: selectedPlayerId,
  limit: 10,
  unknownPlayerLabel: playerText.unknown,
  friendlyMatchLabel: playerText.friendlyMatch,
});
const playerRecentMatchRows = playerRecentMatches.map(
    ({ match, result, tournamentName }) => ({
      id: match.id,
      result,
      firstParticipantName:
        match.matchType === "team"
          ? getTeamName(match.team1) || playerText.unknownTeam
          : getPlayerName(match.player1),
      secondParticipantName:
        match.matchType === "team"
          ? getTeamName(match.team2) || playerText.unknownTeam
          : getPlayerName(match.player2),
      game: match.game,
      roundLabel: formatStoredTournamentLabel(match.roundLabel, lang),
      round: formatStoredTournamentLabel(match.round, lang),
      score: match.score,
      tournamentName,
    }),
  );
const playerFormResults = playerRecentMatches
  .filter((item) => item.result === "win" || item.result === "loss")
  .slice(0, 10);

const playerVisibleFormResults = [...playerFormResults].reverse();
const playerDecidedMatches = playerMatches.filter(
  (match) =>
    getPlayerMatchResult(match, selectedPlayerId, players) !== "pending"
);
  const playerWins = playerDecidedMatches.filter(
    (match) => getPlayerMatchResult(match, selectedPlayerId, players) === "win",
  ).length;
  const playerLosses = playerDecidedMatches.length - playerWins;
  const playerWinRate = getPlayerWinRate(playerMatches, selectedPlayerId, players);
const playerStreak = getPlayerStreakFromVisibleForm(playerFormResults);
  const playerAchievements = getPlayerAchievements(selectedPlayerId);
  const playerEloHistory = selectedPlayer
    ? getPlayerTournamentEloHistory(selectedPlayer, tournaments, teams, players)
    : [];
  const playerEloTimeline = selectedPlayer
    ? getPlayerEloTimeline(selectedPlayer, tournaments, teams, players)
    : [];
  const playerEloTimelineByTournament = new Map(
    playerEloTimeline.map((item) => [
      `${item.tournamentId}-${item.placement}-${item.sourceType}-${
        item.teamId || "solo"
      }`,
      item,
    ]),
  );
  const playerTournamentHistory = tournaments
    .filter(isSelectedPlayerTournament)
    .sort(compareTournamentsLatestFirst)
    .map((tournament) => {
      const placement = getTournamentPlacementForSelectedPlayer(tournament);
      const playedTeamId = getSelectedPlayerTournamentTeamId(tournament);

      return {
        ...tournament,
        place: placement?.place || "—",
        playedTeamName:
          typeof playedTeamId === "number"
            ? getTeamName(playedTeamId) || playerText.unknownTeam
            : undefined,
        eloEntries: playerEloHistory.filter(
          (item) => item.tournamentId === tournament.id,
        ),
        isWinner:
          Number(tournament.winnerId) === Number(selectedPlayerId) ||
          (typeof tournament.winnerTeamId === "number" &&
            isSelectedPlayerInTournamentTeam(
              tournament,
              Number(tournament.winnerTeamId),
            )),
        isMvp: Number(tournament.mvpId) === Number(selectedPlayerId),
      };
    })
    .filter(
      (tournament, index, items) =>
        items.findIndex((item) => item.id === tournament.id) === index,
    ) as (Tournament & {
    place: number | string;
    playedTeamName?: string;
    eloEntries: typeof playerEloHistory;
    isWinner: boolean;
    isMvp: boolean;
  })[];

  const getEloGainBadgeClass = (elo: number) => {
    if (elo >= 200) return "elo-gain-badge elo-gain-badge--major";
    if (elo >= 100) return "elo-gain-badge elo-gain-badge--medium";
    return "elo-gain-badge elo-gain-badge--small";
  };

  const getPlacementTier = (place: number | string) => {
    const numericPlace = Number(place);
    if (numericPlace === 1) return "gold";
    if (numericPlace === 2) return "silver";
    if (numericPlace === 3) return "bronze";
    return "";
  };

  const getTournamentPlacementCardClass = (place: number | string) => {
    const tier = getPlacementTier(place);
    return tier ? `player-tournament-card--${tier}` : "";
  };

  const getPlacementBadgeClass = (place: number | string) => {
    const tier = getPlacementTier(place);
    return tier ? `placement-badge--${tier}` : "";
  };

  const playerTournamentHistoryRows = playerTournamentHistory.map(
    (tournament) => {
      const placementTone = getPlacementTier(tournament.place);
      const placementCardClass = getTournamentPlacementCardClass(
        tournament.place,
      );
      const eloPills = tournament.eloEntries.map((item) => ({
        key: `${tournament.id}-${item.placement}-${item.sourceType}-${
          item.teamId || "solo"
        }`,
        label: `+${item.elo} ELO`,
        className: "player-tournament-pill player-tournament-pill-info",
      }));
      const sourcePills = tournament.eloEntries.map((item) => ({
        key: `${tournament.id}-${item.placement}-${item.sourceType}-${
          item.teamId || "solo"
        }-source`,
        label:
          item.sourceType === "player"
            ? tournament.type === "2x2"
              ? playerText.duo
              : tournament.type === "3x3"
                ? playerText.trio
                : playerText.solo
            : item.teamName || playerText.team,
        className:
          item.sourceType === "team"
            ? "player-tournament-pill player-tournament-pill-info player-tournament-pill-team"
            : "player-tournament-pill player-tournament-pill-info",
      }));
      const playedTeamPill =
        tournament.participantType === "team" &&
        tournament.playedTeamName &&
        !tournament.eloEntries.some(
          (item) =>
            item.sourceType === "team" &&
            item.teamName === tournament.playedTeamName,
        )
          ? {
              key: `${tournament.id}-played-team`,
              label: tournament.playedTeamName,
              className:
                "player-tournament-pill player-tournament-pill-info player-tournament-pill-team",
            }
          : undefined;
      const eloDetails = tournament.eloEntries.map((item) => {
        const timelineItem = playerEloTimelineByTournament.get(
          `${item.tournamentId}-${item.placement}-${item.sourceType}-${
            item.teamId || "solo"
          }`,
        );
        const totalElo =
          typeof timelineItem?.totalEloBonus === "number"
            ? BASE_ELO + timelineItem.totalEloBonus
            : null;
        const previousElo = totalElo !== null ? totalElo - item.elo : null;

        return {
          key: `${tournament.id}-${item.placement}-${item.sourceType}-${
            item.teamId || "solo"
          }-details`,
          elo: item.elo,
          sourceLabel:
            item.sourceType === "team"
              ? playerText.teamPlacement
              : playerText.soloPlacement,
          teamName: item.teamName,
          placement: item.placement,
          previousElo,
          totalElo,
        };
      });

      return {
        id: tournament.id,
        title: tournament.title,
        game: tournament.game,
        format: formatTournamentLabel(tournament.format),
        type: tournament.type,
        place: tournament.place,
        placementTone,
        placementCardClass,
        isWinner: tournament.isWinner,
        isMvp: tournament.isMvp,
        eloPills,
        sourcePills,
        playedTeamPill,
        eloDetails,
      };
    },
  );

  return (
    <>
      {!profileOnly && (
      <div className="toolbar">
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={playerText.searchPlaceholder}
        />

        <PremiumSelect
          value={gameFilter}
          placeholder={playerText.allGames}
          includePlaceholderOption={false}
          options={[
            { value: "all", label: playerText.allGames },
            ...gamesList.map((game) => ({
              value: game.name,
              label: game.name,
            })),
          ]}
          onChange={(value) => setGameFilter(String(value))}
        />

        <PremiumSelect
          value={teamFilter}
          placeholder={playerText.allTeams}
          includePlaceholderOption={false}
          options={[
            { value: "all", label: playerText.allTeams },
            ...teams.map((team) => ({
              value: String(team.id),
              label: team.name,
            })),
          ]}
          onChange={(value) => setTeamFilter(String(value))}
        />

        <PremiumSelect
          value={sortMode}
          placeholder={playerText.sortByElo}
          includePlaceholderOption={false}
          options={[
            { value: "elo", label: playerText.sortByElo },
            { value: "wins", label: playerText.sortByWins },
            { value: "earnings", label: playerText.sortByEarnings },
            { value: "name", label: playerText.sortByName },
          ]}
          onChange={(value) => setSortMode(String(value))}
        />
      </div>
      )}

      <div className="two-col">
        {!profileOnly && (
        <div className="panel">
          <h2 className="panel-title">{playerText.directory}</h2>

          <div className="player-grid home-hover-sync-group">
            {filteredPlayers.map((player) => {
              const teamName = getTeamName(player.teamId);
              const cardAchievements = getPlayerAchievements(player.id);
              const previewAchievements = cardAchievements.slice(0, 3);
              const hiddenAchievementsCount = Math.max(
                cardAchievements.length - previewAchievements.length,
                0,
              );

              return (
                <button
                  key={player.id}
                  className={`player-card player-selector-card home-hover-sync-card ${
                    selectedPlayerId === player.id ? "player-card-active" : ""
                  }`}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`,
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`,
                    );
                  }}
                  onClick={() => handleSelectPlayer(player.id)}
                >
                  <div className="player-head">
                    <img
                      src={player.avatar}
                      alt={player.nickname}
                      className="avatar"
                    />
                    <div className="player-head-info">
                      <div className="player-name-row">
                        <div className="player-name">
                          {player.nickname}{" "}
                          {player.isFeatured ? (
                            <span className="pill featured-pill player-selected-badge">
                              {playerText.featured}
                            </span>
                          ) : null}
                        </div>
                        <span className="pill light player-rank-badge">
                          #{player.rank}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="player-info-box">
                    <div className="player-info-row">
                      <span className="info-label">
                        {playerText.currentTeam}
                      </span>
                      <span className="info-value">
                        {teamName || playerText.noTeam}
                      </span>
                    </div>

                    <div className="player-info-row column">
                      <span className="info-label">{playerText.games}</span>

                      <div className="tag-row compact player-games-row">
                        {player.games.length > 0 ? (
                          player.games.map((game) => (
                            <span key={game} className="pill">
                              {game}
                            </span>
                          ))
                        ) : (
                          <span className="muted small">
                            {playerText.noGames}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="player-info-row column">
                      <span className="info-label">
                        {playerText.achievements}
                      </span>

                      {previewAchievements.length > 0 ? (
                        <div className="tag-row compact player-achievement-preview">
                          {previewAchievements.map((achievement) => (
                            <img
                              key={achievement.id}
                              src={achievement.image}
                              alt={achievement.title}
                              title={achievement.title}
                              className="achievement-img"
                            />
                          ))}

                          {hiddenAchievementsCount > 0 ? (
                            <span className="pill player-achievement-more">
                              +{hiddenAchievementsCount}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="muted small player-achievement-empty-text">
                          {playerText.noAchievements}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mini-stats player-card-stats">
                    <span className="player-stat-pill">
                      <span>{playerText.winsShort}</span>
                      <strong>{player.wins}</strong>
                    </span>
                    <span className="player-stat-pill player-stat-pill-elo">
                      <span>{playerText.elo}</span>
                      <strong>{player.elo}</strong>
                    </span>
                    <span className="player-stat-pill">
                      <span>{"\u20b4"}</span>
                      <strong>{player.earnings}</strong>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        )}

        {selectedPlayer && (
          <div className="panel" ref={profileRef}>
            <button
              type="button"
              className="players-back-to-list"
              onClick={handleBackToList}
              aria-label={playerText.backToList}
            >
              <span aria-hidden="true" className="players-back-to-list-arrow">
                ←
              </span>
              {playerText.backToList}
            </button>

            <h2 className="panel-title">{playerText.profile}</h2>

            <PlayerProfileHeader
              player={selectedPlayer}
              currentTeam={selectedPlayerCurrentTeam}
              labels={{
                elo: playerText.elo,
                rank: text.admin.rank,
                winRate: playerText.winRate,
                currentStreak: playerText.currentStreak,
                games: playerText.games,
                noGames: playerText.noGames,
                achievements: playerText.achievements,
                tournaments: playerText.tournaments,
                form: playerText.form,
                noMatchesYet: playerText.noMatchesYet,
                formWinShort: playerText.formWinShort,
                formLossShort: playerText.formLossShort,
              }}
              winRate={playerWinRate}
              streakLabel={playerStreak.label}
formResults={playerVisibleFormResults}
              achievementsCount={playerAchievements.length}
              tournamentsCount={playerTournaments.length}
              canChangeAvatar={canChangeAvatar}
              avatarSaveLoading={avatarSaveLoading}
              avatarSaveError={avatarSaveError}
              onAvatarSave={onAvatarSave}
            />

            <div className="section-block">
              <h4>{playerText.teamHistory}</h4>

              {selectedPlayerTeamHistory.length === 0 ? (
                <p className="muted">{playerText.noTeam}</p>
              ) : (
                <div className="team-history-list">
                  {selectedPlayerTeamHistory.map((item) => {
                    const teamId = Number(item.teamId);
                    const canOpenTeam = Number.isFinite(teamId) && teamId > 0;

                    return (
                      <div
                        key={item.teamId}
                        className={`team-history-card ${
                          canOpenTeam ? "team-history-click-card" : ""
                        }`}
                        role={canOpenTeam ? "button" : undefined}
                        tabIndex={canOpenTeam ? 0 : undefined}
                        aria-label={
                          canOpenTeam
                            ? `${playerText.openTeamAria} ${
                                item.team?.name || playerText.unknownTeam
                              }`
                            : undefined
                        }
                        onClick={() => {
                          if (!canOpenTeam) return;
                          onOpenTeam?.(teamId);
                        }}
                        onKeyDown={(event) => {
                          if (!canOpenTeam) return;
                          if (event.key !== "Enter" && event.key !== " ")
                            return;
                          event.preventDefault();
                          onOpenTeam?.(teamId);
                        }}
                      >
                        <div className="team-history-top">
                          <div className="team-history-main">
                            {item.team?.logo ? (
                              <img
                                src={item.team.logo}
                                alt={item.team.name}
                                className="team-history-logo"
                              />
                            ) : (
                              <div className="team-history-logo-placeholder">
                                {(
                                  item.team?.name || playerText.unknownTeam
                                ).charAt(0)}
                              </div>
                            )}
                            <div className="team-history-title">
                              {item.team?.name || playerText.unknownTeam}
                            </div>
                          </div>
                          <div className="team-history-actions">
                            {item.isCurrent ? (
                              <span className="pill green">
                                {playerText.currentTeam}
                              </span>
                            ) : null}
                            {canOpenTeam ? (
                              <span
                                className="click-card-arrow"
                                aria-hidden="true"
                              >
                                &gt;
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {item.from || item.to ? (
                          <div className="team-history-meta">
                            <span>{item.from || "-"}</span>
                            <span>{item.to || playerText.currentTeam}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="stats-grid">
              <StatCard
                title={playerText.totalMatches}
                value={playerMatches.length}
              />
              <StatCard title={playerText.wins} value={playerWins} />
              <StatCard title={playerText.losses} value={playerLosses} />
              <StatCard
                title={playerText.tournamentsWon}
                value={selectedPlayer.tournamentsWon}
              />
              <StatCard
                title={playerText.earnings}
                value={`${selectedPlayer.earnings} ₴`}
              />
            </div>

            <PlayerAchievements
              achievements={playerAchievements}
              title={playerText.achievements}
              emptyText={playerText.noAchievements}
            />

            <PlayerTournamentHistory
              tournaments={playerTournamentHistoryRows}
              labels={{
                title: playerText.tournamentHistory,
                emptyText: playerText.noTournamentHistory,
                place: playerText.place,
                winner: playerText.winner,
                mvp: playerText.mvp,
                eloHistory: playerText.eloHistory,
                showEloHistory: playerText.showEloHistory,
                hideEloHistory: playerText.hideEloHistory,
                eloGain: playerText.eloGain,
                source: playerText.source,
                team: playerText.team,
                totalElo: playerText.totalElo,
                openTournamentAria: playerText.openTournamentAria,
              }}
              expandedEloTournamentId={expandedEloTournamentId}
              onToggleEloTournament={(tournamentId) =>
                setExpandedEloTournamentId((currentId) =>
                  currentId === tournamentId ? null : tournamentId,
                )
              }
              onOpenTournament={onOpenTournament}
            />

            <PlayerRecentMatches
              title={playerText.recentMatches}
              emptyText={playerText.noRecentMatches}
              vsText={commonText.vs}
              winShort={playerText.winsShort}
              lossShort={playerText.lossesShort}
              matches={playerRecentMatchRows}
            />
          </div>
        )}
      </div>
    </>
  );
}
