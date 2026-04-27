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

const reconcileNextMatchParticipant = ({
  nextMatch,
  oldWinnerId,
  newWinnerId,
}: {
  nextMatch: Match;
  oldWinnerId: number;
  newWinnerId: number;
}): Match => {
  const firstKey = nextMatch.matchType === "team" ? "team1" : "player1";
  const secondKey = nextMatch.matchType === "team" ? "team2" : "player2";
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

    const updatedNextMatch = reconcileNextMatchParticipant({
      nextMatch,
      oldWinnerId,
      newWinnerId,
    });

    if (updatedNextMatch === nextMatch) return;

    nextMatches = nextMatches.map((match) =>
      match.id === updatedNextMatch.id ? updatedNextMatch : match
    );
    affectedMatches.push(updatedNextMatch);
  });

  return {
    matches: nextMatches,
    affectedMatches: uniqueMatchesById(affectedMatches),
  };
};
