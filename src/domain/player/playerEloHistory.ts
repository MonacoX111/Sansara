import { Player, Team, Tournament } from "../../types";

export type PlayerTournamentEloHistoryItem = {
  tournamentId: number;
  tournamentTitle: string;
  date: string;
  placement: number;
  elo: number;
  sourceType: "player" | "team";
  teamId?: number;
  teamName?: string;
};

export type PlayerEloTimelineItem = PlayerTournamentEloHistoryItem & {
  totalEloBonus: number;
};

export const getPlacementEloBonus = (place: number): number => {
  if (place === 1) return 200;
  if (place === 2) return 100;
  if (place === 3) return 50;
  return 0;
};

const compareHistoryNewestFirst = (
  a: PlayerTournamentEloHistoryItem,
  b: PlayerTournamentEloHistoryItem
) => {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;

  const aTime = Date.parse(a.date);
  const bTime = Date.parse(b.date);
  const normalizedATime = Number.isNaN(aTime) ? 0 : aTime;
  const normalizedBTime = Number.isNaN(bTime) ? 0 : bTime;
  const dateDiff = normalizedBTime - normalizedATime;

  if (dateDiff !== 0) return dateDiff;
  if (a.tournamentId !== b.tournamentId) return b.tournamentId - a.tournamentId;
  return a.placement - b.placement;
};

const getTeamName = (teams: Team[], teamId: number) =>
  teams.find((team) => team.id === teamId)?.name;

export const getPlayerTournamentEloHistory = (
  player: Player,
  tournaments: Tournament[],
  teams: Team[],
  players: Player[]
): PlayerTournamentEloHistoryItem[] => {
  const playerId = Number(player.id);
  const currentPlayer = players.find((item) => Number(item.id) === playerId);
  const currentTeamId =
    typeof currentPlayer?.teamId === "number"
      ? Number(currentPlayer.teamId)
      : Number(player.teamId || 0);
  const currentTeamIds = new Set(currentTeamId > 0 ? [currentTeamId] : []);

  return tournaments
    .flatMap((tournament) =>
      (Array.isArray(tournament.placements) ? tournament.placements : [])
        .map((placement) => {
          const elo = getPlacementEloBonus(Number(placement.place));
          if (elo <= 0) return null;

          if (typeof placement.playerId === "number") {
            if (Number(placement.playerId) !== playerId) return null;

            return {
              tournamentId: tournament.id,
              tournamentTitle: tournament.title,
              date: tournament.date,
              placement: Number(placement.place),
              elo,
              sourceType: "player" as const,
            };
          }

          if (typeof placement.teamId === "number") {
            const teamId = Number(placement.teamId);
            if (!currentTeamIds.has(teamId)) return null;

            return {
              tournamentId: tournament.id,
              tournamentTitle: tournament.title,
              date: tournament.date,
              placement: Number(placement.place),
              elo,
              sourceType: "team" as const,
              teamId,
              teamName: getTeamName(teams, teamId),
            };
          }

          return null;
        })
        .filter((item): item is PlayerTournamentEloHistoryItem =>
          Boolean(item)
        )
    )
    .sort(compareHistoryNewestFirst);
};

export const getPlayerTotalTournamentEloBonus = (
  player: Player,
  tournaments: Tournament[],
  teams: Team[],
  players: Player[]
): number =>
  getPlayerTournamentEloHistory(player, tournaments, teams, players).reduce(
    (total, item) => total + item.elo,
    0
  );

export const getPlayerEloTimeline = (
  player: Player,
  tournaments: Tournament[],
  teams: Team[],
  players: Player[]
): PlayerEloTimelineItem[] => {
  let totalEloBonus = 0;

  return getPlayerTournamentEloHistory(
    player,
    tournaments,
    teams,
    players
  )
    .slice()
    .reverse()
    .map((item) => {
    totalEloBonus += item.elo;
    return {
      ...item,
      totalEloBonus,
    };
    });
};
