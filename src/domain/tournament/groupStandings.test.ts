import { describe, expect, it } from "vitest";

import { Match, Player, Team, Tournament } from "../../types";
import {
  calculateGroupStandings,
  groupMatchesByGroupName,
} from "./groupStandings";

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
  stage: "group",
  groupName: "Group A",
  ...overrides,
});

const makePlayer = (overrides: Partial<Player>): Player => ({
  id: 1,
  nickname: "p",
  fullName: "P",
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
  name: "T",
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
  format: "groups_only",
  status: "ongoing",
  date: "2025-01-01",
  prize: "",
  description: "",
  imageUrl: "",
  participantType: "player",
  participantIds: [],
  groups: [],
  placements: [],
  isPublished: true,
  ...overrides,
});

describe("groupMatchesByGroupName", () => {
  it("seeds empty arrays for every tournament group, even with no matches", () => {
    const result = groupMatchesByGroupName(
      [],
      [
        { id: "g1", name: "Group A", participantIds: [] },
        { id: "g2", name: "Group B", participantIds: [] },
      ]
    );

    expect(result).toEqual({ "Group A": [], "Group B": [] });
  });

  it("buckets matches by groupName", () => {
    const matches = [
      makeMatch({ id: 1, groupName: "Group A" }),
      makeMatch({ id: 2, groupName: "Group B" }),
      makeMatch({ id: 3, groupName: "Group A" }),
    ];

    const result = groupMatchesByGroupName(matches);

    expect(result["Group A"].map((m) => m.id)).toEqual([1, 3]);
    expect(result["Group B"].map((m) => m.id)).toEqual([2]);
  });

  it("falls back to 'Group A' when match has no groupName", () => {
    const matches = [makeMatch({ id: 1, groupName: "" })];

    const result = groupMatchesByGroupName(matches);

    expect(result["Group A"].map((m) => m.id)).toEqual([1]);
  });

  it("works without tournament groups", () => {
    expect(groupMatchesByGroupName([])).toEqual({});
  });
});

describe("calculateGroupStandings — player tournament", () => {
  const players = [
    makePlayer({ id: 1, nickname: "alpha", avatar: "a.png" }),
    makePlayer({ id: 2, nickname: "beta", avatar: "b.png" }),
    makePlayer({ id: 3, nickname: "gamma", avatar: "c.png" }),
  ];

  const tournament = makeTournament({
    participantType: "player",
    groups: [
      {
        id: "g1",
        name: "Group A",
        participantIds: [1, 2, 3],
      },
    ],
  });

  it("accumulates played/wins/losses/points/scoreFor/scoreAgainst from completed matches", () => {
    const matches = [
      makeMatch({
        id: 1,
        groupName: "Group A",
        player1: 1,
        player2: 2,
        winnerId: 1,
        score: "2:1",
        status: "completed",
      }),
      makeMatch({
        id: 2,
        groupName: "Group A",
        player1: 1,
        player2: 3,
        winnerId: 1,
        score: "2:0",
        status: "completed",
      }),
      makeMatch({
        id: 3,
        groupName: "Group A",
        player1: 2,
        player2: 3,
        winnerId: 3,
        score: "0:2",
        status: "completed",
      }),
    ];

    const grouped = groupMatchesByGroupName(matches, tournament.groups);
    const standings = calculateGroupStandings({
      groupedMatches: grouped,
      tournament,
      players,
      teams: [],
    });

    const rows = standings["Group A"];
    expect(rows).toHaveLength(3);

    const alpha = rows.find((r) => r.id === 1)!;
    const beta = rows.find((r) => r.id === 2)!;
    const gamma = rows.find((r) => r.id === 3)!;

    expect(alpha).toMatchObject({
      played: 2,
      wins: 2,
      losses: 0,
      points: 6,
      scoreFor: 4,
      scoreAgainst: 1,
      name: "alpha",
      image: "a.png",
    });
    expect(beta).toMatchObject({
      played: 2,
      wins: 0,
      losses: 2,
      points: 0,
      scoreFor: 1,
      scoreAgainst: 4,
    });
    expect(gamma).toMatchObject({
      played: 2,
      wins: 1,
      losses: 1,
      points: 3,
      scoreFor: 2,
      scoreAgainst: 2,
    });
  });

  it("sorts rows by points → wins → goal diff → scoreFor", () => {
    const matches = [
      makeMatch({
        id: 1,
        groupName: "Group A",
        player1: 1,
        player2: 2,
        winnerId: 1,
        score: "2:1",
      }),
      makeMatch({
        id: 2,
        groupName: "Group A",
        player1: 1,
        player2: 3,
        winnerId: 1,
        score: "2:0",
      }),
      makeMatch({
        id: 3,
        groupName: "Group A",
        player1: 2,
        player2: 3,
        winnerId: 3,
        score: "0:2",
      }),
    ];

    const standings = calculateGroupStandings({
      groupedMatches: groupMatchesByGroupName(matches, tournament.groups),
      tournament,
      players,
      teams: [],
    });

    expect(standings["Group A"].map((r) => r.id)).toEqual([1, 3, 2]);
  });

  it("seeds participants from tournament.groups even with no matches played", () => {
    const standings = calculateGroupStandings({
      groupedMatches: groupMatchesByGroupName([], tournament.groups),
      tournament,
      players,
      teams: [],
    });

    const rows = standings["Group A"];
    expect(rows).toHaveLength(3);
    rows.forEach((row) => {
      expect(row.played).toBe(0);
      expect(row.points).toBe(0);
    });
  });
});

describe("calculateGroupStandings — team tournament", () => {
  const teams = [
    makeTeam({ id: 100, name: "Red", logo: "red.png" }),
    makeTeam({ id: 200, name: "Blue", logo: "blue.png" }),
  ];

  const tournament = makeTournament({
    participantType: "team",
    groups: [
      { id: "g1", name: "Group A", participantIds: [100, 200] },
    ],
  });

  it("accumulates stats for team matches with team1/team2/winnerTeamId", () => {
    const matches = [
      makeMatch({
        id: 1,
        matchType: "team",
        groupName: "Group A",
        team1: 100,
        team2: 200,
        winnerTeamId: 100,
        score: "3:2",
        status: "completed",
      }),
      makeMatch({
        id: 2,
        matchType: "team",
        groupName: "Group A",
        team1: 100,
        team2: 200,
        winnerTeamId: 200,
        score: "1:4",
        status: "completed",
      }),
    ];

    const standings = calculateGroupStandings({
      groupedMatches: groupMatchesByGroupName(matches, tournament.groups),
      tournament,
      players: [],
      teams,
    });

    const red = standings["Group A"].find((r) => r.id === 100)!;
    const blue = standings["Group A"].find((r) => r.id === 200)!;

    expect(red).toMatchObject({
      played: 2,
      wins: 1,
      losses: 1,
      points: 3,
      scoreFor: 4,
      scoreAgainst: 6,
      name: "Red",
      image: "red.png",
    });
    expect(blue).toMatchObject({
      played: 2,
      wins: 1,
      losses: 1,
      points: 3,
      scoreFor: 6,
      scoreAgainst: 4,
      name: "Blue",
      image: "blue.png",
    });

    // Tie on points/wins → blue ahead by goal diff (+2 vs -2)
    expect(standings["Group A"].map((r) => r.id)).toEqual([200, 100]);
  });
});

describe("calculateGroupStandings — edge cases", () => {
  const players = [
    makePlayer({ id: 1, nickname: "alpha" }),
    makePlayer({ id: 2, nickname: "beta" }),
  ];

  const tournament = makeTournament({
    participantType: "player",
    groups: [{ id: "g1", name: "Group A", participantIds: [1, 2] }],
  });

  it("ignores non-completed matches for stats but still seeds participants", () => {
    const matches = [
      makeMatch({
        id: 1,
        groupName: "Group A",
        player1: 1,
        player2: 2,
        winnerId: 1,
        score: "2:0",
        status: "scheduled",
      }),
    ];

    const standings = calculateGroupStandings({
      groupedMatches: groupMatchesByGroupName(matches, tournament.groups),
      tournament,
      players,
      teams: [],
    });

    const rows = standings["Group A"];
    expect(rows).toHaveLength(2);
    rows.forEach((row) => {
      expect(row.played).toBe(0);
      expect(row.wins).toBe(0);
      expect(row.points).toBe(0);
    });
  });

  it("handles missing/invalid score by treating it as 0:0 (still counts as played)", () => {
    const matches = [
      makeMatch({
        id: 1,
        groupName: "Group A",
        player1: 1,
        player2: 2,
        winnerId: 1,
        score: "",
        status: "completed",
      }),
      makeMatch({
        id: 2,
        groupName: "Group A",
        player1: 1,
        player2: 2,
        winnerId: 1,
        score: "abc:xyz",
        status: "completed",
      }),
    ];

    const standings = calculateGroupStandings({
      groupedMatches: groupMatchesByGroupName(matches, tournament.groups),
      tournament,
      players,
      teams: [],
    });

    const alpha = standings["Group A"].find((r) => r.id === 1)!;
    expect(alpha.played).toBe(2);
    expect(alpha.wins).toBe(2);
    expect(alpha.points).toBe(6);
    expect(alpha.scoreFor).toBe(0);
    expect(alpha.scoreAgainst).toBe(0);
  });

  it("returns empty group entries when given empty grouped matches", () => {
    const standings = calculateGroupStandings({
      groupedMatches: {},
      tournament,
      players,
      teams: [],
    });

    expect(standings).toEqual({});
  });

  it("returns rows with no matches when groupedMatches has empty arrays", () => {
    const standings = calculateGroupStandings({
      groupedMatches: { "Group A": [] },
      tournament,
      players,
      teams: [],
    });

    expect(standings["Group A"]).toHaveLength(2);
    expect(standings["Group A"][0].played).toBe(0);
  });

  it("does not crash when tournament is null", () => {
    const matches = [
      makeMatch({
        id: 1,
        groupName: "Group A",
        player1: 1,
        player2: 2,
        winnerId: 1,
        score: "2:0",
        status: "completed",
      }),
    ];

    const standings = calculateGroupStandings({
      groupedMatches: groupMatchesByGroupName(matches),
      tournament: null,
      players,
      teams: [],
    });

    const rows = standings["Group A"];
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.id === 1)?.points).toBe(3);
  });

  it("falls back to '—' name when participant is not in players/teams arrays", () => {
    const matches = [
      makeMatch({
        id: 1,
        groupName: "Group A",
        player1: 999,
        player2: 1,
        winnerId: 999,
        score: "2:0",
        status: "completed",
      }),
    ];

    const standings = calculateGroupStandings({
      groupedMatches: groupMatchesByGroupName(matches),
      tournament: null,
      players,
      teams: [],
    });

    const ghost = standings["Group A"].find((r) => r.id === 999);
    expect(ghost?.name).toBe("—");
    expect(ghost?.image).toBe("");
  });
});
