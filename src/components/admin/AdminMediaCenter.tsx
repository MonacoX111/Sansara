import {
  CSSProperties,
  ChangeEvent,
  DragEvent,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toPng } from "html-to-image";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { Match, Player, Team, Tournament } from "../../types";
import {
  calculateGroupStandings,
  groupMatchesByGroupName,
} from "../../domain/tournament/groupStandings";
import { storage } from "../../firebase";
import { deleteItem, saveItem, subscribeCollection } from "../../firebaseDb";

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

type AssetCategory = "backgrounds" | "overlays" | "textures" | "sponsors";

type SponsorPosition = "topLeft" | "topRight" | "bottomCenter" | "compact";

type MediaAsset = {
  id: string;
  name: string;
  type: AssetCategory;
  url: string;
  storagePath: string;
  mimeType: string;
  createdAt: string;
};

type PendingAsset = {
  file: File;
  name: string;
  type: AssetCategory;
  previewUrl: string;
};

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
  seriesLabel: string;
  highlight: string;
  prizePool: string;
  finalScore: string;
  finalPlaceholder: string;
  tournamentTitle: string;
  // D28: standings Top-N override. Stored as a string so the empty value
  // can mean "use the default of 6" and the input stays uncontrolled-friendly.
  // Parsed and clamped at read-time; never persisted to Firebase.
  standingsLimit: string;
  // D14: optional sponsor caption rendered next to the sponsor logo. Empty
  // string means "no caption". Only displayed when a sponsor asset is also
  // applied -- otherwise the caption is suppressed visually.
  sponsorCaption: string;
  // D26: per-template MVP override fields so a manual pick on one template
  // can no longer silently override another. Each defaults to 0 (= autofill /
  // fall back to legacy draft.mvpId for backward compatibility). Sentinel
  // semantics are identical to draft.mvpId: 0 = autofill, -1 = hidden,
  // > 0 = manual override.
  matchResultMvpId: number;
  mvpCardMvpId: number;
  championPosterMvpId: number;
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
  seriesLabel: "",
  highlight: "",
  prizePool: "",
  finalScore: "",
  finalPlaceholder: "",
  tournamentTitle: "",
  standingsLimit: "",
  sponsorCaption: "",
  matchResultMvpId: 0,
  mvpCardMvpId: 0,
  championPosterMvpId: 0,
};

type StudioTheme =
  | "auto"
  | "crimson"
  | "neonBlue"
  | "royalPurple"
  | "whiteGold"
  | "emerald"
  | "team"
  | "game";

type StylePreset =
  | "default"
  | "cyberpunk"
  | "minimal"
  | "horror"
  | "premiumGold"
  | "vct"
  | "faceit"
  | "anime";

type PalettePreset = {
  primary: string;
  accent: string;
  kicker: string;
  bg1: string;
  bg2: string;
  bg3: string;
};

const STYLE_PRESETS: Record<StylePreset, PalettePreset> = {
  default: {
    primary: "255, 59, 95",
    accent: "67, 208, 255",
    kicker: "#ff4d6d",
    bg1: "#15070d",
    bg2: "#080a11",
    bg3: "#111824",
  },
  cyberpunk: {
    primary: "0, 234, 255",
    accent: "255, 46, 213",
    kicker: "#ff2ed5",
    bg1: "#04141c",
    bg2: "#0a0418",
    bg3: "#160d2c",
  },
  minimal: {
    primary: "230, 232, 238",
    accent: "150, 160, 180",
    kicker: "#e6e8ee",
    bg1: "#0d1016",
    bg2: "#0a0c11",
    bg3: "#11141b",
  },
  horror: {
    primary: "204, 18, 32",
    accent: "120, 12, 18",
    kicker: "#cc1220",
    bg1: "#0d0303",
    bg2: "#060101",
    bg3: "#140404",
  },
  premiumGold: {
    primary: "230, 194, 98",
    accent: "255, 232, 160",
    kicker: "#e6c262",
    bg1: "#0a0804",
    bg2: "#050402",
    bg3: "#100c06",
  },
  vct: {
    primary: "255, 70, 85",
    accent: "24, 30, 42",
    kicker: "#ff4655",
    bg1: "#0e0608",
    bg2: "#060406",
    bg3: "#16080c",
  },
  faceit: {
    primary: "255, 86, 28",
    accent: "24, 24, 28",
    kicker: "#ff561c",
    bg1: "#15080a",
    bg2: "#080606",
    bg3: "#180a08",
  },
  anime: {
    primary: "255, 99, 168",
    accent: "98, 212, 255",
    kicker: "#ff63a8",
    bg1: "#1a0820",
    bg2: "#0a0518",
    bg3: "#150a28",
  },
};

const PALETTE_PRESETS: Record<
  Exclude<StudioTheme, "auto" | "team" | "game">,
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

const assetCategories: { id: AssetCategory; label: string; storageFolder: string }[] = [
  { id: "backgrounds", label: "Backgrounds", storageFolder: "backgrounds" },
  { id: "overlays", label: "Overlays", storageFolder: "overlays" },
  { id: "textures", label: "Textures", storageFolder: "textures" },
  { id: "sponsors", label: "Sponsor Logos", storageFolder: "sponsors" },
];

const acceptedAssetTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

const assetCollectionName = "mediaAssets";

const sponsorPositions: { id: SponsorPosition; label: string }[] = [
  { id: "topLeft", label: "Top-left" },
  { id: "topRight", label: "Top-right" },
  { id: "bottomCenter", label: "Bottom-center" },
  { id: "compact", label: "Compact" },
];

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "S";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

// D27: pin formatting to a single stable locale (en-US) and 24-hour time so
// previews and exported PNGs render the same date string regardless of the
// admin's browser/OS locale. Timezone is intentionally still local because
// match.date is stored as a local-clock ISO string elsewhere in the app.
const MEDIA_DATE_LOCALE = "en-US";
function formatDateLabel(value: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(MEDIA_DATE_LOCALE, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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
  const [studioTheme, setStudioTheme] = useState<StudioTheme>("auto");
  const [stylePreset, setStylePreset] = useState<StylePreset>("default");
  const [teamPaletteRgb, setTeamPaletteRgb] = useState<[number, number, number] | null>(
    null
  );
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [activeAssetCategory, setActiveAssetCategory] =
    useState<AssetCategory>("backgrounds");
  const [assetSearch, setAssetSearch] = useState("");
  const [pendingAsset, setPendingAsset] = useState<PendingAsset | null>(null);
  const [assetDropActive, setAssetDropActive] = useState(false);
  const [assetUploadError, setAssetUploadError] = useState("");
  const [isAssetUploading, setIsAssetUploading] = useState(false);
  const [appliedAssetIds, setAppliedAssetIds] = useState<
    Partial<Record<AssetCategory, string>>
  >({});
  // D21: id of the asset whose delete button has been *armed* (i.e. clicked
  // once). A second click on the same row commits the delete. Clicking any
  // other asset's delete button re-arms only that one. Null = nothing armed.
  const [pendingDeleteAssetId, setPendingDeleteAssetId] = useState<
    string | null
  >(null);
  // Guard against rapid double-commit clicks while the network call is in
  // flight. Holds the id of the asset currently being deleted.
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [sponsorPosition, setSponsorPosition] =
    useState<SponsorPosition>("topRight");
  const [overlayOpacity, setOverlayOpacity] = useState(0.72);
  const [textureOpacity, setTextureOpacity] = useState(0.3);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const tournamentOptions = tournaments
    .slice()
    .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id))
    .map((tournament) => ({
      value: tournament.id,
      label: tournament.title || adminText.tournamentFallback,
    }));

  // Newest matches first. Priority: completedAt DESC → date DESC → id DESC.
  // Missing/unparseable timestamps sink to the bottom (-Infinity) so any match
  // with real data wins. Tie-breakers are checked in order, keeping the sort
  // stable when only partial data is present.
  const matchSortKey = (match: Match): [number, number, number] => {
    const completedAtRaw = (match as unknown as { completedAt?: string })
      .completedAt;
    const completedMs = completedAtRaw
      ? new Date(completedAtRaw).getTime()
      : NaN;
    const dateMs = match.date ? new Date(match.date).getTime() : NaN;
    return [
      Number.isFinite(completedMs) ? completedMs : -Infinity,
      Number.isFinite(dateMs) ? dateMs : -Infinity,
      Number(match.id) || 0,
    ];
  };

  const matchOptions = matches
    .filter(
      (match) =>
        draft.tournamentId === 0 || Number(match.tournamentId) === draft.tournamentId
    )
    .slice()
    .sort((a, b) => {
      const ka = matchSortKey(a);
      const kb = matchSortKey(b);
      if (ka[0] !== kb[0]) return kb[0] - ka[0];
      if (ka[1] !== kb[1]) return kb[1] - ka[1];
      return kb[2] - ka[2];
    })
    .map((match) => {
      const teamA = teams.find((team) => team.id === match.team1)?.name;
      const teamB = teams.find((team) => team.id === match.team2)?.name;
      const playerA = players.find((player) => player.id === match.player1)?.nickname;
      const playerB = players.find((player) => player.id === match.player2)?.nickname;
      const versus = `${teamA || playerA || adminText.unknown} vs ${
        teamB || playerB || adminText.unknown
      }`;
      // D25: when no tournament is selected the global match dropdown becomes
      // a flat firehose. Prefix labels with [tournament title] so admins can
      // visually group the list. When a tournament IS selected the prefix is
      // redundant and intentionally suppressed for a cleaner local view.
      const matchTournamentTitle =
        draft.tournamentId === 0
          ? tournaments.find((t) => t.id === Number(match.tournamentId))?.title ||
            ""
          : "";
      const base = matchTournamentTitle
        ? `[${matchTournamentTitle}] ${versus}`
        : versus;
      // D24: enrich label with date / score so admins can distinguish
      // rematches and completed-vs-scheduled matches at a glance. Falls back
      // to the bare "A vs B" form when no usable date or score exists.
      const completedAtRaw = (match as unknown as { completedAt?: string })
        .completedAt;
      const dateSource = match.date || completedAtRaw || "";
      const parsedDate = dateSource ? new Date(dateSource) : null;
      const shortDate =
        parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toLocaleDateString(MEDIA_DATE_LOCALE, {
              month: "short",
              day: "numeric",
            })
          : "";
      const isCompleted = match.status === "completed";
      const trimmedScore = (match.score || "").trim();
      let label = base;
      if (isCompleted && trimmedScore) {
        label = shortDate
          ? `${base} \u2014 ${trimmedScore} (${shortDate})`
          : `${base} \u2014 ${trimmedScore}`;
      } else if (shortDate) {
        label = `${base} \u2014 ${shortDate}`;
      }
      return { value: match.id, label };
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
  const selectedTeam = teams.find((team) => team.id === draft.teamId) || null;
  // D26: pick the right per-template MVP field. Templates that don't render
  // an MVP at all (matchAnnouncement, groupStandings, playoffBracket) get
  // null and inherit nothing -- they never read the value anyway.
  const mvpFieldKey: keyof DraftState | null =
    selectedTemplate === "matchResult"
      ? "matchResultMvpId"
      : selectedTemplate === "mvpCard"
        ? "mvpCardMvpId"
        : selectedTemplate === "championPoster"
          ? "championPosterMvpId"
          : null;
  const templateMvpRaw = mvpFieldKey
    ? ((draft[mvpFieldKey] as unknown) as number)
    : 0;
  // Effective MVP id with backward-compatibility fallback: a template that
  // has not been explicitly touched (templateMvpRaw === 0) inherits the
  // legacy shared draft.mvpId. Once the admin acts on a specific template,
  // its dedicated field takes over and other templates remain untouched.
  const effectiveMvpId =
    mvpFieldKey && templateMvpRaw !== 0 ? templateMvpRaw : draft.mvpId;
  const selectedMvp =
    effectiveMvpId > 0
      ? players.find((player) => player.id === effectiveMvpId) || null
      : null;

  // Deterministic precedence: manual override > selected match > null.
  // (Previously a single `find` with `||` inside the predicate, which returned
  // whichever ID happened to come first in the underlying array.)
  const resolveTeamSide = (
    overrideId: number,
    matchSideId: number | undefined
  ): Team | null => {
    if (overrideId) {
      const manual = teams.find((team) => team.id === overrideId);
      if (manual) return manual;
    }
    if (matchSideId) {
      return teams.find((team) => team.id === matchSideId) || null;
    }
    return null;
  };

  const resolvePlayerSide = (
    overrideId: number,
    matchSideId: number | undefined
  ): Player | null => {
    if (overrideId) {
      const manual = players.find((player) => player.id === overrideId);
      if (manual) return manual;
    }
    if (matchSideId) {
      return players.find((player) => player.id === matchSideId) || null;
    }
    return null;
  };

  const selectedTeam1 = resolveTeamSide(draft.team1Id, selectedMatch?.team1);
  const selectedTeam2 = resolveTeamSide(draft.team2Id, selectedMatch?.team2);
  const selectedPlayer1 = resolvePlayerSide(
    draft.player1Id,
    selectedMatch?.player1
  );
  const selectedPlayer2 = resolvePlayerSide(
    draft.player2Id,
    selectedMatch?.player2
  );

  const sideA = entityMode === "team" ? selectedTeam1 : selectedPlayer1;
  const sideB = entityMode === "team" ? selectedTeam2 : selectedPlayer2;

  // === AUTOFILL DERIVATIONS ===
  // Real match/tournament data is the source of truth. Every field below is a
  // fallback that kicks in only when the admin has not typed a manual override.
  // Prefer the canonical Grand Final (seriesId === "F1"); otherwise pick the
  // newest "final" match by id descending. (Previously `.find(stage==="final")`
  // returned the first match in array order, which could pick the wrong final
  // when an upper/lower bracket split or a 3rd-place match was mistagged.)
  const tournamentFinalMatch = useMemo(() => {
    if (!selectedTournament) return null;
    const finals = matches.filter(
      (match) =>
        Number(match.tournamentId) === selectedTournament.id &&
        match.stage === "final"
    );
    if (finals.length === 0) return null;
    const grand = finals.find(
      (match) => (match.seriesId || "").trim().toUpperCase() === "F1"
    );
    if (grand) return grand;
    return finals.slice().sort((a, b) => b.id - a.id)[0] || null;
  }, [matches, selectedTournament]);

  // D4 + D26: MVP sentinel evaluated against the effective (per-template)
  // id rather than the shared legacy field, so cross-template bleed cannot
  // sneak in through the sentinel checks.
  //   effectiveMvpId === 0  -> autofill (use tournament.mvpId if present).
  //   effectiveMvpId === -1 -> intentionally hidden; never autofill.
  //   effectiveMvpId  >  0  -> manual override.
  const MVP_HIDDEN = -1;
  const tournamentMvpId = selectedTournament?.mvpId || 0;
  const isMvpHidden = effectiveMvpId === MVP_HIDDEN;
  const isMvpManual = effectiveMvpId > 0;
  // D22: "auto" indicator condition. True only when autofill is actually
  // sourcing the value from the tournament -- not when the user picked
  // manually and not when they intentionally hid the MVP.
  const isMvpAuto = !isMvpManual && !isMvpHidden && tournamentMvpId > 0;
  const resolvedMvpPlayer = useMemo(() => {
    if (isMvpHidden) return null;
    if (selectedMvp) return selectedMvp;
    if (tournamentMvpId) {
      return players.find((player) => player.id === tournamentMvpId) || null;
    }
    return null;
  }, [players, selectedMvp, tournamentMvpId, isMvpHidden]);

  // MVP card: if the admin has not picked a player but the tournament has an
  // MVP, surface that player.
  const mvpCardPlayer = selectedPlayer || resolvedMvpPlayer;

  // When rendering MVP card, derive the player's current team if a team has
  // not been manually chosen.
  const mvpCardTeam =
    selectedTeam ||
    (mvpCardPlayer?.teamId
      ? teams.find((team) => team.id === mvpCardPlayer.teamId) || null
      : null);

  // Match winner side (used to highlight winner on Match Result).
  const matchWinnerId =
    selectedMatch?.winnerTeamId || selectedMatch?.winnerId || 0;
  const sideAWinner =
    !!matchWinnerId &&
    (matchWinnerId === selectedMatch?.team1 ||
      matchWinnerId === selectedMatch?.player1);
  const sideBWinner =
    !!matchWinnerId &&
    (matchWinnerId === selectedMatch?.team2 ||
      matchWinnerId === selectedMatch?.player2);

  // Auto BO{n} from match.bestOf, then tournament.format, then "BO3".
  const autoFormat =
    (selectedMatch?.bestOf ? `BO${selectedMatch.bestOf}` : "") ||
    selectedTournament?.format ||
    "BO3";

  // Match Result map: join Match.maps when multiple, fall back to Match.map.
  const autoMap =
    selectedMatch?.maps && selectedMatch.maps.length > 0
      ? selectedMatch.maps.join(" \u2022 ")
      : selectedMatch?.map || "";

  const autoScore = selectedMatch?.score || "";
  const autoDate = selectedMatch?.date || selectedTournament?.date || "";
  // Stage label: group-stage matches should show the group first; playoff /
  // final / showmatch matches should show their round label first.
  const autoStage = selectedMatch
    ? selectedMatch.stage === "group"
      ? selectedMatch.groupName ||
        selectedMatch.roundLabel ||
        selectedMatch.round ||
        ""
      : selectedMatch.roundLabel ||
        selectedMatch.groupName ||
        selectedMatch.round ||
        ""
    : "";
  const autoFinalScore = tournamentFinalMatch?.score || "";
  const autoPrize = selectedTournament?.prize || "";
  // Map (e.g. "Mirage") is a CS2-only concept. Detect CS2 by tournament.game
  // or by keywords in tournament.title so we never hardcode an ID.
  const cs2HaystackRaw = `${selectedTournament?.game || ""} ${
    selectedTournament?.title || ""
  }`.toLowerCase();
  // Strict: only the canonical Counter-Strike spellings count. The bare word
  // "counter" is intentionally excluded so titles like "Counter Picks Cup" or
  // "Counter Draft League" do NOT trigger CS2-only UI (D9).
  const isCs2Tournament =
    cs2HaystackRaw.includes("cs2") ||
    /\bcs\s*2\b/.test(cs2HaystackRaw) ||
    cs2HaystackRaw.includes("cs:go") ||
    cs2HaystackRaw.includes("csgo") ||
    cs2HaystackRaw.includes("counter-strike") ||
    cs2HaystackRaw.includes("counter strike") ||
    /\bcs\b/.test(cs2HaystackRaw);
  // Is the selected match already completed? (used to decide whether to show
  // TBD placeholders on Match Result.)
  const isMatchCompleted = selectedMatch?.status === "completed";

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

  // Reset stale child state when the tournament changes. Keeps cross-tournament
  // leakage (matchId, side IDs, per-match draft fields) from surfacing on the
  // new tournament. Tracks the previous tournamentId in a ref so the effect is
  // a no-op on the initial mount.
  const previousTournamentIdRef = useRef(draft.tournamentId);
  useEffect(() => {
    if (previousTournamentIdRef.current === draft.tournamentId) return;
    previousTournamentIdRef.current = draft.tournamentId;
    setDraft((prev) => ({
      ...prev,
      matchId: 0,
      team1Id: 0,
      team2Id: 0,
      player1Id: 0,
      player2Id: 0,
      map: "",
      score: "",
      seriesLabel: "",
      dateTime: "",
      groupName: "",
    }));
  }, [draft.tournamentId]);

  useEffect(() => {
    return subscribeCollection<MediaAsset>(assetCollectionName, (items) => {
      setMediaAssets(
        items
          .slice()
          .sort((a, b) => {
            // D15: defensive parse mirroring matchSortKey. Missing,
            // undefined, or malformed createdAt -> getTime() returns NaN,
            // which makes the comparator non-transitive and produces
            // engine-dependent ordering. Fall back to 0 so invalid assets
            // sink to the bottom deterministically; tie-break on id so
            // equal/invalid timestamps still yield a stable order.
            const aRaw = a.createdAt ? new Date(a.createdAt).getTime() : NaN;
            const bRaw = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
            const aMs = Number.isFinite(aRaw) ? aRaw : 0;
            const bMs = Number.isFinite(bRaw) ? bRaw : 0;
            if (bMs !== aMs) return bMs - aMs;
            return (b.id || "").localeCompare(a.id || "");
          })
      );
    });
  }, []);

  // D20: idempotent revoke helper. Revoking an already-revoked Object URL is
  // a silent no-op in browsers, but tracking the set guarantees we never
  // attempt to revoke the same URL twice -- which keeps logs clean and makes
  // the cleanup contract obvious. Used by every path that destroys a
  // pendingAsset (replace / save success / explicit cancel / unmount).
  const revokedPreviewUrlsRef = useRef<Set<string>>(new Set());
  const revokePendingPreview = (asset: PendingAsset | null | undefined) => {
    const url = asset?.previewUrl;
    if (!url) return;
    if (revokedPreviewUrlsRef.current.has(url)) return;
    revokedPreviewUrlsRef.current.add(url);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Cleanup runs both when `pendingAsset` changes (state replacement /
    // explicit cancel / save success) and on component unmount, so this
    // single effect already covers all five paths the audit calls out --
    // the explicit calls below are belt-and-braces for clarity.
    return () => {
      revokePendingPreview(pendingAsset);
    };
  }, [pendingAsset]);

  const presetIntrinsic = STYLE_PRESETS[stylePreset] || STYLE_PRESETS.default;

  const resolvedPreset = useMemo<PalettePreset>(() => {
    if (studioTheme === "auto") return presetIntrinsic;
    if (studioTheme === "team") {
      if (teamPaletteRgb) {
        const [r, g, b] = teamPaletteRgb;
        return makePresetFromRgb(r, g, b);
      }
      return presetIntrinsic;
    }
    if (studioTheme === "game") {
      const preset = matchGamePreset(selectedTournament?.game);
      if (preset) return preset;
      return presetIntrinsic;
    }
    return PALETTE_PRESETS[studioTheme] || presetIntrinsic;
  }, [studioTheme, teamPaletteRgb, selectedTournament, presetIntrinsic]);

  // Inline CSS variables override the preset class only when the user has
  // explicitly chosen a palette other than "auto". This lets each preset's
  // intrinsic colors win by default while still allowing palette refinement.
  const studioStyle: CSSProperties =
    studioTheme === "auto"
      ? {}
      : ({
          "--studio-primary-rgb": resolvedPreset.primary,
          "--studio-accent-rgb": resolvedPreset.accent,
          "--studio-kicker": resolvedPreset.kicker,
          "--studio-bg-1": resolvedPreset.bg1,
          "--studio-bg-2": resolvedPreset.bg2,
          "--studio-bg-3": resolvedPreset.bg3,
        } as CSSProperties);

  const title =
    draft.tournamentTitle ||
    selectedTournament?.title ||
    adminText.mediaTournamentPlaceholder;
  // Single source of truth for stage: manual override > autoStage > placeholder.
  const stage = draft.stage || autoStage || adminText.mediaStagePlaceholder;
  // D17: single unified derivation for Match Announcement & Match Result
  // meta. Backward-compat fallback chain: new field (seriesLabel) wins,
  // legacy field (format) reads through, autoFormat fills the gap.
  const seriesValue = draft.seriesLabel || draft.format || autoFormat;
  const score = draft.score || autoScore || (isMatchCompleted ? "" : "TBD");
  const dateTime = draft.dateTime || autoDate;
  const dateLabel = formatDateLabel(dateTime, adminText.mediaDatePlaceholder);
  // Precedence: manual override > selected match's group > tournament's first
  // group > placeholder. (Previously the tournament's first group beat the
  // selected match, so picking a Group B match still showed "Group A".)
  const groupName =
    draft.groupName ||
    selectedMatch?.groupName ||
    selectedTournament?.groups?.[0]?.name ||
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

  // D28: parse and clamp the Top-N override. Empty / non-numeric / out-of-range
  // values fall back to the historical default of 6.
  const STANDINGS_DEFAULT_LIMIT = 6;
  const STANDINGS_MIN = 1;
  const STANDINGS_MAX = 32;
  const standingsLimit = (() => {
    const parsed = parseInt(draft.standingsLimit, 10);
    if (!Number.isFinite(parsed)) return STANDINGS_DEFAULT_LIMIT;
    return Math.max(STANDINGS_MIN, Math.min(STANDINGS_MAX, parsed));
  })();

  // D23: surface a clear admin hint when the selected tournament has no
  // configured group structure, instead of silently rendering placeholder rows.
  const tournamentHasGroups = (selectedTournament?.groups?.length || 0) > 0;

  // Group standings: reuse the public-tournament helper so the studio mirrors
  // the live standings table pixel-for-pixel (points, MP, wins, round diff).
  const standingsRows = useMemo(() => {
    const tournament = selectedTournament;
    if (!tournament) return [];

    const groupStageMatches = matches.filter(
      (match) =>
        Number(match.tournamentId) === tournament.id &&
        (match.stage === "group" || !match.stage)
    );

    const grouped = groupMatchesByGroupName(
      groupStageMatches,
      tournament.groups
    );

    const standings = calculateGroupStandings({
      groupedMatches: grouped,
      tournament,
      players,
      teams,
    });

    const activeGroup =
      (groupName && standings[groupName]) ||
      standings[Object.keys(standings)[0] || ""] ||
      [];

    return activeGroup.slice(0, standingsLimit).map((row) => ({
      id: row.id,
      name: row.name || adminText.unknown,
      points: row.points,
      played: row.played,
      wins: row.wins,
      roundDiff: row.scoreFor - row.scoreAgainst,
    }));
  }, [
    adminText.unknown,
    groupName,
    matches,
    players,
    selectedTournament,
    teams,
    standingsLimit,
  ]);

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

  const getAssetById = (assetId?: string) =>
    assetId ? mediaAssets.find((asset) => asset.id === assetId) || null : null;

  const appliedBackground = getAssetById(appliedAssetIds.backgrounds);
  const appliedOverlay = getAssetById(appliedAssetIds.overlays);
  const appliedTexture = getAssetById(appliedAssetIds.textures);
  const appliedSponsor = getAssetById(appliedAssetIds.sponsors);

  const filteredAssets = mediaAssets.filter((asset) => {
    if (asset.type !== activeAssetCategory) return false;
    const queryValue = assetSearch.trim().toLowerCase();
    if (!queryValue) return true;
    return asset.name.toLowerCase().includes(queryValue);
  });

  const setPendingFile = (file: File | null) => {
    if (!file) return;
    setAssetUploadError("");
    if (!acceptedAssetTypes.includes(file.type)) {
      setAssetUploadError("Unsupported file. Use PNG, JPG, WEBP, or SVG.");
      return;
    }

    setPendingAsset((previous) => {
      // D20: explicitly revoke the previous preview when replacing.
      revokePendingPreview(previous);
      return {
        file,
        name: file.name.replace(/\.[^.]+$/, ""),
        type: activeAssetCategory,
        previewUrl: URL.createObjectURL(file),
      };
    });
  };

  const handleAssetFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPendingFile(event.target.files?.[0] || null);
    event.target.value = "";
  };

  const handleAssetDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setAssetDropActive(false);
    setPendingFile(event.dataTransfer.files?.[0] || null);
  };

  const handleSaveAsset = async () => {
    if (!pendingAsset || isAssetUploading) return;
    if (!storage) {
      setAssetUploadError("Firebase Storage is not configured.");
      return;
    }

    setIsAssetUploading(true);
    setAssetUploadError("");

    try {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.round(Math.random() * 100000)}`;
      const category = assetCategories.find(
        (assetCategory) => assetCategory.id === pendingAsset.type
      );
      const safeName = sanitizeFileName(pendingAsset.file.name) || `${id}.png`;
      const path = `media/${category?.storageFolder || pendingAsset.type}/${id}-${safeName}`;
      const assetRef = storageRef(storage, path);
      await uploadBytes(assetRef, pendingAsset.file, {
        contentType: pendingAsset.file.type,
      });
      const url = await getDownloadURL(assetRef);
      const asset: MediaAsset = {
        id,
        name: pendingAsset.name || pendingAsset.file.name,
        type: pendingAsset.type,
        url,
        storagePath: path,
        mimeType: pendingAsset.file.type,
        createdAt: new Date().toISOString(),
      };

      await saveItem(assetCollectionName, asset);
      setAppliedAssetIds((previous) => ({ ...previous, [asset.type]: asset.id }));
      // D20: explicitly revoke before clearing state on success.
      revokePendingPreview(pendingAsset);
      setPendingAsset(null);
      showToast?.("Asset uploaded");
    } catch (error) {
      console.error("Asset upload failed:", error);
      const message =
        error instanceof Error ? error.message : "Asset upload failed.";
      setAssetUploadError(message);
      showToast?.(message, "danger");
    } finally {
      setIsAssetUploading(false);
    }
  };

  const handleDeleteAsset = async (asset: MediaAsset) => {
    // Already mid-delete for this asset: ignore. Prevents double-commit from
    // rapid keyboard / mouse clicks while the Firestore + Storage round-trip
    // is in flight.
    if (deletingAssetId === asset.id) return;
    setDeletingAssetId(asset.id);
    try {
      if (storage && asset.storagePath) {
        await deleteObject(storageRef(storage, asset.storagePath));
      }
      await deleteItem(assetCollectionName, asset.id);
      setAppliedAssetIds((previous) => {
        if (previous[asset.type] !== asset.id) return previous;
        const next = { ...previous };
        delete next[asset.type];
        return next;
      });
      showToast?.("Asset deleted");
    } catch (error) {
      console.error("Asset delete failed:", error);
      const message =
        error instanceof Error ? error.message : "Asset delete failed.";
      setAssetUploadError(message);
      showToast?.(message, "danger");
    } finally {
      setDeletingAssetId(null);
      setPendingDeleteAssetId(null);
    }
  };

  // D21: click handler that arms-then-commits. First click on a row arms it;
  // second click on the *same* row triggers the real delete. Clicking a
  // different row's delete button moves the armed state there instead of
  // leaving multiple rows armed.
  const handleRequestDeleteAsset = (asset: MediaAsset) => {
    if (deletingAssetId) return;
    if (pendingDeleteAssetId === asset.id) {
      void handleDeleteAsset(asset);
      return;
    }
    setPendingDeleteAssetId(asset.id);
  };

  const handleApplyAsset = (asset: MediaAsset) => {
    setAppliedAssetIds((previous) => ({ ...previous, [asset.type]: asset.id }));
  };

  const handleClearAsset = (category: AssetCategory) => {
    setAppliedAssetIds((previous) => {
      const next = { ...previous };
      delete next[category];
      return next;
    });
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

  // Tournament title override is a *shared* draft field consumed by every
  // template's preview (Match Announcement / Match Result / Group Standings /
  // MVP Card / Playoff Bracket / Champion Poster). Render the input once at
  // the top of every template's settings panel so the override is fully
  // transparent and admins can never silently carry a value across templates
  // without seeing it. Autofill chain (`draft.tournamentTitle || tournament.title
  // || placeholder`) is unchanged.
  const renderTitleOverrideField = () => (
    <div className="field-block">
      <label className="field-label">{adminText.mediaTournamentTitle}</label>
      <input
        className="input"
        value={draft.tournamentTitle}
        placeholder={
          selectedTournament?.title || adminText.mediaTournamentPlaceholder
        }
        onChange={handleTextChange("tournamentTitle")}
      />
      {renderRestoreAuto("tournamentTitle", draft.tournamentTitle)}
    </div>
  );

  // D8: lightweight "Restore auto" inline link for any string-valued draft
  // override. Visible only when the current value is non-empty (i.e. an
  // override is actually present and could be restored). Clicking clears the
  // field, which immediately re-engages the autofill chain because every
  // derivation uses `draft.X || autoX || placeholder`. No CSS rewrites: the
  // button reuses the existing field-block flex layout and a small inline
  // style so we don't introduce new global classes.
  const restoreAutoLabel = adminText.mediaRestoreAuto || "Restore auto";
  const restoreAutoStyle: CSSProperties = {
    alignSelf: "flex-start",
    marginTop: 4,
    padding: "2px 8px",
    fontSize: "0.72rem",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 4,
    color: "inherit",
    cursor: "pointer",
    opacity: 0.75,
  };
  const renderRestoreAuto = (
    key: keyof DraftState,
    currentValue: string
  ) => {
    if (!currentValue || !currentValue.trim()) return null;
    return (
      <button
        type="button"
        className="media-restore-auto"
        style={restoreAutoStyle}
        onClick={() =>
          updateDraft({ [key]: "" } as unknown as Partial<DraftState>)
        }
      >
        {restoreAutoLabel}
      </button>
    );
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

      {renderTitleOverrideField()}

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
        <>
          <div className="field-block">
            <label className="field-label">{adminText.mediaGroup}</label>
            <PremiumSelect
              value={groupName}
              placeholder={adminText.mediaGroupPlaceholder}
              options={groupOptions}
              onChange={(value) => updateDraft({ groupName: String(value) })}
            />
          </div>
          {/* D28: optional Top-N override. Empty -> default 6. Clamped to
              [1, 32] at read-time; the input itself uses min/max for
              keyboard arrow-step convenience. */}
          <div className="field-block">
            <label className="field-label">
              {adminText.mediaStandingsLimit || "Top N rows"}
            </label>
            <input
              className="input"
              type="number"
              min={STANDINGS_MIN}
              max={STANDINGS_MAX}
              value={draft.standingsLimit}
              placeholder={String(STANDINGS_DEFAULT_LIMIT)}
              onChange={handleTextChange("standingsLimit")}
            />
            {renderRestoreAuto("standingsLimit", draft.standingsLimit)}
          </div>
        </>
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
        selectedTemplate === "championPoster") &&
      mvpFieldKey ? (
        <div className="field-block">
          <label className="field-label">
            MVP
            {/* D22: subtle badge that only appears when the MVP is being
                pulled from tournament.mvpId (autofill), not when manually
                picked or intentionally hidden. */}
            {isMvpAuto ? (
              <span
                className="media-auto-badge"
                style={{
                  marginLeft: 8,
                  padding: "1px 6px",
                  fontSize: "0.65rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderRadius: 3,
                  background: "rgba(255, 184, 56, 0.18)",
                  color: "rgb(255, 184, 56)",
                  border: "1px solid rgba(255, 184, 56, 0.45)",
                }}
              >
                {adminText.mediaAutoBadge || "Auto"}
              </span>
            ) : null}
            {isMvpHidden ? (
              <span
                style={{
                  marginLeft: 8,
                  padding: "1px 6px",
                  fontSize: "0.65rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderRadius: 3,
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "inherit",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  opacity: 0.75,
                }}
              >
                {adminText.mediaHiddenBadge || "Hidden"}
              </span>
            ) : null}
          </label>
          <PremiumSelect
            value={isMvpHidden ? 0 : effectiveMvpId}
            placeholder={isMvpHidden ? "MVP hidden" : "MVP"}
            options={playerOptions}
            onChange={(value) => {
              // D26: writes target the per-template field only. The legacy
              // draft.mvpId is left untouched so other templates keep their
              // current rendering unless their own per-template field is
              // also touched.
              const next =
                typeof value === "number" ? value : Number(value) || 0;
              updateDraft({ [mvpFieldKey]: next } as unknown as Partial<DraftState>);
            }}
          />
          {/* D4: explicit Hide / Restore controls. Hiding is a deliberate
              negative selection (sentinel -1); Restore re-engages autofill
              by setting the per-template field back to 0. */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {!isMvpHidden ? (
              <button
                type="button"
                style={restoreAutoStyle}
                onClick={() =>
                  updateDraft({
                    [mvpFieldKey]: MVP_HIDDEN,
                  } as unknown as Partial<DraftState>)
                }
              >
                {adminText.mediaHideMvp || "Hide MVP"}
              </button>
            ) : null}
            {templateMvpRaw !== 0 ? (
              <button
                type="button"
                style={restoreAutoStyle}
                onClick={() =>
                  updateDraft({
                    [mvpFieldKey]: 0,
                  } as unknown as Partial<DraftState>)
                }
              >
                {adminText.mediaRestoreAutoMvp || "Restore auto MVP"}
              </button>
            ) : null}
          </div>
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
        <div className="field-block">
          <label className="field-label">{adminText.date}</label>
          <input
            className="input"
            value={draft.dateTime}
            placeholder={autoDate || adminText.mediaDatePlaceholder}
            onChange={handleTextChange("dateTime")}
          />
          {renderRestoreAuto("dateTime", draft.dateTime)}
        </div>
      ) : null}

      {(selectedTemplate === "matchAnnouncement" ||
        selectedTemplate === "matchResult") ? (
        <>
          <div className="field-block">
            <label className="field-label">{adminText.mediaStageGroup}</label>
            <input
              className="input"
              value={draft.stage}
              placeholder={autoStage || adminText.mediaStagePlaceholder}
              onChange={handleTextChange("stage")}
            />
            {renderRestoreAuto("stage", draft.stage)}
          </div>
          {/* D17: unified Series / Format field shown for BOTH templates.
              Writes go to seriesLabel; the legacy `format` value still
              reads through via the `seriesValue` derivation, so existing
              saved drafts keep working without migration. */}
          <div className="field-block">
            <label className="field-label">
              {adminText.mediaSeriesLabel || "Series / Format"}
            </label>
            <input
              className="input"
              value={draft.seriesLabel}
              placeholder={draft.format || autoFormat}
              onChange={handleTextChange("seriesLabel")}
            />
            {renderRestoreAuto("seriesLabel", draft.seriesLabel)}
          </div>
          {/* D18: optional sub-headline reused on Match Announcement &
              Match Result. Empty by default, never disrupts existing
              layouts. */}
          <div className="field-block media-form-wide">
            <label className="field-label">{adminText.mediaHighlight}</label>
            <input
              className="input"
              value={draft.highlight}
              placeholder={adminText.mediaHighlightPlaceholder}
              onChange={handleTextChange("highlight")}
            />
            {renderRestoreAuto("highlight", draft.highlight)}
          </div>
        </>
      ) : null}

      {selectedTemplate === "matchResult" ? (
        <>
          <div className="field-block">
            <label className="field-label">{adminText.score}</label>
            <input
              className="input"
              value={draft.score}
              placeholder={autoScore || "2:1"}
              onChange={handleTextChange("score")}
            />
            {renderRestoreAuto("score", draft.score)}
          </div>
          {isCs2Tournament ? (
            <div className="field-block">
              <label className="field-label">{adminText.mediaMap}</label>
              <input
                className="input"
                value={draft.map}
                placeholder={autoMap || "Mirage"}
                onChange={handleTextChange("map")}
              />
              {renderRestoreAuto("map", draft.map)}
            </div>
          ) : null}
        </>
      ) : null}

      {selectedTemplate === "playoffBracket" ? (
        <div className="field-block">
          <label className="field-label">{adminText.mediaFinalPlaceholder}</label>
          <input
            className="input"
            value={draft.finalPlaceholder}
            placeholder={adminText.mediaFinalPlaceholderText}
            onChange={handleTextChange("finalPlaceholder")}
          />
        </div>
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
          {renderRestoreAuto("highlight", draft.highlight)}
        </div>
      ) : null}

      {selectedTemplate === "championPoster" ? (
        <>
          <div className="field-block">
            <label className="field-label">{adminText.prize}</label>
            <input
              className="input"
              value={draft.prizePool}
              placeholder={autoPrize || "$1,000"}
              onChange={handleTextChange("prizePool")}
            />
            {renderRestoreAuto("prizePool", draft.prizePool)}
          </div>
          <div className="field-block">
            <label className="field-label">{adminText.mediaFinalScore}</label>
            <input
              className="input"
              value={draft.finalScore}
              placeholder={autoFinalScore || "3:2"}
              onChange={handleTextChange("finalScore")}
            />
            {renderRestoreAuto("finalScore", draft.finalScore)}
          </div>
          {/* D18: highlight reused as champion subheadline. */}
          <div className="field-block media-form-wide">
            <label className="field-label">{adminText.mediaHighlight}</label>
            <input
              className="input"
              value={draft.highlight}
              placeholder={adminText.mediaHighlightPlaceholder}
              onChange={handleTextChange("highlight")}
            />
            {renderRestoreAuto("highlight", draft.highlight)}
          </div>
        </>
      ) : null}
    </div>
  );

  const renderPreviewContent = () => {
    if (selectedTemplate === "groupStandings") {
      // D23: when the tournament has no groups configured, show a subtle hint
      // and DON'T fall back to the synthetic placeholder rows -- those used to
      // silently mislead admins into thinking standings were live. When the
      // tournament has groups but no match data yet, keep the placeholder
      // rows so the layout still previews correctly.
      const showNoGroupsHint =
        !!selectedTournament && !tournamentHasGroups;
      const previewRows = standingsRows.length
        ? standingsRows
        : showNoGroupsHint
          ? []
          : Array.from({ length: 4 }, (_, index) => ({
              id: index,
              name: `${adminText.mediaParticipantPlaceholder} ${index + 1}`,
              points: Math.max(0, 9 - index * 3),
              played: 3,
              wins: Math.max(0, 3 - index),
              roundDiff: 4 - index,
            }));
      return (
        <div className="media-preview-section media-preview-standings">
          <span className="media-kicker">{groupName}</span>
          <h3>{title}</h3>
          {showNoGroupsHint ? (
            <p
              className="media-empty-hint"
              style={{
                opacity: 0.7,
                fontSize: "0.85rem",
                margin: "4px 0 8px",
              }}
            >
              {adminText.mediaNoGroupsHint ||
                "No groups configured for this tournament."}
            </p>
          ) : null}
          <div className="media-standings-table">
            <div className="media-standings-row media-standings-head">
              <span>#</span>
              <span>{adminText.mediaTeamPlayer}</span>
              <span>PTS</span>
              <span>MP</span>
              <span>W</span>
              <span>RD</span>
            </div>
            {previewRows.map((row, index) => (
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
          {renderLogo(mvpCardPlayer, "media-mvp-avatar", adminText.unknownPlayer)}
          <span className="media-kicker">MVP</span>
          <h3>{mvpCardPlayer?.nickname || adminText.mediaPlayerPlaceholder}</h3>
          <p>{mvpCardTeam?.name || selectedTournament?.title || title}</p>
          <strong>
            {draft.highlight || adminText.mediaHighlightPlaceholder}
          </strong>
        </div>
      );
    }

    if (selectedTemplate === "championPoster") {
      // D18: optional headline reused from the highlight field.
      const championHighlight = draft.highlight.trim();
      // Auto-detect champion entity from the tournament's winner IDs.
      const autoChampionTeam =
        selectedTeam ||
        (selectedTournament?.winnerTeamId
          ? teams.find(
              (team) => team.id === selectedTournament.winnerTeamId
            ) || null
          : null);
      const autoChampionPlayer =
        selectedPlayer ||
        (selectedTournament?.winnerId
          ? players.find(
              (player) => player.id === selectedTournament.winnerId
            ) || null
          : null);
      const championEntity =
        entityMode === "team" ? autoChampionTeam : autoChampionPlayer;
      const championLabel =
        entityMode === "team"
          ? autoChampionTeam?.name
          : autoChampionPlayer?.nickname;

      return (
        <div className="media-preview-section media-preview-champion">
          <span className="media-kicker">CHAMPIONS</span>
          <h3>{championLabel || adminText.mediaChampionPlaceholder}</h3>
          <p>{title}</p>
          {championHighlight ? (
            <p className="media-subheadline">{championHighlight}</p>
          ) : null}
          <div className="media-champion-crown">
            {renderLogo(
              championEntity,
              "media-champion-logo",
              adminText.mediaChampionPlaceholder
            )}
          </div>
          <div className="media-stat-strip">
            <span>{draft.prizePool || autoPrize || "$1,000"}</span>
            <span>{draft.finalScore || autoFinalScore || "3:2"}</span>
            {isMvpHidden ? null : (
              <span>{resolvedMvpPlayer?.nickname || "MVP"}</span>
            )}
          </div>
        </div>
      );
    }

    // Match Announcement & Match Result share this layout. Winner side is
    // highlighted only on Match Result (and only if we can detect the winner).
    const isResult = selectedTemplate === "matchResult";
    const markWinnerA = isResult && sideAWinner;
    const markWinnerB = isResult && sideBWinner;
    // Map is CS2-only: for any other game show the date in its place.
    const resultMap = isCs2Tournament ? draft.map || autoMap : "";
    const resultMapLabel = isCs2Tournament
      ? resultMap || (isMatchCompleted ? "" : "Map TBD")
      : dateLabel;
    // D4: when MVP is intentionally hidden, drop the meta cell entirely
    // (resolvedMvpPlayer is already null in that case, so the existing
    // truthy-check below handles it without further branching).
    const metaMvp = isResult
      ? resolvedMvpPlayer?.nickname || ""
      : "";
    // D18: optional sub-headline shown above the versus block on both
    // Match Announcement and Match Result if the admin set one.
    const matchHighlight = draft.highlight.trim();

    return (
      <div className="media-preview-section media-preview-match">
        <span className="media-kicker">{stage}</span>
        <h3>{title}</h3>
        {matchHighlight ? (
          <p className="media-subheadline">{matchHighlight}</p>
        ) : null}
        <div className="media-versus">
          <div
            className={`media-side ${
              markWinnerA ? "media-side-winner" : ""
            }`}
          >
            {renderLogo(sideA, "media-side-logo", adminText.mediaSideOne)}
            <strong>
              {sideA?.name || sideA?.nickname || adminText.mediaSideOne}
            </strong>
            {markWinnerA ? (
              <span className="media-side-winner-badge">
                {adminText.winner || "WIN"}
              </span>
            ) : null}
          </div>
          <div className="media-vs">{isResult ? score : "VS"}</div>
          <div
            className={`media-side ${
              markWinnerB ? "media-side-winner" : ""
            }`}
          >
            {renderLogo(sideB, "media-side-logo", adminText.mediaSideTwo)}
            <strong>
              {sideB?.name || sideB?.nickname || adminText.mediaSideTwo}
            </strong>
            {markWinnerB ? (
              <span className="media-side-winner-badge">
                {adminText.winner || "WIN"}
              </span>
            ) : null}
          </div>
        </div>
        <div className="media-match-meta">
          <span>{isResult ? resultMapLabel : dateLabel}</span>
          <span>{seriesValue}</span>
          {metaMvp ? <span>{metaMvp}</span> : null}
          {/* D12: surface the derived score on Match Announcement too when
              one actually exists (override or completed match). "TBD" is
              treated as absence so unscheduled matches don't render the
              cell. Match Result already shows the score as the central VS
              cell, so we skip duplication there. */}
          {!isResult && score && score !== "TBD" ? (
            <span>{score}</span>
          ) : null}
        </div>
      </div>
    );
  };

  const activeTemplate = templates.find((template) => template.id === selectedTemplate);

  const palettesList: { id: StudioTheme; label: string }[] = [
    { id: "auto", label: adminText.mediaThemeAuto || "Auto (preset)" },
    { id: "crimson", label: adminText.mediaThemeCrimson || "Crimson Red" },
    { id: "neonBlue", label: adminText.mediaThemeNeonBlue || "Neon Blue" },
    { id: "royalPurple", label: adminText.mediaThemeRoyalPurple || "Royal Purple" },
    { id: "whiteGold", label: adminText.mediaThemeWhiteGold || "White Gold" },
    { id: "emerald", label: adminText.mediaThemeEmerald || "Emerald Green" },
    { id: "team", label: adminText.mediaThemeTeam || "Team Adaptive" },
    { id: "game", label: adminText.mediaThemeGame || "Tournament Game" },
  ];

  const swatchPreset = (id: StudioTheme): PalettePreset => {
    if (id === "auto") return presetIntrinsic;
    if (id === "team") {
      if (teamPaletteRgb) {
        const [r, g, b] = teamPaletteRgb;
        return makePresetFromRgb(r, g, b);
      }
      return presetIntrinsic;
    }
    if (id === "game") {
      const preset = matchGamePreset(selectedTournament?.game);
      return preset || presetIntrinsic;
    }
    return PALETTE_PRESETS[id];
  };

  const presetsList: { id: StylePreset; label: string; description: string }[] = [
    {
      id: "default",
      label: adminText.mediaPresetDefault || "Default Esports",
      description: adminText.mediaPresetDefaultDesc || "Classic red & dark glow",
    },
    {
      id: "cyberpunk",
      label: adminText.mediaPresetCyberpunk || "Cyberpunk",
      description: adminText.mediaPresetCyberpunkDesc || "Neon cyan & magenta grid",
    },
    {
      id: "minimal",
      label: adminText.mediaPresetMinimal || "Minimal",
      description: adminText.mediaPresetMinimalDesc || "Clean dark, soft glow",
    },
    {
      id: "horror",
      label: adminText.mediaPresetHorror || "Horror",
      description: adminText.mediaPresetHorrorDesc || "Dark red, smoky atmosphere",
    },
    {
      id: "premiumGold",
      label: adminText.mediaPresetPremium || "Premium Gold",
      description: adminText.mediaPresetPremiumDesc || "Black & gold luxury",
    },
    {
      id: "vct",
      label: adminText.mediaPresetVct || "VCT Style",
      description: adminText.mediaPresetVctDesc || "Cinematic red & black",
    },
    {
      id: "faceit",
      label: adminText.mediaPresetFaceit || "FACEIT Style",
      description: adminText.mediaPresetFaceitDesc || "Aggressive orange & dark",
    },
    {
      id: "anime",
      label: adminText.mediaPresetAnime || "Anime",
      description: adminText.mediaPresetAnimeDesc || "Vibrant bloom & gradient",
    },
  ];

  const renderAssetLibrary = () => (
    <div className="media-asset-library">
      <div className="media-asset-header">
        <div>
          <span className="media-palette-label">Asset Library</span>
          <strong>Reusable poster layers</strong>
        </div>
      </div>

      <div className="media-asset-tabs">
        {assetCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`media-asset-tab ${
              activeAssetCategory === category.id ? "media-asset-tab-active" : ""
            }`}
            onClick={() => setActiveAssetCategory(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div
        className={`media-asset-dropzone ${
          assetDropActive ? "media-asset-dropzone-active" : ""
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setAssetDropActive(true);
        }}
        onDragLeave={() => setAssetDropActive(false)}
        onDrop={handleAssetDrop}
      >
        <input
          id="media-asset-input"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleAssetFileChange}
        />
        <label htmlFor="media-asset-input">
          Drop an image here or choose file
          <small>PNG, JPG, WEBP, SVG</small>
        </label>
      </div>

      {pendingAsset ? (
        <div className="media-pending-asset">
          <img src={pendingAsset.previewUrl} alt={pendingAsset.name} />
          <div className="media-pending-asset-meta">
            <input
              className="input"
              value={pendingAsset.name}
              onChange={(event) =>
                setPendingAsset((previous) =>
                  previous ? { ...previous, name: event.target.value } : previous
                )
              }
              placeholder="Asset name"
            />
            <div className="media-asset-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={handleSaveAsset}
                disabled={isAssetUploading}
              >
                {isAssetUploading ? "Uploading..." : "Save Asset"}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  // D20: explicitly revoke before clearing on cancel.
                  revokePendingPreview(pendingAsset);
                  setPendingAsset(null);
                }}
                disabled={isAssetUploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <input
        className="input media-asset-search"
        value={assetSearch}
        onChange={(event) => setAssetSearch(event.target.value)}
        placeholder="Search assets"
      />

      <div className="media-applied-assets">
        {assetCategories.map((category) => {
          const asset = getAssetById(appliedAssetIds[category.id]);
          return (
            <div className="media-applied-pill" key={category.id}>
              <span>{category.label}</span>
              <strong>{asset?.name || "None"}</strong>
              {asset ? (
                <button type="button" onClick={() => handleClearAsset(category.id)}>
                  Clear
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {activeAssetCategory === "sponsors" ? (
        <div className="media-sponsor-position">
          <span className="media-palette-label">Sponsor placement</span>
          <div className="media-asset-tabs">
            {sponsorPositions.map((position) => (
              <button
                key={position.id}
                type="button"
                className={`media-asset-tab ${
                  sponsorPosition === position.id ? "media-asset-tab-active" : ""
                }`}
                onClick={() => setSponsorPosition(position.id)}
              >
                {position.label}
              </button>
            ))}
          </div>
          {/* D14: optional sponsor caption. Rendered in the preview only when
              a sponsor asset is also applied; gracefully disappears when
              empty. The field is always available here so admins can author
              the caption before / after picking a sponsor logo. */}
          <div className="field-block" style={{ marginTop: 8 }}>
            <label className="field-label">
              {adminText.mediaSponsorCaption || "Sponsor caption"}
            </label>
            <input
              className="input"
              value={draft.sponsorCaption}
              placeholder={
                adminText.mediaSponsorCaptionPlaceholder ||
                "e.g. Powered by Acme"
              }
              onChange={handleTextChange("sponsorCaption")}
            />
            {renderRestoreAuto("sponsorCaption", draft.sponsorCaption)}
          </div>
        </div>
      ) : null}

      {(activeAssetCategory === "overlays" || activeAssetCategory === "textures") ? (
        <div className="media-opacity-control">
          <label className="field-label">
            {activeAssetCategory === "overlays" ? "Overlay opacity" : "Texture opacity"}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={activeAssetCategory === "overlays" ? overlayOpacity : textureOpacity}
            onChange={(event) =>
              activeAssetCategory === "overlays"
                ? setOverlayOpacity(Number(event.target.value))
                : setTextureOpacity(Number(event.target.value))
            }
          />
        </div>
      ) : null}

      <div className="media-asset-gallery">
        {filteredAssets.length ? (
          filteredAssets.map((asset) => (
            <article className="media-asset-card" key={asset.id}>
              <img src={asset.url} alt={asset.name} />
              <div>
                <strong>{asset.name}</strong>
                <small>{asset.type}</small>
              </div>
              <div className="media-asset-card-actions">
                <button type="button" onClick={() => handleApplyAsset(asset)}>
                  Apply
                </button>
                {pendingDeleteAssetId === asset.id ? (
                  <>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => handleRequestDeleteAsset(asset)}
                      disabled={deletingAssetId === asset.id}
                    >
                      {deletingAssetId === asset.id
                        ? "Deleting..."
                        : "Confirm delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteAssetId(null)}
                      disabled={deletingAssetId === asset.id}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestDeleteAsset(asset)}
                    disabled={deletingAssetId !== null}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <p className="media-settings-note">No assets in this category yet.</p>
        )}
      </div>

      {assetUploadError ? <div className="admin-error">{assetUploadError}</div> : null}
    </div>
  );

  return (
    <section
      id="admin-section-media"
      className={`panel admin-media-center studio-style-${stylePreset}`}
      data-studio-theme={studioTheme}
      data-studio-style={stylePreset}
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
            {appliedBackground ? (
              <div
                className="media-asset-layer media-asset-background"
                style={{ backgroundImage: `url("${appliedBackground.url}")` }}
              />
            ) : null}
            {appliedTexture ? (
              <div
                className="media-asset-layer media-asset-texture"
                style={{
                  backgroundImage: `url("${appliedTexture.url}")`,
                  opacity: textureOpacity,
                }}
              />
            ) : null}
            <div className="media-poster-grid" />
            <div className="media-poster-glow" />
            {appliedOverlay ? (
              <div
                className="media-asset-layer media-asset-overlay"
                style={{
                  backgroundImage: `url("${appliedOverlay.url}")`,
                  opacity: overlayOpacity,
                }}
              />
            ) : null}
            <div className="media-poster-topline">
              <span>SANSARA</span>
              <span>{activeTemplate ? adminText[activeTemplate.labelKey] : ""}</span>
            </div>
            {renderPreviewContent()}
            {appliedSponsor ? (
              <img
                className={`media-sponsor-logo media-sponsor-logo-${sponsorPosition}`}
                src={appliedSponsor.url}
                alt={appliedSponsor.name}
              />
            ) : null}
            {/* D14: caption sits near the sponsor logo, anchored to the same
                corner via inline offsets. Only rendered when both a sponsor
                asset is applied and the caption is non-empty so it never
                competes with critical content. Inline-styled to avoid a
                CSS rewrite. */}
            {appliedSponsor && draft.sponsorCaption.trim() ? (
              <span
                className="media-sponsor-caption"
                style={(() => {
                  const base: CSSProperties = {
                    position: "absolute",
                    fontSize: "0.62rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    opacity: 0.75,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                  };
                  switch (sponsorPosition) {
                    case "topLeft":
                      return { ...base, top: 88, left: 24 };
                    case "topRight":
                      return { ...base, top: 88, right: 24 };
                    case "bottomCenter":
                      return {
                        ...base,
                        bottom: 28,
                        left: "50%",
                        transform: "translateX(-50%)",
                      };
                    case "compact":
                    default:
                      return { ...base, top: 88, right: 24 };
                  }
                })()}
              >
                {draft.sponsorCaption.trim()}
              </span>
            ) : null}
            <div className="media-poster-footer">
              <span>@sansara.esports</span>
              <span>1080 x 1920</span>
            </div>
          </div>
        </div>

        <div className="media-settings-panel">
          <h3>{adminText.mediaSettings}</h3>

          <div className="media-preset-block">
            <span className="media-palette-label">
              {adminText.mediaStylePreset || "Style preset"}
            </span>
            <div className="media-preset-grid">
              {presetsList.map((preset) => {
                const colors = STYLE_PRESETS[preset.id];
                const isActive = stylePreset === preset.id;
                const thumbStyle: CSSProperties = {
                  background: `linear-gradient(160deg, ${colors.bg1} 0%, ${colors.bg2} 50%, ${colors.bg3} 100%)`,
                };
                const accentDotStyle: CSSProperties = {
                  background: `radial-gradient(circle, rgba(${colors.primary}, 0.95), rgba(${colors.primary}, 0) 70%)`,
                };
                const accentBarStyle: CSSProperties = {
                  background: `linear-gradient(90deg, rgb(${colors.primary}), rgb(${colors.accent}))`,
                };
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`media-preset-card studio-style-${preset.id} ${
                      isActive ? "media-preset-card-active" : ""
                    }`}
                    onClick={() => setStylePreset(preset.id)}
                    aria-pressed={isActive}
                    title={preset.description}
                  >
                    <span className="media-preset-thumb" style={thumbStyle}>
                      <span className="media-preset-thumb-dot" style={accentDotStyle} />
                      <span className="media-preset-thumb-bar" style={accentBarStyle} />
                    </span>
                    <span className="media-preset-meta">
                      <strong>{preset.label}</strong>
                      <small>{preset.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

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

          {renderAssetLibrary()}

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
