import { describe, expect, it } from "vitest";

import { Match, Player, Team, Tournament } from "../../types";
import {
  getBiggestUpset,
  getFeaturedMatch,
  getHotPlayer,
  getRivalry,
} from "./smartHighlights";

const makePlayer = (overrides: Partial<Player>): Player => ({
  id: 1,
  nickname: "p",
  fullName: "Player",
  avatar: "",
  teamId: 0,
  games: [],
  wins: 0,
  losses: 0,
  earnings: 0,
  tournamentsWon: 0,
  rank: 0,
  elo: 1000,
  bio: "",
  ...overrides,
});

const makeTeam = (overrides: Partial<Team>): Team => ({
  id: 1,
  name: "Team",
  logo: "",
  games: [],
  earnings: 0,
  wins: 0,
  players: [],
  description: "",
  ...overrides,
});

const makeTournament = (overrides: Partial<Tournament>): Tournament => ({
  id: 1,
  title: "Cup",
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

const makeMatch = (overrides: Partial<Match>): Match => ({
  id: 1,
  game: "g",
  matchType: "player",
  score: "",
  date: "2025-01-01",
  status: "completed",
  round: "",
  bestOf: 1,
  notes: "",
  ...overrides,
});

describe("getBiggestUpset", () => {
  const players = [
    makePlayer({ id: 1, nickname: "lowElo", elo: 800 }),
    makePlayer({ id: 2, nickname: "highElo", elo: 1500 }),
    makePlayer({ id: 3, nickname: "midElo", elo: 1200 }),
  ];

  it("returns lower-ELO winner over higher-ELO loser", () => {
    const matches = [
      makeMatch({
        id: 10,
        matchType: "player",
        player1: 1,
        player2: 2,
        winnerId: 1,
        score: "2-1",
      }),
    ];

    const upset = getBiggestUpset({
      matches,
      players,
      teams: [],
      tournaments: [],
    });

    expect(upset).not.toBeNull();
    expect(upset?.winnerName).toBe("lowElo");
    expect(upset?.loserName).toBe("highElo");
    expect(upset?.eloDifference).toBe(700);
  });

  it("picks the largest ELO difference among multiple upsets", () => {
    const matches = [
      makeMatch({
        id: 10,
        player1: 1,
        player2: 3,
        winnerId: 1,
        score: "2-0",
      }),
      makeMatch({
        id: 11,
        player1: 1,
        player2: 2,
        winnerId: 1,
        score: "2-0",
      }),
    ];

    const upset = getBiggestUpset({
      matches,
      players,
      teams: [],
      tournaments: [],
    });

    expect(upset?.eloDifference).toBe(700);
  });

  it("returns null when winner has higher ELO than loser", () => {
    const matches = [
      makeMatch({
        id: 12,
        player1: 2,
        player2: 1,
        winnerId: 2,
        score: "2-0",
      }),
    ];

    const upset = getBiggestUpset({
      matches,
      players,
      teams: [],
      tournaments: [],
    });

    expect(upset).toBeNull();
  });

  it("returns null for empty match list", () => {
    expect(
      getBiggestUpset({ matches: [], players, teams: [], tournaments: [] })
    ).toBeNull();
  });

  it("ignores non-completed matches", () => {
    const matches = [
      makeMatch({
        id: 13,
        status: "scheduled",
        player1: 1,
        player2: 2,
        winnerId: 1,
      }),
    ];

    expect(
      getBiggestUpset({ matches, players, teams: [], tournaments: [] })
    ).toBeNull();
  });
});

describe("getHotPlayer", () => {
  const players = [
    makePlayer({ id: 1, nickname: "alpha" }),
    makePlayer({ id: 2, nickname: "beta" }),
    makePlayer({ id: 3, nickname: "gamma" }),
  ];

  it("returns player with longest win streak", () => {
    const matches = [
      makeMatch({
        id: 1,
        date: "2025-01-01",
        player1: 1,
        player2: 2,
        winnerId: 1,
      }),
      makeMatch({
        id: 2,
        date: "2025-01-02",
        player1: 1,
        player2: 3,
        winnerId: 1,
      }),
      makeMatch({
        id: 3,
        date: "2025-01-03",
        player1: 1,
        player2: 2,
        winnerId: 1,
      }),
      makeMatch({
        id: 4,
        date: "2025-01-01",
        player1: 2,
        player2: 3,
        winnerId: 2,
      }),
    ];

    const hot = getHotPlayer({ matches, players, tournaments: [] });

    expect(hot?.player.id).toBe(1);
    expect(hot?.streakCount).toBe(3);
  });

  it("returns null for empty match list", () => {
    expect(
      getHotPlayer({ matches: [], players, tournaments: [] })
    ).toBeNull();
  });

  it("returns null when nobody has any wins", () => {
    const matches = [
      makeMatch({
        id: 1,
        status: "scheduled",
        player1: 1,
        player2: 2,
      }),
    ];

    expect(getHotPlayer({ matches, players, tournaments: [] })).toBeNull();
  });
});

describe("getFeaturedMatch", () => {
  const players = [
    makePlayer({ id: 1, nickname: "alpha", elo: 1500 }),
    makePlayer({ id: 2, nickname: "beta", elo: 1500 }),
    makePlayer({ id: 3, nickname: "gamma", elo: 800 }),
    makePlayer({ id: 4, nickname: "delta", elo: 800 }),
  ];

  it("prefers high-stakes match with close score and tournament", () => {
    const matches = [
      makeMatch({
        id: 1,
        player1: 1,
        player2: 2,
        winnerId: 1,
        score: "2-1",
        tournamentId: 1,
        stage: "final",
      }),
      makeMatch({
        id: 2,
        player1: 3,
        player2: 4,
        winnerId: 3,
        score: "2-0",
      }),
    ];

    const featured = getFeaturedMatch({
      matches,
      players,
      teams: [],
      tournaments: [],
    });

    expect(featured?.match.id).toBe(1);
    expect(featured?.participantAName).toBe("alpha");
    expect(featured?.participantBName).toBe("beta");
  });

  it("returns null for empty match list", () => {
    expect(
      getFeaturedMatch({
        matches: [],
        players,
        teams: [],
        tournaments: [],
      })
    ).toBeNull();
  });

  it("returns null when no matches are completed", () => {
    const matches = [
      makeMatch({
        id: 1,
        status: "scheduled",
        player1: 1,
        player2: 2,
      }),
    ];

    expect(
      getFeaturedMatch({ matches, players, teams: [], tournaments: [] })
    ).toBeNull();
  });
});

describe("getRivalry", () => {
  const players = [
    makePlayer({ id: 1, nickname: "alpha" }),
    makePlayer({ id: 2, nickname: "beta" }),
    makePlayer({ id: 3, nickname: "gamma" }),
  ];

  it("returns most frequent player matchup", () => {
    const matches = [
      makeMatch({
        id: 1,
        player1: 1,
        player2: 2,
        winnerId: 1,
        date: "2025-01-01",
      }),
      makeMatch({
        id: 2,
        player1: 2,
        player2: 1,
        winnerId: 2,
        date: "2025-01-02",
      }),
      makeMatch({
        id: 3,
        player1: 1,
        player2: 2,
        winnerId: 1,
        date: "2025-01-03",
      }),
      makeMatch({
        id: 4,
        player1: 1,
        player2: 3,
        winnerId: 1,
        date: "2025-01-01",
      }),
    ];

    const rivalry = getRivalry({ matches, players, teams: [] });

    expect(rivalry).not.toBeNull();
    expect(rivalry?.totalMatches).toBe(3);
    expect(
      [rivalry?.participantA.id, rivalry?.participantB.id].sort()
    ).toEqual([1, 2]);
  });

  it("returns null when no pair has at least 2 matches", () => {
    const matches = [
      makeMatch({
        id: 1,
        player1: 1,
        player2: 2,
        winnerId: 1,
      }),
    ];

    expect(getRivalry({ matches, players, teams: [] })).toBeNull();
  });

  it("returns null for empty match list", () => {
    expect(getRivalry({ matches: [], players, teams: [] })).toBeNull();
  });
});
