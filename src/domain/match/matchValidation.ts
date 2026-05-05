import { Match, Tournament } from "../../types";

export type MatchWinnerValidationResult =
  | { valid: true }
  | { valid: false; message: string; logMessage: string };

export const validateMatchWinner = (
  match: Match
): MatchWinnerValidationResult => {
  if (
    match.matchType === "player" &&
    match.winnerId &&
    match.winnerId !== match.player1 &&
    match.winnerId !== match.player2
  ) {
    return {
      valid: false,
      message: "Invalid match winner",
      logMessage: "Invalid match winner: winnerId must be player1 or player2",
    };
  }

  if (
    match.matchType === "team" &&
    match.winnerTeamId &&
    match.winnerTeamId !== match.team1 &&
    match.winnerTeamId !== match.team2
  ) {
    return {
      valid: false,
      message: "Invalid match winner",
      logMessage:
        "Invalid match winner: winnerTeamId must be team1 or team2",
    };
  }

  return { valid: true };
};

export type MatchValidationSeverity = "error" | "warning";

export type MatchValidationIssue = {
  code:
    | "MATCH_SAME_PLAYER"
    | "MATCH_SAME_TEAM"
    | "MATCH_COMPLETED_WITHOUT_WINNER"
    | "MATCH_SCHEDULED_WITH_WINNER"
    | "MATCH_WINNER_NOT_PARTICIPANT"
    | "MATCH_TYPE_MISMATCH_TOURNAMENT"
    | "MATCH_COMPLETE_WITHOUT_GAME"
    | "MATCH_COMPLETE_WITHOUT_PARTICIPANTS";
  severity: MatchValidationSeverity;
  message: string;
};

export type MatchConsistencyValidationResult = {
  valid: boolean;
  errors: MatchValidationIssue[];
  warnings: MatchValidationIssue[];
};

const hasPlayerWinner = (match: Match) =>
  typeof match.winnerId === "number" && Number(match.winnerId) > 0;

const hasTeamWinner = (match: Match) =>
  typeof match.winnerTeamId === "number" && Number(match.winnerTeamId) > 0;

const hasMatchWinner = (match: Match) =>
  match.matchType === "team" ? hasTeamWinner(match) : hasPlayerWinner(match);

const hasRequiredParticipants = (match: Match) =>
  match.matchType === "team"
    ? Boolean(Number(match.team1) && Number(match.team2))
    : Boolean(Number(match.player1) && Number(match.player2));

const isRealMatch = (match: Match) =>
  match.status === "completed" || match.status === "ongoing";

export const validateMatchConsistency = ({
  match,
  tournament,
}: {
  match: Match;
  tournament?: Tournament | null;
}): MatchConsistencyValidationResult => {
  const issues: MatchValidationIssue[] = [];
  const player1 = Number(match.player1 || 0);
  const player2 = Number(match.player2 || 0);
  const team1 = Number(match.team1 || 0);
  const team2 = Number(match.team2 || 0);

  if (match.matchType === "player" && player1 > 0 && player1 === player2) {
    issues.push({
      code: "MATCH_SAME_PLAYER",
      severity: "error",
      message: "Match participants must be different",
    });
  }

  if (match.matchType === "team" && team1 > 0 && team1 === team2) {
    issues.push({
      code: "MATCH_SAME_TEAM",
      severity: "error",
      message: "Match participants must be different",
    });
  }

  if (match.status === "completed" && !hasMatchWinner(match)) {
    issues.push({
      code: "MATCH_COMPLETED_WITHOUT_WINNER",
      severity: "error",
      message: "Completed match needs a winner",
    });
  }

  if (match.status === "scheduled" && hasMatchWinner(match)) {
    issues.push({
      code: "MATCH_SCHEDULED_WITH_WINNER",
      severity: "error",
      message: "Scheduled match cannot already have a winner",
    });
  }

  const winnerValidation = validateMatchWinner(match);
  if (!winnerValidation.valid) {
    issues.push({
      code: "MATCH_WINNER_NOT_PARTICIPANT",
      severity: "error",
      message: winnerValidation.message,
    });
  }

  if (
    tournament &&
    ((tournament.participantType === "team" && match.matchType !== "team") ||
      (tournament.participantType === "player" && match.matchType !== "player"))
  ) {
    issues.push({
      code: "MATCH_TYPE_MISMATCH_TOURNAMENT",
      severity: "error",
      message: "Match participant type does not match tournament",
    });
  }

  if (isRealMatch(match) && !match.game.trim()) {
    issues.push({
      code: "MATCH_COMPLETE_WITHOUT_GAME",
      severity: "error",
      message: "Match game is required",
    });
  }

  if (isRealMatch(match) && !hasRequiredParticipants(match)) {
    issues.push({
      code: "MATCH_COMPLETE_WITHOUT_PARTICIPANTS",
      severity: "error",
      message: "Both match participants are required",
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
