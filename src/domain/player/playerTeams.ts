import { Player, Team } from "../../types";

export type PlayerTeamHistoryEntry = NonNullable<Player["teamHistory"]>[number];

export type PlayerTeamHistoryItem = PlayerTeamHistoryEntry & {
  team: Team | null;
};

const normalizeTeamId = (teamId: number | undefined) => Number(teamId || 0);

const uniqueTeamIds = (teamIds: number[]) => {
  const seen = new Set<number>();

  return teamIds.filter((teamId) => {
    if (!teamId || seen.has(teamId)) return false;
    seen.add(teamId);
    return true;
  });
};

export const getPlayerCurrentTeam = (player: Player, teams: Team[]) => {
  const currentTeamId = normalizeTeamId(player.teamId);

  if (currentTeamId) {
    return teams.find((team) => team.id === currentTeamId) || null;
  }

  const historyCurrentTeamId = player.teamHistory?.find(
    (item) => item.isCurrent
  )?.teamId;

  return teams.find((team) => team.id === historyCurrentTeamId) || null;
};

export const getPlayerTeamHistory = (
  player: Player,
  teams: Team[]
): PlayerTeamHistoryItem[] => {
  const teamOrder = new Map(
    teams.map((team, index) => [team.id, index] as const)
  );

  const currentTeamId = normalizeTeamId(player.teamId);

  const history =
    Array.isArray(player.teamHistory) && player.teamHistory.length > 0
      ? player.teamHistory
      : currentTeamId
        ? [{ teamId: currentTeamId, isCurrent: true }]
        : [];

  return history
    .filter((item) => normalizeTeamId(item.teamId) > 0)
    .map((item) => {
      const itemTeamId = normalizeTeamId(item.teamId);

      return {
        ...item,
        teamId: itemTeamId,
        isCurrent: currentTeamId
          ? itemTeamId === currentTeamId
          : Boolean(item.isCurrent),
        team: teams.find((team) => team.id === itemTeamId) || null,
      };
    })
    .sort(
      (a, b) =>
        (teamOrder.get(a.teamId) ?? Number.MAX_SAFE_INTEGER) -
        (teamOrder.get(b.teamId) ?? Number.MAX_SAFE_INTEGER)
    );
};

export const getPlayerAllTeamIds = (player: Player) =>
  uniqueTeamIds([
    normalizeTeamId(player.teamId),
    ...(player.teamHistory || []).map((item) => normalizeTeamId(item.teamId)),
  ]);

export const wasPlayerInTeam = (player: Player, teamId: number) =>
  getPlayerAllTeamIds(player).includes(normalizeTeamId(teamId));

export const getPlayersForHistoricalTeam = (teamId: number, players: Player[]) =>
  players.filter((player) => wasPlayerInTeam(player, teamId));
