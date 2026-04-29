import { describe, expect, it } from "vitest";

import { Match } from "../../types";
import { compareMatchesByOrder, sortMatchesByOrder } from "./matchOrdering";

const makeMatch = (overrides: Partial<Match>): Match => ({
  id: 1,
  game: "g",
  matchType: "player",
  score: "",
  date: "",
  status: "completed",
  round: "",
  bestOf: 1,
  notes: "",
  ...overrides,
});

describe("compareMatchesByOrder", () => {
  it("sorts ascending by order field", () => {
    const a = makeMatch({ id: 1, order: 5 });
    const b = makeMatch({ id: 2, order: 1 });

    expect(compareMatchesByOrder(a, b)).toBeGreaterThan(0);
    expect(compareMatchesByOrder(b, a)).toBeLessThan(0);
  });

  it("falls back to id when order is undefined", () => {
    const a = makeMatch({ id: 10 });
    const b = makeMatch({ id: 3 });

    expect(compareMatchesByOrder(a, b)).toBeGreaterThan(0);
    expect(compareMatchesByOrder(b, a)).toBeLessThan(0);
  });

  it("does not break when both order values are undefined", () => {
    const a = makeMatch({ id: 1 });
    const b = makeMatch({ id: 2 });

    expect(compareMatchesByOrder(a, b)).toBeLessThan(0);
    expect(compareMatchesByOrder(b, a)).toBeGreaterThan(0);
  });

  it("treats explicit order as priority over id", () => {
    const a = makeMatch({ id: 100, order: 1 });
    const b = makeMatch({ id: 1, order: 2 });

    expect(compareMatchesByOrder(a, b)).toBeLessThan(0);
  });
});

describe("sortMatchesByOrder", () => {
  it("returns ascending order without mutating input", () => {
    const input = [
      makeMatch({ id: 1, order: 3 }),
      makeMatch({ id: 2, order: 1 }),
      makeMatch({ id: 3, order: 2 }),
    ];
    const inputSnapshot = [...input];

    const sorted = sortMatchesByOrder(input);

    expect(sorted.map((m) => m.id)).toEqual([2, 3, 1]);
    expect(input).toEqual(inputSnapshot);
  });

  it("handles empty input", () => {
    expect(sortMatchesByOrder([])).toEqual([]);
  });

  it("falls back to id ordering when all orders are undefined", () => {
    const input = [
      makeMatch({ id: 5 }),
      makeMatch({ id: 2 }),
      makeMatch({ id: 8 }),
    ];

    const sorted = sortMatchesByOrder(input);

    expect(sorted.map((m) => m.id)).toEqual([2, 5, 8]);
  });
});
