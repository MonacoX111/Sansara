import { describe, expect, it } from "vitest";

import { Match } from "../../types";
import { generateBracketMatches } from "./bracketGeneration";

const makeMatch = (overrides: Partial<Match>): Match => ({
  id: 1,
  game: "g",
  matchType: "player",
  score: "",
  date: "",
  status: "scheduled",
  round: "",
  bestOf: 1,
  notes: "",
  tournamentId: 1,
  ...overrides,
});

const ok = <T extends { ok: boolean }>(result: T) => {
  if (!result.ok) {
    throw new Error("expected ok=true result");
  }
  return result as Extract<T, { ok: true }>;
};

describe("generateBracketMatches — error cases", () => {
  it("returns missing_tournament when tournamentId is 0", () => {
    const result = generateBracketMatches({ matches: [], tournamentId: 0 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing_tournament");
    }
  });

  it("returns no_matches when no matches belong to tournament", () => {
    const matches = [makeMatch({ id: 1, tournamentId: 99 })];

    const result = generateBracketMatches({ matches, tournamentId: 1 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("no_matches");
    }
  });

  it("returns unsupported_size for non-{3,7,15} series counts", () => {
    const matches = [
      makeMatch({ id: 1, order: 1, player1: 1, player2: 2 }),
      makeMatch({ id: 2, order: 2, player1: 3, player2: 4 }),
    ];

    const result = generateBracketMatches({ matches, tournamentId: 1 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("unsupported_size");
      expect(result.message).toContain("Found 2");
    }
  });
});

describe("generateBracketMatches — 3 series (4 teams, single elim)", () => {
  it("labels matches as SF1, SF2, F1 in order", () => {
    const matches = [
      makeMatch({ id: 1, order: 1, player1: 1, player2: 2 }),
      makeMatch({ id: 2, order: 2, player1: 3, player2: 4 }),
      makeMatch({ id: 3, order: 3, player1: 5, player2: 6 }),
    ];

    const result = ok(generateBracketMatches({ matches, tournamentId: 1 }));

    expect(result.matches[0].seriesId).toBe("SF1");
    expect(result.matches[0].nextSeriesId).toBe("F1");
    expect(result.matches[0].roundLabel).toBe("1/2 Final");
    expect(result.matches[0].stage).toBe("playoff");

    expect(result.matches[1].seriesId).toBe("SF2");
    expect(result.matches[1].nextSeriesId).toBe("F1");

    expect(result.matches[2].seriesId).toBe("F1");
    expect(result.matches[2].nextSeriesId).toBe("");
    expect(result.matches[2].roundLabel).toBe("Final");
    expect(result.matches[2].stage).toBe("final");
  });

  it("groups multi-game series (BO3) into a single bracket slot", () => {
    const matches = [
      makeMatch({ id: 1, order: 1, player1: 1, player2: 2, roundLabel: "SF" }),
      makeMatch({ id: 2, order: 2, player1: 1, player2: 2, roundLabel: "SF" }),
      makeMatch({ id: 3, order: 3, player1: 3, player2: 4, roundLabel: "SF" }),
      makeMatch({ id: 4, order: 4, player1: 5, player2: 6, roundLabel: "F" }),
    ];

    const result = ok(generateBracketMatches({ matches, tournamentId: 1 }));

    expect(result.matches[0].seriesId).toBe("SF1");
    expect(result.matches[1].seriesId).toBe("SF1");
    expect(result.matches[2].seriesId).toBe("SF2");
    expect(result.matches[3].seriesId).toBe("F1");
    expect(result.updatedMatches).toHaveLength(4);
  });
});

describe("generateBracketMatches — 7 series (8 teams)", () => {
  it("labels QF1-4, SF1-2, F1 in order", () => {
    const matches = Array.from({ length: 7 }, (_, idx) =>
      makeMatch({
        id: idx + 1,
        order: idx + 1,
        player1: idx * 2 + 1,
        player2: idx * 2 + 2,
      })
    );

    const result = ok(generateBracketMatches({ matches, tournamentId: 1 }));

    expect(result.matches.map((m) => m.seriesId)).toEqual([
      "QF1",
      "QF2",
      "QF3",
      "QF4",
      "SF1",
      "SF2",
      "F1",
    ]);
    expect(result.matches[0].nextSeriesId).toBe("SF1");
    expect(result.matches[1].nextSeriesId).toBe("SF1");
    expect(result.matches[2].nextSeriesId).toBe("SF2");
    expect(result.matches[3].nextSeriesId).toBe("SF2");
    expect(result.matches[4].nextSeriesId).toBe("F1");
    expect(result.matches[5].nextSeriesId).toBe("F1");
    expect(result.matches[6].nextSeriesId).toBe("");
    expect(result.matches[6].stage).toBe("final");
  });
});

describe("generateBracketMatches — 15 series (16 teams)", () => {
  it("labels R16-1..8, QF1-4, SF1-2, F1 in order", () => {
    const matches = Array.from({ length: 15 }, (_, idx) =>
      makeMatch({
        id: idx + 1,
        order: idx + 1,
        player1: idx * 2 + 1,
        player2: idx * 2 + 2,
      })
    );

    const result = ok(generateBracketMatches({ matches, tournamentId: 1 }));

    expect(result.matches.map((m) => m.seriesId)).toEqual([
      "R16-1",
      "R16-2",
      "R16-3",
      "R16-4",
      "R16-5",
      "R16-6",
      "R16-7",
      "R16-8",
      "QF1",
      "QF2",
      "QF3",
      "QF4",
      "SF1",
      "SF2",
      "F1",
    ]);
    expect(result.matches[0].roundLabel).toBe("1/8 Final");
    expect(result.matches[8].roundLabel).toBe("1/4 Final");
    expect(result.matches[12].roundLabel).toBe("1/2 Final");
    expect(result.matches[14].roundLabel).toBe("Final");
  });
});

describe("generateBracketMatches — preserves untouched matches", () => {
  it("does not modify matches from other tournaments", () => {
    const ownedMatches = [
      makeMatch({ id: 1, order: 1, player1: 1, player2: 2 }),
      makeMatch({ id: 2, order: 2, player1: 3, player2: 4 }),
      makeMatch({ id: 3, order: 3, player1: 5, player2: 6 }),
    ];
    const foreign = makeMatch({
      id: 99,
      tournamentId: 2,
      seriesId: "DO_NOT_TOUCH",
      player1: 100,
      player2: 200,
    });

    const result = ok(
      generateBracketMatches({
        matches: [...ownedMatches, foreign],
        tournamentId: 1,
      })
    );

    const untouched = result.matches.find((m) => m.id === 99);
    expect(untouched?.seriesId).toBe("DO_NOT_TOUCH");
  });
});
