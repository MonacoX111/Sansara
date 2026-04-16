import { Team, Player } from "./types";

export const makeIcon = (
  label: string,
  bg = "#18181b",
  fg = "#ffffff"
): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="${bg}"/>
    <text x="32" y="38" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="${fg}">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const parseList = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const getNextId = (items: { id: number }[]): number =>
  items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;

export const syncTeamPlayers = (
  nextPlayers: Player[],
  nextTeams: Team[]
): Team[] => {
  return nextTeams.map((team) => ({
    ...team,
    players: nextPlayers
      .filter((player) => player.teamId === team.id)
      .map((player) => player.id),
  }));
};

export const readStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStorage = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};
