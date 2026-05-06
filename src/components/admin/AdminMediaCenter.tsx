import { ChangeEvent, ReactElement, useMemo, useState } from "react";
import { Match, Player, Team, Tournament } from "../../types";

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

type MediaTemplate =
  | "matchAnnouncement"
  | "matchResult"
  | "groupStandings"
  | "playoffBracket"
  | "mvpCard"
  | "championPoster";

type DraftState = {
  tournamentId: number;
  matchId: number;
  player1Id: number;
  player2Id: number;
  team1Id: number;
  team2Id: number;
  playerId: number;
  teamId: number;
  mvpId: number;
  groupName: string;
  stage: string;
  format: string;
  dateTime: string;
  score: string;
  map: string;
  highlight: string;
  prizePool: string;
  finalScore: string;
  finalPlaceholder: string;
  tournamentTitle: string;
};

type Props = {
  adminText: Record<string, string>;
  commonText: Record<string, string>;
  PremiumSelect: (props: PremiumSelectProps) => ReactElement;
  players: Player[];
  teams: Team[];
  tournaments: Tournament[];
  matches: Match[];
};

const templates: { id: MediaTemplate; labelKey: string; descriptionKey: string }[] = [
  {
    id: "matchAnnouncement",
    labelKey: "mediaTemplateMatchAnnouncement",
    descriptionKey: "mediaTemplateMatchAnnouncementDescription",
  },
  {
    id: "matchResult",
    labelKey: "mediaTemplateMatchResult",
    descriptionKey: "mediaTemplateMatchResultDescription",
  },
  {
    id: "groupStandings",
    labelKey: "mediaTemplateGroupStandings",
    descriptionKey: "mediaTemplateGroupStandingsDescription",
  },
  {
    id: "playoffBracket",
    labelKey: "mediaTemplatePlayoffBracket",
    descriptionKey: "mediaTemplatePlayoffBracketDescription",
  },
  {
    id: "mvpCard",
    labelKey: "mediaTemplateMvpCard",
    descriptionKey: "mediaTemplateMvpCardDescription",
  },
  {
    id: "championPoster",
    labelKey: "mediaTemplateChampionPoster",
    descriptionKey: "mediaTemplateChampionPosterDescription",
  },
];

const initialDraft: DraftState = {
  tournamentId: 0,
  matchId: 0,
  player1Id: 0,
  player2Id: 0,
  team1Id: 0,
  team2Id: 0,
  playerId: 0,
  teamId: 0,
  mvpId: 0,
  groupName: "",
  stage: "",
  format: "",
  dateTime: "",
  score: "",
  map: "",
  highlight: "",
  prizePool: "",
  finalScore: "",
  finalPlaceholder: "",
  tournamentTitle: "",
};

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "S";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function parseScore(score: string) {
  const numbers = score.match(/\d+/g)?.map(Number) || [];
  if (numbers.length < 2) return null;
  return { a: numbers[0], b: numbers[1] };
}

function formatDateLabel(value: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMediaCenter({
  adminText,
  commonText,
  PremiumSelect,
  players,
  teams,
  tournaments,
  matches,
}: Props) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<MediaTemplate>("matchAnnouncement");
  const [draft, setDraft] = useState<DraftState>(initialDraft);

  const tournamentOptions = tournaments
    .slice()
    .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id))
    .map((tournament) => ({
      value: tournament.id,
      label: tournament.title || adminText.tournamentFallback,
    }));

  const matchOptions = matches
    .filter(
      (match) =>
        draft.tournamentId === 0 || Number(match.tournamentId) === draft.tournamentId
    )
    .map((match) => {
      const teamA = teams.find((team) => team.id === match.team1)?.name;
      const teamB = teams.find((team) => team.id === match.team2)?.name;
      const playerA = players.find((player) => player.id === match.player1)?.nickname;
      const playerB = players.find((player) => player.id === match.player2)?.nickname;
      return {
        value: match.id,
        label: `${teamA || playerA || adminText.unknown} vs ${
          teamB || playerB || adminText.unknown
        }`,
      };
    });

  const selectedTournament =
    tournaments.find((tournament) => tournament.id === draft.tournamentId) || null;
  const selectedMatch = matches.find((match) => match.id === draft.matchId) || null;

  const entityMode =
    selectedTournament?.participantType === "team" ||
    selectedMatch?.matchType === "team"
      ? "team"
      : "player";

  const selectedPlayer = players.find((player) => player.id === draft.playerId) || null;
  const selectedMvp = players.find((player) => player.id === draft.mvpId) || null;
  const selectedTeam = teams.find((team) => team.id === draft.teamId) || null;
  const selectedTeam1 =
    teams.find((team) => team.id === draft.team1Id || team.id === selectedMatch?.team1) ||
    null;
  const selectedTeam2 =
    teams.find((team) => team.id === draft.team2Id || team.id === selectedMatch?.team2) ||
    null;
  const selectedPlayer1 =
    players.find(
      (player) => player.id === draft.player1Id || player.id === selectedMatch?.player1
    ) || null;
  const selectedPlayer2 =
    players.find(
      (player) => player.id === draft.player2Id || player.id === selectedMatch?.player2
    ) || null;

  const sideA = entityMode === "team" ? selectedTeam1 : selectedPlayer1;
  const sideB = entityMode === "team" ? selectedTeam2 : selectedPlayer2;

  const title =
    draft.tournamentTitle ||
    selectedTournament?.title ||
    adminText.mediaTournamentPlaceholder;
  const stage =
    draft.stage ||
    selectedMatch?.roundLabel ||
    selectedMatch?.groupName ||
    selectedMatch?.round ||
    adminText.mediaStagePlaceholder;
  const format = draft.format || selectedTournament?.format || "BO3";
  const score = draft.score || selectedMatch?.score || "2:1";
  const dateTime = draft.dateTime || selectedMatch?.date || selectedTournament?.date || "";
  const dateLabel = formatDateLabel(dateTime, adminText.mediaDatePlaceholder);
  const groupName =
    draft.groupName ||
    selectedTournament?.groups?.[0]?.name ||
    selectedMatch?.groupName ||
    adminText.mediaGroupPlaceholder;

  const playerOptions = players.map((player) => ({
    value: player.id,
    label: player.nickname,
  }));

  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: team.name,
  }));

  const groupOptions =
    selectedTournament?.groups?.map((group) => ({
      value: group.name,
      label: group.name,
    })) || [];

  const standingsRows = useMemo(() => {
    const tournament = selectedTournament;
    if (!tournament) return [];

    const group = tournament.groups?.find((item) => item.name === groupName);
    const participantIds =
      group?.participantIds?.length ? group.participantIds : tournament.participantIds || [];
    const rows = participantIds.map((participantId) => {
      const participant =
        tournament.participantType === "team"
          ? teams.find((team) => team.id === participantId)
          : players.find((player) => player.id === participantId);
      const participantMatches = matches.filter((match) => {
        if (match.tournamentId !== tournament.id || match.status !== "completed") return false;
        if (tournament.participantType === "team") {
          return match.team1 === participantId || match.team2 === participantId;
        }
        return match.player1 === participantId || match.player2 === participantId;
      });

      let wins = 0;
      let roundDiff = 0;
      participantMatches.forEach((match) => {
        if (
          match.winnerId === participantId ||
          match.winnerTeamId === participantId
        ) {
          wins += 1;
        }

        const parsed = parseScore(match.score);
        if (!parsed) return;
        const isFirstSide = match.team1 === participantId || match.player1 === participantId;
        roundDiff += isFirstSide ? parsed.a - parsed.b : parsed.b - parsed.a;
      });

      return {
        id: participantId,
        name: participant?.name || participant?.nickname || adminText.unknown,
        points: wins * 3,
        played: participantMatches.length,
        wins,
        roundDiff,
      };
    });

    return rows
      .sort((a, b) => b.points - a.points || b.roundDiff - a.roundDiff)
      .slice(0, 6);
  }, [adminText.unknown, groupName, matches, players, selectedTournament, teams]);

  const updateDraft = (updates: Partial<DraftState>) =>
    setDraft((prev) => ({ ...prev, ...updates }));

  const renderLogo = (
    item: Player | Team | null,
    className: string,
    fallback: string
  ) => {
    const src = item && "avatar" in item ? item.avatar : item?.logo;
    const name = item && "nickname" in item ? item.nickname : item?.name;

    return src ? (
      <img className={className} src={src} alt={name || fallback} />
    ) : (
      <div className={`${className} media-avatar-fallback`}>
        {initials(name || fallback)}
      </div>
    );
  };

  const handleSelectChange =
    (key: keyof DraftState) => (value: SelectValue) => {
      updateDraft({ [key]: typeof value === "number" ? value : Number(value) || 0 });
    };

  const handleTextChange =
    (key: keyof DraftState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateDraft({ [key]: event.target.value });
    };

  const renderTemplateFields = () => (
    <div className="media-form-grid">
      <div className="field-block">
        <label className="field-label">{adminText.tournament}</label>
        <PremiumSelect
          value={draft.tournamentId}
          placeholder={adminText.mediaTournamentPlaceholder}
          options={tournamentOptions}
          onChange={handleSelectChange("tournamentId")}
        />
      </div>

      {selectedTemplate !== "groupStandings" &&
      selectedTemplate !== "playoffBracket" &&
      selectedTemplate !== "championPoster" ? (
        <div className="field-block">
          <label className="field-label">{adminText.match}</label>
          <PremiumSelect
            value={draft.matchId}
            placeholder={adminText.mediaMatchPlaceholder}
            options={matchOptions}
            onChange={handleSelectChange("matchId")}
          />
        </div>
      ) : null}

      {(selectedTemplate === "matchAnnouncement" ||
        selectedTemplate === "matchResult") &&
      entityMode === "team" ? (
        <>
          <div className="field-block">
            <label className="field-label">{adminText.mediaSideOne}</label>
            <PremiumSelect
              value={draft.team1Id}
              placeholder={adminText.unknownTeam}
              options={teamOptions}
              onChange={handleSelectChange("team1Id")}
            />
          </div>
          <div className="field-block">
            <label className="field-label">{adminText.mediaSideTwo}</label>
            <PremiumSelect
              value={draft.team2Id}
              placeholder={adminText.unknownTeam}
              options={teamOptions}
              onChange={handleSelectChange("team2Id")}
            />
          </div>
        </>
      ) : null}

      {(selectedTemplate === "matchAnnouncement" ||
        selectedTemplate === "matchResult") &&
      entityMode === "player" ? (
        <>
          <div className="field-block">
            <label className="field-label">{adminText.mediaSideOne}</label>
            <PremiumSelect
              value={draft.player1Id}
              placeholder={adminText.unknownPlayer}
              options={playerOptions}
              onChange={handleSelectChange("player1Id")}
            />
          </div>
          <div className="field-block">
            <label className="field-label">{adminText.mediaSideTwo}</label>
            <PremiumSelect
              value={draft.player2Id}
              placeholder={adminText.unknownPlayer}
              options={playerOptions}
              onChange={handleSelectChange("player2Id")}
            />
          </div>
        </>
      ) : null}

      {selectedTemplate === "groupStandings" ? (
        <div className="field-block">
          <label className="field-label">{adminText.mediaGroup}</label>
          <PremiumSelect
            value={groupName}
            placeholder={adminText.mediaGroupPlaceholder}
            options={groupOptions}
            onChange={(value) => updateDraft({ groupName: String(value) })}
          />
        </div>
      ) : null}

      {selectedTemplate === "mvpCard" ? (
        <>
          <div className="field-block">
            <label className="field-label">{adminText.player}</label>
            <PremiumSelect
              value={draft.playerId}
              placeholder={adminText.unknownPlayer}
              options={playerOptions}
              onChange={handleSelectChange("playerId")}
            />
          </div>
          <div className="field-block">
            <label className="field-label">{adminText.team}</label>
            <PremiumSelect
              value={draft.teamId}
              placeholder={adminText.unknownTeam}
              options={teamOptions}
              onChange={handleSelectChange("teamId")}
            />
          </div>
        </>
      ) : null}

      {(selectedTemplate === "matchResult" ||
        selectedTemplate === "mvpCard" ||
        selectedTemplate === "championPoster") ? (
        <div className="field-block">
          <label className="field-label">MVP</label>
          <PremiumSelect
            value={draft.mvpId}
            placeholder="MVP"
            options={playerOptions}
            onChange={handleSelectChange("mvpId")}
          />
        </div>
      ) : null}

      {selectedTemplate === "championPoster" ? (
        <div className="field-block">
          <label className="field-label">{adminText.mediaChampion}</label>
          <PremiumSelect
            value={entityMode === "team" ? draft.teamId : draft.playerId}
            placeholder={adminText.mediaChampionPlaceholder}
            options={entityMode === "team" ? teamOptions : playerOptions}
            onChange={
              entityMode === "team"
                ? handleSelectChange("teamId")
                : handleSelectChange("playerId")
            }
          />
        </div>
      ) : null}

      {selectedTemplate === "matchAnnouncement" ? (
        <>
          <div className="field-block">
            <label className="field-label">{adminText.date}</label>
            <input
              className="input"
              value={draft.dateTime}
              placeholder={adminText.mediaDatePlaceholder}
              onChange={handleTextChange("dateTime")}
            />
          </div>
          <div className="field-block">
            <label className="field-label">{adminText.format}</label>
            <input
              className="input"
              value={draft.format}
              placeholder="BO3"
              onChange={handleTextChange("format")}
            />
          </div>
        </>
      ) : null}

      {(selectedTemplate === "matchAnnouncement" ||
        selectedTemplate === "matchResult") ? (
        <div className="field-block">
          <label className="field-label">{adminText.mediaStageGroup}</label>
          <input
            className="input"
            value={draft.stage}
            placeholder={adminText.mediaStagePlaceholder}
            onChange={handleTextChange("stage")}
          />
        </div>
      ) : null}

      {selectedTemplate === "matchResult" ? (
        <>
          <div className="field-block">
            <label className="field-label">{adminText.score}</label>
            <input
              className="input"
              value={draft.score}
              placeholder="2:1"
              onChange={handleTextChange("score")}
            />
          </div>
          <div className="field-block">
            <label className="field-label">{adminText.mediaMap}</label>
            <input
              className="input"
              value={draft.map}
              placeholder="Mirage"
              onChange={handleTextChange("map")}
            />
          </div>
        </>
      ) : null}

      {selectedTemplate === "playoffBracket" ? (
        <>
          <div className="field-block">
            <label className="field-label">{adminText.mediaTournamentTitle}</label>
            <input
              className="input"
              value={draft.tournamentTitle}
              placeholder={adminText.mediaTournamentPlaceholder}
              onChange={handleTextChange("tournamentTitle")}
            />
          </div>
          <div className="field-block">
            <label className="field-label">{adminText.mediaFinalPlaceholder}</label>
            <input
              className="input"
              value={draft.finalPlaceholder}
              placeholder={adminText.mediaFinalPlaceholderText}
              onChange={handleTextChange("finalPlaceholder")}
            />
          </div>
        </>
      ) : null}

      {selectedTemplate === "mvpCard" ? (
        <div className="field-block media-form-wide">
          <label className="field-label">{adminText.mediaHighlight}</label>
          <textarea
            className="input textarea"
            value={draft.highlight}
            placeholder={adminText.mediaHighlightPlaceholder}
            onChange={handleTextChange("highlight")}
          />
        </div>
      ) : null}

      {selectedTemplate === "championPoster" ? (
        <>
          <div className="field-block">
            <label className="field-label">{adminText.prize}</label>
            <input
              className="input"
              value={draft.prizePool}
              placeholder="$1,000"
              onChange={handleTextChange("prizePool")}
            />
          </div>
          <div className="field-block">
            <label className="field-label">{adminText.mediaFinalScore}</label>
            <input
              className="input"
              value={draft.finalScore}
              placeholder="3:2"
              onChange={handleTextChange("finalScore")}
            />
          </div>
        </>
      ) : null}
    </div>
  );

  const renderPreviewContent = () => {
    if (selectedTemplate === "groupStandings") {
      return (
        <div className="media-preview-section media-preview-standings">
          <span className="media-kicker">{groupName}</span>
          <h3>{title}</h3>
          <div className="media-standings-table">
            <div className="media-standings-row media-standings-head">
              <span>#</span>
              <span>{adminText.mediaTeamPlayer}</span>
              <span>PTS</span>
              <span>MP</span>
              <span>W</span>
              <span>RD</span>
            </div>
            {(standingsRows.length
              ? standingsRows
              : Array.from({ length: 4 }, (_, index) => ({
                  id: index,
                  name: `${adminText.mediaParticipantPlaceholder} ${index + 1}`,
                  points: Math.max(0, 9 - index * 3),
                  played: 3,
                  wins: Math.max(0, 3 - index),
                  roundDiff: 4 - index,
                }))
            ).map((row, index) => (
              <div className="media-standings-row" key={row.id}>
                <span>{index + 1}</span>
                <strong>{row.name}</strong>
                <span>{row.points}</span>
                <span>{row.played}</span>
                <span>{row.wins}</span>
                <span>{row.roundDiff > 0 ? `+${row.roundDiff}` : row.roundDiff}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedTemplate === "playoffBracket") {
      const semiTeams = [
        sideA?.name || sideA?.nickname || adminText.mediaSemiFinalOne,
        sideB?.name || sideB?.nickname || adminText.mediaSemiFinalTwo,
        selectedTournament?.participantIds?.[2]
          ? teams.find((team) => team.id === selectedTournament.participantIds[2])?.name ||
            players.find((player) => player.id === selectedTournament.participantIds[2])
              ?.nickname
          : adminText.mediaSemiFinalThree,
        selectedTournament?.participantIds?.[3]
          ? teams.find((team) => team.id === selectedTournament.participantIds[3])?.name ||
            players.find((player) => player.id === selectedTournament.participantIds[3])
              ?.nickname
          : adminText.mediaSemiFinalFour,
      ];

      return (
        <div className="media-preview-section media-preview-bracket">
          <span className="media-kicker">PLAYOFF</span>
          <h3>{title}</h3>
          <div className="media-bracket-mini">
            <div className="media-bracket-round">
              {semiTeams.map((teamName) => (
                <div className="media-bracket-slot" key={teamName}>
                  {teamName}
                </div>
              ))}
            </div>
            <div className="media-bracket-round media-bracket-final">
              <div className="media-bracket-slot">
                {draft.finalPlaceholder || adminText.mediaFinalPlaceholderText}
              </div>
              <div className="media-bracket-slot media-bracket-winner">
                {adminText.winner}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedTemplate === "mvpCard") {
      return (
        <div className="media-preview-section media-preview-mvp">
          {renderLogo(selectedPlayer, "media-mvp-avatar", adminText.unknownPlayer)}
          <span className="media-kicker">MVP</span>
          <h3>{selectedPlayer?.nickname || adminText.mediaPlayerPlaceholder}</h3>
          <p>{selectedTeam?.name || selectedTournament?.title || title}</p>
          <strong>
            {draft.highlight || adminText.mediaHighlightPlaceholder}
          </strong>
        </div>
      );
    }

    if (selectedTemplate === "championPoster") {
      const champion =
        entityMode === "team"
          ? selectedTeam?.name || selectedTournament?.winnerTeamId
          : selectedPlayer?.nickname || selectedTournament?.winnerId;

      return (
        <div className="media-preview-section media-preview-champion">
          <span className="media-kicker">CHAMPIONS</span>
          <h3>{champion || adminText.mediaChampionPlaceholder}</h3>
          <p>{title}</p>
          <div className="media-champion-crown">
            {renderLogo(
              entityMode === "team" ? selectedTeam : selectedPlayer,
              "media-champion-logo",
              adminText.mediaChampionPlaceholder
            )}
          </div>
          <div className="media-stat-strip">
            <span>{draft.prizePool || selectedTournament?.prize || "$1,000"}</span>
            <span>{draft.finalScore || "3:2"}</span>
            <span>{selectedMvp?.nickname || "MVP"}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="media-preview-section media-preview-match">
        <span className="media-kicker">{stage}</span>
        <h3>{title}</h3>
        <div className="media-versus">
          <div className="media-side">
            {renderLogo(sideA, "media-side-logo", adminText.mediaSideOne)}
            <strong>
              {sideA?.name || sideA?.nickname || adminText.mediaSideOne}
            </strong>
          </div>
          <div className="media-vs">
            {selectedTemplate === "matchResult" ? score : "VS"}
          </div>
          <div className="media-side">
            {renderLogo(sideB, "media-side-logo", adminText.mediaSideTwo)}
            <strong>
              {sideB?.name || sideB?.nickname || adminText.mediaSideTwo}
            </strong>
          </div>
        </div>
        <div className="media-match-meta">
          <span>{selectedTemplate === "matchResult" ? draft.map || "Map TBD" : dateLabel}</span>
          <span>{format}</span>
          <span>{selectedMvp?.nickname || "MVP"}</span>
        </div>
      </div>
    );
  };

  const activeTemplate = templates.find((template) => template.id === selectedTemplate);

  return (
    <section id="admin-section-media" className="panel admin-media-center">
      <div className="media-center-header">
        <div>
          <span className="media-eyebrow">{adminText.mediaStudioEyebrow}</span>
          <h2 className="panel-title">{adminText.mediaCenterTitle}</h2>
          <p className="media-center-subtitle">{adminText.mediaCenterSubtitle}</p>
        </div>
        <button type="button" className="secondary-btn media-export-btn" disabled>
          {adminText.mediaExportComingSoon}
        </button>
      </div>

      <div className="media-center-layout">
        <aside className="media-template-list" aria-label={adminText.mediaTemplates}>
          {templates.map((template) => {
            const isActive = template.id === selectedTemplate;
            return (
              <button
                type="button"
                key={template.id}
                className={`media-template-btn ${isActive ? "media-template-btn-active" : ""}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <span>{adminText[template.labelKey]}</span>
                <small>{adminText[template.descriptionKey]}</small>
              </button>
            );
          })}
        </aside>

        <div className="media-preview-shell">
          <div className={`media-story-preview media-story-preview-${selectedTemplate}`}>
            <div className="media-poster-grid" />
            <div className="media-poster-glow" />
            <div className="media-poster-topline">
              <span>SANSARA</span>
              <span>{activeTemplate ? adminText[activeTemplate.labelKey] : ""}</span>
            </div>
            {renderPreviewContent()}
            <div className="media-poster-footer">
              <span>@sansara.esports</span>
              <span>1080 x 1920</span>
            </div>
          </div>
        </div>

        <div className="media-settings-panel">
          <h3>{adminText.mediaSettings}</h3>
          {renderTemplateFields()}
          <p className="media-settings-note">{commonText.save} / export disabled for v1.</p>
        </div>
      </div>
    </section>
  );
}
