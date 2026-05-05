import { Tournament } from "../../types";

export type TournamentValidationSeverity = "error" | "warning";

export type TournamentValidationIssue = {
  code:
    | "TOURNAMENT_FINISHED_WITHOUT_RESULTS"
    | "TOURNAMENT_TEAM_WINNER_FOR_NON_TEAM"
    | "TOURNAMENT_PLAYER_WINNER_FOR_NON_PLAYER"
    | "TOURNAMENT_SQUAD_WINNER_FOR_INVALID_TYPE"
    | "TOURNAMENT_PLAYER_PLACEMENT_IN_TEAM_EVENT"
    | "TOURNAMENT_TEAM_PLACEMENT_IN_PLAYER_EVENT"
    | "TOURNAMENT_FINISHED_TEAM_WITHOUT_ROSTERS"
    | "TOURNAMENT_WINNER_WITHOUT_PLACEMENTS";
  severity: TournamentValidationSeverity;
  message: string;
};

export type TournamentConsistencyValidationResult = {
  valid: boolean;
  errors: TournamentValidationIssue[];
  warnings: TournamentValidationIssue[];
};

const isFinishedTournament = (tournament: Tournament) =>
  tournament.status === "completed" || tournament.status === "finished";

const hasWinnerId = (tournament: Tournament) =>
  typeof tournament.winnerId === "number" && Number(tournament.winnerId) > 0;

const hasWinnerTeamId = (tournament: Tournament) =>
  typeof tournament.winnerTeamId === "number" &&
  Number(tournament.winnerTeamId) > 0;

const hasWinnerSquadIds = (tournament: Tournament) =>
  Array.isArray(tournament.winnerSquadIds) &&
  tournament.winnerSquadIds.some((id) => Number(id) > 0);

const hasPlacements = (tournament: Tournament) =>
  Array.isArray(tournament.placements) && tournament.placements.length > 0;

const isSquadWinnerCompatible = (tournament: Tournament) =>
  tournament.participantType === "squad" ||
  (tournament.participantType === "player" &&
    ["2x2", "3x3"].includes(String(tournament.type)));

const hasAnyRosterPlayers = (tournament: Tournament) =>
  Array.isArray(tournament.teamRosters) &&
  tournament.teamRosters.some(
    (roster) => Array.isArray(roster.playerIds) && roster.playerIds.length > 0
  );

export const validateTournamentConsistency = (
  tournament: Tournament
): TournamentConsistencyValidationResult => {
  const issues: TournamentValidationIssue[] = [];
  const finished = isFinishedTournament(tournament);
  const winnerIdPresent = hasWinnerId(tournament);
  const winnerTeamPresent = hasWinnerTeamId(tournament);
  const winnerSquadPresent = hasWinnerSquadIds(tournament);
  const placementsPresent = hasPlacements(tournament);

  if (
    finished &&
    !placementsPresent &&
    !winnerIdPresent &&
    !winnerTeamPresent &&
    !winnerSquadPresent
  ) {
    issues.push({
      code: "TOURNAMENT_FINISHED_WITHOUT_RESULTS",
      severity: "error",
      message: "Finished tournament needs placements or a winner",
    });
  }

  if (winnerTeamPresent && tournament.participantType !== "team") {
    issues.push({
      code: "TOURNAMENT_TEAM_WINNER_FOR_NON_TEAM",
      severity: "error",
      message: "Team winner is only valid for team tournaments",
    });
  }

  if (winnerIdPresent && tournament.participantType !== "player") {
    issues.push({
      code: "TOURNAMENT_PLAYER_WINNER_FOR_NON_PLAYER",
      severity: "error",
      message: "Player winner is only valid for player tournaments",
    });
  }

  if (winnerSquadPresent && !isSquadWinnerCompatible(tournament)) {
    issues.push({
      code: "TOURNAMENT_SQUAD_WINNER_FOR_INVALID_TYPE",
      severity: "error",
      message: "Squad winners are only valid for squad or duo/trio tournaments",
    });
  }

  if (placementsPresent && tournament.participantType === "team") {
    const hasPlayerPlacement = tournament.placements.some(
      (placement) =>
        typeof placement.playerId === "number" && Number(placement.playerId) > 0
    );

    if (hasPlayerPlacement) {
      issues.push({
        code: "TOURNAMENT_PLAYER_PLACEMENT_IN_TEAM_EVENT",
        severity: "error",
        message: "Team tournaments should use team placements",
      });
    }
  }

  if (placementsPresent && tournament.participantType === "player") {
    const hasTeamPlacement = tournament.placements.some(
      (placement) =>
        typeof placement.teamId === "number" && Number(placement.teamId) > 0
    );

    if (hasTeamPlacement) {
      issues.push({
        code: "TOURNAMENT_TEAM_PLACEMENT_IN_PLAYER_EVENT",
        severity: "error",
        message: "Player tournaments should use player placements",
      });
    }
  }

  if (finished && tournament.participantType === "team" && !hasAnyRosterPlayers(tournament)) {
    issues.push({
      code: "TOURNAMENT_FINISHED_TEAM_WITHOUT_ROSTERS",
      severity: "warning",
      message: "Finished team tournament has no frozen rosters",
    });
  }

  if (
    finished &&
    !placementsPresent &&
    (winnerIdPresent || winnerTeamPresent || winnerSquadPresent)
  ) {
    issues.push({
      code: "TOURNAMENT_WINNER_WITHOUT_PLACEMENTS",
      severity: "warning",
      message: "Tournament has a winner but no placements",
    });
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};
