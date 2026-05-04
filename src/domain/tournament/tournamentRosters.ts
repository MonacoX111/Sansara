import { Player, Tournament, TournamentTeamRoster } from "../../types";

export type TournamentRosterLookup = {
  playerIds: number[];
  isFallback: boolean;
};

export const getTournamentTeamRoster = (
  tournament: Tournament,
  teamId: number
): TournamentTeamRoster | undefined => {
  if (!Array.isArray(tournament.teamRosters)) return undefined;

  return tournament.teamRosters.find(
    (roster) => Number(roster.teamId) === Number(teamId)
  );
};

export const getTournamentRosterPlayerIds = (
  tournament: Tournament,
  teamId: number,
  players: Player[] = []
): TournamentRosterLookup => {
  const hasAnyRosters =
    Array.isArray(tournament.teamRosters) && tournament.teamRosters.length > 0;

  const snapshot = getTournamentTeamRoster(tournament, teamId);
  const snapshotIds =
    snapshot && Array.isArray(snapshot.playerIds)
      ? snapshot.playerIds.map(Number)
      : [];

  if (snapshotIds.length > 0) {
    return { playerIds: snapshotIds, isFallback: false };
  }

  // If rosters exist on the tournament, don't fall back to current team membership.
  // An empty/missing roster for this team means the team had no players recorded.
  if (hasAnyRosters) {
    return { playerIds: [], isFallback: false };
  }

  // Only fall back when teamRosters is completely absent
  return {
    playerIds: players
      .filter((player) => Number(player.teamId) === Number(teamId))
      .map((player) => player.id),
    isFallback: true,
  };
};

export const isPlayerInTournamentTeamRoster = (
  tournament: Tournament,
  teamId: number,
  playerId: number,
  players: Player[] = []
): boolean =>
  getTournamentRosterPlayerIds(tournament, teamId, players).playerIds.includes(
    Number(playerId)
  );
