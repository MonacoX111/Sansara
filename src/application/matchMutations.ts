import { saveItem } from "../firebaseDb";
import { Match, MatchStatus } from "../types";
import { getFallbackMatchOrder } from "../domain/match/matchOrdering";
import { progressMatchWinner } from "../domain/match/matchProgression";
import { validateMatchWinner } from "../domain/match/matchValidation";
import { getNextId } from "../utils";

type MatchForm = {
  game: string;
  matchType: "player" | "team";
  player1: number;
  player2: number;
  team1: number;
  team2: number;
  score: string;
  winnerId: number;
  winnerTeamId: number;
  tournamentId: number;
  date: string;
  status: MatchStatus;
  round: string;
  stage: "group" | "playoff" | "final" | "showmatch";
  groupName: string;
  roundLabel: string;
  seriesId?: string;
  nextSeriesId?: string;
  bestOf: number;
  notes: string;
};

type ToastType = "success" | "danger" | "warning";

type ShowToast = (
  text: string,
  type?: ToastType,
  action?: () => void,
  actionLabel?: string
) => void;

type CommonText = Record<string, string>;

type SaveMatchMutationParams = {
  matchForm: MatchForm;
  selectedMatch: Match | null;
  matches: Match[];
  commonText: CommonText;
  isFirebaseConfigured: boolean;
  setMatches: (items: Match[]) => void;
  setSelectedMatchId: (id: number) => void;
  showToast: ShowToast;
  writeStorage: (key: string, value: unknown) => void;
};

export const saveMatchMutation = async ({
  matchForm,
  selectedMatch,
  matches,
  commonText,
  isFirebaseConfigured,
  setMatches,
  setSelectedMatchId,
  showToast,
  writeStorage,
}: SaveMatchMutationParams) => {
  if (!matchForm.game.trim()) {
    showToast("Match game is required", "danger");
    return;
  }

  if (
    (matchForm.matchType === "player" &&
      (!Number(matchForm.player1) || !Number(matchForm.player2))) ||
    (matchForm.matchType === "team" &&
      (!Number(matchForm.team1) || !Number(matchForm.team2)))
  ) {
    showToast("Both match participants are required", "danger");
    return;
  }

  const baseMatch: Match =
    selectedMatch || {
      id: getNextId(matches),
      game: "",
      matchType: matchForm.matchType,
      player1: 0,
      player2: 0,
      team1: 0,
      team2: 0,
      score: "",
      winnerId: 0,
      winnerTeamId: 0,
      tournamentId: Number(matchForm.tournamentId || 0),
      date: "",
      status: "scheduled",
      round: "",
      bestOf: 1,
      notes: "",
      eloApplied: false,
      stage: "group",
      groupName: "",
      roundLabel: "",
    };

  const updatedMatch: Match = {
    ...baseMatch,
    order:
      typeof baseMatch.order === "number"
        ? baseMatch.order
        : getFallbackMatchOrder(matches, Number(matchForm.tournamentId || 0)),
    seriesId: matchForm.seriesId || "",
    nextSeriesId: matchForm.nextSeriesId || "",
    game: matchForm.game,
    matchType: matchForm.matchType,
    player1: Number(matchForm.player1),
    player2: Number(matchForm.player2),
    team1: Number(matchForm.team1),
    team2: Number(matchForm.team2),
    score: matchForm.score,
    winnerId: Number(matchForm.winnerId),
    winnerTeamId: Number(matchForm.winnerTeamId),
    tournamentId: Number(matchForm.tournamentId),
    date: matchForm.date,
    status: matchForm.status,
    round: matchForm.roundLabel || matchForm.round,
    stage: matchForm.stage || "group",
    groupName: matchForm.stage === "group" ? matchForm.groupName || "" : "",
    roundLabel: matchForm.roundLabel || "",
    bestOf: Number(matchForm.bestOf || 1),
    notes: matchForm.notes,
    eloApplied: false,
  };

  const validation = validateMatchWinner(updatedMatch);

  if (!validation.valid) {
    console.error(validation.logMessage);
    showToast(commonText.invalidMatchWinner, "danger");
    return;
  }

  const progressionResult = progressMatchWinner({
    matches,
    currentMatch: updatedMatch,
  });

  const previousMatches = matches;

  setMatches(progressionResult.matches);

  setSelectedMatchId(updatedMatch.id);

  try {
    if (isFirebaseConfigured) {
      await Promise.all(
        progressionResult.affectedMatches.map((match) =>
          saveItem("matches", match)
        )
      );
    }

    showToast(commonText.matchSaved);
  } catch (error) {
    console.error("Failed to save match:", error);
    if (isFirebaseConfigured) {
      setMatches(previousMatches);
      writeStorage("tm_matches", previousMatches);
    }
    showToast(commonText.matchSaveFailed, "danger");
  }
};
