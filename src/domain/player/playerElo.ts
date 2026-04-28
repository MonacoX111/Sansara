import { Player, Tournament } from "../../types";
import { getPlacementEloBonus } from "./playerEloHistory";
import { getTournamentRosterPlayerIds } from "../tournament/tournamentRosters";

type ApplyTournamentPlacementEloResult = {
  players: Player[];
  tournament: Tournament;
  applied: boolean;
};

export const BASE_ELO = 1000;

const isFinishedTournament = (tournament: Tournament) =>
  tournament.status === "finished" || tournament.status === "completed";

const recalculatePlayerRanks = (items: Player[]): Player[] => {
  const sortedPlayers = [...items].sort((a, b) => {
    if (b.elo !== a.elo) return b.elo - a.elo;
    return a.id - b.id;
  });

  const rankMap = new Map<number, number>();
  sortedPlayers.forEach((player, index) => {
    rankMap.set(player.id, index + 1);
  });

  return items.map((player) => ({
    ...player,
    rank: rankMap.get(player.id) || 0,
  }));
};

export const applyTournamentPlacementElo = (
  players: Player[],
  tournament: Tournament
): ApplyTournamentPlacementEloResult => {
  if (!isFinishedTournament(tournament) || tournament.eloApplied === true) {
    return { players, tournament, applied: false };
  }

  const eloByPlayerId = new Map<number, number>();

  (Array.isArray(tournament.placements) ? tournament.placements : []).forEach(
    (placement) => {
      const bonus = getPlacementEloBonus(Number(placement.place));
      if (bonus <= 0) return;

      if (typeof placement.playerId === "number" && Number(placement.playerId) > 0) {
        const playerId = Number(placement.playerId);
        eloByPlayerId.set(playerId, (eloByPlayerId.get(playerId) || 0) + bonus);
        return;
      }

      if (typeof placement.teamId === "number" && Number(placement.teamId) > 0) {
        const teamId = Number(placement.teamId);
        const rosterPlayerIds = getTournamentRosterPlayerIds(
          tournament,
          teamId,
          players
        ).playerIds;

        rosterPlayerIds.forEach((playerId) => {
          eloByPlayerId.set(
            playerId,
            (eloByPlayerId.get(playerId) || 0) + bonus
          );
        });
      }
    }
  );

  if (eloByPlayerId.size === 0) {
    return { players, tournament, applied: false };
  }

  const nextPlayers = recalculatePlayerRanks(
    players.map((player) => {
      const bonus = eloByPlayerId.get(player.id) || 0;
      if (bonus <= 0) return player;

      return {
        ...player,
        elo: Number(player.elo || 0) + bonus,
      };
    })
  );

  return {
    players: nextPlayers,
    tournament: {
      ...tournament,
      eloApplied: true,
    },
    applied: true,
  };
};

export const recalculateAllPlayersElo = (
  players: Player[],
  tournaments: Tournament[]
): Player[] => {
  const reset = players.map((player) => ({ ...player, elo: BASE_ELO }));

  return tournaments
    .filter(isFinishedTournament)
    .reduce<Player[]>(
      (acc, tournament) =>
        applyTournamentPlacementElo(acc, {
          ...tournament,
          eloApplied: false,
        }).players,
      reset
    );
};
