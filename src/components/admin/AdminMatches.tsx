import { Dispatch, ReactElement, SetStateAction } from "react";
import {
  Match,
  MatchStage,
  MatchStatus,
  ParticipantType,
  Player,
  Team,
  Tournament,
} from "../../types";

const matchStatusOptions: MatchStatus[] = [
  "scheduled",
  "ongoing",
  "completed",
  "cancelled",
];

type MatchForm = {
  game: string;
  matchType: Extract<ParticipantType, "player" | "team">;
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
  stage: MatchStage;
  groupName: string;
  roundLabel: string;
  seriesId?: string;
  nextSeriesId?: string;
  bestOf: number;
  notes: string;
};

type SelectValue = number | string;

type SelectOption = {
  value: SelectValue;
  label: string;
};

type PremiumSelectProps = {
  value: SelectValue;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: SelectValue) => void;
  disabled?: boolean;
};

type ConfirmDeleteState = {
  open: boolean;
  type: "player" | "team" | "tournament" | "match" | "achievement" | null;
  achievementId?: number;
};

type WinnerOption = {
  id: number;
  name: string;
};

type Props = {
  adminText: Record<string, string>;
  commonText: Record<string, string>;
  PremiumSelect: (props: PremiumSelectProps) => ReactElement;
  setConfirmDelete: Dispatch<SetStateAction<ConfirmDeleteState>>;
  tournaments: Tournament[];
  matches: Match[];
  selectedMatchId: number;
  setSelectedMatchId: (id: number) => void;
  matchForm: MatchForm;
  setMatchForm: Dispatch<SetStateAction<MatchForm>>;
  saveMatch: () => void;
  addMatch: (tournamentId?: number) => void;
  reorderMatch: (direction: "up" | "down", tournamentId: number) => void;
  autoGenerateBracket: (tournamentId: number) => void;
  matchTournamentFilterId: number;
  setMatchTournamentFilterId: (id: number) => void;
  selectedMatchTournament: Tournament | null;
  availablePlayer1Options: Player[];
  availablePlayer2Options: Player[];
  selectedWinnerOptions: WinnerOption[];
  availableTeam1Options: Team[];
  availableTeam2Options: Team[];
  selectedWinnerTeamOptions: WinnerOption[];
  getPlayerName: (id: number) => string;
  getTeamName: (id: number) => string;
  getTournamentName: (id: number) => string;
};

export default function AdminMatches(props: Props) {
  const {
    adminText,
    commonText,
    PremiumSelect,
    setConfirmDelete,
    tournaments,
    matches,
    selectedMatchId,
    setSelectedMatchId,
    matchForm,
    setMatchForm,
    saveMatch,
    addMatch,
    reorderMatch,
    autoGenerateBracket,
    matchTournamentFilterId,
    setMatchTournamentFilterId,
    selectedMatchTournament,
    availablePlayer1Options,
    availablePlayer2Options,
    selectedWinnerOptions,
    availableTeam1Options,
    availableTeam2Options,
    selectedWinnerTeamOptions,
    getPlayerName,
    getTeamName,
    getTournamentName,
  } = props;

  return (
      <div id="admin-section-matches" className="two-col">
        <div className="panel">
          <h2 className="panel-title">{adminText.matches}</h2>

          <div className="field-block">
            <label className="field-label">{adminText.selectTournament}</label>
            <PremiumSelect
              value={matchTournamentFilterId}
              placeholder={adminText.selectTournament}
              options={tournaments.map((tournament) => ({
                value: tournament.id,
                label: tournament.title || adminText.tournamentFallback,
              }))}
              onChange={(value) => {
                const nextTournamentId = Number(value);
                const nextTournament =
                  tournaments.find(
                    (tournament) => tournament.id === nextTournamentId
                  ) || null;

                setMatchTournamentFilterId(nextTournamentId);
                setSelectedMatchId(0);

setMatchForm({
  stage: "group",
  groupName: "",
  roundLabel: "",
  seriesId: "",
  nextSeriesId: "",
game: nextTournament?.game || "",
                  matchType:
                    nextTournament?.participantType === "team"
                      ? "team"
                      : "player",
                  player1: 0,
                  player2: 0,
                  team1: 0,
                  team2: 0,
                  score: "",
                  winnerId: 0,
                  winnerTeamId: 0,
                  tournamentId: nextTournamentId,
                  date: "",
                  status: "scheduled",
                  round: "",
                  bestOf: 1,
                  notes: "",
                });
              }}
            />
          </div>

          <div className="list-col admin-scroll-list">
<div className="btn-row">
  <button
    className="secondary-btn add-list-btn add-match-btn-top"
    onClick={() => addMatch(matchTournamentFilterId)}
  >
    {adminText.addMatch}
  </button>

<button
  className="primary-btn auto-bracket-btn"
  disabled={!matchTournamentFilterId}
  onClick={() => autoGenerateBracket(matchTournamentFilterId)}
>
  {adminText.autoGenerateBracket}
</button>
</div>

<div className="btn-row">
  <button
    className="secondary-btn"
    disabled={!selectedMatchId}
    onClick={() => reorderMatch("up", matchTournamentFilterId)}
  >
    {adminText.moveUp}
  </button>

  <button
    className="secondary-btn"
    disabled={!selectedMatchId}
    onClick={() => reorderMatch("down", matchTournamentFilterId)}
  >
    {adminText.moveDown}
  </button>
</div>

            {[...matches]
              .filter((match) =>
                matchTournamentFilterId
                  ? match.tournamentId === matchTournamentFilterId
                  : match.tournamentId === 0
              )
              .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id))
              .map((match) => (
                <button
                  key={match.id}
                  onClick={() => {
                    setSelectedMatchId(match.id);
                    setMatchTournamentFilterId(match.tournamentId || 0);
                  }}
                  className={`admin-list-btn ${
                    selectedMatchId === match.id ? "admin-list-btn-active" : ""
                  }`}
                >
                  {match.matchType === "team"
                    ? `${getTeamName(match.team1 || 0)} vs ${getTeamName(
                        match.team2 || 0
                      )}`
                    : `${getPlayerName(match.player1 || 0)} vs ${getPlayerName(
                        match.player2 || 0
                      )}`}
                </button>
              ))}
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">{adminText.editMatch}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.matchType}</label>
              <PremiumSelect
                value={
                  selectedMatchTournament?.participantType ||
                  matchForm.matchType
                }
                placeholder={adminText.matchType}
                disabled={Boolean(selectedMatchTournament)}
                options={[
                  { value: "player", label: adminText.playerVsPlayer },
                  { value: "team", label: adminText.teamVsTeam },
                ]}
                onChange={(value) =>
                  setMatchForm((prev: MatchForm) => ({
                    ...prev,
                    matchType: value as "player" | "team",
                    player1: 0,
                    player2: 0,
                    team1: 0,
                    team2: 0,
                    winnerId: 0,
                    winnerTeamId: 0,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.tournament}</label>
              <div className="admin-premium-select admin-premium-select-disabled">
                <div className="admin-premium-select-trigger admin-premium-select-trigger-disabled">
                  <span>
                    {getTournamentName(matchForm.tournamentId) ||
                      adminText.noTournament}
                  </span>
                  <span className="admin-premium-select-arrow">⌄</span>
                </div>
              </div>
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">{adminText.game}</label>
                <input
                  className="input"
                  placeholder={adminText.game}
                  value={matchForm.game}
                  onChange={(e) =>
                    setMatchForm((prev: MatchForm) => ({
                      ...prev,
                      game: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.date}</label>
                <input
                  className="input"
                  type="date"
                  value={matchForm.date}
                  onChange={(e) =>
                    setMatchForm((prev: MatchForm) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {matchForm.matchType === "player" ? (
              <div className="form-grid two">
                <div className="field-block">
                  <label className="field-label">{adminText.player1}</label>
                  <PremiumSelect
                    value={matchForm.player1}
                    placeholder={adminText.selectPlayer}
                    options={availablePlayer1Options.map((player) => ({
                      value: player.id,
                      label: player.nickname,
                    }))}
                    onChange={(value) => {
                      const nextPlayer1 = Number(value);
                      const nextWinnerId =
                        matchForm.winnerId === nextPlayer1 ||
                        matchForm.winnerId === matchForm.player2
                          ? matchForm.winnerId
                          : 0;

                      setMatchForm((prev: MatchForm) => ({
                        ...prev,
                        player1: nextPlayer1,
                        winnerId: nextWinnerId,
                      }));
                    }}
                  />
                </div>

                <div className="field-block">
                  <label className="field-label">{adminText.player2}</label>
                  <PremiumSelect
                    value={matchForm.player2}
                    placeholder={adminText.selectPlayer}
                    options={availablePlayer2Options.map((player) => ({
                      value: player.id,
                      label: player.nickname,
                    }))}
                    onChange={(value) => {
                      const nextPlayer2 = Number(value);
                      const nextWinnerId =
                        matchForm.winnerId === nextPlayer2 ||
                        matchForm.winnerId === matchForm.player1
                          ? matchForm.winnerId
                          : 0;

                      setMatchForm((prev: MatchForm) => ({
                        ...prev,
                        player2: nextPlayer2,
                        winnerId: nextWinnerId,
                      }));
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="form-grid two">
                <div className="field-block">
                  <label className="field-label">{adminText.team1}</label>
<PremiumSelect
  value={matchForm.team1}
  placeholder={adminText.selectTeam}
  options={availableTeam1Options.map((team) => ({
    value: team.id,
    label: team.name,
  }))}
  onChange={(value) => {
    const nextTeam1 = Number(value);
    const nextWinnerTeamId =
      matchForm.winnerTeamId === nextTeam1 ||
      matchForm.winnerTeamId === matchForm.team2
        ? matchForm.winnerTeamId
        : 0;

    setMatchForm((prev: MatchForm) => ({
      ...prev,
      team1: nextTeam1,
      winnerTeamId: nextWinnerTeamId,
    }));
  }}
/>
                </div>

                <div className="field-block">
                  <label className="field-label">{adminText.team2}</label>
<PremiumSelect
  value={matchForm.team2}
  placeholder={adminText.selectTeam}
  options={availableTeam2Options.map((team) => ({
    value: team.id,
    label: team.name,
  }))}
  onChange={(value) => {
    const nextTeam2 = Number(value);
    const nextWinnerTeamId =
      matchForm.winnerTeamId === nextTeam2 ||
      matchForm.winnerTeamId === matchForm.team1
        ? matchForm.winnerTeamId
        : 0;

    setMatchForm((prev: MatchForm) => ({
      ...prev,
      team2: nextTeam2,
      winnerTeamId: nextWinnerTeamId,
    }));
  }}
/>
                </div>
              </div>
            )}

            <div className="field-block">
              <label className="field-label">{adminText.score}</label>
              <input
                className="input"
                placeholder="2:1"
                value={matchForm.score}
                onChange={(e) =>
                  setMatchForm((prev: MatchForm) => ({
                    ...prev,
                    score: e.target.value,
                  }))
                }
              />
            </div>

            {matchForm.matchType === "player" ? (
              <div className="field-block">
                <label className="field-label">{adminText.winner}</label>
                <PremiumSelect
                  value={
                    selectedWinnerOptions.some(
                      (player) => player.id === matchForm.winnerId
                    )
                      ? matchForm.winnerId
                      : 0
                  }
                  placeholder={adminText.selectWinner}
                  options={selectedWinnerOptions.map((player) => ({
                    value: player.id,
                    label: player.name,
                  }))}
                  onChange={(value) =>
                    setMatchForm((prev: MatchForm) => ({
                      ...prev,
                      winnerId: Number(value),
                    }))
                  }
                />
              </div>
            ) : (
              <div className="field-block">
                <label className="field-label">{adminText.winningTeam}</label>
<PremiumSelect
  value={
    selectedWinnerTeamOptions.some(
      (team) => team.id === matchForm.winnerTeamId
    )
      ? matchForm.winnerTeamId
      : 0
  }
  placeholder={adminText.selectWinningTeam}
  options={selectedWinnerTeamOptions.map((team) => ({
    value: team.id,
    label: team.name,
  }))}
  onChange={(value) =>
    setMatchForm((prev: MatchForm) => ({
      ...prev,
      winnerTeamId: Number(value),
    }))
  }
/>
              </div>
            )}

<div className="form-grid two">
  <div className="field-block">
    <label className="field-label">{adminText.status}</label>
    <PremiumSelect
      value={matchForm.status}
      placeholder={adminText.selectStatus}
      options={matchStatusOptions.map((status) => ({
        value: status,
        label: status,
      }))}
      onChange={(value) =>
        setMatchForm((prev: MatchForm) => ({
          ...prev,
          status: value as MatchStatus,
        }))
      }
    />
  </div>

  <div className="field-block">
    <label className="field-label">{adminText.stage}</label>
    <PremiumSelect
      value={matchForm.stage}
      placeholder={adminText.selectStage}
      options={[
        { value: "group", label: adminText.groupStage },
        { value: "playoff", label: adminText.playoffStage },
        { value: "final", label: adminText.finalStage },
        { value: "showmatch", label: adminText.showmatchStage },
      ]}
      onChange={(value) =>
        setMatchForm((prev: MatchForm) => ({
          ...prev,
          stage: value as "group" | "playoff" | "final" | "showmatch",
          groupName: value === "group" ? prev.groupName : "",
        }))
      }
    />
  </div>
</div>

<div className="form-grid two">
<div className="field-block">
  <label className="field-label">{adminText.group}</label>
  <PremiumSelect
    value={matchForm.groupName || ""}
    placeholder={adminText.selectGroup}
    disabled={matchForm.stage !== "group"}
    options={(selectedMatchTournament?.groups || []).map((group) => ({
      value: group.name,
      label: group.name,
    }))}
    onChange={(value) =>
      setMatchForm((prev: MatchForm) => ({
        ...prev,
        groupName: String(value),
      }))
    }
  />
</div>

  <div className="field-block">
    <label className="field-label">{adminText.roundLabel}</label>
    <input
      className="input"
      placeholder={adminText.roundLabelPlaceholder}
      value={matchForm.roundLabel}
      onChange={(e) =>
        setMatchForm((prev: MatchForm) => ({
          ...prev,
          roundLabel: e.target.value,
          round: e.target.value,
        }))
      }
    />
  </div>
</div>

<div className="field-block">
  <label className="field-label">{adminText.seriesId}</label>
  <div className="field-block">
  <label className="field-label">{adminText.nextSeries}</label>
  <input
    className="input"
    placeholder={adminText.nextSeriesPlaceholder}
    value={matchForm.nextSeriesId || ""}
    onChange={(e) =>
      setMatchForm((prev: MatchForm) => ({
        ...prev,
        nextSeriesId: e.target.value,
      }))
    }
  />
</div>
  <input
    className="input"
    placeholder={adminText.seriesIdPlaceholder}
    value={matchForm.seriesId || ""}
    onChange={(e) =>
      setMatchForm((prev: MatchForm) => ({
        ...prev,
        seriesId: e.target.value,
      }))
    }
  />
</div>

            <div className="field-block">
              <label className="field-label">{adminText.bestOf}</label>
              <input
                className="input"
                type="number"
                min={1}
                value={matchForm.bestOf}
                onChange={(e) =>
                  setMatchForm((prev: MatchForm) => ({
                    ...prev,
                    bestOf: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.notes}</label>
              <textarea
                className="input textarea"
                placeholder={adminText.notes}
                value={matchForm.notes}
                onChange={(e) =>
                  setMatchForm((prev: MatchForm) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </div>

            <div className="btn-row">
<button className="primary-btn" onClick={saveMatch}>
  {commonText.save}
</button>
<button
  className="danger-btn"
  onClick={() => setConfirmDelete({ open: true, type: "match" })}
>
  {commonText.delete}
</button>
            </div>
          </div>
        </div>
      </div>
  );
}
