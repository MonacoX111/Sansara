import { Dispatch, ReactElement, SetStateAction } from "react";
import { Player, Team } from "../../types";

type PlayerForm = {
  nickname: string;
  fullName: string;
  teamId: number;
  teamHistory: NonNullable<Player["teamHistory"]>;
  games: string;
  wins: number;
  losses: number;
  earnings: number;
  tournamentsWon: number;
  rank: number;
  elo: number;
  bio: string;
  isFeatured: boolean;
  avatar: string;
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

type MultiGamePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

type ConfirmDeleteState = {
  open: boolean;
  type: "player" | "team" | "tournament" | "match" | "achievement" | null;
  achievementId?: number;
};

type Props = {
  adminText: Record<string, string>;
  commonText: Record<string, string>;
  PremiumSelect: (props: PremiumSelectProps) => ReactElement;
  MultiGamePicker: (props: MultiGamePickerProps) => ReactElement;
  setConfirmDelete: Dispatch<SetStateAction<ConfirmDeleteState>>;
  players: Player[];
  teams: Team[];
  selectedPlayerId: number;
  setSelectedPlayerId: (id: number) => void;
  playerForm: PlayerForm;
  setPlayerForm: Dispatch<SetStateAction<PlayerForm>>;
  savePlayer: () => void;
  addPlayer: () => void;
  playerAdminSearch: string;
  setPlayerAdminSearch: Dispatch<SetStateAction<string>>;
  filteredAdminPlayers: Player[];
};

export default function AdminPlayers(props: Props) {
  const {
    adminText,
    commonText,
    PremiumSelect,
    MultiGamePicker,
    setConfirmDelete,
    players,
    teams,
    selectedPlayerId,
    setSelectedPlayerId,
    playerForm,
    setPlayerForm,
    savePlayer,
    addPlayer,
    playerAdminSearch,
    setPlayerAdminSearch,
    filteredAdminPlayers,
  } = props;

  const toggleHistoricalTeam = (teamId: number) => {
    setPlayerForm((prev) => {
      const exists = prev.teamHistory.some((item) => item.teamId === teamId);
      const nextHistory = exists
        ? prev.teamHistory.filter((item) => item.teamId !== teamId)
        : [...prev.teamHistory, { teamId }];

      return {
        ...prev,
        teamHistory: nextHistory.map((item) => ({
          ...item,
          isCurrent: item.teamId === prev.teamId || item.isCurrent,
        })),
      };
    });
  };

  return (
      <div id="admin-section-players" className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">{adminText.players}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.searchPlayer}</label>
              <input
                className="input"
                placeholder={adminText.searchPlaceholder}
                value={playerAdminSearch}
                onChange={(e) => setPlayerAdminSearch(e.target.value)}
              />
            </div>

            <div className="list-col admin-scroll-list">
              <button
                className="secondary-btn add-list-btn admin-create-btn"
                onClick={addPlayer}
              >
                {adminText.addPlayer}
              </button>

              {filteredAdminPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(player.id)}
                  className={`admin-list-btn ${
                    selectedPlayerId === player.id
                      ? "admin-list-btn-active"
                      : ""
                  } ${player.isFeatured ? "admin-list-btn-featured" : ""}`}
                >
                  <span>{player.nickname || adminText.playerFallback}</span>
                  {player.isFeatured ? (
                    <span className="admin-featured-badge">{adminText.featured}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">{adminText.editPlayer}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.nickname}</label>
              <input
                className="input"
                placeholder={adminText.nickname}
                value={playerForm.nickname}
                onChange={(e) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    nickname: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.fullName}</label>
              <input
                className="input"
                placeholder={adminText.fullName}
                value={playerForm.fullName}
                onChange={(e) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.bio}</label>
              <textarea
                className="input textarea"
                placeholder={adminText.bio}
                value={playerForm.bio}
                onChange={(e) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(playerForm.isFeatured)}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      isFeatured: e.target.checked,
                    }))
                  }
                />
                {adminText.featuredPlayer}
              </label>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.team}</label>
              <PremiumSelect
                value={playerForm.teamId}
                placeholder={adminText.noTeam}
                options={teams.map((team) => ({
                  value: team.id,
                  label: team.name,
                }))}
                onChange={(value) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    teamId: Number(value),
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">
                {adminText.teamHistory}
              </label>
              <div className="historical-team-picker">
                {teams.map((team) => (
                  <label key={team.id} className="field-label checkbox-label">
                    <input
                      type="checkbox"
                      checked={playerForm.teamHistory.some(
                        (item) => item.teamId === team.id
                      )}
                      onChange={() => toggleHistoricalTeam(team.id)}
                    />
                    {team.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.games}</label>
              <MultiGamePicker
                value={playerForm.games}
                onChange={(value) =>
                  setPlayerForm((prev) => ({ ...prev, games: value }))
                }
              />
            </div>

            <div className="form-grid">
              <div className="field-block">
                <label className="field-label">{adminText.wins}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.wins}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      wins: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.losses}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.losses}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      losses: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.earnings}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.earnings}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      earnings: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.tournamentsWon}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.tournamentsWon}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      tournamentsWon: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.rank}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.rank}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      rank: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.elo}</label>
                <input
                  className="input"
                  type="number"
                  value={playerForm.elo}
                  onChange={(e) =>
                    setPlayerForm((prev) => ({
                      ...prev,
                      elo: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.avatar}</label>
              <input
                type="text"
                className="input"
                placeholder={adminText.avatarUrlPlaceholder}
                value={playerForm.avatar || ""}
                onChange={(e) =>
                  setPlayerForm((prev) => ({
                    ...prev,
                    avatar: e.target.value,
                  }))
                }
              />

              {playerForm.avatar ? (
                <img
                  src={playerForm.avatar}
                  alt={adminText.avatar}
                  style={{
                    marginTop: 10,
                    width: 88,
                    height: 88,
                    objectFit: "cover",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
              ) : null}
            </div>

<div className="btn-row">
  <button className="primary-btn" onClick={savePlayer}>
    {commonText.save}
  </button>
  <button
    className="danger-btn"
    onClick={() => setConfirmDelete({ open: true, type: "player" })}
  >
    {commonText.delete}
  </button>
</div>
          </div>
        </div>
      </div>

  );
}
