import { Match, Player, Team, Tournament } from "../types";
import StatCard from "./StatCard";

type Props = {
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
}: Props) {
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
    teams.find((team) => team.id === teamId)?.name || "Unknown team";

  const getTournamentTitle = (tournamentId?: number) =>
    tournaments.find((tournament) => tournament.id === tournamentId)?.title ||
    "Independent match";

  const getMatchOpponentName = (match: Match) => {
    if (match.team1 === selectedTeamId) {
      return getTeamName(match.team2);
    }

    if (match.team2 === selectedTeamId) {
      return getTeamName(match.team1);
    }

    return "Unknown opponent";
  };

  const getMatchResultLabel = (match: Match) => {
    if (!selectedTeamId || !match.winnerTeamId) {
      return "No winner";
    }

    if (match.winnerTeamId === selectedTeamId) {
      return "Win";
    }

    return "Loss";
  };

  return (
    <div className="two-col reverse">
      <div className="panel">
        <h2 className="panel-title">Teams</h2>

        <div className="list-col">
          {teams.map((team) => (
            <button
              key={team.id}
              className={`simple-card button-card ${
                selectedTeamId === team.id ? "team-card-active" : ""
              }`}
              onClick={() => setSelectedTeamId(team.id)}
            >
              <div className="player-head">
                <img src={team.logo} alt={team.name} className="logo" />
                <div>
                  <div className="achievement-title">{team.name}</div>
                  <div className="muted small">{team.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTeam && (
        <div className="panel">
          <h2 className="panel-title">Team profile</h2>

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
            <StatCard title="Players" value={teamPlayers.length} />
            <StatCard title="Wins" value={selectedTeam.wins} />
            <StatCard title="Earnings" value={`${selectedTeam.earnings} ₴`} />
            <StatCard title="Games" value={selectedTeam.games.length} />
          </div>

          <div className="section-block">
            <h4>Players</h4>

            {teamPlayers.length > 0 ? (
              <div className="team-roster-list">
                {teamPlayers.map((player) => (
                  <div key={player.id} className="team-roster-card">
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
                        ELO: {player.elo} • Wins: {player.wins}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-block">No players added yet</div>
            )}
          </div>

          <div className="section-block">
            <h4>Won tournaments</h4>

            {wonTournaments.length > 0 ? (
              <div className="team-history-list">
                {wonTournaments.map((tournament) => (
                  <div key={tournament.id} className="team-history-card">
                    <div className="team-history-top">
                      <div className="team-history-title">
                        {tournament.title}
                      </div>
                      <span className="pill gold">Winner</span>
                    </div>

                    <div className="team-history-meta">
                      <span>{tournament.game}</span>
                      <span>{tournament.date || "No date"}</span>
                      <span>{tournament.format}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-block">No tournaments won yet</div>
            )}
          </div>

          <div className="section-block">
            <h4>Recent matches</h4>

            {recentTeamMatches.length > 0 ? (
              <div className="team-history-list">
                {recentTeamMatches.map((match) => (
                  <div key={match.id} className="team-history-card">
                    <div className="team-history-top">
                      <div className="team-history-title">
                        {selectedTeam.name} vs {getMatchOpponentName(match)}
                      </div>

                      <span
                        className={`pill ${
                          getMatchResultLabel(match) === "Win" ? "green" : ""
                        }`}
                      >
                        {getMatchResultLabel(match)}
                      </span>
                    </div>

                    <div className="team-history-meta">
                      <span>{match.score || "No score"}</span>
                      <span>{match.date || "No date"}</span>
                      <span>{getTournamentTitle(match.tournamentId)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-block">No recent matches yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
