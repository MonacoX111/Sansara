import { Match, Player, Team, Tournament } from "../../types";

export type BiggestUpsetHighlight = {
  match: Match;
  winnerName: string;
  loserName: string;
  winnerElo: number;
  loserElo: number;
  eloDifference: number;
  tournamentName?: string;
  score?: string;
  matchType: "player" | "team";
};

export type HotPlayerHighlight = {
  player: Player;
  streakCount: number;
  latestMatch: Match;
  tournamentName?: string;
};

type GetBiggestUpsetArgs = {
  matches: Match[];
  players: Player[];
  teams: Team[];
  tournaments: Tournament[];
};

type GetHotPlayerArgs = {
  matches: Match[];
  players: Player[];
  tournaments: Tournament[];
};

const isCompletedMatch = (match: Match) =>
  match.status === "completed" || String(match.status) === "finished";

const getMatchSortValue = (match: Match) => {
  const dateValue = match.date ? new Date(match.date).getTime() : 0;
  const safeDateValue = Number.isFinite(dateValue) ? dateValue : 0;

  return safeDateValue * 100000 + Number(match.order ?? match.id ?? 0);
};

const getCurrentTeamAverageElo = (teamId: number, players: Player[]) => {
  const currentTeamPlayers = players.filter((player) => player.teamId === teamId);

  if (currentTeamPlayers.length === 0) return null;

  const totalElo = currentTeamPlayers.reduce(
    (sum, player) => sum + Number(player.elo || 0),
    0
  );

  return Math.round(totalElo / currentTeamPlayers.length);
};

const getTournamentName = (match: Match, tournaments: Tournament[]) =>
  tournaments.find((tournament) => tournament.id === match.tournamentId)?.title;

const getPlayerUpset = (
  match: Match,
  players: Player[],
  tournaments: Tournament[]
): BiggestUpsetHighlight | null => {
  if (!match.winnerId || !match.player1 || !match.player2) return null;

  const loserId =
    match.winnerId === match.player1
      ? match.player2
      : match.winnerId === match.player2
      ? match.player1
      : null;

  if (!loserId) return null;

  const winner = players.find((player) => player.id === match.winnerId);
  const loser = players.find((player) => player.id === loserId);

  if (!winner || !loser) return null;

  const winnerElo = Number(winner.elo || 0);
  const loserElo = Number(loser.elo || 0);
  const eloDifference = loserElo - winnerElo;

  if (eloDifference <= 0) return null;

  return {
    match,
    winnerName: winner.nickname,
    loserName: loser.nickname,
    winnerElo,
    loserElo,
    eloDifference,
    tournamentName: getTournamentName(match, tournaments),
    score: match.score,
    matchType: "player",
  };
};

const getTeamUpset = (
  match: Match,
  players: Player[],
  teams: Team[],
  tournaments: Tournament[]
): BiggestUpsetHighlight | null => {
  if (!match.winnerTeamId || !match.team1 || !match.team2) return null;

  const loserTeamId =
    match.winnerTeamId === match.team1
      ? match.team2
      : match.winnerTeamId === match.team2
      ? match.team1
      : null;

  if (!loserTeamId) return null;

  const winner = teams.find((team) => team.id === match.winnerTeamId);
  const loser = teams.find((team) => team.id === loserTeamId);

  if (!winner || !loser) return null;

  const winnerElo = getCurrentTeamAverageElo(winner.id, players);
  const loserElo = getCurrentTeamAverageElo(loser.id, players);

  if (winnerElo === null || loserElo === null) return null;

  const eloDifference = loserElo - winnerElo;

  if (eloDifference <= 0) return null;

  return {
    match,
    winnerName: winner.name,
    loserName: loser.name,
    winnerElo,
    loserElo,
    eloDifference,
    tournamentName: getTournamentName(match, tournaments),
    score: match.score,
    matchType: "team",
  };
};

export const getBiggestUpset = ({
  matches,
  players,
  teams,
  tournaments,
}: GetBiggestUpsetArgs): BiggestUpsetHighlight | null => {
  return matches.reduce<BiggestUpsetHighlight | null>((bestUpset, match) => {
    if (!isCompletedMatch(match)) return bestUpset;

    const currentUpset =
      match.matchType === "player"
        ? getPlayerUpset(match, players, tournaments)
        : match.matchType === "team"
        ? getTeamUpset(match, players, teams, tournaments)
        : null;

    if (!currentUpset) return bestUpset;
    if (!bestUpset) return currentUpset;

    return currentUpset.eloDifference > bestUpset.eloDifference
      ? currentUpset
      : bestUpset;
  }, null);
};

export const getHotPlayer = ({
  matches,
  players,
  tournaments,
}: GetHotPlayerArgs): HotPlayerHighlight | null => {
  const completedPlayerMatches = matches
    .filter(
      (match) =>
        isCompletedMatch(match) &&
        match.matchType === "player" &&
        Boolean(match.winnerId) &&
        Boolean(match.player1) &&
        Boolean(match.player2)
    )
    .sort((a, b) => getMatchSortValue(b) - getMatchSortValue(a));

  if (completedPlayerMatches.length === 0) return null;

  return players.reduce<HotPlayerHighlight | null>((bestHotPlayer, player) => {
    let streakCount = 0;
    let latestMatch: Match | null = null;

    for (const match of completedPlayerMatches) {
      const didPlay = match.player1 === player.id || match.player2 === player.id;

      if (!didPlay) continue;

      if (match.winnerId !== player.id) break;

      streakCount += 1;
      latestMatch = latestMatch || match;
    }

    if (!latestMatch || streakCount === 0) return bestHotPlayer;

    const currentHotPlayer: HotPlayerHighlight = {
      player,
      streakCount,
      latestMatch,
      tournamentName: getTournamentName(latestMatch, tournaments),
    };

    if (!bestHotPlayer) return currentHotPlayer;

    if (currentHotPlayer.streakCount !== bestHotPlayer.streakCount) {
      return currentHotPlayer.streakCount > bestHotPlayer.streakCount
        ? currentHotPlayer
        : bestHotPlayer;
    }

    return getMatchSortValue(currentHotPlayer.latestMatch) >
      getMatchSortValue(bestHotPlayer.latestMatch)
      ? currentHotPlayer
      : bestHotPlayer;
  }, null);
};
