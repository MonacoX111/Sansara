export type ParticipantType = "player" | "team";

export type Placement = {
  place: number;
  playerId?: number;
  teamId?: number;
};

export type TournamentStatus = "draft" | "upcoming" | "ongoing" | "completed";

export type MatchStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export type MatchStage = "group" | "playoff" | "final" | "showmatch";

export type Team = {
  id: number;
  name: string;
  logo: string;
  games: string[];
  earnings: number;
  wins: number;
  players: number[];
  description: string;
  isFeatured?: boolean;
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
  isFeatured?: boolean;
};

export type Tournament = {
  id: number;
  order?: number;
  title: string;
  game: string;
  type: string;
  format: string;
  status: TournamentStatus;
  date: string;
  prize: string;
  description: string;
  imageUrl: string;

  // хто бере участь у турнірі
  participantType: ParticipantType;
  participantIds: number[];

  // результати
  winnerId?: number;
  winnerTeamId?: number;
  mvpId?: number;
  placements: Placement[];

  isPublished: boolean;
};

export type Match = {
  id: number;
  game: string;

  // режим матчу
  matchType: ParticipantType;

  // player match
  player1?: number;
  player2?: number;
  winnerId?: number;

  // team match
  team1?: number;
  team2?: number;
  winnerTeamId?: number;

  score: string;

  // прив’язка
  tournamentId?: number;

  // базова інформація
  date: string;
  status: MatchStatus;
  round: string;
  bestOf: number;
  notes: string;
  eloApplied: boolean;

  // нове для турнірної структури
  stage?: MatchStage;
  groupName?: string;
  roundLabel?: string;
  isPublished?: boolean;
};

export type Achievement = {
  id: number;
  title: string;
  description: string;
  image: string;
  playerIds: number[];
};

export type HomeAnnouncement = {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  date: string;
  prize: string;
  format: string;
  status: string;
  description: string;
  participantCount: number;
  tournamentId?: number;
  isVisible: boolean;
};

export type GameItem = {
  id: string;
  name: string;
  icon: string;
};

export type TabKey =
  | "home"
  | "players"
  | "teams"
  | "tournaments"
  | "leaderboard"
  | "admin";
