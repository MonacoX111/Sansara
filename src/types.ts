export type Placement = {
  playerId: number;
  place: number;
};

export type TournamentStatus = "draft" | "upcoming" | "ongoing" | "completed";

export type MatchStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export type Team = {
  id: number;
  name: string;
  logo: string;
  games: string[];
  earnings: number;
  wins: number;
  players: number[];
  description: string;
};

export type Player = {
  id: number;
  nickname: string;
  fullName: string;
  avatar: string;
  teamId: number;
  games: string[];
  wins: number;
  losses: number;
  earnings: number;
  tournamentsWon: number;
  rank: number;
  elo: number;
  bio: string;
};

export type Tournament = {
  id: number;
  title: string;
  game: string;
  type: string;
  format: string;
  status: TournamentStatus;
  date: string;
  prize: string;
  description: string;
  participantIds: number[];
  winnerId?: number;
  mvpId?: number;
  placements: Placement[];
  isPublished: boolean;
};

export type Match = {
  id: number;
  game: string;
  player1: number;
  player2: number;
  score: string;
  winnerId: number;
  tournamentId: number;
  date: string;
  status: MatchStatus;
  round: string;
  bestOf: number;
  notes: string;
  eloApplied: boolean;
};

export type Achievement = {
  id: number;
  title: string;
  description: string;
  image: string;
  playerIds: number[];
};

export type GameItem = {
  id: string;
  name: string;
  icon: string;
};

export type TabKey =
  | "players"
  | "teams"
  | "tournaments"
  | "leaderboard"
  | "admin";
