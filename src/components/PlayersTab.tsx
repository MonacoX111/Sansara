import { Achievement, Match, Player, Team, Tournament } from "../types";
import {
  getPlayerMatchResult,
  getPlayerMatches,
  getPlayerRecentMatches,
  getPlayerStreak,
  getPlayerWinRate,
} from "../domain/player/playerStats";
import {
  getPlayerAllTeamIds,
  getPlayerCurrentTeam,
  getPlayerTeamHistory,
} from "../domain/player/playerTeams";
import {
  getPlayerTournamentEloHistory,
} from "../domain/player/playerEloHistory";
import {
  getTournamentTeamRoster,
  isPlayerInTournamentTeamRoster,
} from "../domain/tournament/tournamentRosters";
import { Lang, t } from "../utils/translations";
import PremiumSelect from "./ui/PremiumSelect";
import StatCard from "./StatCard";

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
  lang = "en",
}: Props) {

  const text = t[lang] || t.en;
  const playerText = text.playersPage;
  const commonText = text.common;

  const getTeamName = (teamId: number) =>
    teams.find((t) => t.id === teamId)?.name || "";

  const getTeamLogo = (teamId: number) =>
    teams.find((t) => t.id === teamId)?.logo || "";

  const getPlayerAchievements = (playerId: number) =>
    achievements.filter((achievement) =>
      achievement.playerIds.includes(playerId)
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
    teamId: number
  ) => {
    const roster = getTournamentTeamRoster(tournament, teamId);

    if (roster) {
      return isPlayerInTournamentTeamRoster(
        tournament,
        teamId,
        selectedPlayerId,
        players
      );
    }

    return selectedPlayerTeamIdSet.has(Number(teamId));
  };

  const getSelectedPlayerTournamentTeamId = (tournament: Tournament) => {
    if (tournament.participantType !== "team") return undefined;

    const roster = Array.isArray(tournament.teamRosters)
      ? tournament.teamRosters.find((item) =>
          Array.isArray(item.playerIds)
            ? item.playerIds.map(Number).includes(Number(selectedPlayerId))
            : false
        )
      : undefined;

    if (roster) return Number(roster.teamId);

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
          isSelectedPlayerInTournamentTeam(tournament, Number(item.teamId)))
    );
  };

  const isSelectedPlayerTournament = (tournament: Tournament) => {
    if (!selectedPlayer) return false;

    const participantIds = Array.isArray(tournament.participantIds)
      ? tournament.participantIds.map((id) => Number(id))
      : [];
    const placement = getTournamentPlacementForSelectedPlayer(tournament);
    const participatedDirectly =
      tournament.participantType === "player" &&
      participantIds.includes(Number(selectedPlayer.id));
    const participatedByTeam =
      tournament.participantType === "team" &&
      participantIds.some((teamId) =>
        isSelectedPlayerInTournamentTeam(tournament, teamId)
      );
    const wonDirectly = Number(tournament.winnerId) === Number(selectedPlayer.id);
    const wonByTeam =
      typeof tournament.winnerTeamId === "number" &&
      isSelectedPlayerInTournamentTeam(
        tournament,
        Number(tournament.winnerTeamId)
      );

    return (
      participatedDirectly ||
      participatedByTeam ||
      Boolean(placement) ||
      wonDirectly ||
      wonByTeam
    );
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
      gameFilter === "all" ? true : player.games.includes(gameFilter)
    )
    .filter((player) =>
      teamFilter === "all" ? true : String(player.teamId) === teamFilter
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

  const playerMatches = getPlayerMatches(matches, selectedPlayerId).sort(
    (a, b) => (a.order ?? a.id) - (b.order ?? b.id)
  );
  const playerRecentMatches = getPlayerRecentMatches({
    matches,
    players,
    tournaments,
    playerId: selectedPlayerId,
    limit: 6,
    unknownPlayerLabel: playerText.unknown,
    friendlyMatchLabel: playerText.friendlyMatch,
  }).reverse();
  const playerDecidedMatches = playerMatches.filter(
    (match) => getPlayerMatchResult(match, selectedPlayerId) !== "pending"
  );
  const playerWins = playerDecidedMatches.filter(
    (match) => getPlayerMatchResult(match, selectedPlayerId) === "win"
  ).length;
  const playerLosses = playerDecidedMatches.length - playerWins;
  const playerWinRate = getPlayerWinRate(playerMatches, selectedPlayerId);
  const playerStreak = getPlayerStreak(playerMatches, selectedPlayerId);

  const playerAchievements = getPlayerAchievements(selectedPlayerId);
  const playerEloHistory = selectedPlayer
    ? getPlayerTournamentEloHistory(
        selectedPlayer,
        tournaments,
        teams,
        players
      )
    : [];
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
          (item) => item.tournamentId === tournament.id
        ),
        isWinner:
          Number(tournament.winnerId) === Number(selectedPlayerId) ||
          (typeof tournament.winnerTeamId === "number" &&
            isSelectedPlayerInTournamentTeam(
              tournament,
              Number(tournament.winnerTeamId)
            )),
        isMvp: Number(tournament.mvpId) === Number(selectedPlayerId),
      };
    })
    .filter(
      (tournament, index, items) =>
        items.findIndex((item) => item.id === tournament.id) === index
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

  return (
    <>
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

      <div className="two-col">
        <div className="panel">
          <h2 className="panel-title">{playerText.directory}</h2>

          <div className="player-grid">
            {filteredPlayers.map((player) => {
              const teamName = getTeamName(player.teamId);
              const cardAchievements = getPlayerAchievements(player.id);
              const previewAchievements = cardAchievements.slice(0, 3);
              const hiddenAchievementsCount = Math.max(
                cardAchievements.length - previewAchievements.length,
                0
              );

              return (
                <button
                  key={player.id}
                  className={`player-card ${
                    selectedPlayerId === player.id ? "player-card-active" : ""
                  }`}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                  onClick={() => setSelectedPlayerId(player.id)}
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
                            <span className="pill featured-pill">{playerText.featured}</span>
                          ) : null}
                        </div>
                        <span className="pill light">#{player.rank}</span>
                      </div>
                    </div>
                  </div>

                  <div className="player-info-box">
                    <div className="player-info-row">
                      <span className="info-label">{playerText.currentTeam}</span>
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
                          <span className="muted small">{playerText.noGames}</span>
                        )}
                      </div>
                    </div>

                    <div className="player-info-row column">
                      <span className="info-label">{playerText.achievements}</span>

                      {previewAchievements.length > 0 ? (
                        <div className="tag-row compact">
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
                            <span className="pill">
                              +{hiddenAchievementsCount}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="muted small">{playerText.noAchievements}</span>
                      )}
                    </div>
                  </div>

                  <div className="mini-stats">
                    <div>
                      {playerText.winsShort}: {player.wins}
                    </div>
                    <div>
                      {playerText.elo}: {player.elo}
                    </div>
                    <div>₴: {player.earnings}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedPlayer && (
          <div className="panel">
            <h2 className="panel-title">{playerText.profile}</h2>

            <div className="profile-head">
              <img
                src={selectedPlayer.avatar}
                alt={selectedPlayer.nickname}
                className="avatar large"
              />

              <div className="profile-main-info">
                <h3 className="profile-name">{selectedPlayer.nickname}</h3>

                {selectedPlayer.bio ? (
                  <div className="player-role-badge">{selectedPlayer.bio}</div>
                ) : null}

                <div className="profile-info-box upgraded">
                  <div className="profile-primary-row">
                    <div
                      className="profile-primary-card team-card"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
                      <span className="info-label">{playerText.team}</span>

                      <div className="profile-team-main">
                        {selectedPlayerCurrentTeam?.logo ? (
                          <img
                            src={selectedPlayerCurrentTeam.logo}
                            alt={selectedPlayerCurrentTeam.name}
                            className="profile-team-logo"
                          />
                        ) : (
                          <div className="profile-team-logo-placeholder">
                            {(getTeamName(selectedPlayer.teamId) || "—").charAt(
                              0
                            )}
                          </div>
                        )}

                        <span className="profile-primary-value">
                          {selectedPlayerCurrentTeam?.name || playerText.noTeam}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-info-row column">
                    <span className="info-label">{playerText.games}</span>

                    <div className="profile-games-enhanced">
                      {selectedPlayer.games.length > 0 ? (
                        selectedPlayer.games.map((game) => (
                          <span key={game} className="profile-game-chip">
                            {game}
                          </span>
                        ))
                      ) : (
                        <span className="muted small">{playerText.noGames}</span>
                      )}
                    </div>
                  </div>

                  <div className="profile-mini-stats">
                    <div
                      className="profile-mini-stat-card"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
                      <span className="info-label">{playerText.achievements}</span>
                      <span className="profile-mini-stat-value">
                        {playerAchievements.length}
                      </span>
                    </div>

                    <div
                      className="profile-mini-stat-card"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
<span className="info-label">{playerText.tournaments}</span>
<span className="profile-mini-stat-value">
  {playerTournaments.length}
</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                          ? `Open ${item.team?.name || playerText.unknownTeam}`
                          : undefined
                      }
                      onClick={() => {
                        if (!canOpenTeam) return;
                        onOpenTeam?.(teamId);
                      }}
                      onKeyDown={(event) => {
                        if (!canOpenTeam) return;
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        onOpenTeam?.(teamId);
                      }}
                    >
                      <div className="team-history-top">
                        <div className="team-history-title">
                          {item.team?.name || playerText.unknownTeam}
                        </div>
                        {item.isCurrent ? (
                          <span className="pill green">
                            {playerText.currentTeam}
                          </span>
                        ) : null}
                      </div>

                      {(item.from || item.to) ? (
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
  <StatCard title={playerText.totalMatches} value={playerMatches.length} />
  <StatCard title={playerText.winRate} value={`${playerWinRate}%`} />
  <StatCard title={playerText.elo} value={selectedPlayer.elo} />
  <StatCard title={playerText.wins} value={playerWins} />
  <StatCard title={playerText.losses} value={playerLosses} />
  <StatCard title={playerText.currentStreak} value={playerStreak.label} />
  <StatCard
    title={playerText.tournamentsWon}
    value={selectedPlayer.tournamentsWon}
  />
  <StatCard
    title={playerText.earnings}
    value={`${selectedPlayer.earnings} ₴`}
  />
</div>


<div className="section-block">
  <h4>{playerText.achievements}</h4>
  {playerAchievements.length === 0 ? (
    <p className="muted">{playerText.noAchievements}</p>
  ) : (
                <div className="achievement-grid">
                  {playerAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="achievement-card achievement-card-pro"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
                      <img
                        src={achievement.image}
                        alt={achievement.title}
                        className="achievement-img"
                      />
                      <div>
                        <div className="achievement-title">
                          {achievement.title}
                        </div>
                        <div className="muted small">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

<div className="section-block">
  <h4>{playerText.tournamentHistory}</h4>

  {playerTournamentHistory.length === 0 ? (
    <p className="muted">{playerText.noTournamentHistory}</p>
  ) : (
                <div className="list-col">
                  {playerTournamentHistory.map((tournament) => {
                    const placementCardClass =
                      getTournamentPlacementCardClass(tournament.place);
                    const placementBadgeClass = getPlacementBadgeClass(
                      tournament.place
                    );

                    return (
                    <div
                      key={tournament.id}
                      className={`simple-card tournament-history-click-card ${placementCardClass}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${tournament.title}`}
                      onClick={() => onOpenTournament?.(tournament.id)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        onOpenTournament?.(tournament.id);
                      }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
                      <div className="row-between">
                        <div>
                          <div className="achievement-title tournament-history-open-title">
                            {tournament.title}
                          </div>
                          <div className="muted small">
                            {tournament.game} •{" "}
                            {tournament.format || tournament.type}
                          </div>
                        </div>

                        <div className="tag-row">
                          <span className={`pill light ${placementBadgeClass}`}>
                            {playerText.place}: {String(tournament.place)}
                          </span>
                          {tournament.isWinner ? (
                            <span className="pill green badge-winner">
                              {playerText.winner}
                            </span>
                          ) : null}
                          {tournament.isMvp ? (
                            <span className="pill gold badge-mvp">
                              {playerText.mvp}
                            </span>
                          ) : null}
                          {tournament.eloEntries.map((item) => (
                            <span
                              key={`${tournament.id}-${item.placement}-${item.sourceType}-${item.teamId || "solo"}`}
                              className={getEloGainBadgeClass(item.elo)}
                            >
                              +{item.elo} ELO
                            </span>
                          ))}
                          {tournament.eloEntries.map((item) => (
                            <span
                              key={`${tournament.id}-${item.placement}-${item.sourceType}-${item.teamId || "solo"}-source`}
                              className="pill light"
                            >
                              {item.sourceType === "player"
                                ? playerText.solo
                                : playerText.teamPlacement}
                              {item.teamName ? `: ${item.teamName}` : ""}
                            </span>
                          ))}
                          {tournament.participantType === "team" &&
                          tournament.playedTeamName &&
                          !tournament.eloEntries.some(
                            (item) =>
                              item.sourceType === "team" &&
                              item.teamName === tournament.playedTeamName
                          ) ? (
                            <span className="pill light">
                              {playerText.team}: {tournament.playedTeamName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

<div className="section-block">
  <h4>{playerText.recentMatches}</h4>

  {playerRecentMatches.length === 0 ? (
    <p className="muted">{playerText.noRecentMatches}</p>
  ) : (
                <div className="list-col">
                  {playerRecentMatches.map(
                    ({ match, opponentName, result, tournamentName }) => (
                    <div
                      key={match.id}
                      className="simple-card"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
                      <div className="row-between">
                        <div>
                          <div className="achievement-title">
                            {playerText.opponent}: {opponentName}
                            <span
                              className={`pill player-result-pill player-result-${result}`}
                            >
                              {result === "win"
                                ? playerText.win
                                : result === "loss"
                                ? playerText.loss
                                : playerText.pending}
                            </span>
                          </div>
                          <div className="muted small">
                            {match.game} •{" "}
                            {tournamentName}
                          </div>
                        </div>

                        <div className="right-block">
                          <div className="score">{match.score || "-"}</div>
                          <div className="muted small">{match.date}</div>
                        </div>
                      </div>

                      <div className="tour-meta">
                        <div>
                          <span className="muted">{playerText.status}:</span>{" "}
                          {match.status || "—"}
                        </div>
                        <div>
                          <span className="muted">{playerText.round}:</span>{" "}
                          {match.round || "—"}
                        </div>
                        <div>
                          <span className="muted">{playerText.format}:</span>{" "}
                          {commonText.bestOfShort}
                          {match.bestOf || 1}
                        </div>
                        {match.notes ? (
                          <div>
                            <span className="muted">{playerText.notes}:</span>{" "}
                            {match.notes}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
