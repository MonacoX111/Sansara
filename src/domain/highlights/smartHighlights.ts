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

export type FeaturedMatchHighlight = {
  match: Match;
  participantAName: string;
  participantBName: string;
  winnerName?: string;
  tournamentName?: string;
  score?: string;
  reasonLabel?: string;
};

export type MatchOfTheWeekHighlight = FeaturedMatchHighlight;

export type RivalryParticipant = {
  id: number;
  name: string;
};

export type RivalryHighlight = {
  type: "player" | "team";
  participantA: RivalryParticipant;
  participantB: RivalryParticipant;
  totalMatches: number;
  winsA: number;
  winsB: number;
  lastMatch: Match;
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

type GetFeaturedMatchArgs = {
  matches: Match[];
  players: Player[];
  teams: Team[];
  tournaments: Tournament[];
};

type GetMatchOfTheWeekArgs = GetFeaturedMatchArgs;

type GetRivalryArgs = {
  matches: Match[];
  players: Player[];
  teams: Team[];
};

type RivalryGroup = RivalryHighlight & {
  lastMatchSortValue: number;
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

const parseScoreDifference = (score?: string) => {
  if (!score) return null;

  const scores = score.match(/\d+/g)?.map(Number) || [];
  if (scores.length < 2) return null;

  return Math.abs(scores[0] - scores[1]);
};

const getStageImportance = (match: Match) => {
  const stageText = `${match.stage || ""} ${match.roundLabel || ""} ${
    match.round || ""
  }`.toLowerCase();

  if (stageText.includes("final")) return 300;
  if (stageText.includes("semi")) return 220;
  if (stageText.includes("quarter")) return 160;
  if (stageText.includes("playoff")) return 120;
  if (stageText.includes("group")) return 60;

  return stageText.trim() ? 40 : 0;
};

const getMatchParticipants = (
  match: Match,
  players: Player[],
  teams: Team[]
) => {
  if (match.matchType === "player") {
    const playerA = players.find((player) => player.id === match.player1);
    const playerB = players.find((player) => player.id === match.player2);

    if (!playerA || !playerB) return null;

    const winner =
      match.winnerId === playerA.id
        ? playerA
        : match.winnerId === playerB.id
        ? playerB
        : undefined;

    return {
      participantAName: playerA.nickname,
      participantBName: playerB.nickname,
      winnerName: winner?.nickname,
      combinedElo: Number(playerA.elo || 0) + Number(playerB.elo || 0),
    };
  }

  if (match.matchType === "team") {
    const teamA = teams.find((team) => team.id === match.team1);
    const teamB = teams.find((team) => team.id === match.team2);

    if (!teamA || !teamB) return null;

    const teamAElo = getCurrentTeamAverageElo(teamA.id, players);
    const teamBElo = getCurrentTeamAverageElo(teamB.id, players);
    const winner =
      match.winnerTeamId === teamA.id
        ? teamA
        : match.winnerTeamId === teamB.id
        ? teamB
        : undefined;

    return {
      participantAName: teamA.name,
      participantBName: teamB.name,
      winnerName: winner?.name,
      combinedElo: Number(teamAElo || 0) + Number(teamBElo || 0),
    };
  }

  return null;
};

const getSortedPair = (participantAId: number, participantBId: number) => {
  return participantAId < participantBId
    ? [participantAId, participantBId]
    : [participantBId, participantAId];
};

const getPlayerParticipant = (
  playerId: number,
  players: Player[]
): RivalryParticipant | null => {
  const player = players.find((item) => item.id === playerId);

  return player ? { id: player.id, name: player.nickname } : null;
};

const getTeamParticipant = (
  teamId: number,
  teams: Team[]
): RivalryParticipant | null => {
  const team = teams.find((item) => item.id === teamId);

  return team ? { id: team.id, name: team.name } : null;
};

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

export const getFeaturedMatch = ({
  matches,
  players,
  teams,
  tournaments,
}: GetFeaturedMatchArgs): FeaturedMatchHighlight | null => {
  const completedMatches = matches.filter(isCompletedMatch);

  if (completedMatches.length === 0) return null;

  return completedMatches.reduce<{
    highlight: FeaturedMatchHighlight;
    score: number;
  } | null>((bestMatch, match) => {
    const participants = getMatchParticipants(match, players, teams);

    if (!participants) return bestMatch;

    const scoreDifference = parseScoreDifference(match.score);
    const closeScoreValue =
      scoreDifference === null ? 0 : Math.max(0, 500 - scoreDifference * 120);
    const tournamentValue = match.tournamentId ? 120 : 0;
    const stageValue = getStageImportance(match);
    const recentValue = getMatchSortValue(match) / 1000000000000000;
    const combinedEloValue = participants.combinedElo / 10;
    const totalScore =
      closeScoreValue +
      combinedEloValue +
      tournamentValue +
      stageValue +
      recentValue;

    const currentHighlight: FeaturedMatchHighlight = {
      match,
      participantAName: participants.participantAName,
      participantBName: participants.participantBName,
      winnerName: participants.winnerName,
      tournamentName: getTournamentName(match, tournaments),
      score: match.score,
      reasonLabel:
        scoreDifference !== null && scoreDifference <= 1
          ? "close-score"
          : match.tournamentId
          ? "tournament-match"
          : "recent-form",
    };

    if (!bestMatch || totalScore > bestMatch.score) {
      return {
        highlight: currentHighlight,
        score: totalScore,
      };
    }

    return bestMatch;
  }, null)?.highlight || null;
};

export const getMatchOfTheWeek = (
  args: GetMatchOfTheWeekArgs
): MatchOfTheWeekHighlight | null => getFeaturedMatch(args);

export const getRivalry = ({
  matches,
  players,
  teams,
}: GetRivalryArgs): RivalryHighlight | null => {
  const rivalryGroups = matches.reduce<Map<string, RivalryGroup>>(
    (groups, match) => {
      if (!isCompletedMatch(match)) return groups;

      const isPlayerMatch = match.matchType === "player";
      const isTeamMatch = match.matchType === "team";
      const participantAId = isPlayerMatch ? match.player1 : match.team1;
      const participantBId = isPlayerMatch ? match.player2 : match.team2;
      const winnerId = isPlayerMatch ? match.winnerId : match.winnerTeamId;

      if (
        (!isPlayerMatch && !isTeamMatch) ||
        !participantAId ||
        !participantBId ||
        participantAId === participantBId
      ) {
        return groups;
      }

      const [normalizedAId, normalizedBId] = getSortedPair(
        participantAId,
        participantBId
      );
      const participantA = isPlayerMatch
        ? getPlayerParticipant(normalizedAId, players)
        : getTeamParticipant(normalizedAId, teams);
      const participantB = isPlayerMatch
        ? getPlayerParticipant(normalizedBId, players)
        : getTeamParticipant(normalizedBId, teams);

      if (!participantA || !participantB) return groups;

      const key = `${isPlayerMatch ? "player" : "team"}-${normalizedAId}-${normalizedBId}`;
      const currentSortValue = getMatchSortValue(match);
      const existingGroup = groups.get(key);

      const nextGroup: RivalryGroup = existingGroup
        ? {
            ...existingGroup,
            totalMatches: existingGroup.totalMatches + 1,
            winsA:
              winnerId === normalizedAId
                ? existingGroup.winsA + 1
                : existingGroup.winsA,
            winsB:
              winnerId === normalizedBId
                ? existingGroup.winsB + 1
                : existingGroup.winsB,
            lastMatch:
              currentSortValue > existingGroup.lastMatchSortValue
                ? match
                : existingGroup.lastMatch,
            lastMatchSortValue: Math.max(
              existingGroup.lastMatchSortValue,
              currentSortValue
            ),
          }
        : {
            type: isPlayerMatch ? "player" : "team",
            participantA,
            participantB,
            totalMatches: 1,
            winsA: winnerId === normalizedAId ? 1 : 0,
            winsB: winnerId === normalizedBId ? 1 : 0,
            lastMatch: match,
            lastMatchSortValue: currentSortValue,
          };

      groups.set(key, nextGroup);

      return groups;
    },
    new Map<string, RivalryGroup>()
  );

  const bestRivalry = Array.from(rivalryGroups.values()).reduce<
    RivalryGroup | null
  >((bestGroup, group) => {
    if (group.totalMatches < 2) return bestGroup;
    if (!bestGroup) return group;

    if (group.totalMatches !== bestGroup.totalMatches) {
      return group.totalMatches > bestGroup.totalMatches ? group : bestGroup;
    }

    return group.lastMatchSortValue > bestGroup.lastMatchSortValue
      ? group
      : bestGroup;
  }, null);

  if (!bestRivalry) return null;

  const { lastMatchSortValue, ...highlight } = bestRivalry;

  return highlight;
};
