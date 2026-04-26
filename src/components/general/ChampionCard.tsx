import type { MouseEvent } from "react";
import { Match, Player, Team, Tournament } from "../../types";
import { Lang, t } from "../../utils/translations";

type Props = {
  tournaments: Tournament[];
  players: Player[];
  teams: Team[];
  matches: Match[];
  lang: Lang;
  handleGlow: (e: MouseEvent<HTMLElement>) => void;
};

export default function ChampionCard({
  tournaments,
  players,
  teams,
  matches,
  lang,
  handleGlow,
}: Props) {
  const text = t[lang] || t.en;
  const generalText = text.generalPage;
  const commonText = text.common;
  const completedTournaments = tournaments.filter(
    (tournament) => tournament.status === "completed"
  );

  if (completedTournaments.length === 0) {
    return null;
  }

  const lastTournament = [...completedTournaments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  const winner =
    lastTournament.participantType === "team"
      ? teams.find((team) => team.id === lastTournament.winnerTeamId)
      : lastTournament.participantType === "squad"
      ? {
          name: (lastTournament.winnerSquadIds || [])
            .map((id) => players.find((player) => player.id === id)?.nickname || "?")
            .join(" / "),
          logo: "",
        }
      : players.find((player) => player.id === lastTournament.winnerId);

  const winnerName = winner
    ? "name" in winner
      ? winner.name
      : winner.nickname
    : generalText.unknown;

  const winnerImage = winner
    ? "name" in winner
      ? winner.logo
      : winner.avatar
    : "";

  const tournamentCompletedMatches = matches.filter(
    (match) =>
      match.tournamentId === lastTournament.id && match.status === "completed"
  );

  const explicitFinalMatch = tournamentCompletedMatches.find(
    (match) =>
      (match.round || "").toLowerCase().includes("final") &&
      !(match.round || "").toLowerCase().includes("semi")
  );

  const winnerLastMatch = [...tournamentCompletedMatches]
    .filter((match) =>
      lastTournament.participantType === "team"
        ? match.winnerTeamId === lastTournament.winnerTeamId
        : match.winnerId === lastTournament.winnerId
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const finalMatch = explicitFinalMatch || winnerLastMatch || null;

  const opponent =
    finalMatch && lastTournament.participantType === "team"
      ? teams.find(
          (team) =>
            team.id !== finalMatch.winnerTeamId &&
            (team.id === finalMatch.team1 || team.id === finalMatch.team2)
        )
      : finalMatch
      ? players.find(
          (player) =>
            player.id !== finalMatch.winnerId &&
            (player.id === finalMatch.player1 || player.id === finalMatch.player2)
        )
      : null;

  const opponentName = opponent
    ? "name" in opponent
      ? opponent.name
      : opponent.nickname
    : generalText.unknown;

  return (
    <div className="panel champion-panel">
      <h2 className="panel-title">{generalText.lastChampion}</h2>

      <div
        className="champion-card champion-card-upgraded"
        onMouseMove={handleGlow}
      >
        <div className="champion-left">
          {winnerImage ? (
            <img src={winnerImage} alt={winnerName} className="champion-avatar" />
          ) : (
            <div className="champion-avatar-placeholder">
              {winnerName.charAt(0) || "C"}
            </div>
          )}

          <div>
            <div className="champion-name">{winnerName}</div>

            <div className="champion-tournament-badge">
              {lastTournament.title}
            </div>

            <div className="champion-meta-row">
              <span className="champion-game-pill">{lastTournament.game}</span>

              <span className="champion-date-pill">
                {lastTournament.date || commonText.tbd}
              </span>
            </div>
          </div>
        </div>

        <div className="champion-right">
          <div className="champion-badge">🏆</div>

          {finalMatch && (
            <>
              <div className="champion-score-label">
                {generalText.finalResult}
              </div>
              <div className="champion-score-big">
                {finalMatch.score || "—"}
              </div>
              <div className="champion-opponent-pill">
                {commonText.vs} {opponentName}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
