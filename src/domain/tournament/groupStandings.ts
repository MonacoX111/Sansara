import {
  Match,
  Player,
  Team,
  Tournament,
  TournamentGroup,
} from "../../types";

export type GroupStandingRow = {
  id: number;
  name: string;
  image: string;
  played: number;
  wins: number;
  losses: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
};

export type GroupStandings = Record<string, GroupStandingRow[]>;

export type GroupedMatches = Record<string, Match[]>;

const DEFAULT_GROUP_NAME = "Group A";

export const groupMatchesByGroupName = (
  groupMatches: Match[],
  tournamentGroups?: TournamentGroup[]
): GroupedMatches => {
  const seed = (tournamentGroups || []).reduce((acc, group) => {
    acc[group.name] = [];
    return acc;
  }, {} as GroupedMatches);

  return groupMatches.reduce((acc, match) => {
    const group = match.groupName || DEFAULT_GROUP_NAME;

    if (!acc[group]) acc[group] = [];
    acc[group].push(match);

    return acc;
  }, seed);
};

type CalculateGroupStandingsArgs = {
  groupedMatches: GroupedMatches;
  tournament: Tournament | null | undefined;
  players: Player[];
  teams: Team[];
};

export const calculateGroupStandings = ({
  groupedMatches,
  tournament,
  players,
  teams,
}: CalculateGroupStandingsArgs): GroupStandings => {
  const getPlayerName = (playerId?: number) =>
    (playerId
      ? players.find((player) => player.id === playerId)?.nickname
      : undefined) || "—";

  const getTeamName = (teamId?: number) =>
    (teamId ? teams.find((team) => team.id === teamId)?.name : undefined) ||
    "—";

  return Object.entries(groupedMatches).reduce<GroupStandings>(
    (acc, [groupName, groupItems]) => {
      const table = new Map<string, GroupStandingRow>();

      const ensureParticipant = (
        id: number | undefined,
        name: string,
        image: string
      ) => {
        if (!id) return;

        const key = String(id);

        if (!table.has(key)) {
          table.set(key, {
            id,
            name,
            image,
            played: 0,
            wins: 0,
            losses: 0,
            points: 0,
            scoreFor: 0,
            scoreAgainst: 0,
          });
        }
      };

      const tournamentGroup = tournament?.groups?.find(
        (group) => group.name === groupName
      );

      tournamentGroup?.participantIds.forEach((participantId) => {
        const participant =
          tournament?.participantType === "team"
            ? teams.find((team) => team.id === participantId)
            : players.find((player) => player.id === participantId);

        const participantName =
          tournament?.participantType === "team"
            ? participant && "name" in participant
              ? participant.name
              : getTeamName(participantId)
            : participant && "nickname" in participant
            ? participant.nickname
            : getPlayerName(participantId);

        const participantImage =
          tournament?.participantType === "team"
            ? participant && "logo" in participant
              ? participant.logo
              : ""
            : participant && "avatar" in participant
            ? participant.avatar
            : "";

        ensureParticipant(participantId, participantName, participantImage);
      });

      groupItems.forEach((match) => {
        const leftId =
          match.matchType === "team" ? match.team1 : match.player1;

        const rightId =
          match.matchType === "team" ? match.team2 : match.player2;

        const winnerId =
          match.matchType === "team" ? match.winnerTeamId : match.winnerId;

        const leftEntity =
          match.matchType === "team"
            ? teams.find((team) => team.id === leftId)
            : players.find((player) => player.id === leftId);

        const rightEntity =
          match.matchType === "team"
            ? teams.find((team) => team.id === rightId)
            : players.find((player) => player.id === rightId);

        const leftName =
          match.matchType === "team"
            ? leftEntity && "name" in leftEntity
              ? leftEntity.name
              : getTeamName(leftId)
            : leftEntity && "nickname" in leftEntity
            ? leftEntity.nickname
            : getPlayerName(leftId);

        const rightName =
          match.matchType === "team"
            ? rightEntity && "name" in rightEntity
              ? rightEntity.name
              : getTeamName(rightId)
            : rightEntity && "nickname" in rightEntity
            ? rightEntity.nickname
            : getPlayerName(rightId);

        const leftImage =
          match.matchType === "team"
            ? leftEntity && "logo" in leftEntity
              ? leftEntity.logo
              : ""
            : leftEntity && "avatar" in leftEntity
            ? leftEntity.avatar
            : "";

        const rightImage =
          match.matchType === "team"
            ? rightEntity && "logo" in rightEntity
              ? rightEntity.logo
              : ""
            : rightEntity && "avatar" in rightEntity
            ? rightEntity.avatar
            : "";

        ensureParticipant(leftId, leftName, leftImage);
        ensureParticipant(rightId, rightName, rightImage);

        if (!leftId || !rightId || match.status !== "completed") return;

        const leftRow = table.get(String(leftId));
        const rightRow = table.get(String(rightId));

        if (!leftRow || !rightRow) return;

        const [leftScoreRaw, rightScoreRaw] = (match.score || "")
          .split(":")
          .map((value) => Number(value.trim()));

        const leftScore = Number.isFinite(leftScoreRaw) ? leftScoreRaw : 0;
        const rightScore = Number.isFinite(rightScoreRaw) ? rightScoreRaw : 0;

        leftRow.played += 1;
        rightRow.played += 1;

        leftRow.scoreFor += leftScore;
        leftRow.scoreAgainst += rightScore;

        rightRow.scoreFor += rightScore;
        rightRow.scoreAgainst += leftScore;

        if (winnerId === leftId) {
          leftRow.wins += 1;
          leftRow.points += 3;
          rightRow.losses += 1;
        }

        if (winnerId === rightId) {
          rightRow.wins += 1;
          rightRow.points += 3;
          leftRow.losses += 1;
        }
      });

      acc[groupName] = Array.from(table.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;

        const diffA = a.scoreFor - a.scoreAgainst;
        const diffB = b.scoreFor - b.scoreAgainst;

        if (diffB !== diffA) return diffB - diffA;
        return b.scoreFor - a.scoreFor;
      });

      return acc;
    },
    {}
  );
};
