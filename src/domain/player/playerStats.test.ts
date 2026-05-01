import { describe, expect, it } from "vitest";

import { PlayerRecentMatch, getPlayerStreakFromVisibleForm } from "./playerStats";

const makeVisibleForm = (results: Array<"W" | "L">): PlayerRecentMatch[] =>
  results.map((result, index) =>
    ({
      match: { id: index + 1 },
      opponentId: 0,
      opponentName: "Opponent",
      result: result === "W" ? "win" : "loss",
      tournamentName: "Tournament",
    }) as PlayerRecentMatch,
  );

describe("getPlayerStreakFromVisibleForm", () => {
  it.each([
    [["W", "W", "W", "L"], "L1"],
    [["W", "W", "L", "L"], "L2"],
    [["L", "W", "W", "W"], "W3"],
    [["W", "L", "W", "W"], "W2"],
  ] as const)(
    "counts backwards from the rightmost visible FORM badge for %s",
    (results, expectedLabel) => {
      expect(getPlayerStreakFromVisibleForm(makeVisibleForm([...results])).label).toBe(
        expectedLabel,
      );
    },
  );

  it("keeps the existing default label when there are no results", () => {
    expect(getPlayerStreakFromVisibleForm([]).label).toBe("-");
  });
});
