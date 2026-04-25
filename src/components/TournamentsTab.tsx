import { useEffect, useMemo, useRef, useState } from "react";
import { Match, Player, Team, Tournament } from "../types";

type Props = {
  tournaments: Tournament[];
  players: Player[];
  teams: Team[];
  matches: Match[];
};

export default function TournamentsTab({
  tournaments,
  players,
  teams,
  matches,
}: Props) {
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    number | null
  >(null);

  const selectedTournament = useMemo(
    () =>
      tournaments.find(
        (tournament) => tournament.id === selectedTournamentId
      ) ?? null,
    [tournaments, selectedTournamentId]
  );

  const getPlayerById = (playerId?: number) =>
    playerId ? players.find((player) => player.id === playerId) : undefined;

  const getTeamById = (teamId?: number) =>
    teamId ? teams.find((team) => team.id === teamId) : undefined;

  const getPlayerName = (playerId?: number) =>
    getPlayerById(playerId)?.nickname || "—";

  const getTeamName = (teamId?: number) => getTeamById(teamId)?.name || "—";

  const getSquadWinnerIds = (tournament: Tournament) => {
    if (
      Array.isArray(tournament.winnerSquadIds) &&
      tournament.winnerSquadIds.length > 0
    ) {
      return tournament.winnerSquadIds.map(Number);
    }

    if (Array.isArray(tournament.placements)) {
      return tournament.placements
        .filter(
          (placement) =>
            placement.place === 1 && typeof placement.playerId === "number"
        )
        .map((placement) => Number(placement.playerId));
    }

    return [];
  };

  const getTournamentWinnerName = (tournament: Tournament) => {
    if (tournament.participantType === "team") {
      return getTeamName(tournament.winnerTeamId);
    }

    if (tournament.participantType === "squad") {
      const squadWinnerIds = getSquadWinnerIds(tournament);

      return squadWinnerIds.length > 0
        ? squadWinnerIds.map((id) => getPlayerName(id)).join(" / ")
        : "—";
    }

    return getPlayerName(tournament.winnerId);
  };

  const getTournamentWinnerImage = (tournament: Tournament) => {
    if (tournament.participantType === "team") {
      return (
        teams.find((team) => team.id === tournament.winnerTeamId)?.logo || ""
      );
    }

    if (tournament.participantType === "squad") {
      const firstWinnerId = getSquadWinnerIds(tournament)[0];
      return (
        players.find((player) => player.id === firstWinnerId)?.avatar || ""
      );
    }

    return (
      players.find((player) => player.id === tournament.winnerId)?.avatar || ""
    );
  };

  const getParticipantEntries = (tournament: Tournament) => {
    if (!Array.isArray(tournament.participantIds)) return [];

    if (tournament.participantType === "team") {
      return tournament.participantIds
        .map((participantId) => teams.find((team) => team.id === participantId))
        .filter(Boolean)
        .map((team) => ({
          id: team!.id,
          name: team!.name,
          image: team!.logo,
          type: "team" as const,
        }));
    }

    return tournament.participantIds
      .map((participantId) =>
        players.find((player) => player.id === participantId)
      )
      .filter(Boolean)
      .map((player) => ({
        id: player!.id,
        name: player!.nickname,
        image: player!.avatar,
        type:
          tournament.participantType === "squad"
            ? ("squad" as const)
            : ("player" as const),
      }));
  };

  const getPlacementEntries = (tournament: Tournament) => {
    if (!Array.isArray(tournament.placements)) return [];

    if (tournament.participantType === "team") {
      return tournament.placements
        .map((placement) => {
          const team = teams.find((team) => team.id === placement.teamId);

          if (!team) return null;

          return {
            place: placement.place,
            entityId: team.id,
            entityName: team.name,
          };
        })
        .filter(Boolean) as {
        place: number;
        entityId: number;
        entityName: string;
      }[];
    }

    return tournament.placements
      .map((placement) => {
        const player = players.find(
          (player) => player.id === placement.playerId
        );

        if (!player) return null;

        return {
          place: placement.place,
          entityId: player.id,
          entityName: player.nickname,
        };
      })
      .filter(Boolean) as {
      place: number;
      entityId: number;
      entityName: string;
    }[];
  };

  const selectedParticipants = selectedTournament
    ? getParticipantEntries(selectedTournament)
    : [];

  const selectedPlacements = selectedTournament
    ? getPlacementEntries(selectedTournament)
    : [];

const selectedMatches = selectedTournament
  ? matches.filter((match) => match.tournamentId === selectedTournament.id)
  : [];

const tournamentFormat = selectedTournament?.format || "playoff";

const shouldShowGroups =
  tournamentFormat === "groups_only" ||
  tournamentFormat === "groups_playoff" ||
  tournamentFormat === "league" ||
  tournamentFormat === "swiss";

const shouldShowPlayoff =
  tournamentFormat === "playoff" ||
  tournamentFormat === "groups_playoff";

const groupMatches = shouldShowGroups
  ? selectedMatches.filter((match) => match.stage === "group")
  : [];

const playoffMatches = shouldShowPlayoff
  ? selectedMatches.filter((match) => match.stage === "playoff")
  : [];

const finalMatches = shouldShowPlayoff
  ? selectedMatches.filter((match) => match.stage === "final")
  : [];

const otherMatches = selectedMatches.filter(
  (match) =>
    match.stage !== "group" &&
    match.stage !== "playoff" &&
    match.stage !== "final"
);

const groupedMatches = groupMatches.reduce((acc, match) => {
  const group = match.groupName || "Group A";

  if (!acc[group]) acc[group] = [];
  acc[group].push(match);

  return acc;
}, selectedTournament?.groups?.reduce((acc, group) => {
  acc[group.name] = [];
  return acc;
}, {} as Record<string, Match[]>) || {});

const groupStandings = Object.entries(groupedMatches).reduce(
  (acc, [groupName, groupItems]) => {
    const table = new Map<
      string,
      {
        id: number;
        name: string;
        image: string;
        played: number;
        wins: number;
        losses: number;
        points: number;
        scoreFor: number;
        scoreAgainst: number;
      }
    >();

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

    const tournamentGroup = selectedTournament?.groups?.find(
      (group) => group.name === groupName
    );

    tournamentGroup?.participantIds.forEach((participantId) => {
      const participant =
        selectedTournament?.participantType === "team"
          ? teams.find((team) => team.id === participantId)
          : players.find((player) => player.id === participantId);

      const participantName =
        selectedTournament?.participantType === "team"
          ? participant && "name" in participant
            ? participant.name
            : getTeamName(participantId)
          : participant && "nickname" in participant
          ? participant.nickname
          : getPlayerName(participantId);

      const participantImage =
        selectedTournament?.participantType === "team"
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
  {} as Record<
    string,
    {
      id: number;
      name: string;
      image: string;
      played: number;
      wins: number;
      losses: number;
      points: number;
      scoreFor: number;
      scoreAgainst: number;
    }[]
  >
);

const getSeriesKey = (match: Match) =>
  match.seriesId?.trim() || `single-match-${match.id}`;

const roundPriority = (roundName: string) => {
  const normalized = roundName.toLowerCase();

  if (normalized.includes("1/8") || normalized.includes("r16")) return 1;
  if (normalized.includes("1/4") || normalized.includes("qf")) return 2;
  if (normalized.includes("1/2") || normalized.includes("sf")) return 3;
  if (normalized.includes("final")) return 4;

  return 99;
};

const playoffRounds = playoffMatches.reduce((acc, match) => {
  const round = match.roundLabel || match.round || "Playoff";
  const seriesKey = getSeriesKey(match);

  if (!acc[round]) acc[round] = {};
  if (!acc[round][seriesKey]) acc[round][seriesKey] = [];

  acc[round][seriesKey].push(match);

  return acc;
}, {} as Record<string, Record<string, Match[]>>);

const playoffRoundSeries = Object.entries(playoffRounds)
  .sort(([roundA], [roundB]) => {
    const priorityDiff = roundPriority(roundA) - roundPriority(roundB);
    if (priorityDiff !== 0) return priorityDiff;
    return roundA.localeCompare(roundB);
  })
  .map(([roundName, seriesMap]) => ({
    roundName,
    series: Object.values(seriesMap)
      .map((seriesMatches) => [...seriesMatches].sort((a, b) => a.id - b.id))
      .sort((a, b) => {
        const aKey = getSeriesKey(a[0] || ({} as Match));
        const bKey = getSeriesKey(b[0] || ({} as Match));
        return aKey.localeCompare(bKey, undefined, { numeric: true });
      }),
  }));

const finalSeries = Object.values(
  finalMatches.reduce((acc, match) => {
    const seriesKey = getSeriesKey(match);

    if (!acc[seriesKey]) acc[seriesKey] = [];
    acc[seriesKey].push(match);

    return acc;
  }, {} as Record<string, Match[]>)
)
  .map((seriesMatches) => [...seriesMatches].sort((a, b) => a.id - b.id))
  .sort((a, b) => {
    const aKey = getSeriesKey(a[0] || ({} as Match));
    const bKey = getSeriesKey(b[0] || ({} as Match));
    return aKey.localeCompare(bKey, undefined, { numeric: true });
  });

const bracketRef = useRef<HTMLDivElement | null>(null);
const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
const [activeParticipantId, setActiveParticipantId] = useState<number>(0);

const [bracketLines, setBracketLines] = useState<
  { id: string; fromId: string; toId: string; path: string }[]
>([]);

const getSeriesPathIds = (seriesId: string | null) => {
  if (!seriesId) return [];

  const allSeries = [...playoffMatches, ...finalMatches];
  const path = new Set<string>();
  let currentId = seriesId;

  while (currentId) {
    path.add(currentId);

    const currentMatch = allSeries.find(
      (match) => getSeriesKey(match) === currentId
    );

    if (!currentMatch?.nextSeriesId) break;

    currentId = currentMatch.nextSeriesId;
  }

  return Array.from(path);
};

const activeSeriesPath = useMemo(
  () => getSeriesPathIds(activeSeriesId),
  [activeSeriesId, playoffMatches, finalMatches]
);

const getMatchParticipantIds = (match: Match) =>
  match.matchType === "team"
    ? [Number(match.team1 || 0), Number(match.team2 || 0)]
    : [Number(match.player1 || 0), Number(match.player2 || 0)];

const getMatchWinnerId = (match: Match) =>
  match.matchType === "team"
    ? Number(match.winnerTeamId || 0)
    : Number(match.winnerId || 0);



const activeSeriesResultMap = useMemo(() => {
  const result = new Map<string, "win" | "loss" | "draw">();

  if (!activeParticipantId) return result;

  const allSeries = [...playoffMatches, ...finalMatches];

  allSeries.forEach((match) => {
    const seriesId = getSeriesKey(match);
    const participants = getMatchParticipantIds(match);
    const winnerId = getMatchWinnerId(match);

    if (!participants.includes(activeParticipantId)) return;

    if (winnerId === activeParticipantId) {
      result.set(seriesId, "win");
      return;
    }

    if (winnerId > 0) {
      result.set(seriesId, "loss");
      return;
    }

    result.set(seriesId, "draw");
  });

  return result;
}, [activeParticipantId, playoffMatches, finalMatches]);

const winnerSeriesPath = (() => {
  if (!selectedTournament) return [];

  const allSeries = [...playoffMatches, ...finalMatches];

  const championPlayerId = Number(selectedTournament.winnerId || 0);
  const championTeamId = Number(selectedTournament.winnerTeamId || 0);

  if (!championPlayerId && !championTeamId) return [];

  const championWonMatches = allSeries.filter((match) => {
    if (championPlayerId) {
      return Number(match.winnerId || 0) === championPlayerId;
    }

    if (championTeamId) {
      return Number(match.winnerTeamId || 0) === championTeamId;
    }

    return false;
  });

  return Array.from(
    new Set(championWonMatches.map((match) => getSeriesKey(match)))
  );
})();

useEffect(() => {
  const buildLines = () => {
    const root = bracketRef.current;
    if (!root) return;

    const rootRect = root.getBoundingClientRect();
    const cards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-series-id]")
    );

    const nextLines: {
      id: string;
      fromId: string;
      toId: string;
      path: string;
    }[] = [];

    cards.forEach((card) => {
      const seriesId = card.dataset.seriesId;
      const nextSeriesId = card.dataset.nextSeriesId;

      if (!seriesId || !nextSeriesId) return;

      const target = root.querySelector<HTMLElement>(
        `[data-series-id="${nextSeriesId}"]`
      );

      if (!target) return;

      const fromRect = card.getBoundingClientRect();
      const toRect = target.getBoundingClientRect();

      const startX = fromRect.right - rootRect.left;
      const startY = fromRect.top + fromRect.height / 2 - rootRect.top;

      const endX = toRect.left - rootRect.left;
      const endY = toRect.top + toRect.height / 2 - rootRect.top;

      const middleX = startX + (endX - startX) / 2;

      nextLines.push({
        id: `${seriesId}-${nextSeriesId}`,
        fromId: seriesId,
        toId: nextSeriesId,
        path: `M ${startX} ${startY} H ${middleX} V ${endY} H ${endX}`,
      });
    });

setBracketLines((currentLines) => {
  const currentSignature = currentLines
    .map((line) => `${line.id}:${line.path}`)
    .join("|");

  const nextSignature = nextLines
    .map((line) => `${line.id}:${line.path}`)
    .join("|");

  return currentSignature === nextSignature ? currentLines : nextLines;
});
  };

  const frame = window.requestAnimationFrame(buildLines);
  const timer = window.setTimeout(buildLines, 150);

  window.addEventListener("resize", buildLines);

  return () => {
    window.cancelAnimationFrame(frame);
    window.clearTimeout(timer);
    window.removeEventListener("resize", buildLines);
  };
}, [selectedTournamentId, matches]);

const getMatchPreviewData = (match: Match) => {
  const isTeamMatch = match.matchType === "team";

  const leftName = isTeamMatch
    ? getTeamName(match.team1)
    : getPlayerName(match.player1);

  const rightName = isTeamMatch
    ? getTeamName(match.team2)
    : getPlayerName(match.player2);

  const winnerName = isTeamMatch
    ? getTeamName(match.winnerTeamId)
    : getPlayerName(match.winnerId);

  const winnerLeft = isTeamMatch
    ? match.winnerTeamId === match.team1
    : match.winnerId === match.player1;

  const winnerRight = isTeamMatch
    ? match.winnerTeamId === match.team2
    : match.winnerId === match.player2;

  const leftImage = isTeamMatch
    ? teams.find((team) => team.id === match.team1)?.logo || ""
    : players.find((player) => player.id === match.player1)?.avatar || "";

  const rightImage = isTeamMatch
    ? teams.find((team) => team.id === match.team2)?.logo || ""
    : players.find((player) => player.id === match.player2)?.avatar || "";

  return {
    leftName,
    rightName,
    winnerName,
    winnerLeft,
    winnerRight,
    leftImage,
    rightImage,
  };
};

const renderBracketMatch = (
  match: Match,
  matchIndex = 0,
  matchesCount = 1,
  showLines = false
) => {
  const {
    leftName,
    rightName,
    winnerName,
    winnerLeft,
    winnerRight,
    leftImage,
    rightImage,
  } = getMatchPreviewData(match);


  
return (
  <div
    key={match.id}
    className={`bracket-match-card ${
      showLines ? "bracket-match-card-lined" : ""
    } ${matchIndex % 2 === 0 ? "bracket-match-even" : "bracket-match-odd"} ${
      matchIndex === matchesCount - 1 ? "bracket-match-last" : ""
    }`}
  >
      <div className="bracket-match-top">
        <span>{match.roundLabel || match.round || "Match"}</span>
        <span>{match.status || "—"}</span>
      </div>

      <div className={`bracket-side ${winnerLeft ? "winner" : ""}`}>
        <div className="bracket-player">
          {leftImage ? (
            <img src={leftImage} alt={leftName} />
          ) : (
            <div className="bracket-avatar-placeholder">
              {leftName.charAt(0) || "L"}
            </div>
          )}
          <span>{leftName}</span>
        </div>
      </div>

      <div className="bracket-score">{match.score || "VS"}</div>

      <div className={`bracket-side ${winnerRight ? "winner" : ""}`}>
        <div className="bracket-player">
          {rightImage ? (
            <img src={rightImage} alt={rightName} />
          ) : (
            <div className="bracket-avatar-placeholder">
              {rightName.charAt(0) || "R"}
            </div>
          )}
          <span>{rightName}</span>
        </div>
      </div>

      {winnerName !== "—" ? (
        <div className="bracket-winner">Winner: {winnerName}</div>
      ) : null}
    </div>
  );
};

const renderBracketSeries = (
  seriesMatches: Match[],
  seriesIndex = 0,
  seriesCount = 1,
  showLines = false
) => {
const mainMatch = seriesMatches[seriesMatches.length - 1] || seriesMatches[0];
const seriesId = getSeriesKey(mainMatch);
const activeSeriesResult = activeSeriesResultMap.get(seriesId);

  return (
<div
  key={mainMatch.id}
  data-series-id={seriesId}
  data-next-series-id={mainMatch.nextSeriesId || ""}
onMouseLeave={() => {
  setActiveSeriesId((current) => (current === null ? current : null));
  setActiveParticipantId((current) => (current === 0 ? current : 0));
}}
className={`bracket-match-card bracket-series-card ${
  activeSeriesResult === "win"
    ? "bracket-series-active bracket-series-path-win"
    : activeSeriesResult === "loss"
    ? "bracket-series-path-loss"
    : activeSeriesResult === "draw"
    ? "bracket-series-path-draw"
    : ""
} ${
  mainMatch.status === "completed" &&
  (mainMatch.winnerId || mainMatch.winnerTeamId)
    ? "bracket-series-completed"
    : ""
} ${seriesMatches.length > 1 ? "bracket-series-multi" : ""}`}
>
      <div className="bracket-match-top">
        <span>{mainMatch.roundLabel || mainMatch.round || "Series"}</span>
        <span>{mainMatch.status || "—"}</span>
      </div>

{seriesMatches.map((match) => {
  const {
    leftName,
    rightName,
    winnerName,
    winnerLeft,
    winnerRight,
    leftImage,
    rightImage,
  } = getMatchPreviewData(match);

  const leftParticipantId =
    match.matchType === "team"
      ? Number(match.team1 || 0)
      : Number(match.player1 || 0);

  const rightParticipantId =
    match.matchType === "team"
      ? Number(match.team2 || 0)
      : Number(match.player2 || 0);

  return (
          <div key={match.id} className="bracket-series-game">
<div
onMouseEnter={() => {
  setActiveSeriesId((current) => (current === seriesId ? current : seriesId));
  setActiveParticipantId((current) =>
    current === leftParticipantId ? current : leftParticipantId
  );
}}
  className={`bracket-side ${winnerLeft ? "winner" : ""} ${
activeParticipantId === leftParticipantId
  ? winnerLeft
    ? "bracket-side-hover-win"
    : winnerName !== "—"
    ? "bracket-side-hover-loss"
    : "bracket-side-hover-draw"
      : ""
  }`}
>
              <div className="bracket-player">
                {leftImage ? (
                  <img src={leftImage} alt={leftName} />
                ) : (
                  <div className="bracket-avatar-placeholder">
                    {leftName.charAt(0) || "L"}
                  </div>
                )}
                <span>{leftName}</span>
              </div>
            </div>

            <div className="bracket-score">{match.score || "VS"}</div>

<div
onMouseEnter={() => {
  setActiveSeriesId((current) => (current === seriesId ? current : seriesId));
  setActiveParticipantId((current) =>
    current === rightParticipantId ? current : rightParticipantId
  );
}}
className={`bracket-side ${winnerRight ? "winner" : ""} ${
  activeParticipantId === rightParticipantId
    ? winnerRight
      ? "bracket-side-hover-win"
      : winnerName !== "—"
      ? "bracket-side-hover-loss"
      : "bracket-side-hover-draw"
    : ""
}`}
>
              <div className="bracket-player">
                {rightImage ? (
                  <img src={rightImage} alt={rightName} />
                ) : (
                  <div className="bracket-avatar-placeholder">
                    {rightName.charAt(0) || "R"}
                  </div>
                )}
                <span>{rightName}</span>
              </div>
            </div>

            {winnerName !== "—" ? (
              <div className="bracket-winner">Winner: {winnerName}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

  return (
    <div className="panel">
      <div className="row-between">
        <h2 className="panel-title">Tournaments and history</h2>

        {selectedTournament ? (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setSelectedTournamentId(null)}
          >
            Back to list
          </button>
        ) : null}
      </div>

      {!selectedTournament ? (
        <div className="tour-grid">
          {[...tournaments]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((tournament) => (
              <button
                key={tournament.id}
                type="button"
                className="simple-card tournament-card-button tournament-history-card"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty(
                    "--x",
                    `${e.clientX - rect.left}px`
                  );
                  e.currentTarget.style.setProperty(
                    "--y",
                    `${e.clientY - rect.top}px`
                  );
                }}
                onClick={() => setSelectedTournamentId(tournament.id)}
                style={
                  tournament.imageUrl
                    ? {
                        backgroundImage: `linear-gradient(rgba(7, 9, 13, 0.52), rgba(7, 9, 13, 0.86)), url(${tournament.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }
                    : undefined
                }
              >
                <div className="tournament-history-overlay">
                  <div className="tournament-history-top">
                    <div className="tournament-history-head">
                      <div className="tournament-history-title">
                        {tournament.title}
                      </div>

                      <div className="tournament-history-subtitle">
                        <span className="history-meta-pill">
                          {tournament.game || "—"}
                        </span>
                        <span className="history-meta-pill">
                          {tournament.type || "—"}
                        </span>
                        {tournament.format ? (
                          <span className="history-meta-pill">
                            {tournament.format}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <span className="pill light tournament-history-prize">
                      {tournament.prize || "No prize"}
                    </span>
                  </div>

                  <div className="tournament-history-info-grid">
                    <div
                      className="tournament-history-info-card"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
                      <span className="tournament-history-label">Date</span>
                      <span className="tournament-history-value">
                        {tournament.date || "—"}
                      </span>
                    </div>

                    <div
                      className="tournament-history-info-card"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
                      <span className="tournament-history-label">Winner</span>
                      <span className="tournament-history-value">
                        {getTournamentWinnerName(tournament)}
                      </span>
                    </div>

                    <div
                      className="tournament-history-info-card"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
                      <span className="tournament-history-label">MVP</span>
                      <span className="tournament-history-value">
                        {getPlayerName(tournament.mvpId)}
                      </span>
                    </div>

                    <div
                      className="tournament-history-info-card"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
                      <span className="tournament-history-label">
                        Participants
                      </span>
                      <span className="tournament-history-value">
                        {Array.isArray(tournament.participantIds)
                          ? tournament.participantIds.length
                          : 0}
                      </span>
                    </div>
                  </div>

                  <div className="tournament-card-footer upgraded">
                    <span className="tournament-open-pill">
                      Open tournament
                    </span>
                  </div>
                </div>
              </button>
            ))}
        </div>
      ) : (
        <div className="tournament-public-view">
          <div
            className="tournament-hero"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty(
                "--x",
                `${e.clientX - rect.left}px`
              );
              e.currentTarget.style.setProperty(
                "--y",
                `${e.clientY - rect.top}px`
              );
            }}
            style={
              selectedTournament.imageUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(7, 9, 13, 0.78), rgba(7, 9, 13, 0.88)), url(${selectedTournament.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }
                : undefined
            }
          >
            <div className="tournament-hero-main">
              <div className="tournament-hero-label">Tournament</div>
              <h1 className="tournament-hero-title">
                {selectedTournament.title}
              </h1>

              <div className="tournament-hero-subtitle">
                <span>{selectedTournament.game}</span>
                <span>•</span>
                <span>{selectedTournament.type}</span>
                {selectedTournament.format ? (
                  <>
                    <span>•</span>
                    <span>{selectedTournament.format}</span>
                  </>
                ) : null}
              </div>

              {selectedTournament.description ? (
                <p className="tournament-hero-description">
                  {selectedTournament.description}
                </p>
              ) : null}
            </div>

            <div className="tournament-hero-side">
              <div
                className="tournament-stat-card"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty(
                    "--x",
                    `${e.clientX - rect.left}px`
                  );
                  e.currentTarget.style.setProperty(
                    "--y",
                    `${e.clientY - rect.top}px`
                  );
                }}
              >
                <div className="muted small">Status</div>
                <div className="achievement-title">
                  {selectedTournament.status || "—"}
                </div>
              </div>

              <div
                className="tournament-stat-card"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty(
                    "--x",
                    `${e.clientX - rect.left}px`
                  );
                  e.currentTarget.style.setProperty(
                    "--y",
                    `${e.clientY - rect.top}px`
                  );
                }}
              >
                <div className="muted small">Date</div>
                <div className="achievement-title">
                  {selectedTournament.date || "—"}
                </div>
              </div>

              <div
                className="tournament-stat-card"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty(
                    "--x",
                    `${e.clientX - rect.left}px`
                  );
                  e.currentTarget.style.setProperty(
                    "--y",
                    `${e.clientY - rect.top}px`
                  );
                }}
              >
                <div className="muted small">Prize</div>
                <div className="achievement-title">
                  {selectedTournament.prize || "—"}
                </div>
              </div>

              <div
                className="tournament-stat-card"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty(
                    "--x",
                    `${e.clientX - rect.left}px`
                  );
                  e.currentTarget.style.setProperty(
                    "--y",
                    `${e.clientY - rect.top}px`
                  );
                }}
              >
                <div className="muted small">Participants</div>
                <div className="achievement-title">
                  {selectedParticipants.length}
                </div>
              </div>
            </div>
          </div>

          {selectedTournament.imageUrl ? (
            <div className="simple-card tournament-section tournament-cover-section">
              <div className="achievement-title">Tournament cover</div>

              <img
                src={selectedTournament.imageUrl}
                alt={selectedTournament.title}
                className="tournament-cover-image"
              />
            </div>
          ) : null}

          <div className="tournament-sections-grid">
            <div
              className="simple-card tournament-section"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--x",
                  `${e.clientX - rect.left}px`
                );
                e.currentTarget.style.setProperty(
                  "--y",
                  `${e.clientY - rect.top}px`
                );
              }}
            >
              <div className="achievement-title">Tournament overview</div>

              <div className="tournament-overview-grid">
                <div
                  className="overview-stat-card game"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Game</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.game || "—"}
                  </strong>
                </div>

                <div
                  className="overview-stat-card type"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Type</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.type || "—"}
                  </strong>
                </div>

                <div
                  className="overview-stat-card format"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Format</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.format || "—"}
                  </strong>
                </div>

                <div
                  className="overview-stat-card status"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Status</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.status || "—"}
                  </strong>
                </div>

                <div
                  className="overview-stat-card date"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Date</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.date || "—"}
                  </strong>
                </div>

                <div
                  className="overview-stat-card prize"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${e.clientY - rect.top}px`
                    );
                  }}
                >
                  <span className="overview-stat-label">Prize</span>
                  <strong className="overview-stat-value">
                    {selectedTournament.prize || "—"}
                  </strong>
                </div>
              </div>
            </div>

            <div
              className="simple-card tournament-section"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--x",
                  `${e.clientX - rect.left}px`
                );
                e.currentTarget.style.setProperty(
                  "--y",
                  `${e.clientY - rect.top}px`
                );
              }}
            >
              <div className="achievement-title">Results</div>

              {(() => {
                const winnerName = getTournamentWinnerName(selectedTournament);

                const winnerImage =
                  getTournamentWinnerImage(selectedTournament);

                const mvpName = getPlayerName(selectedTournament.mvpId);

                const mvpPlayer = players.find(
                  (player) => player.id === selectedTournament.mvpId
                );

                const mvpImage = mvpPlayer?.avatar || "";

                return (
                  <div className="results-block-upgraded">
                    <div
                      className="results-winner-card results-winner-card-shimmer"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--x",
                          `${e.clientX - rect.left}px`
                        );
                        e.currentTarget.style.setProperty(
                          "--y",
                          `${e.clientY - rect.top}px`
                        );
                      }}
                    >
                      <div className="results-winner-head">
                        {winnerImage ? (
                          <img
                            src={winnerImage}
                            alt={winnerName}
                            className="results-winner-avatar"
                          />
                        ) : (
                          <div className="results-winner-avatar-placeholder">
                            {winnerName.charAt(0) || "W"}
                          </div>
                        )}

                        <div className="results-winner-text">
                          <div className="results-label">Champion</div>
                          <div className="results-winner-name">
                            {winnerName}
                          </div>
                        </div>
                      </div>
                    </div>

                    {mvpName !== "—" ? (
                      <div
                        className="mvp-card"
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          e.currentTarget.style.setProperty(
                            "--x",
                            `${e.clientX - rect.left}px`
                          );
                          e.currentTarget.style.setProperty(
                            "--y",
                            `${e.clientY - rect.top}px`
                          );
                        }}
                      >
                        <div className="mvp-left">
                          {(() => {
                            const mvpPlayer = players.find(
                              (player) => player.id === selectedTournament.mvpId
                            );

                            return mvpPlayer?.avatar ? (
                              <img
                                src={mvpPlayer.avatar}
                                alt={mvpName}
                                className="mvp-avatar"
                              />
                            ) : (
                              <div className="mvp-avatar-placeholder">
                                {mvpName.charAt(0) || "M"}
                              </div>
                            );
                          })()}

                          <div className="mvp-text">
                            <div className="mvp-label">MVP</div>
                            <div className="mvp-name">{mvpName}</div>
                          </div>
                        </div>

                        <div className="mvp-badge">★</div>
                      </div>
                    ) : null}

                    {selectedPlacements.length > 0 ? (
                      <div className="results-placements-grid">
                        {selectedPlacements
                          .sort((a, b) => a.place - b.place)
                          .filter((entry) => entry.place !== 1)
                          .map((entry) => {
                            const placementClass =
                              entry.place === 2
                                ? "results-placement-silver"
                                : entry.place === 3
                                ? "results-placement-bronze"
                                : "results-placement-default";

                            return (
                              <div
                                key={`${selectedTournament.id}-${entry.place}-${entry.entityId}`}
                                className={`results-placement-card ${placementClass}`}
                                onMouseMove={(e) => {
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  e.currentTarget.style.setProperty(
                                    "--x",
                                    `${e.clientX - rect.left}px`
                                  );
                                  e.currentTarget.style.setProperty(
                                    "--y",
                                    `${e.clientY - rect.top}px`
                                  );
                                }}
                              >
                                <div className="results-placement-place">
                                  #{entry.place}
                                </div>
                                <div className="results-placement-name">
                                  {entry.entityName}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="results-empty-state">
                        Placements have not been added yet.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div
              className="simple-card tournament-section tournament-section-full"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--x",
                  `${e.clientX - rect.left}px`
                );
                e.currentTarget.style.setProperty(
                  "--y",
                  `${e.clientY - rect.top}px`
                );
              }}
            >
<div className="achievement-title">Tournament structure</div>

{selectedMatches.length > 0 || Object.keys(groupedMatches).length > 0 ? (
  <div className="tournament-bracket-layout">
    {shouldShowGroups && Object.keys(groupedMatches).length > 0 ? (
      <div className="bracket-block">
        <div className="bracket-block-head">
          <span>
            {tournamentFormat === "groups_only"
              ? "Group stage standings"
              : "Group stage"}
          </span>
          <small>{groupMatches.length} matches</small>
        </div>

        <div className="bracket-groups-grid">
          {Object.entries(groupedMatches).map(([groupName, groupItems]) => (
<div key={groupName} className="bracket-group-card">
  <div className="bracket-group-title">{groupName}</div>

  <div className="group-standings-table">
    <div className="group-standings-row group-standings-head">
      <span>#</span>
      <span>Participant</span>
      <span>P</span>
      <span>W</span>
      <span>L</span>
      <span>Pts</span>
    </div>

{(groupStandings[groupName] || []).map((row, index) => (
  <div key={row.id} className="group-standings-row">
    <span>{index + 1}</span>

    <span className="group-standings-participant">
      {row.image ? (
        <img src={row.image} alt={row.name} />
      ) : (
        <span className="group-standings-avatar-fallback">
          {row.name.charAt(0)}
        </span>
      )}
      <span>{row.name}</span>
    </span>

    <span>{row.played}</span>
    <span>{row.wins}</span>
    <span>{row.losses}</span>
    <span>{row.points}</span>
  </div>
))}
  </div>

  <div className="bracket-group-matches">
    {groupItems.map((match) => renderBracketMatch(match))}
  </div>
</div>
          ))}
        </div>
      </div>
    ) : null}

    {shouldShowPlayoff &&
    (playoffMatches.length > 0 || finalMatches.length > 0) ? (
      <div className="bracket-block">
<div className="bracket-block-head bracket-block-head-stacked">
  <span>Playoff bracket</span>
  <small>{playoffMatches.length + finalMatches.length} matches</small>
</div>

        <div className="bracket-scroll">
          <div className="bracket-columns" ref={bracketRef}>
            <svg className="bracket-svg-lines">
{bracketLines.map((line) => {
const fromResult = activeSeriesResultMap.get(line.fromId);
const toResult = activeSeriesResultMap.get(line.toId);

const isWinLine = fromResult === "win" && toResult === "win";
const isLossLine = fromResult === "win" && toResult === "loss";
const isDrawLine = fromResult === "draw" || toResult === "draw";

return (
  <path
    key={line.id}
    d={line.path}
className={
  isLossLine
    ? "bracket-line-loss"
    : isWinLine
    ? "bracket-line-active"
    : isDrawLine
    ? "bracket-line-draw"
    : ""
}
  />
);
})}
            </svg>

            {playoffRoundSeries.map(({ roundName, series }) => (
              <div key={roundName} className="bracket-column">
                <div className="bracket-column-title">{roundName}</div>

                <div className="bracket-column-matches">
                  {series.map((seriesMatches, seriesIndex) =>
                    renderBracketSeries(
                      seriesMatches,
                      seriesIndex,
                      series.length,
                      false
                    )
                  )}
                </div>
              </div>
            ))}

            {finalMatches.length > 0 ? (
              <div className="bracket-column bracket-column-final">
                <div className="bracket-column-title">Final</div>

                <div className="bracket-column-matches">
                  {finalSeries.map((seriesMatches, seriesIndex) =>
                    renderBracketSeries(
                      seriesMatches,
                      seriesIndex,
                      finalSeries.length,
                      false
                    )
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ) : null}

    {otherMatches.length > 0 ? (
      <div className="bracket-block">
        <div className="bracket-block-head">
          <span>Other matches</span>
          <small>{otherMatches.length} matches</small>
        </div>

        <div className="bracket-groups-grid">
          {otherMatches.map((match) => renderBracketMatch(match))}
        </div>
      </div>
    ) : null}
  </div>
) : (
  <div className="muted small">No matches added yet.</div>
)}

              {selectedParticipants.length > 0 ? (
                <div className="tournament-participants">
                  {selectedTournament?.participantType === "team"
                    ? selectedParticipants.map((participant) => {
                        const team = teams.find(
                          (item) => item.id === participant.id
                        );
                        const isWinner =
                          selectedTournament.participantType === "squad"
                            ? getSquadWinnerIds(selectedTournament).includes(
                                participant.id
                              )
                            : selectedTournament.winnerId === participant.id;

                        return (
                          <div
                            key={participant.id}
                            className={`participant-card ${
                              isWinner ? "participant-card-winner" : ""
                            }`}
                            onMouseMove={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              e.currentTarget.style.setProperty(
                                "--x",
                                `${e.clientX - rect.left}px`
                              );
                              e.currentTarget.style.setProperty(
                                "--y",
                                `${e.clientY - rect.top}px`
                              );
                            }}
                          >
                            <div className="participant-card-head">
                              {participant.image ? (
                                <img
                                  src={participant.image}
                                  alt={participant.name}
                                  className="participant-avatar"
                                />
                              ) : (
                                <div className="participant-avatar-placeholder">
                                  {participant.name.charAt(0) || "T"}
                                </div>
                              )}

                              <div className="participant-head-content">
                                <div className="participant-title-row">
                                  <div className="achievement-title">
                                    {participant.name}
                                  </div>

                                  {isWinner ? (
                                    <span className="participant-winner-badge">
                                      Winner
                                    </span>
                                  ) : null}
                                </div>

                                <div className="muted small">Team profile</div>
                              </div>
                            </div>

                            <div className="participant-stats-grid">
                              <div className="participant-stat-box">
                                <span className="muted">Wins</span>
                                <strong>{team?.wins ?? 0}</strong>
                              </div>

                              <div className="participant-stat-box">
                                <span className="muted">Earnings</span>
                                <strong>{team?.earnings ?? 0}</strong>
                              </div>

                              <div className="participant-stat-box">
                                <span className="muted">Players</span>
                                <strong>{team?.players?.length ?? 0}</strong>
                              </div>
                            </div>

                            <div className="participant-roster">
                              <div className="participant-roster-label">
                                Roster
                              </div>

                              {team?.players?.length ? (
                                <div className="participant-roster-list">
                                  {team.players.map((playerId) => {
                                    const rosterPlayer = players.find(
                                      (item) => item.id === playerId
                                    );

                                    return (
                                      <div
                                        key={`${participant.id}-${playerId}`}
                                        className="participant-roster-item"
                                      >
                                        {rosterPlayer?.avatar ? (
                                          <img
                                            src={rosterPlayer.avatar}
                                            alt={
                                              rosterPlayer.nickname || "Player"
                                            }
                                            className="participant-roster-avatar"
                                          />
                                        ) : (
                                          <div className="participant-roster-avatar-placeholder">
                                            {rosterPlayer?.nickname?.charAt(
                                              0
                                            ) || "P"}
                                          </div>
                                        )}

                                        <span className="participant-roster-name">
                                          {rosterPlayer?.nickname || "Unknown"}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="participant-roster-empty">
                                  No players in roster
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    : selectedParticipants.map((participant) => {
                        const player = players.find(
                          (item) => item.id === participant.id
                        );
                        const isWinner =
                          selectedTournament.participantType === "squad"
                            ? Array.isArray(
                                selectedTournament.winnerSquadIds
                              ) &&
                              selectedTournament.winnerSquadIds.includes(
                                participant.id
                              )
                            : selectedTournament.winnerId === participant.id;

                        return (
                          <div
                            key={participant.id}
                            className={`participant-card ${
                              isWinner ? "participant-card-winner" : ""
                            }`}
                            onMouseMove={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              e.currentTarget.style.setProperty(
                                "--x",
                                `${e.clientX - rect.left}px`
                              );
                              e.currentTarget.style.setProperty(
                                "--y",
                                `${e.clientY - rect.top}px`
                              );
                            }}
                          >
                            <div className="participant-card-head">
                              {participant.image ? (
                                <img
                                  src={participant.image}
                                  alt={participant.name}
                                  className="participant-avatar"
                                />
                              ) : (
                                <div className="participant-avatar-placeholder">
                                  {participant.name.charAt(0) || "P"}
                                </div>
                              )}

                              <div className="participant-head-content">
                                <div className="participant-title-row">
                                  <div className="achievement-title">
                                    {participant.name}
                                  </div>

                                  {isWinner ? (
                                    <span className="participant-winner-badge">
                                      Winner
                                    </span>
                                  ) : null}
                                </div>

                                <div className="muted small">
                                  Player profile
                                </div>
                              </div>
                            </div>

                            <div className="participant-stats-grid">
                              <div className="participant-stat-box">
                                <span className="muted">Wins</span>
                                <strong>{player?.wins ?? 0}</strong>
                              </div>

                              <div className="participant-stat-box">
                                <span className="muted">Losses</span>
                                <strong>{player?.losses ?? 0}</strong>
                              </div>

                              <div className="participant-stat-box">
                                <span className="muted">ELO</span>
                                <strong>{player?.elo ?? 0}</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                </div>
              ) : (
                <div className="muted small">No participants added yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
