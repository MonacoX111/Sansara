import { Match } from "../../types";

const upsertMatch = (matches: Match[], updatedMatch: Match): Match[] => {
  const exists = matches.some((match) => match.id === updatedMatch.id);

  return exists
    ? matches.map((match) =>
        match.id === updatedMatch.id ? updatedMatch : match
      )
    : [...matches, updatedMatch];
};

const uniqueMatchesById = (matches: Match[]): Match[] => {
  const map = new Map<number, Match>();
  matches.forEach((match) => {
    map.set(match.id, match);
  });
  return Array.from(map.values());
};

const getWinnerForMatchType = (match: Match, matchType: Match["matchType"]) =>
  matchType === "team"
    ? Number(match.winnerTeamId || 0)
    : Number(match.winnerId || 0);

const getParticipantKeys = (matchType: Match["matchType"]) => ({
  firstKey: matchType === "team" ? "team1" : "player1",
  secondKey: matchType === "team" ? "team2" : "player2",
  winnerKey: matchType === "team" ? "winnerTeamId" : "winnerId",
});

const reconcileNextMatchParticipant = ({
  nextMatch,
  oldWinnerId,
  newWinnerId,
}: {
  nextMatch: Match;
  oldWinnerId: number;
  newWinnerId: number;
}): Match => {
  const { firstKey, secondKey } = getParticipantKeys(nextMatch.matchType);
  const firstValue = Number(nextMatch[firstKey] || 0);
  const secondValue = Number(nextMatch[secondKey] || 0);

  let nextFirstValue = firstValue;
  let nextSecondValue = secondValue;
  let clearedSlot: typeof firstKey | typeof secondKey | null = null;

  if (oldWinnerId > 0 && oldWinnerId !== newWinnerId) {
    if (nextFirstValue === oldWinnerId) {
      nextFirstValue = 0;
      clearedSlot = firstKey;
    }

    if (nextSecondValue === oldWinnerId) {
      nextSecondValue = 0;
      clearedSlot = clearedSlot || secondKey;
    }
  }

  if (
    newWinnerId > 0 &&
    nextFirstValue !== newWinnerId &&
    nextSecondValue !== newWinnerId
  ) {
    if (clearedSlot === firstKey) {
      nextFirstValue = newWinnerId;
    } else if (clearedSlot === secondKey) {
      nextSecondValue = newWinnerId;
    } else if (!nextFirstValue) {
      nextFirstValue = newWinnerId;
    } else if (!nextSecondValue) {
      nextSecondValue = newWinnerId;
    }
  }

  if (nextFirstValue === firstValue && nextSecondValue === secondValue) {
    return nextMatch;
  }

  return {
    ...nextMatch,
    [firstKey]: nextFirstValue,
    [secondKey]: nextSecondValue,
  };
};

const removeStaleParticipantFromMatch = ({
  match,
  staleParticipantId,
}: {
  match: Match;
  staleParticipantId: number;
}): Match => {
  if (staleParticipantId <= 0) return match;

  const { firstKey, secondKey, winnerKey } = getParticipantKeys(match.matchType);
  const firstValue = Number(match[firstKey] || 0);
  const secondValue = Number(match[secondKey] || 0);
  const winnerValue = Number(match[winnerKey] || 0);

  const nextFirstValue = firstValue === staleParticipantId ? 0 : firstValue;
  const nextSecondValue = secondValue === staleParticipantId ? 0 : secondValue;
  const nextWinnerValue = winnerValue === staleParticipantId ? 0 : winnerValue;

  if (
    nextFirstValue === firstValue &&
    nextSecondValue === secondValue &&
    nextWinnerValue === winnerValue
  ) {
    return match;
  }

  return {
    ...match,
    [firstKey]: nextFirstValue,
    [secondKey]: nextSecondValue,
    [winnerKey]: nextWinnerValue,
  };
};

export const progressMatchWinner = ({
  matches,
  currentMatch,
}: {
  matches: Match[];
  currentMatch: Match;
}): {
  matches: Match[];
  affectedMatches: Match[];
} => {
  let nextMatches = upsertMatch(matches, currentMatch);
  const affectedMatches: Match[] = [currentMatch];
  const previousMatch = matches.find((match) => match.id === currentMatch.id);

  if (!currentMatch.nextSeriesId && !previousMatch?.nextSeriesId) {
    return {
      matches: nextMatches,
      affectedMatches,
    };
  }

  const nextSeriesIds = Array.from(
    new Set(
      [previousMatch?.nextSeriesId || "", currentMatch.nextSeriesId || ""].filter(
        Boolean
      )
    )
  );

  nextSeriesIds.forEach((nextSeriesId) => {
    const nextMatch = nextMatches.find(
      (match) => match.seriesId === nextSeriesId
    );

    if (!nextMatch) return;

    const oldWinnerId =
      previousMatch && previousMatch.nextSeriesId === nextSeriesId
        ? getWinnerForMatchType(previousMatch, nextMatch.matchType)
        : 0;
    const newWinnerId =
      currentMatch.nextSeriesId === nextSeriesId
        ? getWinnerForMatchType(currentMatch, nextMatch.matchType)
        : 0;

    let updatedNextMatch = reconcileNextMatchParticipant({
      nextMatch,
      oldWinnerId,
      newWinnerId,
    });
    const shouldClearNextWinner =
      oldWinnerId > 0 &&
      oldWinnerId !== newWinnerId &&
      getWinnerForMatchType(nextMatch, nextMatch.matchType) === oldWinnerId;

    if (shouldClearNextWinner) {
      updatedNextMatch = removeStaleParticipantFromMatch({
        match: updatedNextMatch,
        staleParticipantId: oldWinnerId,
      });
    }

    if (updatedNextMatch === nextMatch) return;

    nextMatches = nextMatches.map((match) =>
      match.id === updatedNextMatch.id ? updatedNextMatch : match
    );
    affectedMatches.push(updatedNextMatch);

    if (
      oldWinnerId <= 0 ||
      oldWinnerId === newWinnerId ||
      getWinnerForMatchType(nextMatch, nextMatch.matchType) !== oldWinnerId
    ) {
      return;
    }

    let staleParticipantId = oldWinnerId;
    let currentCascadeMatch = updatedNextMatch;
    const visitedSeriesIds = new Set<string>();

    while (currentCascadeMatch.nextSeriesId) {
      if (visitedSeriesIds.has(currentCascadeMatch.nextSeriesId)) break;
      visitedSeriesIds.add(currentCascadeMatch.nextSeriesId);

      const downstreamMatch = nextMatches.find(
        (match) => match.seriesId === currentCascadeMatch.nextSeriesId
      );

      if (!downstreamMatch) break;

      const updatedDownstreamMatch = removeStaleParticipantFromMatch({
        match: downstreamMatch,
        staleParticipantId,
      });

      if (updatedDownstreamMatch === downstreamMatch) break;

      nextMatches = nextMatches.map((match) =>
        match.id === updatedDownstreamMatch.id ? updatedDownstreamMatch : match
      );
      affectedMatches.push(updatedDownstreamMatch);

      if (
        getWinnerForMatchType(downstreamMatch, downstreamMatch.matchType) !==
        staleParticipantId
      ) {
        break;
      }

      currentCascadeMatch = updatedDownstreamMatch;
    }
  });

  return {
    matches: nextMatches,
    affectedMatches: uniqueMatchesById(affectedMatches),
  };
};
