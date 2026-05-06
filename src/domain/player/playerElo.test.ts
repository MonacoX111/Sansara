import { describe, expect, it } from "vitest";

import { Player, Tournament } from "../../types";
import { getPlacementEloBonus } from "./playerEloHistory";
import {
  applyTournamentPlacementElo,
  BASE_ELO,
  recalculateAllPlayersElo,
} from "./playerElo";

const makePlayer = (overrides: Partial<Player>): Player => ({
  id: 1,
  nickname: "p",
  fullName: "Player One",
  avatar: "",
  teamId: 0,
  games: [],
  wins: 0,
  losses: 0,
  earnings: 0,
  tournamentsWon: 0,
  rank: 0,
  elo: BASE_ELO,
  bio: "",
  ...overrides,
});

const makeTournament = (overrides: Partial<Tournament>): Tournament => ({
  id: 1,
  title: "T",
  game: "g",
  type: "1x1",
  format: "playoff",
  status: "finished",
  date: "2025-01-01",
  prize: "",
  description: "",
  imageUrl: "",
  participantType: "player",
  participantIds: [],
  placements: [],
  isPublished: true,
  ...overrides,
});

describe("getPlacementEloBonus", () => {
  it("gives +200 for 1st place", () => {
    expect(getPlacementEloBonus(1)).toBe(200);
  });

  it("gives +100 for 2nd place", () => {
    expect(getPlacementEloBonus(2)).toBe(100);
  });

  it("gives +50 for 3rd place", () => {
    expect(getPlacementEloBonus(3)).toBe(50);
  });

  it("gives 0 for 4th place and below", () => {
    expect(getPlacementEloBonus(4)).toBe(0);
    expect(getPlacementEloBonus(10)).toBe(0);
  });

  it("gives 0 for invalid place values", () => {
    expect(getPlacementEloBonus(0)).toBe(0);
    expect(getPlacementEloBonus(-1)).toBe(0);
  });
});

describe("applyTournamentPlacementElo", () => {
  const players = [
    makePlayer({ id: 1, nickname: "alpha", elo: 1000 }),
    makePlayer({ id: 2, nickname: "beta", elo: 1000 }),
    makePlayer({ id: 3, nickname: "gamma", elo: 1000 }),
  ];

  it("applies ELO bonuses for finished tournament", () => {
    const tournament = makeTournament({
      status: "finished",
      placements: [
        { place: 1, playerId: 1 },
        { place: 2, playerId: 2 },
        { place: 3, playerId: 3 },
      ],
    });

    const result = applyTournamentPlacementElo(players, tournament);

    expect(result.applied).toBe(true);
    expect(result.players.find((p) => p.id === 1)?.elo).toBe(1200);
    expect(result.players.find((p) => p.id === 2)?.elo).toBe(1100);
    expect(result.players.find((p) => p.id === 3)?.elo).toBe(1050);
  });

  it("applies ELO bonuses for completed tournament", () => {
    const tournament = makeTournament({
      status: "completed",
      placements: [{ place: 1, playerId: 1 }],
    });

    const result = applyTournamentPlacementElo(players, tournament);

    expect(result.applied).toBe(true);
    expect(result.players.find((p) => p.id === 1)?.elo).toBe(1200);
  });

  it("does NOT apply ELO when tournament is not finished", () => {
    const tournament = makeTournament({
      status: "ongoing",
      placements: [{ place: 1, playerId: 1 }],
    });

    const result = applyTournamentPlacementElo(players, tournament);

    expect(result.applied).toBe(false);
    expect(result.players).toBe(players);
    expect(result.players.find((p) => p.id === 1)?.elo).toBe(1000);
  });

  it("does NOT apply ELO when tournament is draft", () => {
    const tournament = makeTournament({
      status: "draft",
      placements: [{ place: 1, playerId: 1 }],
    });

    const result = applyTournamentPlacementElo(players, tournament);

    expect(result.applied).toBe(false);
  });

  it("returns applied=false when no qualifying placements exist", () => {
    const tournament = makeTournament({
      status: "finished",
      placements: [{ place: 4, playerId: 1 }],
    });

    const result = applyTournamentPlacementElo(players, tournament);

    expect(result.applied).toBe(false);
    expect(result.players.find((p) => p.id === 1)?.elo).toBe(1000);
  });
});

describe("recalculateAllPlayersElo", () => {
  it("resets current ELO before rebuilding from completed tournament placements", () => {
    const players = [
      makePlayer({ id: 1, nickname: "alpha", elo: 2222 }),
      makePlayer({ id: 2, nickname: "beta", elo: 900 }),
      makePlayer({ id: 3, nickname: "gamma", elo: 1300 }),
      makePlayer({ id: 4, nickname: "delta", elo: 1700 }),
    ];
    const tournaments = [
      makeTournament({
        id: 1,
        status: "completed",
        placements: [
          { place: 1, playerId: 1 },
          { place: 2, playerId: 2 },
          { place: 3, playerId: 3 },
          { place: 4, playerId: 4 },
        ],
      }),
      makeTournament({
        id: 2,
        status: "draft",
        placements: [{ place: 1, playerId: 4 }],
      }),
    ];

    const result = recalculateAllPlayersElo(players, tournaments);

    expect(result.find((p) => p.id === 1)?.elo).toBe(BASE_ELO + 200);
    expect(result.find((p) => p.id === 2)?.elo).toBe(BASE_ELO + 100);
    expect(result.find((p) => p.id === 3)?.elo).toBe(BASE_ELO + 50);
    expect(result.find((p) => p.id === 4)?.elo).toBe(BASE_ELO);
  });

  it("uses team roster snapshots when present", () => {
    const players = [
      makePlayer({ id: 1, nickname: "alpha", teamId: 10 }),
      makePlayer({ id: 2, nickname: "beta", teamId: 20 }),
      makePlayer({ id: 3, nickname: "gamma", teamId: 10 }),
    ];
    const tournament = makeTournament({
      participantType: "team",
      participantIds: [10],
      placements: [{ place: 1, teamId: 10 }],
      teamRosters: [{ teamId: 10, playerIds: [2] }],
    });

    const result = recalculateAllPlayersElo(players, [tournament]);

    expect(result.find((p) => p.id === 1)?.elo).toBe(BASE_ELO);
    expect(result.find((p) => p.id === 2)?.elo).toBe(BASE_ELO + 200);
    expect(result.find((p) => p.id === 3)?.elo).toBe(BASE_ELO);
  });

  it("falls back to current team players only when teamRosters are absent", () => {
    const players = [
      makePlayer({ id: 1, nickname: "alpha", teamId: 10 }),
      makePlayer({ id: 2, nickname: "beta", teamId: 10 }),
      makePlayer({ id: 3, nickname: "gamma", teamId: 20 }),
    ];
    const tournament = makeTournament({
      participantType: "team",
      participantIds: [10],
      placements: [{ place: 1, teamId: 10 }],
      teamRosters: undefined,
    });

    const result = recalculateAllPlayersElo(players, [tournament]);

    expect(result.find((p) => p.id === 1)?.elo).toBe(BASE_ELO + 200);
    expect(result.find((p) => p.id === 2)?.elo).toBe(BASE_ELO + 200);
    expect(result.find((p) => p.id === 3)?.elo).toBe(BASE_ELO);
  });

  it("does not fall back when a roster snapshot exists but is empty", () => {
    const players = [
      makePlayer({ id: 1, nickname: "alpha", teamId: 10 }),
      makePlayer({ id: 2, nickname: "beta", teamId: 10 }),
    ];
    const tournament = makeTournament({
      participantType: "team",
      participantIds: [10],
      placements: [{ place: 1, teamId: 10 }],
      teamRosters: [{ teamId: 10, playerIds: [] }],
    });

    const result = recalculateAllPlayersElo(players, [tournament]);

    expect(result.find((p) => p.id === 1)?.elo).toBe(BASE_ELO);
    expect(result.find((p) => p.id === 2)?.elo).toBe(BASE_ELO);
  });
});
