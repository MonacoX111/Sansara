import { Player, Tournament } from "../../types";
import { getPlacementEloBonus } from "./playerEloHistory";

type ApplyTournamentPlacementEloResult = {
  players: Player[];
  tournament: Tournament;
  applied: boolean;
};

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
  if (!isFinishedTournament(tournament) || tournament.eloApplied !== false) {
    return { players, tournament, applied: false };
  }

  const eloByPlayerId = new Map<number, number>();

  tournament.placements.forEach((placement) => {
    const bonus = getPlacementEloBonus(Number(placement.place));
    if (bonus <= 0) return;

    if (typeof placement.playerId === "number") {
      const playerId = Number(placement.playerId);
      eloByPlayerId.set(playerId, (eloByPlayerId.get(playerId) || 0) + bonus);
      return;
    }

    if (typeof placement.teamId === "number") {
      const teamId = Number(placement.teamId);
      players
        .filter((player) => Number(player.teamId) === teamId)
        .forEach((player) => {
          eloByPlayerId.set(
            player.id,
            (eloByPlayerId.get(player.id) || 0) + bonus
          );
        });
    }
  });

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
