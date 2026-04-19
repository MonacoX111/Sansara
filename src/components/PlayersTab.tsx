import { Achievement, Match, Player, Team, Tournament } from "../types";
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
}: Props) {
  const getTeamName = (teamId: number) =>
    teams.find((t) => t.id === teamId)?.name || "";

  const getPlayerName = (playerId: number) =>
    players.find((p) => p.id === playerId)?.nickname || "Unknown";

  const getPlayerAchievements = (playerId: number) =>
    achievements.filter((achievement) =>
      achievement.playerIds.includes(playerId)
    );

  const selectedPlayer =
    players.find((player) => player.id === selectedPlayerId) || null;

  const playerTournaments = selectedPlayer
    ? tournaments.filter((tournament) => {
        if (!Array.isArray(tournament.participantIds)) return false;

        return tournament.participantIds
          .map((id) => Number(id))
          .includes(Number(selectedPlayer.id));
      })
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

  const playerMatches = matches.filter(
    (match) =>
      match.player1 === selectedPlayerId || match.player2 === selectedPlayerId
  );

  const playerAchievements = getPlayerAchievements(selectedPlayerId);

  const playerTournamentHistory = tournaments
    .map((tournament) => {
      const placement = Array.isArray(tournament.placements)
        ? tournament.placements.find(
            (item) => Number(item.playerId) === Number(selectedPlayerId)
          )
        : undefined;

      const participantIds = Array.isArray(tournament.participantIds)
        ? tournament.participantIds.map((id) => Number(id))
        : [];

      const participatedByParticipantIds = participantIds.includes(
        Number(selectedPlayerId)
      );

      const participatedByMatches = playerMatches.some(
        (match) => match.tournamentId === tournament.id
      );

      const participated =
        participatedByParticipantIds ||
        Boolean(placement) ||
        participatedByMatches;

      if (!participated) return null;

      return {
        ...tournament,
        place: placement?.place || "—",
        isWinner: Number(tournament.winnerId) === Number(selectedPlayerId),
        isMvp: Number(tournament.mvpId) === Number(selectedPlayerId),
      };
    })
    .filter(Boolean) as (Tournament & {
    place: number | string;
    isWinner: boolean;
    isMvp: boolean;
  })[];

  return (
    <>
      <div className="toolbar">
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук по ніку або грі"
        />

        <select
          className="input"
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
        >
          <option value="all">All games</option>
          {gamesList.map((game) => (
            <option key={game.id} value={game.name}>
              {game.name}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
        >
          <option value="all">All teams</option>
          {teams.map((team) => (
            <option key={team.id} value={String(team.id)}>
              {team.name}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
        >
          <option value="elo">Sort by ELO</option>
          <option value="wins">Sort by wins</option>
          <option value="earnings">Sort by earnings</option>
          <option value="name">Sort by name</option>
        </select>
      </div>

      <div className="two-col">
        <div className="panel">
          <h2 className="panel-title">Players directory</h2>

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
                            <span className="pill gold">Featured</span>
                          ) : null}
                        </div>
                        <span className="pill light">#{player.rank}</span>
                      </div>
                    </div>
                  </div>

                  <div className="player-info-box">
                    <div className="player-info-row">
                      <span className="info-label">Team</span>
                      <span className="info-value">
                        {teamName || "Без команди"}
                      </span>
                    </div>

                    <div className="player-info-row column">
                      <span className="info-label">Games</span>

                      <div className="tag-row compact player-games-row">
                        {player.games.length > 0 ? (
                          player.games.map((game) => (
                            <span key={game} className="pill">
                              {game}
                            </span>
                          ))
                        ) : (
                          <span className="muted small">Немає ігор</span>
                        )}
                      </div>
                    </div>

                    <div className="player-info-row column">
                      <span className="info-label">Achievements</span>

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
                        <span className="muted small">Немає досягнень</span>
                      )}
                    </div>
                  </div>

                  <div className="mini-stats">
                    <div>W: {player.wins}</div>
                    <div>ELO: {player.elo}</div>
                    <div>₴: {player.earnings}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedPlayer && (
          <div className="panel">
            <h2 className="panel-title">Player profile</h2>

            <div className="profile-head">
              <img
                src={selectedPlayer.avatar}
                alt={selectedPlayer.nickname}
                className="avatar large"
              />

              <div className="profile-main-info">
                <h3 className="profile-name">{selectedPlayer.nickname}</h3>
                <p className="muted">{selectedPlayer.bio}</p>

                <div className="profile-info-box">
                  <div className="profile-info-row">
                    <span className="info-label">Team</span>
                    <span className="info-value">
                      {getTeamName(selectedPlayer.teamId) || "Без команди"}
                    </span>
                  </div>

                  <div className="profile-info-row column">
                    <span className="info-label">Games</span>

                    <div className="tag-row compact player-games-row">
                      {selectedPlayer.games.length > 0 ? (
                        selectedPlayer.games.map((game) => (
                          <span key={game} className="pill">
                            {game}
                          </span>
                        ))
                      ) : (
                        <span className="muted small">Немає ігор</span>
                      )}
                    </div>
                  </div>

                  <div className="profile-info-row">
                    <span className="info-label">Achievements</span>
                    <span className="info-value">
                      {playerAchievements.length}
                    </span>
                  </div>

                  <div className="profile-info-row">
                    <span className="info-label">Tournaments</span>
                    <span className="info-value">
                      {playerTournaments.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <StatCard title="ELO" value={selectedPlayer.elo} />
              <StatCard title="Wins" value={selectedPlayer.wins} />
              <StatCard
                title="Tournaments won"
                value={selectedPlayer.tournamentsWon}
              />
              <StatCard
                title="Earnings"
                value={`${selectedPlayer.earnings} ₴`}
              />
            </div>

            <div className="section-block">
              <h4>Achievements</h4>
              {playerAchievements.length === 0 ? (
                <p className="muted">Досягнень поки немає.</p>
              ) : (
                <div className="achievement-grid">
                  {playerAchievements.map((achievement) => (
                    <div key={achievement.id} className="achievement-card">
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
              <h4>Tournament history</h4>

              {playerTournamentHistory.length === 0 ? (
                <p className="muted">Не брав участі у турнірах.</p>
              ) : (
                <div className="list-col">
                  {playerTournamentHistory.map((tournament) => (
                    <div key={tournament.id} className="simple-card">
                      <div className="row-between">
                        <div>
                          <div className="achievement-title">
                            {tournament.title}
                          </div>
                          <div className="muted small">
                            {tournament.game} •{" "}
                            {tournament.format || tournament.type}
                          </div>
                        </div>

                        <div className="tag-row">
                          <span className="pill light">
                            Place: {String(tournament.place)}
                          </span>
                          {tournament.isWinner ? (
                            <span className="pill green">Winner</span>
                          ) : null}
                          {tournament.isMvp ? (
                            <span className="pill gold">MVP</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="section-block">
              <h4>Recent matches</h4>

              {playerMatches.length === 0 ? (
                <p className="muted">Не брав участі у матчах.</p>
              ) : (
                <div className="list-col">
                  {playerMatches.map((match) => (
                    <div key={match.id} className="simple-card">
                      <div className="row-between">
                        <div>
                          <div className="achievement-title">
                            {getPlayerName(match.player1)} vs{" "}
                            {getPlayerName(match.player2)}
                          </div>
                          <div className="muted small">
                            {match.game} •{" "}
                            {tournaments.find(
                              (t) => t.id === match.tournamentId
                            )?.title || "Friendly match"}
                          </div>
                        </div>

                        <div className="right-block">
                          <div className="score">{match.score}</div>
                          <div className="muted small">{match.date}</div>
                        </div>
                      </div>

                      <div className="tour-meta">
                        <div>
                          <span className="muted">Status:</span>{" "}
                          {match.status || "—"}
                        </div>
                        <div>
                          <span className="muted">Round:</span>{" "}
                          {match.round || "—"}
                        </div>
                        <div>
                          <span className="muted">Format:</span> BO
                          {match.bestOf || 1}
                        </div>
                        {match.notes ? (
                          <div>
                            <span className="muted">Notes:</span> {match.notes}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
