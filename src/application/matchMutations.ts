import { saveItem } from "../firebaseDb";
import { Match, MatchStatus, Tournament } from "../types";
import { getFallbackMatchOrder } from "../domain/match/matchOrdering";
import { progressMatchWinner } from "../domain/match/matchProgression";
import {
  MatchValidationIssue,
  validateMatchConsistency,
} from "../domain/match/matchValidation";
import { getNextId } from "../utils";

type MatchForm = {
  game: string;
  matchType: "player" | "team";
  player1: number;
  player2: number;
  team1: number;
  team2: number;
  score: string;
  maps: string[];
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

const getMatchValidationMessage = (
  commonText: CommonText,
  issue: MatchValidationIssue
) => {
  const messages: Record<MatchValidationIssue["code"], string | undefined> = {
    MATCH_SAME_PLAYER: commonText.matchSameParticipant,
    MATCH_SAME_TEAM: commonText.matchSameParticipant,
    MATCH_COMPLETED_WITHOUT_WINNER: commonText.matchCompletedWithoutWinner,
    MATCH_SCHEDULED_WITH_WINNER: commonText.matchScheduledWithWinner,
    MATCH_WINNER_NOT_PARTICIPANT: commonText.invalidMatchWinner,
    MATCH_TYPE_MISMATCH_TOURNAMENT: commonText.matchTypeMismatchTournament,
    MATCH_COMPLETE_WITHOUT_GAME: commonText.matchGameRequired,
    MATCH_COMPLETE_WITHOUT_PARTICIPANTS: commonText.matchParticipantsRequired,
  };

  return messages[issue.code] || issue.message;
};

const getBestOfMapCount = (bestOf: number) => {
  const safeBestOf = Number(bestOf || 1);
  if (safeBestOf >= 7) return 7;
  if (safeBestOf >= 5) return 5;
  if (safeBestOf >= 3) return 3;
  return 1;
};

type SaveMatchMutationParams = {
  matchForm: MatchForm;
  selectedMatch: Match | null;
  matches: Match[];
  tournaments: Tournament[];
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
  tournaments,
  commonText,
  isFirebaseConfigured,
  setMatches,
  setSelectedMatchId,
  showToast,
  writeStorage,
}: SaveMatchMutationParams) => {
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
      maps: [],
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

  let updatedMatch: Match = {
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
    maps: (matchForm.maps || [])
      .slice(0, getBestOfMapCount(matchForm.bestOf))
      .map((map) => map.trim())
      .filter((map, index, items) => map && items.indexOf(map) === index),
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

  const matchTournament =
    tournaments.find(
      (tournament) => tournament.id === Number(updatedMatch.tournamentId || 0)
    ) || null;
  if (matchTournament?.game !== "CS 2") {
    updatedMatch = { ...updatedMatch, maps: [] };
  }

  const validation = validateMatchConsistency({
    match: updatedMatch,
    tournament: matchTournament,
  });

  if (!validation.valid) {
    const firstError = validation.errors[0];
    console.error(firstError.message, firstError);
    showToast(getMatchValidationMessage(commonText, firstError), "danger");
    return;
  }

  validation.warnings.forEach((warning) => {
    console.warn(getMatchValidationMessage(commonText, warning), warning);
  });

  const progressionResult = progressMatchWinner({
    matches,
    currentMatch: updatedMatch,
  });

  const previousMatches = matches;

  setMatches(progressionResult.matches);
  writeStorage("tm_matches", progressionResult.matches);

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
