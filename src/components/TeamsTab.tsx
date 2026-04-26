import { Match, Player, Team, Tournament } from "../types";
import { Lang, t } from "../utils/translations";
import StatCard from "./StatCard";

type Props = {
  lang: Lang;
  teams: Team[];
  players: Player[];
  tournaments: Tournament[];
  matches: Match[];
  selectedTeamId: number;
  setSelectedTeamId: (id: number) => void;
};

export default function TeamsTab({
  teams,
  players,
  tournaments,
  matches,
  selectedTeamId,
  setSelectedTeamId,
  lang,
}: Props) {
  const text = t[lang] || t.en;
  const teamText = text.teamsPage;
  const commonText = text.common;
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) || null;

  const teamPlayers = players.filter(
    (player) => player.teamId === selectedTeamId
  );

  const wonTournaments = tournaments.filter(
    (tournament) => tournament.winnerTeamId === selectedTeamId
  );

  const recentTeamMatches = matches
    .filter(
      (match) =>
        match.matchType === "team" &&
        (match.team1 === selectedTeamId || match.team2 === selectedTeamId)
    )
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

const getTeamName = (teamId?: number) =>
  teams.find((team) => team.id === teamId)?.name || teamText.unknownTeam;

const getTournamentTitle = (tournamentId?: number) =>
  tournaments.find((tournament) => tournament.id === tournamentId)?.title ||
  teamText.independentMatch;

const getMatchOpponentName = (match: Match) => {
    if (match.team1 === selectedTeamId) {
      return getTeamName(match.team2);
    }

    if (match.team2 === selectedTeamId) {
      return getTeamName(match.team1);
    }

    return teamText.unknownOpponent;
  };

  const getMatchResultLabel = (match: Match) => {
if (!selectedTeamId || !match.winnerTeamId) {
  return teamText.noWinner;
}

if (match.winnerTeamId === selectedTeamId) {
  return teamText.win;
}

return teamText.loss;
  };

  return (
    <div className="two-col reverse">
      <div className="panel">
        <h2 className="panel-title">{teamText.directory}</h2>

        <div className="list-col">
          {[...teams]
            .sort((a, b) => {
              if (a.isFeatured && !b.isFeatured) return -1;
              if (!a.isFeatured && b.isFeatured) return 1;
              return 0;
            })
            .map((team) => (
              <button
                key={team.id}
                className={`simple-card button-card ${
                  selectedTeamId === team.id ? "player-card-active" : ""
                } ${team.isFeatured ? "featured-team-card" : ""}`}
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
                onClick={() => setSelectedTeamId(team.id)}
              >
                <div className="player-head">
                  <img src={team.logo} alt={team.name} className="logo" />
                  <div>
                    <div className="achievement-title">
                      {team.name}
                      {team.isFeatured ? (
                        <span className="team-featured-badge">{teamText.featured}</span>
                      ) : null}
                    </div>
                    <div className="muted small">{team.description}</div>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {selectedTeam && (
        <div className="panel">
          <h2 className="panel-title">{teamText.profile}</h2>

          <div className="team-profile-head">
            <img
              src={selectedTeam.logo}
              alt={selectedTeam.name}
              className="logo big"
            />
            <div>
              <h3 className="profile-name">{selectedTeam.name}</h3>
              <p className="muted">{selectedTeam.description}</p>

              <div className="tag-row">
                {selectedTeam.games.map((game) => (
                  <span key={game} className="pill">
                    {game}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="stats-grid">
<StatCard title={teamText.players} value={teamPlayers.length} />
<StatCard title={teamText.wins} value={selectedTeam.wins} />
<StatCard title={teamText.earnings} value={`${selectedTeam.earnings} ₴`} />
<StatCard title={teamText.games} value={selectedTeam.games.length} />
          </div>

          <div className="section-block">
            <h4>{teamText.players}</h4>

            {teamPlayers.length > 0 ? (
              <div className="team-roster-list">
                {teamPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="team-roster-card"
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
                    {player.avatar ? (
                      <img
                        src={player.avatar}
                        alt={player.nickname}
                        className="team-roster-avatar"
                      />
                    ) : (
                      <div className="team-roster-avatar-placeholder">
                        {player.nickname.charAt(0)}
                      </div>
                    )}

                    <div className="team-roster-content">
                      <div className="team-roster-name">{player.nickname}</div>
                      <div className="team-roster-sub">
                        {teamText.elo}: {player.elo} • {teamText.wins}: {player.wins}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-block">{teamText.noPlayersAdded}</div>
            )}
          </div>

          <div className="section-block">
            <h4>{teamText.wonTournaments}</h4>

            {wonTournaments.length > 0 ? (
              <div className="team-history-list">
                {wonTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="team-history-card"
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
                    <div className="team-history-top">
                      <div className="team-history-title">
                        {tournament.title}
                      </div>
                      <span className="pill gold">{teamText.winner}</span>
                    </div>

                    <div className="team-history-meta">
                      <span>{tournament.game}</span>
                      <span>{tournament.date || teamText.noDate}</span>
                      <span>{tournament.format}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-block">{teamText.noTournamentsWon}</div>
            )}
          </div>

          <div className="section-block">
            <h4>{teamText.recentMatches}</h4>

            {recentTeamMatches.length > 0 ? (
              <div className="team-history-list">
                {recentTeamMatches.map((match) => (
                  <div key={match.id} className="team-history-card">
                    <div className="team-history-top">
                      <div className="team-history-title">
                        {selectedTeam.name} {commonText.vs}{" "}
                        {getMatchOpponentName(match)}
                      </div>

                      <span
                        className={`pill ${
                          getMatchResultLabel(match) === teamText.win ? "green" : ""
                        }`}
                      >
                        {getMatchResultLabel(match)}
                      </span>
                    </div>

                    <div className="team-history-meta">
<span>{match.score || teamText.noScore}</span>
<span>{match.date || teamText.noDate}</span>
                      <span>{getTournamentTitle(match.tournamentId)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
<div className="empty-block">{teamText.noRecentMatches}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
