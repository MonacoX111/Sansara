import {
  CSSProperties,
  ChangeEvent,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toPng } from "html-to-image";
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
  showToast?: (message: string, type?: "success" | "danger" | "warning") => void;
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

type StudioTheme =
  | "crimson"
  | "neonBlue"
  | "royalPurple"
  | "whiteGold"
  | "emerald"
  | "team"
  | "game";

type PalettePreset = {
  primary: string;
  accent: string;
  kicker: string;
  bg1: string;
  bg2: string;
  bg3: string;
};

const PALETTE_PRESETS: Record<
  Exclude<StudioTheme, "team" | "game">,
  PalettePreset
> = {
  crimson: {
    primary: "255, 59, 95",
    accent: "67, 208, 255",
    kicker: "#ff4d6d",
    bg1: "#15070d",
    bg2: "#080a11",
    bg3: "#111824",
  },
  neonBlue: {
    primary: "56, 182, 255",
    accent: "132, 234, 255",
    kicker: "#84eaff",
    bg1: "#061320",
    bg2: "#060c14",
    bg3: "#0a1426",
  },
  royalPurple: {
    primary: "178, 102, 255",
    accent: "255, 102, 220",
    kicker: "#d8a8ff",
    bg1: "#170728",
    bg2: "#0b0716",
    bg3: "#160a26",
  },
  whiteGold: {
    primary: "244, 208, 124",
    accent: "255, 245, 220",
    kicker: "#f7d774",
    bg1: "#1a1408",
    bg2: "#0c0a06",
    bg3: "#1f180a",
  },
  emerald: {
    primary: "76, 217, 140",
    accent: "134, 255, 200",
    kicker: "#6ee7a8",
    bg1: "#06140e",
    bg2: "#060e0a",
    bg3: "#0a1a13",
  },
};

const GAME_PRESETS: Record<string, PalettePreset> = {
  cs2: {
    primary: "244, 110, 33",
    accent: "255, 184, 56",
    kicker: "#ffb838",
    bg1: "#1c0a06",
    bg2: "#0c0805",
    bg3: "#1d1006",
  },
  dota: {
    primary: "200, 33, 44",
    accent: "255, 96, 80",
    kicker: "#ff6a5a",
    bg1: "#160606",
    bg2: "#0a0606",
    bg3: "#1a0a0a",
  },
  fc26: {
    primary: "38, 153, 255",
    accent: "70, 220, 160",
    kicker: "#46dca0",
    bg1: "#04111e",
    bg2: "#040a14",
    bg3: "#0a1a26",
  },
  clashRoyale: {
    primary: "56, 138, 255",
    accent: "244, 200, 92",
    kicker: "#f4c85c",
    bg1: "#0a1326",
    bg2: "#06091a",
    bg3: "#10172a",
  },
};

const matchGamePreset = (game?: string): PalettePreset | null => {
  const g = (game || "").toLowerCase();
  if (!g) return null;
  if (g.includes("cs") || g.includes("counter")) return GAME_PRESETS.cs2;
  if (g.includes("dota")) return GAME_PRESETS.dota;
  if (g.includes("fc") || g.includes("fifa")) return GAME_PRESETS.fc26;
  if (g.includes("clash")) return GAME_PRESETS.clashRoyale;
  return null;
};

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("")}`;

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return [h, s, l];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
};

const makePresetFromRgb = (r: number, g: number, b: number): PalettePreset => {
  const [h, s] = rgbToHsl(r, g, b);
  const accent = hslToRgb((h + 0.55) % 1, Math.min(0.9, s + 0.1), 0.62);
  const bg1 = hslToRgb(h, Math.min(0.55, s), 0.08);
  const bg2 = hslToRgb(h, Math.min(0.45, s), 0.04);
  const bg3 = hslToRgb(h, Math.min(0.5, s), 0.1);
  return {
    primary: `${r}, ${g}, ${b}`,
    accent: `${accent[0]}, ${accent[1]}, ${accent[2]}`,
    kicker: toHex(r, g, b),
    bg1: toHex(bg1[0], bg1[1], bg1[2]),
    bg2: toHex(bg2[0], bg2[1], bg2[2]),
    bg3: toHex(bg3[0], bg3[1], bg3[2]),
  };
};

const templateFileNames: Record<MediaTemplate, string> = {
  matchAnnouncement: "sansara-match-announcement.png",
  matchResult: "sansara-match-result.png",
  groupStandings: "sansara-group-standings.png",
  playoffBracket: "sansara-playoff-bracket.png",
  mvpCard: "sansara-mvp-card.png",
  championPoster: "sansara-champion-poster.png",
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
  showToast,
}: Props) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<MediaTemplate>("matchAnnouncement");
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [studioTheme, setStudioTheme] = useState<StudioTheme>("crimson");
  const [teamPaletteRgb, setTeamPaletteRgb] = useState<[number, number, number] | null>(
    null
  );
  const previewRef = useRef<HTMLDivElement | null>(null);

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

  const themeTeamSource =
    selectedTeam || selectedTeam1 || selectedTeam2 || null;
  const themeTeamLogo = themeTeamSource?.logo || "";

  useEffect(() => {
    if (studioTheme !== "team") return;
    if (!themeTeamLogo) {
      setTeamPaletteRgb(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 128) continue;
          const rr = data[i];
          const gg = data[i + 1];
          const bb = data[i + 2];
          const max = Math.max(rr, gg, bb);
          const min = Math.min(rr, gg, bb);
          if (max - min < 22) continue;
          if (max < 30 || min > 230) continue;
          r += rr;
          g += gg;
          b += bb;
          count += 1;
        }
        if (count === 0) {
          setTeamPaletteRgb(null);
          return;
        }
        setTeamPaletteRgb([
          Math.round(r / count),
          Math.round(g / count),
          Math.round(b / count),
        ]);
      } catch {
        setTeamPaletteRgb(null);
      }
    };
    img.onerror = () => {
      if (!cancelled) setTeamPaletteRgb(null);
    };
    img.src = themeTeamLogo;
    return () => {
      cancelled = true;
    };
  }, [studioTheme, themeTeamLogo]);

  const resolvedPreset = useMemo<PalettePreset>(() => {
    if (studioTheme === "team") {
      if (teamPaletteRgb) {
        const [r, g, b] = teamPaletteRgb;
        return makePresetFromRgb(r, g, b);
      }
      return PALETTE_PRESETS.crimson;
    }
    if (studioTheme === "game") {
      const preset = matchGamePreset(selectedTournament?.game);
      if (preset) return preset;
      return PALETTE_PRESETS.crimson;
    }
    return PALETTE_PRESETS[studioTheme] || PALETTE_PRESETS.crimson;
  }, [studioTheme, teamPaletteRgb, selectedTournament]);

  const studioStyle = {
    "--studio-primary-rgb": resolvedPreset.primary,
    "--studio-accent-rgb": resolvedPreset.accent,
    "--studio-kicker": resolvedPreset.kicker,
    "--studio-bg-1": resolvedPreset.bg1,
    "--studio-bg-2": resolvedPreset.bg2,
    "--studio-bg-3": resolvedPreset.bg3,
  } as CSSProperties;

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

  const handleExport = async () => {
    const previewNode = previewRef.current;
    if (!previewNode || isExporting) return;

    setIsExporting(true);
    setExportError("");

    try {
      const rect = previewNode.getBoundingClientRect();
      const pixelRatio = rect.width > 0 ? 1080 / rect.width : 3;
      const dataUrl = await toPng(previewNode, {
        cacheBust: true,
        backgroundColor: resolvedPreset.bg2,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        pixelRatio,
      });

      const link = document.createElement("a");
      link.download = templateFileNames[selectedTemplate];
      link.href = dataUrl;
      link.click();

      showToast?.(adminText.mediaExportSuccess || "PNG exported");
    } catch (error) {
      console.error("Media export failed:", error);
      const message =
        adminText.mediaExportFailed ||
        "Export failed. Check image URLs and try again.";
      setExportError(message);
      showToast?.(message, "danger");
    } finally {
      setIsExporting(false);
    }
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
      const placeholderLabels = [
        adminText.mediaSemiFinalOne,
        adminText.mediaSemiFinalTwo,
        adminText.mediaSemiFinalThree,
        adminText.mediaSemiFinalFour,
      ];

      const tournamentPlayoffMatches = selectedTournament
        ? matches.filter(
            (match) =>
              Number(match.tournamentId) === selectedTournament.id &&
              (match.stage === "playoff" || match.stage === "final")
          )
        : [];

      const isSemiFinalMatch = (match: Match) => {
        const sid = (match.seriesId || "").trim().toUpperCase();
        if (sid.startsWith("SF")) return true;
        const label = `${match.roundLabel || ""} ${match.round || ""}`.toLowerCase();
        return (
          /1\s*\/\s*2/.test(label) ||
          label.includes("semi") ||
          label.includes("півфінал") ||
          label.includes("полуфинал")
        );
      };

      const isFinalMatch = (match: Match) => {
        const sid = (match.seriesId || "").trim().toUpperCase();
        if (sid === "F1") return true;
        if (match.stage === "final") return true;
        const label = `${match.roundLabel || ""} ${match.round || ""}`.toLowerCase().trim();
        return label === "final" || label === "фінал" || label === "финал";
      };

      const semiMatches = tournamentPlayoffMatches
        .filter(isSemiFinalMatch)
        .sort((a, b) => {
          const sa = (a.seriesId || "").toUpperCase();
          const sb = (b.seriesId || "").toUpperCase();
          if (sa && sb && sa !== sb) return sa.localeCompare(sb);
          return (a.order ?? a.id) - (b.order ?? b.id);
        })
        .slice(0, 2);

      const finalMatch =
        tournamentPlayoffMatches.find(isFinalMatch) || null;

      const resolveParticipantName = (
        match: Match | null,
        side: 1 | 2
      ): string | null => {
        if (!match) return null;
        const isTeam = match.matchType === "team";
        const id = isTeam
          ? side === 1
            ? match.team1
            : match.team2
          : side === 1
          ? match.player1
          : match.player2;
        if (!id) return null;
        if (isTeam) return teams.find((team) => team.id === id)?.name || null;
        return players.find((player) => player.id === id)?.nickname || null;
      };

      const semiSlots: { name: string; isPlaceholder: boolean }[] = [];
      for (let i = 0; i < 2; i += 1) {
        const semi = semiMatches[i] || null;
        const nameA = resolveParticipantName(semi, 1);
        const nameB = resolveParticipantName(semi, 2);
        semiSlots.push({
          name: nameA || placeholderLabels[i * 2],
          isPlaceholder: !nameA,
        });
        semiSlots.push({
          name: nameB || placeholderLabels[i * 2 + 1],
          isPlaceholder: !nameB,
        });
      }

      // Legacy fallback: if there are no playoff matches yet, fall back to
      // the manually selected match + tournament.participantIds order.
      if (semiMatches.length === 0) {
        const fallbackA = sideA?.name || sideA?.nickname;
        const fallbackB = sideB?.name || sideB?.nickname;
        if (fallbackA) semiSlots[0] = { name: fallbackA, isPlaceholder: false };
        if (fallbackB) semiSlots[1] = { name: fallbackB, isPlaceholder: false };
        const id3 = selectedTournament?.participantIds?.[2];
        const id4 = selectedTournament?.participantIds?.[3];
        const name3 = id3
          ? teams.find((team) => team.id === id3)?.name ||
            players.find((player) => player.id === id3)?.nickname ||
            null
          : null;
        const name4 = id4
          ? teams.find((team) => team.id === id4)?.name ||
            players.find((player) => player.id === id4)?.nickname ||
            null
          : null;
        if (name3) semiSlots[2] = { name: name3, isPlaceholder: false };
        if (name4) semiSlots[3] = { name: name4, isPlaceholder: false };
      }

      const finalParticipantA = resolveParticipantName(finalMatch, 1);
      const finalParticipantB = resolveParticipantName(finalMatch, 2);
      const finalWinnerId =
        finalMatch?.winnerTeamId || finalMatch?.winnerId || 0;
      const finalWinnerName =
        finalWinnerId && finalMatch
          ? finalMatch.matchType === "team"
            ? teams.find((team) => team.id === finalWinnerId)?.name || null
            : players.find((player) => player.id === finalWinnerId)?.nickname ||
              null
          : null;

      const finalSlotText =
        draft.finalPlaceholder ||
        (finalParticipantA && finalParticipantB
          ? `${finalParticipantA} vs ${finalParticipantB}`
          : finalParticipantA ||
            finalParticipantB ||
            adminText.mediaFinalPlaceholderText);
      const winnerSlotText = finalWinnerName || adminText.winner;

      return (
        <div className="media-preview-section media-preview-bracket">
          <span className="media-kicker">PLAYOFF</span>
          <h3>{title}</h3>
          <div className="media-bracket-mini">
            <div className="media-bracket-round">
              {semiSlots.map((slot, index) => (
                <div className="media-bracket-slot" key={`semi-${index}`}>
                  {slot.name}
                </div>
              ))}
            </div>
            <div className="media-bracket-round media-bracket-final">
              <div className="media-bracket-slot">{finalSlotText}</div>
              <div className="media-bracket-slot media-bracket-winner">
                {winnerSlotText}
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

  const palettesList: { id: StudioTheme; label: string }[] = [
    { id: "crimson", label: adminText.mediaThemeCrimson || "Crimson Red" },
    { id: "neonBlue", label: adminText.mediaThemeNeonBlue || "Neon Blue" },
    { id: "royalPurple", label: adminText.mediaThemeRoyalPurple || "Royal Purple" },
    { id: "whiteGold", label: adminText.mediaThemeWhiteGold || "White Gold" },
    { id: "emerald", label: adminText.mediaThemeEmerald || "Emerald Green" },
    { id: "team", label: adminText.mediaThemeTeam || "Team Adaptive" },
    { id: "game", label: adminText.mediaThemeGame || "Tournament Game" },
  ];

  const swatchPreset = (id: StudioTheme): PalettePreset => {
    if (id === "team") {
      if (teamPaletteRgb) {
        const [r, g, b] = teamPaletteRgb;
        return makePresetFromRgb(r, g, b);
      }
      return PALETTE_PRESETS.crimson;
    }
    if (id === "game") {
      const preset = matchGamePreset(selectedTournament?.game);
      return preset || PALETTE_PRESETS.crimson;
    }
    return PALETTE_PRESETS[id];
  };

  return (
    <section
      id="admin-section-media"
      className="panel admin-media-center"
      data-studio-theme={studioTheme}
      style={studioStyle}
    >
      <div className="media-center-header">
        <div>
          <span className="media-eyebrow">{adminText.mediaStudioEyebrow}</span>
          <h2 className="panel-title">{adminText.mediaCenterTitle}</h2>
          <p className="media-center-subtitle">{adminText.mediaCenterSubtitle}</p>
        </div>
        <button
          type="button"
          className="secondary-btn media-export-btn"
          disabled={isExporting}
          onClick={handleExport}
        >
          {isExporting
            ? adminText.mediaExporting || commonText.generating
            : adminText.mediaExportPng || "Export PNG"}
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
          <div
            ref={previewRef}
            className={`media-story-preview media-story-preview-${selectedTemplate}`}
          >
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

          <div className="media-palette-block">
            <span className="media-palette-label">
              {adminText.mediaThemePalette || "Theme palette"}
            </span>
            <div className="media-palette-grid">
              {palettesList.map((palette) => {
                const preset = swatchPreset(palette.id);
                const isActive = studioTheme === palette.id;
                const swatchStyle: CSSProperties = {
                  background: `linear-gradient(135deg, rgb(${preset.primary}) 0%, rgb(${preset.primary}) 50%, rgb(${preset.accent}) 50%, rgb(${preset.accent}) 100%)`,
                };
                return (
                  <button
                    key={palette.id}
                    type="button"
                    className={`media-palette-btn ${
                      isActive ? "media-palette-btn-active" : ""
                    }`}
                    onClick={() => setStudioTheme(palette.id)}
                    aria-pressed={isActive}
                    aria-label={palette.label}
                    title={palette.label}
                  >
                    <span className="media-palette-swatch" style={swatchStyle} />
                    <small>{palette.label}</small>
                  </button>
                );
              })}
            </div>
            {studioTheme === "team" && !teamPaletteRgb ? (
              <small className="media-palette-hint">
                {adminText.mediaThemeTeamHint ||
                  "Select a team in the form to extract its colors."}
              </small>
            ) : null}
            {studioTheme === "game" && !matchGamePreset(selectedTournament?.game) ? (
              <small className="media-palette-hint">
                {adminText.mediaThemeGameHint ||
                  "Select a tournament with a known game (CS 2, Dota 2, FC 26, Clash Royale)."}
              </small>
            ) : null}
          </div>

          {renderTemplateFields()}
          <p className="media-settings-note">
            {adminText.mediaExportLocalOnly ||
              "Export downloads a local PNG only. Nothing is uploaded."}
          </p>
          {exportError ? <div className="admin-error">{exportError}</div> : null}
        </div>
      </div>
    </section>
  );
}
