import { Dispatch, ReactElement, SetStateAction } from "react";
import { Team } from "../../types";

type TeamForm = {
  name: string;
  logo: string;
  games: string;
  wins: number;
  earnings: number;
  description: string;
  isFeatured: boolean;
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
  MultiGamePicker: (props: MultiGamePickerProps) => ReactElement;
  setConfirmDelete: Dispatch<SetStateAction<ConfirmDeleteState>>;
  teams: Team[];
  selectedTeamId: number;
  setSelectedTeamId: (id: number) => void;
  teamForm: TeamForm;
  setTeamForm: Dispatch<SetStateAction<TeamForm>>;
  saveTeam: () => void;
  addTeam: () => void;
};

export default function AdminTeams(props: Props) {
  const {
    adminText,
    commonText,
    MultiGamePicker,
    setConfirmDelete,
    teams,
    selectedTeamId,
    setSelectedTeamId,
    teamForm,
    setTeamForm,
    saveTeam,
    addTeam,
  } = props;

  return (
      <div id="admin-section-teams" className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">{adminText.teams}</h2>

          <div className="list-col admin-scroll-list">
            <button
              className="secondary-btn add-list-btn add-team-btn-top"
              onClick={addTeam}
            >
              {adminText.addTeam}
            </button>

            {[...teams]
              .sort((a, b) => {
                if (a.isFeatured && !b.isFeatured) return -1;
                if (!a.isFeatured && b.isFeatured) return 1;
                return 0;
              })
              .map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`admin-list-btn ${
                    selectedTeamId === team.id ? "admin-list-btn-active" : ""
                  } ${team.isFeatured ? "admin-list-btn-featured" : ""}`}
                >
                  <span>{team.name || adminText.teamFallback}</span>
                  {team.isFeatured ? (
                    <span className="admin-featured-badge">{adminText.featured}</span>
                  ) : null}
                </button>
              ))}
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">{adminText.editTeam}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.name}</label>
              <input
                className="input"
                placeholder={adminText.teamNamePlaceholder}
                value={teamForm.name}
                onChange={(e) =>
                  setTeamForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.games}</label>
              <MultiGamePicker
                value={teamForm.games}
                onChange={(value) =>
                  setTeamForm((prev) => ({ ...prev, games: value }))
                }
              />
            </div>

            <div className="form-grid">
              <div className="field-block">
                <label className="field-label">{adminText.wins}</label>
                <input
                  className="input"
                  type="number"
                  value={teamForm.wins}
                  onChange={(e) =>
                    setTeamForm((prev) => ({
                      ...prev,
                      wins: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.earnings}</label>
                <input
                  className="input"
                  type="number"
                  value={teamForm.earnings}
                  onChange={(e) =>
                    setTeamForm((prev) => ({
                      ...prev,
                      earnings: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.description}</label>
              <textarea
                className="input textarea"
                placeholder={adminText.teamDescriptionPlaceholder}
                value={teamForm.description}
                onChange={(e) =>
                  setTeamForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(teamForm.isFeatured)}
                  onChange={(e) =>
                    setTeamForm((prev) => ({
                      ...prev,
                      isFeatured: e.target.checked,
                    }))
                  }
                />
                {adminText.featuredTeam}
              </label>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.logoUrl}</label>
              <input
                className="input"
                type="text"
                placeholder={adminText.logoUrlPlaceholder}
                value={teamForm.logo}
                onChange={(e) =>
                  setTeamForm((prev) => ({
                    ...prev,
                    logo: e.target.value,
                  }))
                }
              />

              {teamForm.logo ? (
                <img
                  src={teamForm.logo}
                  alt={adminText.teamLogoPreviewAlt}
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
  <button className="primary-btn" onClick={saveTeam}>
    {commonText.save}
  </button>
  <button
    className="danger-btn"
    onClick={() => setConfirmDelete({ open: true, type: "team" })}
  >
    {commonText.delete}
  </button>
</div>
          </div>
        </div>
      </div>

  );
}
