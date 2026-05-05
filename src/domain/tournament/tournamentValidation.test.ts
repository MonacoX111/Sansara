import { describe, expect, it } from "vitest";

import { Tournament } from "../../types";
import { validateTournamentConsistency } from "./tournamentValidation";

const makeTournament = (overrides: Partial<Tournament>): Tournament => ({
  id: 1,
  title: "Cup",
  game: "g",
  type: "1x1",
  format: "playoff",
  status: "draft",
  date: "",
  prize: "",
  description: "",
  imageUrl: "",
  participantType: "player",
  participantIds: [10, 20],
  placements: [],
  isPublished: true,
  ...overrides,
});

describe("validateTournamentConsistency", () => {
  it("warns when a finished tournament has a winner but no placements", () => {
    const result = validateTournamentConsistency(
      makeTournament({
        status: "finished",
        winnerId: 10,
      })
    );

    expect(result.valid).toBe(true);
    expect(result.warnings.map((issue) => issue.code)).toContain(
      "TOURNAMENT_WINNER_WITHOUT_PLACEMENTS"
    );
  });

  it("warns when a finished team tournament has no rosters", () => {
    const result = validateTournamentConsistency(
      makeTournament({
        type: "5x5",
        status: "completed",
        participantType: "team",
        participantIds: [1, 2],
        winnerTeamId: 1,
        teamRosters: [],
      })
    );

    expect(result.valid).toBe(true);
    expect(result.warnings.map((issue) => issue.code)).toContain(
      "TOURNAMENT_FINISHED_TEAM_WITHOUT_ROSTERS"
    );
  });

  it("blocks player winners on team tournaments", () => {
    const result = validateTournamentConsistency(
      makeTournament({
        type: "5x5",
        status: "completed",
        participantType: "team",
        participantIds: [1, 2],
        winnerId: 10,
        teamRosters: [{ teamId: 1, playerIds: [10] }],
      })
    );

    expect(result.valid).toBe(false);
    expect(result.errors.map((issue) => issue.code)).toContain(
      "TOURNAMENT_PLAYER_WINNER_FOR_NON_PLAYER"
    );
  });

  it("blocks finished tournaments without any result source", () => {
    const result = validateTournamentConsistency(
      makeTournament({
        status: "finished",
      })
    );

    expect(result.valid).toBe(false);
    expect(result.errors.map((issue) => issue.code)).toContain(
      "TOURNAMENT_FINISHED_WITHOUT_RESULTS"
    );
  });

  it("blocks team placements in player tournaments", () => {
    const result = validateTournamentConsistency(
      makeTournament({
        status: "finished",
        placements: [{ place: 1, teamId: 1 }],
      })
    );

    expect(result.valid).toBe(false);
    expect(result.errors.map((issue) => issue.code)).toContain(
      "TOURNAMENT_TEAM_PLACEMENT_IN_PLAYER_EVENT"
    );
  });
});
