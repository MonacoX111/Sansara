import { describe, expect, it } from "vitest";

import { Player, Team, Tournament } from "../../types";
import {
  getPlacementEloBonus,
  getPlayerEloTimeline,
  getPlayerTotalTournamentEloBonus,
  getPlayerTournamentEloHistory,
} from "./playerEloHistory";

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

const makeTeam = (overrides: Partial<Team>): Team =>
  ({
    id: 1,
    name: "Team",
    logo: "",
    ...overrides,
  } as Team);

describe("getPlacementEloBonus", () => {
  it("matches the documented podium values", () => {
    expect(getPlacementEloBonus(1)).toBe(200);
    expect(getPlacementEloBonus(2)).toBe(100);
    expect(getPlacementEloBonus(3)).toBe(50);
    expect(getPlacementEloBonus(4)).toBe(0);
  });
});

describe("getPlayerTournamentEloHistory", () => {
  const player = makePlayer({ id: 1 });

  it("returns an empty array when there are no tournaments", () => {
    expect(getPlayerTournamentEloHistory(player, [], [], [player])).toEqual([]);
  });

  it("includes solo placements for the player only", () => {
    const tournaments: Tournament[] = [
      makeTournament({
        id: 10,
        title: "Solo Cup",
        date: "2025-03-01",
        participantType: "player",
        placements: [
          { place: 1, playerId: 1 },
          { place: 2, playerId: 99 },
        ],
      }),
    ];

    const history = getPlayerTournamentEloHistory(
      player,
      tournaments,
      [],
      [player]
    );

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      tournamentId: 10,
      placement: 1,
      elo: 200,
      sourceType: "player",
    });
  });

  it("ignores non-podium placements (4th and below)", () => {
    const tournaments: Tournament[] = [
      makeTournament({
        id: 11,
        placements: [{ place: 4, playerId: 1 }],
      }),
    ];

    expect(
      getPlayerTournamentEloHistory(player, tournaments, [], [player])
    ).toEqual([]);
  });

  it("counts team placement when player is in the team roster snapshot", () => {
    const team = makeTeam({ id: 50, name: "Phoenix" });
    const tournaments: Tournament[] = [
      makeTournament({
        id: 20,
        title: "Team Cup",
        participantType: "team",
        teamRosters: [{ teamId: 50, playerIds: [1, 2] }],
        placements: [{ place: 2, teamId: 50 }],
      }),
    ];

    const history = getPlayerTournamentEloHistory(
      player,
      tournaments,
      [team],
      [player, makePlayer({ id: 2, teamId: 50 })]
    );

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      tournamentId: 20,
      placement: 2,
      elo: 100,
      sourceType: "team",
      rosterSource: "snapshot",
      teamId: 50,
      teamName: "Phoenix",
    });
  });

  it("falls back to current team membership when no snapshot exists", () => {
    const team = makeTeam({ id: 60, name: "Wolves" });
    const playerOnTeam = makePlayer({ id: 1, teamId: 60 });
    const tournaments: Tournament[] = [
      makeTournament({
        id: 21,
        participantType: "team",
        teamRosters: [],
        placements: [{ place: 3, teamId: 60 }],
      }),
    ];

    const history = getPlayerTournamentEloHistory(
      playerOnTeam,
      tournaments,
      [team],
      [playerOnTeam]
    );

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      sourceType: "team",
      rosterSource: "fallback",
      elo: 50,
    });
  });

  it("excludes team placements when the player is not in the roster", () => {
    const tournaments: Tournament[] = [
      makeTournament({
        id: 22,
        participantType: "team",
        teamRosters: [{ teamId: 70, playerIds: [99] }],
        placements: [{ place: 1, teamId: 70 }],
      }),
    ];

    expect(
      getPlayerTournamentEloHistory(player, tournaments, [], [player])
    ).toEqual([]);
  });
});

describe("getPlayerEloTimeline", () => {
  it("returns an empty timeline when there are no tournaments", () => {
    const player = makePlayer({ id: 1 });
    expect(getPlayerEloTimeline(player, [], [], [player])).toEqual([]);
  });

  it("orders entries chronologically (oldest first) with correct cumulative ELO", () => {
    const player = makePlayer({ id: 1 });
    const tournaments: Tournament[] = [
      makeTournament({
        id: 1,
        title: "Spring",
        date: "2025-01-01",
        placements: [{ place: 1, playerId: 1 }],
      }),
      makeTournament({
        id: 2,
        title: "Summer",
        date: "2025-06-01",
        placements: [{ place: 2, playerId: 1 }],
      }),
      makeTournament({
        id: 3,
        title: "Winter",
        date: "2025-12-01",
        placements: [{ place: 3, playerId: 1 }],
      }),
    ];

    const timeline = getPlayerEloTimeline(player, tournaments, [], [player]);

    expect(timeline).toHaveLength(3);
    expect(timeline[0]).toMatchObject({
      tournamentTitle: "Spring",
      elo: 200,
      totalEloBonus: 200,
    });
    expect(timeline[1]).toMatchObject({
      tournamentTitle: "Summer",
      elo: 100,
      totalEloBonus: 300,
    });
    expect(timeline[2]).toMatchObject({
      tournamentTitle: "Winter",
      elo: 50,
      totalEloBonus: 350,
    });
  });

  it("ignores tournaments where the player has no qualifying placement", () => {
    const player = makePlayer({ id: 1 });
    const tournaments: Tournament[] = [
      makeTournament({
        id: 1,
        date: "2025-01-01",
        placements: [{ place: 4, playerId: 1 }],
      }),
      makeTournament({
        id: 2,
        date: "2025-02-01",
        placements: [{ place: 1, playerId: 1 }],
      }),
      makeTournament({
        id: 3,
        date: "2025-03-01",
        placements: [{ place: 1, playerId: 99 }],
      }),
    ];

    const timeline = getPlayerEloTimeline(player, tournaments, [], [player]);

    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toMatchObject({
      tournamentId: 2,
      elo: 200,
      totalEloBonus: 200,
    });
  });

  it("accumulates a mix of solo and team placements in chronological order", () => {
    const team = makeTeam({ id: 50, name: "Phoenix" });
    const player = makePlayer({ id: 1, teamId: 50 });
    const tournaments: Tournament[] = [
      makeTournament({
        id: 1,
        title: "Solo Open",
        date: "2025-01-10",
        placements: [{ place: 3, playerId: 1 }],
      }),
      makeTournament({
        id: 2,
        title: "Team Cup",
        date: "2025-05-10",
        participantType: "team",
        teamRosters: [{ teamId: 50, playerIds: [1] }],
        placements: [{ place: 1, teamId: 50 }],
      }),
    ];

    const timeline = getPlayerEloTimeline(
      player,
      tournaments,
      [team],
      [player]
    );

    expect(timeline.map((item) => item.tournamentId)).toEqual([1, 2]);
    expect(timeline.map((item) => item.totalEloBonus)).toEqual([50, 250]);
    expect(timeline[0].sourceType).toBe("player");
    expect(timeline[1].sourceType).toBe("team");
    expect(timeline[1].teamName).toBe("Phoenix");
  });
});

describe("getPlayerTotalTournamentEloBonus", () => {
  it("sums podium ELO across solo and team placements", () => {
    const team = makeTeam({ id: 50 });
    const player = makePlayer({ id: 1, teamId: 50 });
    const tournaments: Tournament[] = [
      makeTournament({
        id: 1,
        date: "2025-01-01",
        placements: [{ place: 1, playerId: 1 }],
      }),
      makeTournament({
        id: 2,
        date: "2025-02-01",
        participantType: "team",
        teamRosters: [{ teamId: 50, playerIds: [1] }],
        placements: [{ place: 2, teamId: 50 }],
      }),
      makeTournament({
        id: 3,
        date: "2025-03-01",
        placements: [{ place: 5, playerId: 1 }],
      }),
    ];

    expect(
      getPlayerTotalTournamentEloBonus(player, tournaments, [team], [player])
    ).toBe(300);
  });

  it("returns 0 for a player with no qualifying placements", () => {
    const player = makePlayer({ id: 1 });
    expect(getPlayerTotalTournamentEloBonus(player, [], [], [player])).toBe(0);
  });
});
