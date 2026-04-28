export type ParticipantType = "player" | "team" | "squad";

export type TournamentType = "1x1" | "2x2" | "3x3" | "5x5" | "custom";

export type TournamentFormat =
  | "playoff"
  | "groups_playoff"
  | "groups_only"
  | "swiss"
  | "league"
  | "custom";

export type Placement = {
  place: number;
  playerId?: number;
  teamId?: number;
};

export type TournamentGroup = {
  id: string;
  name: string;
  participantIds: number[];
};

export type TournamentTeamRoster = {
  teamId: number;
  playerIds: number[];
};

export type TournamentStatus =
  | "draft"
  | "upcoming"
  | "ongoing"
  | "completed"
  | "finished";

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
  teamHistory?: {
    teamId: number;
    from?: string;
    to?: string;
    isCurrent?: boolean;
  }[];
  games: string[];
  wins: number;
  losses: number;
  earnings: number;
  tournamentsWon: number;
  rank: number;
  elo: number;
  baseElo?: number;
  eloAdjustment?: number;
  bio: string;
  isFeatured?: boolean;
};

export type Tournament = {
  id: number;
  order?: number;
  title: string;
  game: string;
  type: TournamentType | string;
  format: TournamentFormat | string;
  status: TournamentStatus;
  date: string;
  prize: string;
  description: string;
  imageUrl: string;

  // хто бере участь у турнірі
  participantType: ParticipantType;
  participantIds: number[];

  // групи турніру
  teamRosters?: TournamentTeamRoster[];
  groups?: TournamentGroup[];

  // результати
  winnerId?: number;
  winnerTeamId?: number;
  winnerSquadIds?: number[];
  mvpId?: number;
  placements: Placement[];

  eloApplied?: boolean;
  isPublished: boolean;
};

export type Match = {
  id: number;
  order?: number;
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
seriesId?: string;
nextSeriesId?: string;
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
  participantLabelType: "players" | "teams";
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
  | "general"
  | "players"
  | "teams"
  | "tournaments"
  | "leaderboard"
  | "admin";
