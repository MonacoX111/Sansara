import { Match, Player, Tournament } from "../../types";
import { getPlayerAllTeamIds } from "./playerTeams";

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

const getPlayerTeamIdsForStats = (playerId: number, players: Player[]) => {
  const player = players.find((item) => item.id === playerId);
  return player ? getPlayerAllTeamIds(player) : [];
};

export const comparePlayerMatchesLatestFirst = (a: Match, b: Match) => {
  const aTime = getMatchDateTime(a);
  const bTime = getMatchDateTime(b);

  // Both matches have real dates — newer date first
  if (aTime > 0 && bTime > 0 && aTime !== bTime) return bTime - aTime;

  // Different tournaments — sort by tournament recency
  const aTid = Number(a.tournamentId || 0);
  const bTid = Number(b.tournamentId || 0);
  if (aTid !== bTid) {
    // If only one has a date, the one without a date may be newer (just added)
    // Use tournamentId as proxy: higher id = newer tournament
    if (aTime !== bTime) {
      // One has date, one doesn't — use date presence:
      // dateless match likely belongs to a newer tournament
      return aTime === 0 ? -1 : 1;
    }
    // Both have same date status — higher tournamentId = newer
    return bTid - aTid;
  }

  // Same tournament — use admin order (ascending: lower order = top of list)
  return (a.order ?? a.id) - (b.order ?? b.id);
};

export const getPlayerMatches = (
  matches: Match[],
  playerId: number,
  players: Player[] = []
) => {
  const playerTeamIds = getPlayerTeamIdsForStats(playerId, players);

  return matches.filter((match) => {
    if (
      match.matchType === "player" &&
      (normalizeId(match.player1) === playerId ||
        normalizeId(match.player2) === playerId)
    ) {
      return true;
    }

    if (match.matchType === "team") {
      return (
        playerTeamIds.includes(normalizeId(match.team1)) ||
        playerTeamIds.includes(normalizeId(match.team2))
      );
    }

    return false;
  });
};

export const getPlayerMatchResult = (
  match: Match,
  playerId: number,
  players: Player[] = []
): PlayerMatchResult => {
  if (match.matchType === "team") {
    const playerTeamIds = getPlayerTeamIdsForStats(playerId, players);
    const playerTeamId = [normalizeId(match.team1), normalizeId(match.team2)].find(
      (teamId) => playerTeamIds.includes(teamId)
    );
    const winnerTeamId = normalizeId(match.winnerTeamId);

    if (!playerTeamId || !winnerTeamId) return "pending";

    return winnerTeamId === playerTeamId ? "win" : "loss";
  }

  const winnerId = normalizeId(match.winnerId);

  if (!winnerId) return "pending";

  return winnerId === playerId ? "win" : "loss";
};

export const getPlayerWinRate = (
  matches: Match[],
  playerId: number,
  players: Player[] = []
) => {
  const decidedMatches = matches.filter(
    (match) => getPlayerMatchResult(match, playerId, players) !== "pending"
  );

  if (decidedMatches.length === 0) return 0;

  const wins = decidedMatches.filter(
    (match) => getPlayerMatchResult(match, playerId, players) === "win"
  ).length;

  return Math.round((wins / decidedMatches.length) * 100);
};

export const getPlayerStreak = (
  matches: Match[],
  playerId: number,
  players: Player[] = []
): PlayerStreak => {
  const decidedMatches = [...matches]
    .sort(comparePlayerMatchesLatestFirst)
    .filter((match) => getPlayerMatchResult(match, playerId, players) !== "pending");

  if (decidedMatches.length === 0) {
    return { type: "-", count: 0, label: "-" };
  }

  const latestResult = getPlayerMatchResult(decidedMatches[0], playerId, players);
  const type = latestResult === "win" ? "W" : "L";

  let count = 0;

  for (const match of decidedMatches) {
    const result = getPlayerMatchResult(match, playerId, players);

    if (result !== latestResult) break;

    count += 1;
  }

  return { type, count, label: `${type}${count}` };
};

export const getPlayerStreakFromVisibleForm = (
  visibleResults: PlayerRecentMatch[]
): PlayerStreak => {
  const decidedResults = visibleResults.filter(
    (item) => item.result === "win" || item.result === "loss"
  );

  if (decidedResults.length === 0) {
    return { type: "-", count: 0, label: "-" };
  }

  const latestResult = decidedResults[0].result;
  const type = latestResult === "win" ? "W" : "L";

  let count = 0;

  for (const item of decidedResults) {
    if (item.result !== latestResult) break;
    count += 1;
  }

  return { type, count, label: `${type}${count}` };
};

export const getPlayerRecentMatches = ({
  matches,
  players,
  tournaments,
  playerId,
  limit = 10,
  unknownPlayerLabel,
  friendlyMatchLabel,
}: RecentMatchOptions): PlayerRecentMatch[] =>
  getPlayerMatches(matches, playerId, players)
    .sort(comparePlayerMatchesLatestFirst)
    .slice(0, limit)
    .map((match) => {
      const isTeamMatch = match.matchType === "team";

      const playerTeamIds = getPlayerTeamIdsForStats(playerId, players);
      const team1 = normalizeId(match.team1);
      const team2 = normalizeId(match.team2);

      const player1 = normalizeId(match.player1);
      const player2 = normalizeId(match.player2);

      const opponentId = isTeamMatch
        ? playerTeamIds.includes(team1)
          ? team2
          : team1
        : player1 === playerId
          ? player2
          : player1;

      const opponentName = isTeamMatch
        ? unknownPlayerLabel
        : players.find((player) => player.id === opponentId)?.nickname ||
          unknownPlayerLabel;

      const tournamentName =
        tournaments.find((tournament) => tournament.id === match.tournamentId)
          ?.title || friendlyMatchLabel;

      return {
        match,
        opponentId,
        opponentName,
        result: getPlayerMatchResult(match, playerId, players),
        tournamentName,
      };
    });

/**
 * Single source of truth: determines which tournaments a player actually
 * participated in. Uses roster-first logic — only falls back to player.teamId
 * when teamRosters are completely absent from the tournament.
 */
export const getPlayerParticipatedTournaments = (
  player: Player,
  tournaments: Tournament[],
  players: Player[] = []
): Tournament[] => {
  const playerId = Number(player.id);
  const playerTeamIds = getPlayerAllTeamIds(player);

  return tournaments.filter((tournament) => {
    const participantIds = Array.isArray(tournament.participantIds)
      ? tournament.participantIds.map(Number)
      : [];

    // Direct player participation
    if (
      tournament.participantType === "player" &&
      participantIds.includes(playerId)
    ) {
      return true;
    }

    // Team tournament — check rosters
    if (tournament.participantType === "team") {
      const hasRosters =
        Array.isArray(tournament.teamRosters) &&
        tournament.teamRosters.length > 0;

      if (hasRosters) {
        // Roster-first: only count if player is explicitly in a roster
        return tournament.teamRosters!.some(
          (roster) =>
            Array.isArray(roster.playerIds) &&
            roster.playerIds.map(Number).includes(playerId)
        );
      }

      // Fallback: no rosters at all → use team membership
      return participantIds.some((teamId) => playerTeamIds.includes(teamId));
    }

    return false;
  });
};