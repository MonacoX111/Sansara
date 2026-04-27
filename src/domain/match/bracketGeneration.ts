import { Match, MatchStage } from "../../types";
import { sortMatchesByOrder } from "./matchOrdering";

type BracketPlanItem = {
  seriesId: string;
  nextSeriesId: string;
  roundLabel: string;
  stage: MatchStage;
};

export type BracketGenerationResult =
  | {
      ok: true;
      matches: Match[];
      updatedMatches: Match[];
    }
  | {
      ok: false;
      reason: "missing_tournament" | "no_matches" | "unsupported_size";
      message: string;
    };

const getParticipantKey = (match: Match): string => {
  const firstId =
    match.matchType === "team"
      ? Number(match.team1 || 0)
      : Number(match.player1 || 0);

  const secondId =
    match.matchType === "team"
      ? Number(match.team2 || 0)
      : Number(match.player2 || 0);

  return [firstId, secondId].sort((a, b) => a - b).join("-");
};

const getRoundKey = (match: Match): string =>
  (match.roundLabel || match.round || "auto").trim().toLowerCase();

const getBracketPlan = (seriesCount: number): BracketPlanItem[] | null => {
  if (seriesCount === 3) {
    return [
      {
        seriesId: "SF1",
        nextSeriesId: "F1",
        roundLabel: "1/2 Final",
        stage: "playoff",
      },
      {
        seriesId: "SF2",
        nextSeriesId: "F1",
        roundLabel: "1/2 Final",
        stage: "playoff",
      },
      {
        seriesId: "F1",
        nextSeriesId: "",
        roundLabel: "Final",
        stage: "final",
      },
    ];
  }

  if (seriesCount === 7) {
    return [
      {
        seriesId: "QF1",
        nextSeriesId: "SF1",
        roundLabel: "1/4 Final",
        stage: "playoff",
      },
      {
        seriesId: "QF2",
        nextSeriesId: "SF1",
        roundLabel: "1/4 Final",
        stage: "playoff",
      },
      {
        seriesId: "QF3",
        nextSeriesId: "SF2",
        roundLabel: "1/4 Final",
        stage: "playoff",
      },
      {
        seriesId: "QF4",
        nextSeriesId: "SF2",
        roundLabel: "1/4 Final",
        stage: "playoff",
      },
      {
        seriesId: "SF1",
        nextSeriesId: "F1",
        roundLabel: "1/2 Final",
        stage: "playoff",
      },
      {
        seriesId: "SF2",
        nextSeriesId: "F1",
        roundLabel: "1/2 Final",
        stage: "playoff",
      },
      {
        seriesId: "F1",
        nextSeriesId: "",
        roundLabel: "Final",
        stage: "final",
      },
    ];
  }

  if (seriesCount === 15) {
    return [
      {
        seriesId: "R16-1",
        nextSeriesId: "QF1",
        roundLabel: "1/8 Final",
        stage: "playoff",
      },
      {
        seriesId: "R16-2",
        nextSeriesId: "QF1",
        roundLabel: "1/8 Final",
        stage: "playoff",
      },
      {
        seriesId: "R16-3",
        nextSeriesId: "QF2",
        roundLabel: "1/8 Final",
        stage: "playoff",
      },
      {
        seriesId: "R16-4",
        nextSeriesId: "QF2",
        roundLabel: "1/8 Final",
        stage: "playoff",
      },
      {
        seriesId: "R16-5",
        nextSeriesId: "QF3",
        roundLabel: "1/8 Final",
        stage: "playoff",
      },
      {
        seriesId: "R16-6",
        nextSeriesId: "QF3",
        roundLabel: "1/8 Final",
        stage: "playoff",
      },
      {
        seriesId: "R16-7",
        nextSeriesId: "QF4",
        roundLabel: "1/8 Final",
        stage: "playoff",
      },
      {
        seriesId: "R16-8",
        nextSeriesId: "QF4",
        roundLabel: "1/8 Final",
        stage: "playoff",
      },
      {
        seriesId: "QF1",
        nextSeriesId: "SF1",
        roundLabel: "1/4 Final",
        stage: "playoff",
      },
      {
        seriesId: "QF2",
        nextSeriesId: "SF1",
        roundLabel: "1/4 Final",
        stage: "playoff",
      },
      {
        seriesId: "QF3",
        nextSeriesId: "SF2",
        roundLabel: "1/4 Final",
        stage: "playoff",
      },
      {
        seriesId: "QF4",
        nextSeriesId: "SF2",
        roundLabel: "1/4 Final",
        stage: "playoff",
      },
      {
        seriesId: "SF1",
        nextSeriesId: "F1",
        roundLabel: "1/2 Final",
        stage: "playoff",
      },
      {
        seriesId: "SF2",
        nextSeriesId: "F1",
        roundLabel: "1/2 Final",
        stage: "playoff",
      },
      {
        seriesId: "F1",
        nextSeriesId: "",
        roundLabel: "Final",
        stage: "final",
      },
    ];
  }

  return null;
};

export const generateBracketMatches = ({
  matches,
  tournamentId,
}: {
  matches: Match[];
  tournamentId: number;
}): BracketGenerationResult => {
  if (!tournamentId) {
    return {
      ok: false,
      reason: "missing_tournament",
      message: "Select tournament first",
    };
  }

  const tournamentMatches = sortMatchesByOrder(
    matches.filter((match) => match.tournamentId === tournamentId)
  );

  if (tournamentMatches.length === 0) {
    return {
      ok: false,
      reason: "no_matches",
      message: "No matches found for this tournament",
    };
  }

  const seriesMap = new Map<string, Match[]>();

  tournamentMatches.forEach((match) => {
    const key = `${getRoundKey(match)}-${getParticipantKey(match)}`;
    const current = seriesMap.get(key) || [];
    seriesMap.set(key, [...current, match]);
  });

  const seriesGroups = Array.from(seriesMap.values()).sort(
    (a, b) => (a[0].order ?? a[0].id) - (b[0].order ?? b[0].id)
  );

  const bracketPlan = getBracketPlan(seriesGroups.length);

  if (!bracketPlan) {
    return {
      ok: false,
      reason: "unsupported_size",
      message: `Supported playoff sizes: 4 teams = 3 series, 8 teams = 7 series, 16 teams = 15 series. Found ${seriesGroups.length}`,
    };
  }

  const updatedMatches: Match[] = [];

  const nextMatches = matches.map((match) => {
    const groupIndex = seriesGroups.findIndex((group) =>
      group.some((groupMatch) => groupMatch.id === match.id)
    );

    if (groupIndex === -1) return match;

    const plan = bracketPlan[groupIndex];
    const updatedMatch: Match = {
      ...match,
      stage: plan.stage,
      round: plan.roundLabel,
      roundLabel: plan.roundLabel,
      seriesId: plan.seriesId,
      nextSeriesId: plan.nextSeriesId,
    };

    updatedMatches.push(updatedMatch);
    return updatedMatch;
  });

  return {
    ok: true,
    matches: nextMatches,
    updatedMatches,
  };
};
