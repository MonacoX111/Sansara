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
  const snapshot = getTournamentTeamRoster(tournament, teamId);

  if (snapshot) {
    return {
      playerIds: Array.isArray(snapshot.playerIds)
        ? snapshot.playerIds.map(Number)
        : [],
      isFallback: false,
    };
  }

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
