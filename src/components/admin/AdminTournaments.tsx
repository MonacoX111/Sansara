import {
  ChangeEvent,
  Dispatch,
  ReactElement,
  SetStateAction,
} from "react";
import { getPlayersForHistoricalTeam } from "../../domain/player/playerTeams";

import {
  Placement,
  Player,
  Team,
  Tournament,
  TournamentGroup,
  TournamentStatus,
  TournamentTeamRoster,
} from "../../types";

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

const tournamentStatusOptions: TournamentStatus[] = [
  "draft",
  "upcoming",
  "ongoing",
  "completed",
  "finished",
];

type Props = {
  adminText: Record<string, string>;
  commonText: Record<string, string>;
  PremiumSelect: (props: PremiumSelectProps) => ReactElement;
  setConfirmDelete: Dispatch<SetStateAction<ConfirmDeleteState>>;

  players: Player[];
  teams: Team[];
  tournaments: Tournament[];

  selectedTournamentId: number;
  tournamentForm: TournamentForm;
  setTournamentForm: Dispatch<SetStateAction<TournamentForm>>;

  saveTournament: () => void;
  addTournament: () => void;
  reorderTournament: (direction: "up" | "down") => void;
  handleTournamentImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  handleTournamentSelect: (id: number) => void;

  orderedTournaments: Tournament[];
  safeTournamentParticipantIds: number[];

  selectedTournamentPlayers: Player[];
  selectedTournamentTeams: Team[];
  selectedTournamentMvpPlayers: Player[];

selectedTournamentWinnerId: number | string;
selectedTournamentWinnerTeamId: number | string;
selectedTournamentMvpId: number | string;

  toggleTournamentParticipant: (id: number) => void;
  addTournamentGroup: () => void;
  updateTournamentGroupName: (groupId: string, name: string) => void;
  deleteTournamentGroup: (groupId: string) => void;
  toggleTournamentGroupParticipant: (
    groupId: string,
    participantId: number
  ) => void;
  toggleTournamentRosterPlayer: (teamId: number, playerId: number) => void;

  getPlayerName: (id: number) => string;
};

export default function AdminTournaments(props: Props) {
  const {
    adminText,
    commonText,
    PremiumSelect,
    setConfirmDelete,
    players,
    teams,
    tournaments,
    selectedTournamentId,
    tournamentForm,
    setTournamentForm,
    saveTournament,
    addTournament,
    reorderTournament,
    handleTournamentImageUpload,
    handleTournamentSelect,
    orderedTournaments,
    safeTournamentParticipantIds,
    selectedTournamentPlayers,
    selectedTournamentTeams,
    selectedTournamentMvpPlayers,
    selectedTournamentWinnerId,
    selectedTournamentWinnerTeamId,
    selectedTournamentMvpId,
    toggleTournamentParticipant,
    addTournamentGroup,
    updateTournamentGroupName,
    deleteTournamentGroup,
    toggleTournamentGroupParticipant,
    toggleTournamentRosterPlayer,
    getPlayerName,
  } = props;

  return (
      <div id="admin-section-tournaments" className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">{adminText.tournaments}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.selectTournament}</label>
              <PremiumSelect
                value={selectedTournamentId}
                placeholder={adminText.selectTournament}
                options={orderedTournaments.map((tournament) => ({
                  value: tournament.id,
                  label: tournament.title || adminText.tournamentFallback,
                }))}
                onChange={(value) => handleTournamentSelect(Number(value))}
              />
            </div>

            <button
              className="secondary-btn add-list-btn add-tournament-btn-top"
              onClick={addTournament}
            >
              {adminText.addTournament}
            </button>

            <div className="btn-row">
              <button
                className="secondary-btn"
                disabled={
                  orderedTournaments.findIndex(
                    (tournament) => tournament.id === selectedTournamentId
                  ) <= 0
                }
                onClick={() => reorderTournament("up")}
              >
                {adminText.moveUp}
              </button>

              <button
                className="secondary-btn"
                disabled={
                  orderedTournaments.findIndex(
                    (tournament) => tournament.id === selectedTournamentId
                  ) === -1 ||
                  orderedTournaments.findIndex(
                    (tournament) => tournament.id === selectedTournamentId
                  ) >=
                    orderedTournaments.length - 1
                }
                onClick={() => reorderTournament("down")}
              >
                {adminText.moveDown}
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">{adminText.editTournament}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.title}</label>
              <input
                className="input"
                placeholder={adminText.tournamentTitlePlaceholder}
                value={tournamentForm.title}
                onChange={(e) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">{adminText.game}</label>
                <input
                  className="input"
                  placeholder={adminText.game}
                  value={tournamentForm.game}
                  onChange={(e) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      game: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.participantType}</label>
                <PremiumSelect
                  value={tournamentForm.participantType || "player"}
                  placeholder={adminText.playersOption}
                  options={[
                    { value: "player", label: adminText.playersOption },
                    { value: "team", label: adminText.teamsOption },
                    { value: "squad", label: adminText.squadOption },
                  ]}
                  onChange={(value) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      participantType: value as "player" | "team" | "squad",
                      participantIds: [],
                      teamRosters: value === "team" ? [] : undefined,
                      winnerId: undefined,
                      winnerTeamId: undefined,
                      winnerSquadIds: [],
                      mvpId: undefined,
                      placements: [],
                    }))
                  }
                />
              </div>

<div className="field-block">
  <label className="field-label">{adminText.type}</label>
  <PremiumSelect
    value={tournamentForm.type || "1x1"}
    placeholder={adminText.selectType}
    options={[
      { value: "1x1", label: adminText.oneVsOne },
      { value: "2x2", label: adminText.twoVsTwo },
      { value: "3x3", label: adminText.threeVsThree },
      { value: "5x5", label: adminText.fiveVsFive },
      { value: "custom", label: adminText.customOption },
    ]}
    onChange={(value) =>
      setTournamentForm((prev) => ({
        ...prev,
        type: value as string,
      }))
    }
  />
</div>
            </div>

            <div className="form-grid two">
<div className="field-block">
  <label className="field-label">{adminText.format}</label>
  <PremiumSelect
    value={tournamentForm.format || "playoff"}
    placeholder={adminText.selectFormat}
    options={[
      { value: "playoff", label: adminText.playoffSingleElimination },
      { value: "groups_playoff", label: adminText.groupsPlayoff },
      { value: "groups_only", label: adminText.groupsOnly },
      { value: "swiss", label: adminText.swissSystem },
      { value: "league", label: adminText.leagueRoundRobin },
      { value: "custom", label: adminText.customOption },
    ]}
    onChange={(value) =>
      setTournamentForm((prev) => ({
        ...prev,
        format: value as string,
      }))
    }
  />
</div>

              <div className="field-block">
                <label className="field-label">{adminText.status}</label>
                <PremiumSelect
                  value={tournamentForm.status}
                  placeholder={adminText.selectStatus}
                  options={tournamentStatusOptions.map((status) => ({
                    value: status,
                    label: status,
                  }))}
                  onChange={(value) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      status: value as TournamentStatus,
                    }))
                  }
                />
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.date}</label>
              <input
                className="input"
                type="date"
                value={tournamentForm.date}
                onChange={(e) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.prize}</label>
              <input
                className="input"
                placeholder={adminText.prizePlaceholder}
                value={tournamentForm.prize}
                onChange={(e) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    prize: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.description}</label>
              <textarea
                className="input textarea"
                placeholder={adminText.tournamentDescriptionPlaceholder}
                value={tournamentForm.description}
                onChange={(e) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="field-block">
              <label className="field-label">{adminText.tournamentImage}</label>
              <input
                className="input"
                type="text"
                placeholder={adminText.imageUrlPlaceholder}
                value={tournamentForm.imageUrl || ""}
                onChange={handleTournamentImageUpload}
              />

              {tournamentForm.imageUrl ? (
                <img
                  src={tournamentForm.imageUrl}
                  alt={adminText.tournamentPreviewAlt}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    maxHeight: 160,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
              ) : null}
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.participants}</label>

              <div className="picker-grid compact-grid">
                {tournamentForm.participantType === "team"
                  ? teams.map((team) => {
                      const isSelected = safeTournamentParticipantIds.includes(
                        team.id
                      );

                      return (
                        <button
                          key={team.id}
                          type="button"
                          className={`picker-btn compact ${
                            isSelected ? "picker-btn-active" : ""
                          }`}
                          onClick={() => toggleTournamentParticipant(team.id)}
                        >
                          <span>{team.name}</span>
                        </button>
                      );
                    })
                  : players.map((player) => {
                      const isSelected = safeTournamentParticipantIds.includes(
                        player.id
                      );

                      return (
                        <button
                          key={player.id}
                          type="button"
                          className={`picker-btn compact ${
                            isSelected ? "picker-btn-active" : ""
                          }`}
                          onClick={() => toggleTournamentParticipant(player.id)}
                        >
                          <span>
                            {tournamentForm.participantType === "squad"
                              ? `${adminText.squadMember}: ${player.nickname}`
                              : player.nickname}
                          </span>
                        </button>
                      );
                    })}
              </div>
            </div>

            <div className="match-preview">
              <div className="muted small">
                {adminText.participantsSelected}: {safeTournamentParticipantIds.length}
              </div>
              <div className="muted small">
                {tournamentForm.participantType === "team"
                  ? selectedTournamentTeams.length > 0
                    ? selectedTournamentTeams.map((team) => team.name).join(", ")
                    : adminText.noParticipantsSelected
                  : selectedTournamentPlayers.length > 0
                  ? selectedTournamentPlayers
                      .map((player) => player.nickname)
                      .join(", ")
                : adminText.noParticipantsSelected}
              </div>
            </div>

            {tournamentForm.participantType === "team" &&
            selectedTournamentTeams.length > 0 ? (
              <div className="field-block">
                <label className="field-label">
                  {adminText.tournamentTeamRosters || "Tournament team rosters"}
                </label>

                <div className="form-col">
                  {selectedTournamentTeams.map((team) => {
                    const roster = Array.isArray(tournamentForm.teamRosters)
                      ? tournamentForm.teamRosters.find(
                          (item) => Number(item.teamId) === Number(team.id)
                        )
                      : undefined;
                    const selectedRosterPlayerIds = new Set(
                      Array.isArray(roster?.playerIds)
                        ? roster.playerIds.map(Number)
                        : []
                    );
                    const eligiblePlayers = getPlayersForHistoricalTeam(
                      team.id,
                      players
                    );
                    const eligiblePlayerIds = new Set(
                      eligiblePlayers.map((player) => player.id)
                    );
                    const selectedIneligiblePlayerIds = Array.from(
                      selectedRosterPlayerIds
                    ).filter((playerId) => !eligiblePlayerIds.has(playerId));

                    return (
                      <div key={`roster-${team.id}`} className="simple-card">
                        <div className="row-between">
                          <div>
                            <div className="achievement-title">{team.name}</div>
                            <div className="muted small">
                              {adminText.rosterPlayersSelected ||
                                "Roster players selected"}
                              : {selectedRosterPlayerIds.size}
                            </div>
                          </div>
                        </div>

                        {eligiblePlayers.length > 0 ? (
                          <div className="picker-grid compact-grid">
                            {eligiblePlayers.map((player) => {
                            const isSelected = selectedRosterPlayerIds.has(
                              player.id
                            );

                            return (
                              <label
                                key={`roster-${team.id}-${player.id}`}
                                className={`picker-btn compact ${
                                  isSelected ? "picker-btn-active" : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleTournamentRosterPlayer(
                                      team.id,
                                      player.id
                                    )
                                  }
                                />
                                <span>{player.nickname}</span>
                              </label>
                            );
                            })}
                          </div>
                        ) : (
                          <div className="muted small">
                            {adminText.noEligibleRosterPlayers ||
                              "No eligible players for this team"}
                          </div>
                        )}

                        {selectedIneligiblePlayerIds.length > 0 ? (
                          <div className="tag-row compact">
                            {selectedIneligiblePlayerIds.map((playerId) => {
                              const selectedPlayer = players.find(
                                (player) => player.id === playerId
                              );

                              return (
                                <span
                                  key={`ineligible-${team.id}-${playerId}`}
                                  className="pill light"
                                >
                                  {selectedPlayer?.nickname ||
                                    adminText.unknownPlayer ||
                                    "Unknown"}{" "}
                                  / not eligible
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {(tournamentForm.format === "groups_playoff" ||
              tournamentForm.format === "groups_only" ||
              tournamentForm.format === "league" ||
              tournamentForm.format === "swiss") && (
              <div className="field-block">
                <div className="btn-row">
                  <label className="field-label">{adminText.groupsSetup}</label>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={addTournamentGroup}
                  >
                    {adminText.addGroup}
                  </button>
                </div>

                <div className="admin-groups-grid">
                  {(Array.isArray(tournamentForm.groups)
                    ? tournamentForm.groups
                    : []
                  ).map((group) => (
                    <div key={group.id} className="admin-group-card">
                      <div className="btn-row">
                        <input
                          className="input"
                          value={group.name}
                          placeholder={adminText.groupPlaceholder}
                          onChange={(e) =>
                            updateTournamentGroupName(group.id, e.target.value)
                          }
                        />

                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => deleteTournamentGroup(group.id)}
                        >
                          {commonText.delete}
                        </button>
                      </div>

                      <div className="picker-grid compact-grid">
                        {tournamentForm.participantType === "team"
                          ? selectedTournamentTeams.map((team) => {
                              const isSelected = Array.isArray(
                                group.participantIds
                              )
                                ? group.participantIds.includes(team.id)
                                : false;

                              return (
                                <button
                                  key={`${group.id}-${team.id}`}
                                  type="button"
                                  className={`picker-btn compact ${
                                    isSelected ? "picker-btn-active" : ""
                                  }`}
                                  onClick={() =>
                                    toggleTournamentGroupParticipant(
                                      group.id,
                                      team.id
                                    )
                                  }
                                >
                                  <span>{team.name}</span>
                                </button>
                              );
                            })
                          : selectedTournamentPlayers.map((player) => {
                              const isSelected = Array.isArray(
                                group.participantIds
                              )
                                ? group.participantIds.includes(player.id)
                                : false;

                              return (
                                <button
                                  key={`${group.id}-${player.id}`}
                                  type="button"
                                  className={`picker-btn compact ${
                                    isSelected ? "picker-btn-active" : ""
                                  }`}
                                  onClick={() =>
                                    toggleTournamentGroupParticipant(
                                      group.id,
                                      player.id
                                    )
                                  }
                                >
                                  <span>{player.nickname}</span>
                                </button>
                              );
                            })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="field-block">
              <label className="field-label">{adminText.mvp}</label>
              <PremiumSelect
                value={selectedTournamentMvpId || 0}
                placeholder={adminText.selectMvp}
                options={selectedTournamentMvpPlayers.map((player) => ({
                  value: player.id,
                  label: player.nickname,
                }))}
                onChange={(value) =>
                  setTournamentForm((prev) => ({
                    ...prev,
                    mvpId: Number(value) > 0 ? Number(value) : undefined,
                  }))
                }
              />
            </div>

            {tournamentForm.participantType === "team" && (
              <div className="field-block">
                <label className="field-label">{adminText.winnerTeam}</label>
                <PremiumSelect
                  value={selectedTournamentWinnerTeamId || 0}
                  placeholder={adminText.selectWinnerTeam}
                  options={selectedTournamentTeams.map((team) => ({
                    value: team.id,
                    label: team.name,
                  }))}
                  onChange={(value) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      winnerTeamId:
                        Number(value) > 0 ? Number(value) : undefined,
                    }))
                  }
                />
              </div>
            )}

            {tournamentForm.participantType === "player" && (
              <div className="field-block">
                <label className="field-label">{adminText.winnerPlayer}</label>
                <PremiumSelect
                  value={selectedTournamentWinnerId || 0}
                  placeholder={adminText.selectWinnerPlayer}
                  options={selectedTournamentPlayers.map((player) => ({
                    value: player.id,
                    label: player.nickname,
                  }))}
                  onChange={(value) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      winnerId: Number(value) > 0 ? Number(value) : undefined,
                      winnerTeamId: undefined,
                      winnerSquadIds: [],
                    }))
                  }
                />
              </div>
            )}

            {tournamentForm.participantType === "squad" && (
              <div className="field-block">
                <label className="field-label">{adminText.winnerSquadPlayers}</label>

                <div className="picker-grid compact-grid">
                  {selectedTournamentPlayers.map((player) => {
                    const winnerSquadIds = Array.isArray(
                      tournamentForm.winnerSquadIds
                    )
                      ? tournamentForm.winnerSquadIds
                      : [];

                    const isSelected = winnerSquadIds.includes(player.id);

                    return (
                      <button
                        key={`winner-squad-${player.id}`}
                        type="button"
                        className={`picker-btn compact ${
                          isSelected ? "picker-btn-active" : ""
                        }`}
                        onClick={() =>
                          setTournamentForm((prev) => {
                            const currentIds = Array.isArray(
                              prev.winnerSquadIds
                            )
                              ? prev.winnerSquadIds
                              : [];

                            const nextWinnerSquadIds = currentIds.includes(
                              player.id
                            )
                              ? currentIds.filter((id) => id !== player.id)
                              : [...currentIds, player.id];

                            return {
                              ...prev,
                              winnerSquadIds: nextWinnerSquadIds,
                              winnerId: undefined,
                              winnerTeamId: undefined,
                            };
                          })
                        }
                      >
                        <span>{player.nickname}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="muted small">
                  {adminText.selectedWinners}:{" "}
                  {Array.isArray(tournamentForm.winnerSquadIds) &&
                  tournamentForm.winnerSquadIds.length > 0
                    ? tournamentForm.winnerSquadIds
                        .map((id) => getPlayerName(id))
                        .join(" / ")
                    : adminText.noSquadWinnersSelected}
                </div>
              </div>
            )}

            <div className="field-block">
              <label className="field-label">{adminText.placements}</label>

              <div className="form-col">
                {tournamentForm.participantType === "team"
                  ? selectedTournamentTeams.map((team) => {
                      const placement = Array.isArray(tournamentForm.placements)
                        ? tournamentForm.placements.find(
                            (item) => item.teamId === team.id
                          )
                        : undefined;

                      return (
                        <div key={team.id} className="form-grid two">
                          <div className="field-block">
                            <label className="field-label">{team.name}</label>
                            <input
                              className="input"
                              type="number"
                              min={1}
                              placeholder={adminText.place}
                              value={placement ? placement.place : ""}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                const nextPlace = Number(rawValue);

                                setTournamentForm((prev) => {
                                  const safePlacements = Array.isArray(
                                    prev.placements
                                  )
                                    ? prev.placements
                                    : [];

                                  if (!rawValue || nextPlace <= 0) {
                                    return {
                                      ...prev,
                                      placements: safePlacements.filter(
                                        (item) => item.teamId !== team.id
                                      ),
                                    };
                                  }

                                  const exists = safePlacements.some(
                                    (item) => item.teamId === team.id
                                  );

                                  return {
                                    ...prev,
                                    placements: exists
                                      ? safePlacements.map((item) =>
                                          item.teamId === team.id
                                            ? {
                                                ...item,
                                                teamId: team.id,
                                                playerId: undefined,
                                                place: nextPlace,
                                              }
                                            : item
                                        )
                                      : [
                                          ...safePlacements,
                                          {
                                            teamId: team.id,
                                            playerId: undefined,
                                            place: nextPlace,
                                          },
                                        ],
                                  };
                                });
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  : selectedTournamentPlayers.map((player) => {
                      const placement = Array.isArray(tournamentForm.placements)
                        ? tournamentForm.placements.find(
                            (item) => item.playerId === player.id
                          )
                        : undefined;

                      return (
                        <div key={player.id} className="form-grid two">
                          <div className="field-block">
                            <label className="field-label">
                              {player.nickname}
                            </label>
                            <input
                              className="input"
                              type="number"
                              min={1}
                              placeholder={adminText.place}
                              value={placement ? placement.place : ""}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                const nextPlace = Number(rawValue);

                                setTournamentForm((prev) => {
                                  const safePlacements = Array.isArray(
                                    prev.placements
                                  )
                                    ? prev.placements
                                    : [];

                                  if (!rawValue || nextPlace <= 0) {
                                    return {
                                      ...prev,
                                      placements: safePlacements.filter(
                                        (item) => item.playerId !== player.id
                                      ),
                                    };
                                  }

                                  const exists = safePlacements.some(
                                    (item) => item.playerId === player.id
                                  );

                                  return {
                                    ...prev,
                                    placements: exists
                                      ? safePlacements.map((item) =>
                                          item.playerId === player.id
                                            ? {
                                                ...item,
                                                playerId: player.id,
                                                teamId: undefined,
                                                place: nextPlace,
                                              }
                                            : item
                                        )
                                      : [
                                          ...safePlacements,
                                          {
                                            playerId: player.id,
                                            teamId: undefined,
                                            place: nextPlace,
                                          },
                                        ],
                                  };
                                });
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>

            <div className="field-block">
              <label className="field-label checkbox-label">
                <input
                  type="checkbox"
                  checked={tournamentForm.isPublished}
                  onChange={(e) =>
                    setTournamentForm((prev) => ({
                      ...prev,
                      isPublished: e.target.checked,
                    }))
                  }
                />
                <span>{adminText.published}</span>
              </label>
            </div>

            <div className="btn-row">
<button className="primary-btn" onClick={saveTournament}>
  {commonText.save}
</button>
<button
  className="danger-btn"
  onClick={() => setConfirmDelete({ open: true, type: "tournament" })}
>
  {commonText.delete}
</button>
            </div>
          </div>
        </div>
      </div>

  );
}
