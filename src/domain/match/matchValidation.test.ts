import { describe, expect, it } from "vitest";

import { Match } from "../../types";
import { validateMatchWinner } from "./matchValidation";

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
  ...overrides,
});

describe("validateMatchWinner — player match", () => {
  it("returns valid when winnerId equals player1", () => {
    const match = makeMatch({
      matchType: "player",
      player1: 10,
      player2: 20,
      winnerId: 10,
    });

    expect(validateMatchWinner(match)).toEqual({ valid: true });
  });

  it("returns valid when winnerId equals player2", () => {
    const match = makeMatch({
      matchType: "player",
      player1: 10,
      player2: 20,
      winnerId: 20,
    });

    expect(validateMatchWinner(match)).toEqual({ valid: true });
  });

  it("returns invalid when winnerId is not one of the players", () => {
    const match = makeMatch({
      matchType: "player",
      player1: 10,
      player2: 20,
      winnerId: 999,
    });

    const result = validateMatchWinner(match);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toBe("Invalid match winner");
      expect(result.logMessage).toContain("winnerId");
    }
  });

  it("treats empty/undefined winnerId as valid (not yet decided)", () => {
    const noWinner = makeMatch({
      matchType: "player",
      player1: 10,
      player2: 20,
    });
    const zeroWinner = makeMatch({
      matchType: "player",
      player1: 10,
      player2: 20,
      winnerId: 0,
    });

    expect(validateMatchWinner(noWinner)).toEqual({ valid: true });
    expect(validateMatchWinner(zeroWinner)).toEqual({ valid: true });
  });
});

describe("validateMatchWinner — team match", () => {
  it("returns valid when winnerTeamId equals team1", () => {
    const match = makeMatch({
      matchType: "team",
      team1: 100,
      team2: 200,
      winnerTeamId: 100,
    });

    expect(validateMatchWinner(match)).toEqual({ valid: true });
  });

  it("returns valid when winnerTeamId equals team2", () => {
    const match = makeMatch({
      matchType: "team",
      team1: 100,
      team2: 200,
      winnerTeamId: 200,
    });

    expect(validateMatchWinner(match)).toEqual({ valid: true });
  });

  it("returns invalid when winnerTeamId is not one of the teams", () => {
    const match = makeMatch({
      matchType: "team",
      team1: 100,
      team2: 200,
      winnerTeamId: 9999,
    });

    const result = validateMatchWinner(match);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toBe("Invalid match winner");
      expect(result.logMessage).toContain("winnerTeamId");
    }
  });

  it("treats empty/undefined winnerTeamId as valid", () => {
    const match = makeMatch({
      matchType: "team",
      team1: 100,
      team2: 200,
    });

    expect(validateMatchWinner(match)).toEqual({ valid: true });
  });
});

describe("validateMatchWinner — type-specific guards", () => {
  it("does not validate team fields on a player match", () => {
    const match = makeMatch({
      matchType: "player",
      player1: 10,
      player2: 20,
      winnerId: 10,
      winnerTeamId: 9999,
    });

    expect(validateMatchWinner(match)).toEqual({ valid: true });
  });

  it("does not validate player fields on a team match", () => {
    const match = makeMatch({
      matchType: "team",
      team1: 100,
      team2: 200,
      winnerTeamId: 100,
      winnerId: 9999,
    });

    expect(validateMatchWinner(match)).toEqual({ valid: true });
  });
});
