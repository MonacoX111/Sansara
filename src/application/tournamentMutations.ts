import { saveItem } from "../firebaseDb";
import {
  Placement,
  Player,
  Tournament,
  TournamentGroup,
  TournamentStatus,
  TournamentTeamRoster,
} from "../types";
import { recalculateAllPlayersElo } from "../domain/player/playerElo";

type TournamentForm = {
  title: string;
  game: string;
  type: string;
  format: string;
  status: TournamentStatus;
  date: string;
  prize: string;
  description: string;
  imageUrl: string;
  participantType: "player" | "team" | "squad";
  participantIds: number[];
  teamRosters?: TournamentTeamRoster[];
  groups: TournamentGroup[];
  winnerId?: number;
  winnerTeamId?: number;
  winnerSquadIds?: number[];
  mvpId?: number;
  placements: Placement[];
  isPublished: boolean;
};

type ToastType = "success" | "danger" | "warning";

type ShowToast = (
  text: string,
  type?: ToastType,
  action?: () => void,
  actionLabel?: string
) => void;

type CommonText = Record<string, string>;

type SaveTournamentMutationParams = {
  confirmedEloWarning?: boolean;
  tournamentForm: TournamentForm;
  selectedTournamentId: number;
  selectedTournament: Tournament | null;
  tournaments: Tournament[];
  players: Player[];
  commonText: CommonText;
  isFirebaseConfigured: boolean;
  setTournaments: (items: Tournament[]) => void;
  setPlayers: (items: Player[]) => void;
  showToast: ShowToast;
  writeStorage: (key: string, value: unknown) => void;
};

export const saveTournamentMutation = async (
  params: SaveTournamentMutationParams
) => {
  const {
    confirmedEloWarning = false,
    tournamentForm,
    selectedTournamentId,
    selectedTournament,
    tournaments,
    players,
    commonText,
    isFirebaseConfigured,
    setTournaments,
    setPlayers,
    showToast,
    writeStorage,
  } = params;

  if (!tournamentForm.title.trim()) {
    showToast("Tournament title is required", "danger");
    return;
  }

  const updatedTournament: Tournament = {
    id: selectedTournamentId,
    order:
      typeof selectedTournament?.order === "number"
        ? selectedTournament.order
        : tournaments.findIndex(
            (tournament) => tournament.id === selectedTournamentId
          ),
    title: tournamentForm.title,
    game: tournamentForm.game,
    type: tournamentForm.type,
    format: tournamentForm.format,
    status: tournamentForm.status,
    date: tournamentForm.date,
    prize: tournamentForm.prize,
    description: tournamentForm.description,
    imageUrl: tournamentForm.imageUrl,
    participantType: tournamentForm.participantType || "player",
    participantIds: Array.isArray(tournamentForm.participantIds)
      ? tournamentForm.participantIds.map(Number)
      : [],
    teamRosters:
      tournamentForm.participantType === "team" &&
      Array.isArray(tournamentForm.teamRosters)
        ? tournamentForm.teamRosters
            .filter((roster) =>
              tournamentForm.participantIds.includes(Number(roster.teamId))
            )
            .map((roster) => ({
              teamId: Number(roster.teamId),
              playerIds: Array.isArray(roster.playerIds)
                ? roster.playerIds.map(Number)
                : [],
            }))
        : undefined,
    groups: Array.isArray(tournamentForm.groups)
      ? tournamentForm.groups.map((group, groupIndex) => ({
          id: group.id || `group-${groupIndex + 1}`,
          name: group.name || `Group ${groupIndex + 1}`,
          participantIds: Array.isArray(group.participantIds)
            ? group.participantIds.map(Number)
            : [],
        }))
      : [],
    winnerId:
      tournamentForm.participantType === "player" &&
      tournamentForm.winnerId &&
      tournamentForm.winnerId > 0
        ? Number(tournamentForm.winnerId)
        : undefined,
    winnerTeamId:
      tournamentForm.participantType === "team" &&
      tournamentForm.winnerTeamId &&
      tournamentForm.winnerTeamId > 0
        ? Number(tournamentForm.winnerTeamId)
        : undefined,
    winnerSquadIds:
      tournamentForm.participantType === "squad" &&
      Array.isArray(tournamentForm.winnerSquadIds)
        ? tournamentForm.winnerSquadIds.map(Number)
        : [],
    mvpId:
      tournamentForm.mvpId && tournamentForm.mvpId > 0
        ? Number(tournamentForm.mvpId)
        : undefined,
    placements: Array.isArray(tournamentForm.placements)
      ? tournamentForm.placements.map((item) => ({
          place: Number(item.place),
          playerId:
            typeof item.playerId === "number"
              ? Number(item.playerId)
              : undefined,
          teamId:
            typeof item.teamId === "number" ? Number(item.teamId) : undefined,
        }))
      : [],
    eloApplied:
      typeof selectedTournament?.eloApplied === "boolean"
        ? selectedTournament.eloApplied
        : undefined,
    isPublished: Boolean(tournamentForm.isPublished),
  };

  const isFinished =
    updatedTournament.status === "completed" ||
    updatedTournament.status === "finished";

  if (
    ["player", "team", "squad"].includes(updatedTournament.participantType) &&
    updatedTournament.participantIds.length === 0
  ) {
    showToast("Tournament participants are required", "danger");
    return;
  }

  if (
    isFinished &&
    Array.isArray(updatedTournament.placements) &&
    updatedTournament.placements.length > 0 &&
    !confirmedEloWarning
  ) {
    showToast(
      "Saving placements for a finished tournament may change ELO/ranks.",
      "warning",
      () => {
        void saveTournamentMutation({
          ...params,
          confirmedEloWarning: true,
        });
      },
      commonText.save || "Save"
    );
    return;
  }

  let updatedTournamentWithRoster = updatedTournament;

  if (
    isFinished &&
    updatedTournament.participantType === "team" &&
    Array.isArray(updatedTournament.placements)
  ) {
    const existingRosters = Array.isArray(updatedTournament.teamRosters)
      ? updatedTournament.teamRosters
      : [];

    const teamIdsFromPlacements = updatedTournament.placements
      .map((placement) => Number(placement.teamId ?? 0))
      .filter((teamId) => !Number.isNaN(teamId) && teamId > 0);

    const uniqueTeamIds = [...new Set(teamIdsFromPlacements)];

    const frozenRosters = uniqueTeamIds.map((teamId) => {
      const existing = existingRosters.find(
        (roster) => Number(roster.teamId) === teamId
      );

      if (
        existing &&
        Array.isArray(existing.playerIds) &&
        existing.playerIds.length > 0
      ) {
        return {
          teamId,
          playerIds: existing.playerIds.map(Number),
        };
      }

      const playerIds = players
        .filter((player) => Number(player.teamId) === teamId)
        .map((player) => Number(player.id));

      if (playerIds.length === 0) {
        console.warn("ELO: Empty roster for team", teamId, updatedTournament.id);
      }

      return {
        teamId,
        playerIds,
      };
    });

    const rosterByTeamId = new Map(
      existingRosters.map((roster) => [Number(roster.teamId), roster])
    );
    frozenRosters.forEach((roster) => {
      rosterByTeamId.set(Number(roster.teamId), roster);
    });

    updatedTournamentWithRoster = {
      ...updatedTournament,
      teamRosters: Array.from(rosterByTeamId.values()),
    };
  }

  const tournamentToSave: Tournament = {
    ...updatedTournamentWithRoster,
    eloApplied: isFinished ? true : Boolean(updatedTournament.eloApplied),
  };

  const previousTournaments = tournaments;
  const previousPlayers = players;

  const nextTournaments = tournaments.map((tournament) =>
    tournament.id === selectedTournamentId ? tournamentToSave : tournament
  );

  const safeTournaments = nextTournaments.map((tournament) => ({
    ...tournament,
    imageUrl:
      typeof tournament.imageUrl === "string" &&
      tournament.imageUrl.startsWith("data:")
        ? ""
        : tournament.imageUrl || "",
  }));

  const recalculatedPlayers = recalculateAllPlayersElo(players, safeTournaments);
  const changedPlayers = recalculatedPlayers.filter((player) => {
    const previous = players.find((item) => item.id === player.id);
    return (
      previous &&
      (previous.elo !== player.elo || previous.rank !== player.rank)
    );
  });

  setTournaments(safeTournaments);
  writeStorage("tm_tournaments", safeTournaments);

  if (changedPlayers.length > 0) {
    setPlayers(recalculatedPlayers);
    writeStorage("tm_players", recalculatedPlayers);
  }

  try {
    if (isFirebaseConfigured) {
      const safeTournament =
        safeTournaments.find(
          (tournament) => tournament.id === tournamentToSave.id
        ) || tournamentToSave;

      await saveItem("tournaments", safeTournament);
      if (changedPlayers.length > 0) {
        await Promise.all(
          changedPlayers.map((player) => saveItem("players", player))
        );
      }
    }
    showToast(commonText.tournamentSaved);
  } catch (error) {
    console.error("Failed to save tournament:", error);
    if (isFirebaseConfigured) {
      setTournaments(previousTournaments);
      writeStorage("tm_tournaments", previousTournaments);

      if (changedPlayers.length > 0) {
        setPlayers(previousPlayers);
        writeStorage("tm_players", previousPlayers);
      }
    }
    showToast("Failed to save tournament", "danger");
  }
};
