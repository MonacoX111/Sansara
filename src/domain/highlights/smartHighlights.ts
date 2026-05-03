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

type TournamentScopeArgs = {
  matches: Match[];
  tournaments: Tournament[];
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

const toTournamentIdNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getTournamentName = (match: Match, tournaments: Tournament[]) => {
  const matchTournamentId = toTournamentIdNumber(match.tournamentId);
  if (matchTournamentId === null) return undefined;

  return tournaments.find(
    (tournament) => toTournamentIdNumber(tournament.id) === matchTournamentId
  )?.title;
};

const parseScoreDifference = (score?: string) => {
  if (!score) return null;

  const scores = score.match(/\d+/g)?.map(Number) || [];
  if (scores.length < 2) return null;

  return Math.abs(scores[0] - scores[1]);
};

const NORMAL_WIN_SCORE_THRESHOLD = 13;

const parseScoreInfo = (score?: string) => {
  if (!score) return null;

  const scores = score.match(/\d+/g)?.map(Number) || [];
  if (scores.length < 2) return null;

  const [a, b] = scores;
  const difference = Math.abs(a - b);
  const maxScore = Math.max(a, b);

  return {
    difference,
    isDraw: a === b,
    hasOvertime: maxScore > NORMAL_WIN_SCORE_THRESHOLD,
  };
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
  const completedMatches = matches
    .filter(
      (match) =>
        isCompletedMatch(match) &&
        ((match.matchType === "player" &&
          Boolean(match.winnerId) &&
          Boolean(match.player1) &&
          Boolean(match.player2)) ||
          (match.matchType === "team" &&
            Boolean(match.winnerTeamId) &&
            Boolean(match.team1) &&
            Boolean(match.team2)))
    )
    .sort((a, b) => getMatchSortValue(b) - getMatchSortValue(a));

  if (completedMatches.length === 0) return null;

  return players.reduce<HotPlayerHighlight | null>((bestHotPlayer, player) => {
    const playerTeamIds = [
      player.teamId,
      ...(player.teamHistory || []).map((item) => item.teamId),
    ]
      .map((teamId) => Number(teamId || 0))
      .filter((teamId) => teamId > 0);

    let streakCount = 0;
    let latestMatch: Match | null = null;

    for (const match of completedMatches) {
      const didPlayPlayerMatch =
        match.matchType === "player" &&
        (match.player1 === player.id || match.player2 === player.id);

      const didPlayTeamMatch =
        match.matchType === "team" &&
        (playerTeamIds.includes(Number(match.team1 || 0)) ||
          playerTeamIds.includes(Number(match.team2 || 0)));

      if (!didPlayPlayerMatch && !didPlayTeamMatch) continue;

      const didWinPlayerMatch =
        match.matchType === "player" && match.winnerId === player.id;

      const didWinTeamMatch =
        match.matchType === "team" &&
        playerTeamIds.includes(Number(match.winnerTeamId || 0));

      if (!didWinPlayerMatch && !didWinTeamMatch) break;

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

    const scoreInfo = parseScoreInfo(match.score);
    const scoreDifference = scoreInfo ? scoreInfo.difference : null;

    // Close score still matters but no longer dominates (cap 200, was 500).
    const closeScoreValue =
      scoreDifference === null ? 0 : Math.max(0, 200 - scoreDifference * 40);

    // Stage and tournament are now the strongest signals.
    const stageValue = getStageImportance(match);
    const tournamentValue = match.tournamentId ? 150 : 0;

    // A real winner outranks a draw of the same closeness.
    const hasWinner = Boolean(match.winnerId || match.winnerTeamId);
    const winnerBonus = hasWinner ? 200 : 0;

    // Overtime / extra rounds (e.g. CS 16:12) outrank normal close scores.
    const overtimeBonus = scoreInfo?.hasOvertime ? 220 : 0;

    const combinedEloValue = participants.combinedElo / 20;

    // Recency acts as a real tiebreaker: ~9 points per day, well below stage.
    const recentValue = getMatchSortValue(match) / 1000000000000000;

    const totalScore =
      stageValue +
      tournamentValue +
      winnerBonus +
      overtimeBonus +
      closeScoreValue +
      combinedEloValue +
      recentValue;

    const reasonLabel = scoreInfo?.hasOvertime
      ? "overtime"
      : stageValue >= 120
      ? "high-stakes-stage"
      : !scoreInfo?.isDraw && scoreDifference !== null && scoreDifference <= 1
      ? "close-score"
      : match.tournamentId
      ? "tournament-match"
      : "recent-form";

    const currentHighlight: FeaturedMatchHighlight = {
      match,
      participantAName: participants.participantAName,
      participantBName: participants.participantBName,
      winnerName: participants.winnerName,
      tournamentName: getTournamentName(match, tournaments),
      score: match.score,
      reasonLabel,
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

const getTournamentOrderKey = (tournament: Tournament) => {
  // Newest tournament is determined strictly by creation order (id).
  // Larger id = newer tournament. The `order` field is intentionally
  // ignored here so that legacy tournaments with large `order` values
  // cannot be mistaken for the newest one.
  return toTournamentIdNumber(tournament.id) ?? 0;
};

export const getNewestTournamentWithCompletedMatches = ({
  matches,
  tournaments,
}: TournamentScopeArgs): Tournament | null => {
  // 1. Build the set of tournament ids that have at least one completed/finished match.
  const completedTournamentIds = new Set<number>();
  for (const match of matches) {
    if (!isCompletedMatch(match)) continue;
    const id = toTournamentIdNumber(match.tournamentId);
    if (id === null) continue;
    completedTournamentIds.add(id);
  }

  if (completedTournamentIds.size === 0) return null;

  // 2. Sort all tournaments DESC strictly by id — larger id = newer.
  //    A tournament with only scheduled matches will be naturally skipped
  //    in step 3 because its id is not in `completedTournamentIds`.
  const sortedDesc = [...tournaments].sort(
    (a, b) => getTournamentOrderKey(b) - getTournamentOrderKey(a)
  );

  // 3. Return the first tournament (newest) that has a completed match.
  for (const tournament of sortedDesc) {
    const id = toTournamentIdNumber(tournament.id);
    if (id !== null && completedTournamentIds.has(id)) return tournament;
  }

  return null;
};

export const scopeMatchesToNewestTournament = ({
  matches,
  tournaments,
}: TournamentScopeArgs): Match[] => {
  const tournament = getNewestTournamentWithCompletedMatches({
    matches,
    tournaments,
  });

  // Strict rule: fall back to all matches ONLY if no tournament has any
  // completed/finished match. Never merge old + new tournaments.
  // Always return a fresh array so consumers (e.g. React useMemo) never
  // reuse a stale reference when match data changes.
  if (!tournament) return [...matches];

  const tournamentId = toTournamentIdNumber(tournament.id);
  if (tournamentId === null) return [...matches];

  return matches.filter(
    (match) => toTournamentIdNumber(match.tournamentId) === tournamentId
  );
};
