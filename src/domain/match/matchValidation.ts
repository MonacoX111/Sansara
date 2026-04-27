import { Match } from "../../types";

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
