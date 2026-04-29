import { describe, expect, it } from "vitest";

import { Match } from "../../types";
import { progressMatchWinner } from "./matchProgression";

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
  seriesId: "",
  nextSeriesId: "",
  ...overrides,
});

const findById = (matches: Match[], id: number) => {
  const match = matches.find((m) => m.id === id);
  if (!match) throw new Error(`match ${id} not found`);
  return match;
};

describe("progressMatchWinner — leaf to next", () => {
  it("inserts winner into the empty slot of next match", () => {
    const qf = makeMatch({
      id: 1,
      player1: 10,
      player2: 20,
      seriesId: "QF1",
      nextSeriesId: "SF1",
    });
    const sf = makeMatch({
      id: 2,
      player1: 0,
      player2: 0,
      seriesId: "SF1",
      nextSeriesId: "F1",
    });

    const updatedQf: Match = { ...qf, winnerId: 10 };
    const result = progressMatchWinner({
      matches: [qf, sf],
      currentMatch: updatedQf,
    });

    const sfAfter = findById(result.matches, 2);
    expect(sfAfter.player1).toBe(10);
    expect(sfAfter.player2).toBe(0);
    expect(result.affectedMatches.map((m) => m.id).sort()).toEqual([1, 2]);
  });

  it("fills the second slot when first slot is occupied", () => {
    const qf = makeMatch({
      id: 1,
      player1: 10,
      player2: 20,
      seriesId: "QF1",
      nextSeriesId: "SF1",
    });
    const sf = makeMatch({
      id: 2,
      player1: 99,
      player2: 0,
      seriesId: "SF1",
    });

    const updatedQf: Match = { ...qf, winnerId: 10 };
    const result = progressMatchWinner({
      matches: [qf, sf],
      currentMatch: updatedQf,
    });

    const sfAfter = findById(result.matches, 2);
    expect(sfAfter.player1).toBe(99);
    expect(sfAfter.player2).toBe(10);
  });
});

describe("progressMatchWinner — changing winner", () => {
  it("removes old winner and inserts new winner into next match", () => {
    const qf = makeMatch({
      id: 1,
      player1: 10,
      player2: 20,
      winnerId: 10,
      seriesId: "QF1",
      nextSeriesId: "SF1",
    });
    const sf = makeMatch({
      id: 2,
      player1: 10,
      player2: 30,
      seriesId: "SF1",
      nextSeriesId: "F1",
    });

    const updatedQf: Match = { ...qf, winnerId: 20 };
    const result = progressMatchWinner({
      matches: [qf, sf],
      currentMatch: updatedQf,
    });

    const sfAfter = findById(result.matches, 2);
    expect(sfAfter.player1).toBe(20);
    expect(sfAfter.player2).toBe(30);
  });
});

describe("progressMatchWinner — cascade invalidation", () => {
  it("clears stale winner from SF AND from Final when QF winner changes", () => {
    const qf = makeMatch({
      id: 1,
      player1: 10,
      player2: 20,
      winnerId: 10,
      seriesId: "QF1",
      nextSeriesId: "SF1",
    });
    const sf = makeMatch({
      id: 2,
      player1: 10,
      player2: 30,
      winnerId: 10,
      seriesId: "SF1",
      nextSeriesId: "F1",
    });
    const final = makeMatch({
      id: 3,
      player1: 10,
      player2: 40,
      seriesId: "F1",
      nextSeriesId: "",
    });

    const updatedQf: Match = { ...qf, winnerId: 20 };
    const result = progressMatchWinner({
      matches: [qf, sf, final],
      currentMatch: updatedQf,
    });

    const sfAfter = findById(result.matches, 2);
    const finalAfter = findById(result.matches, 3);

    expect(sfAfter.player1).toBe(20);
    expect(sfAfter.player2).toBe(30);
    expect(sfAfter.winnerId).toBe(0);

    expect(finalAfter.player1).toBe(0);
    expect(finalAfter.player2).toBe(40);

    const affectedIds = result.affectedMatches.map((m) => m.id).sort();
    expect(affectedIds).toEqual([1, 2, 3]);
  });
});

describe("progressMatchWinner — empty nextSeriesId", () => {
  it("only upserts current match without crashing when nextSeriesId is empty", () => {
    const final = makeMatch({
      id: 1,
      player1: 10,
      player2: 20,
      seriesId: "F1",
      nextSeriesId: "",
    });

    const updatedFinal: Match = { ...final, winnerId: 10 };
    const result = progressMatchWinner({
      matches: [final],
      currentMatch: updatedFinal,
    });

    expect(result.matches).toHaveLength(1);
    expect(findById(result.matches, 1).winnerId).toBe(10);
    expect(result.affectedMatches).toHaveLength(1);
  });

  it("upserts a brand new match (not yet in matches list)", () => {
    const newMatch = makeMatch({
      id: 42,
      player1: 1,
      player2: 2,
      winnerId: 1,
    });

    const result = progressMatchWinner({
      matches: [],
      currentMatch: newMatch,
    });

    expect(result.matches).toHaveLength(1);
    expect(findById(result.matches, 42).winnerId).toBe(1);
  });
});

describe("progressMatchWinner — team match support", () => {
  it("progresses winner using team1/team2/winnerTeamId fields", () => {
    const qf = makeMatch({
      id: 1,
      matchType: "team",
      team1: 100,
      team2: 200,
      seriesId: "QF1",
      nextSeriesId: "SF1",
    });
    const sf = makeMatch({
      id: 2,
      matchType: "team",
      team1: 0,
      team2: 0,
      seriesId: "SF1",
    });

    const updatedQf: Match = { ...qf, winnerTeamId: 100 };
    const result = progressMatchWinner({
      matches: [qf, sf],
      currentMatch: updatedQf,
    });

    const sfAfter = findById(result.matches, 2);
    expect(sfAfter.team1).toBe(100);
    expect(sfAfter.team2).toBe(0);
  });

  it("clears stale team winner downstream on cascade", () => {
    const qf = makeMatch({
      id: 1,
      matchType: "team",
      team1: 100,
      team2: 200,
      winnerTeamId: 100,
      seriesId: "QF1",
      nextSeriesId: "SF1",
    });
    const sf = makeMatch({
      id: 2,
      matchType: "team",
      team1: 100,
      team2: 300,
      winnerTeamId: 100,
      seriesId: "SF1",
      nextSeriesId: "F1",
    });
    const final = makeMatch({
      id: 3,
      matchType: "team",
      team1: 100,
      team2: 400,
      seriesId: "F1",
    });

    const updatedQf: Match = { ...qf, winnerTeamId: 200 };
    const result = progressMatchWinner({
      matches: [qf, sf, final],
      currentMatch: updatedQf,
    });

    const sfAfter = findById(result.matches, 2);
    const finalAfter = findById(result.matches, 3);

    expect(sfAfter.team1).toBe(200);
    expect(sfAfter.team2).toBe(300);
    expect(sfAfter.winnerTeamId).toBe(0);
    expect(finalAfter.team1).toBe(0);
    expect(finalAfter.team2).toBe(400);
  });
});

describe("progressMatchWinner — cycle protection", () => {
  it("does not infinite-loop on circular nextSeriesId chain", () => {
    // Corrupted data: A -> B -> A
    const a = makeMatch({
      id: 1,
      player1: 10,
      player2: 20,
      winnerId: 10,
      seriesId: "A",
      nextSeriesId: "B",
    });
    const b = makeMatch({
      id: 2,
      player1: 10,
      player2: 30,
      winnerId: 10,
      seriesId: "B",
      nextSeriesId: "A",
    });

    const updatedA: Match = { ...a, winnerId: 20 };

    const start = Date.now();
    const result = progressMatchWinner({
      matches: [a, b],
      currentMatch: updatedA,
    });
    const elapsedMs = Date.now() - start;

    // Must terminate quickly (well under any reasonable timeout)
    expect(elapsedMs).toBeLessThan(1000);
    expect(result.matches).toHaveLength(2);
    expect(result.affectedMatches.length).toBeGreaterThan(0);
  });

  it("does not infinite-loop on self-referential nextSeriesId", () => {
    const a = makeMatch({
      id: 1,
      player1: 10,
      player2: 20,
      winnerId: 10,
      seriesId: "A",
      nextSeriesId: "A",
    });

    const updatedA: Match = { ...a, winnerId: 20 };

    const start = Date.now();
    const result = progressMatchWinner({
      matches: [a],
      currentMatch: updatedA,
    });
    const elapsedMs = Date.now() - start;

    expect(elapsedMs).toBeLessThan(1000);
    expect(findById(result.matches, 1).winnerId).toBe(20);
  });
});
