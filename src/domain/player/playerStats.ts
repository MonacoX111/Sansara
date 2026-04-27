import { Match, Player, Tournament } from "../../types";

export type PlayerMatchResult = "win" | "loss" | "pending";

export type PlayerStreak = {
  type: "W" | "L" | "-";
  count: number;
  label: string;
};

export type PlayerRecentMatch = {
  match: Match;
  opponentId: number;
  opponentName: string;
  result: PlayerMatchResult;
  tournamentName: string;
};

type RecentMatchOptions = {
  matches: Match[];
  players: Player[];
  tournaments: Tournament[];
  playerId: number;
  limit?: number;
  unknownPlayerLabel: string;
  friendlyMatchLabel: string;
};

const normalizeId = (id: number | undefined) => Number(id || 0);

const getMatchDateTime = (match: Match) => {
  const timestamp = Date.parse(match.date);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const comparePlayerMatchesLatestFirst = (a: Match, b: Match) => {
  const dateDiff = getMatchDateTime(b) - getMatchDateTime(a);
  if (dateDiff !== 0) return dateDiff;

  return (b.order ?? b.id) - (a.order ?? a.id);
};

export const getPlayerMatches = (matches: Match[], playerId: number) =>
  matches.filter(
    (match) =>
      match.matchType === "player" &&
      (normalizeId(match.player1) === playerId ||
        normalizeId(match.player2) === playerId)
  );

export const getPlayerMatchResult = (
  match: Match,
  playerId: number
): PlayerMatchResult => {
  const winnerId = normalizeId(match.winnerId);

  if (!winnerId) return "pending";
  return winnerId === playerId ? "win" : "loss";
};

export const getPlayerWinRate = (matches: Match[], playerId: number) => {
  const decidedMatches = matches.filter(
    (match) => getPlayerMatchResult(match, playerId) !== "pending"
  );

  if (decidedMatches.length === 0) return 0;

  const wins = decidedMatches.filter(
    (match) => getPlayerMatchResult(match, playerId) === "win"
  ).length;

  return Math.round((wins / decidedMatches.length) * 100);
};

export const getPlayerStreak = (
  matches: Match[],
  playerId: number
): PlayerStreak => {
  const decidedMatches = [...matches]
    .sort(comparePlayerMatchesLatestFirst)
    .filter((match) => getPlayerMatchResult(match, playerId) !== "pending");

  if (decidedMatches.length === 0) {
    return {
      type: "-",
      count: 0,
      label: "-",
    };
  }

  const firstResult = getPlayerMatchResult(decidedMatches[0], playerId);
  const type = firstResult === "win" ? "W" : "L";
  let count = 0;

  for (const match of decidedMatches) {
    const result = getPlayerMatchResult(match, playerId);
    if (
      (type === "W" && result !== "win") ||
      (type === "L" && result !== "loss")
    ) {
      break;
    }

    count += 1;
  }

  return {
    type,
    count,
    label: `${type}${count}`,
  };
};

export const getPlayerRecentMatches = ({
  matches,
  players,
  tournaments,
  playerId,
  limit = 6,
  unknownPlayerLabel,
  friendlyMatchLabel,
}: RecentMatchOptions): PlayerRecentMatch[] =>
  getPlayerMatches(matches, playerId)
    .sort(comparePlayerMatchesLatestFirst)
    .slice(0, limit)
    .map((match) => {
      const player1 = normalizeId(match.player1);
      const player2 = normalizeId(match.player2);
      const opponentId = player1 === playerId ? player2 : player1;
      const opponentName =
        players.find((player) => player.id === opponentId)?.nickname ||
        unknownPlayerLabel;
      const tournamentName =
        tournaments.find((tournament) => tournament.id === match.tournamentId)
          ?.title || friendlyMatchLabel;

      return {
        match,
        opponentId,
        opponentName,
        result: getPlayerMatchResult(match, playerId),
        tournamentName,
      };
    });
