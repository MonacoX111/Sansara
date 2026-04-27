import { Match } from "../../types";

export type MatchReorderDirection = "up" | "down";

export const normalizeMatches = (items: Match[]): Match[] =>
  items.map((match, index) => ({
    ...match,
    order: typeof match.order === "number" ? match.order : index,
    score: match.score || "",
    winnerId: Number(match.winnerId || 0),
    tournamentId: Number(match.tournamentId || 0),
    status: match.status || "scheduled",
    seriesId: match.seriesId || "",
    nextSeriesId: match.nextSeriesId || "",
    round: match.round || "",
    stage: match.stage || "group",
    groupName: match.groupName || "",
    roundLabel: match.roundLabel || "",
    bestOf: Number(match.bestOf || 1),
    notes: match.notes || "",
    eloApplied: Boolean(match.eloApplied),
  }));

export const compareMatchesByOrder = (a: Match, b: Match): number =>
  (a.order ?? a.id) - (b.order ?? b.id);

export const sortMatchesByOrder = (matches: Match[]): Match[] =>
  [...matches].sort(compareMatchesByOrder);

export const getTopOrderForNewMatch = (
  matches: Match[],
  tournamentId: number
): number => {
  const tournamentMatchOrders = matches
    .filter((match) => Number(match.tournamentId || 0) === tournamentId)
    .map((match) => match.order ?? match.id);

  return tournamentMatchOrders.length > 0
    ? Math.min(...tournamentMatchOrders) - 1
    : 0;
};

export const getFallbackMatchOrder = (
  matches: Match[],
  tournamentId: number
): number =>
  matches.filter((match) => Number(match.tournamentId || 0) === tournamentId)
    .length;

export const reorderMatchByOrder = ({
  matches,
  selectedMatchId,
  direction,
  tournamentId,
}: {
  matches: Match[];
  selectedMatchId: number;
  direction: MatchReorderDirection;
  tournamentId: number;
}):
  | {
      matches: Match[];
      updatedMatches: [Match, Match];
      selectedMatchId: number;
    }
  | null => {
  const selectedTournamentId = Number(tournamentId || 0);
  const visibleMatches = sortMatchesByOrder(
    matches.filter(
      (match) => Number(match.tournamentId || 0) === selectedTournamentId
    )
  );

  const currentIndex = visibleMatches.findIndex(
    (match) => match.id === selectedMatchId
  );

  if (currentIndex === -1) return null;
  if (direction === "up" && currentIndex === 0) return null;
  if (direction === "down" && currentIndex === visibleMatches.length - 1) {
    return null;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const currentMatch = visibleMatches[currentIndex];
  const targetMatch = visibleMatches[targetIndex];

  const updatedCurrentMatch: Match = {
    ...currentMatch,
    order: targetMatch.order ?? targetMatch.id,
  };

  const updatedTargetMatch: Match = {
    ...targetMatch,
    order: currentMatch.order ?? currentMatch.id,
  };

  const nextMatches = matches.map((match) => {
    if (match.id === currentMatch.id) return updatedCurrentMatch;
    if (match.id === targetMatch.id) return updatedTargetMatch;
    return match;
  });

  return {
    matches: nextMatches,
    updatedMatches: [updatedCurrentMatch, updatedTargetMatch],
    selectedMatchId: currentMatch.id,
  };
};
