import {
  ChangeEvent,
  Dispatch,
  ReactElement,
  SetStateAction,
} from "react";
import { HomeAnnouncement, Player, Team, Tournament } from "../../types";

type HomeAnnouncementForm = HomeAnnouncement;

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

type Props = {
  adminText: Record<string, string>;
  PremiumSelect: (props: PremiumSelectProps) => ReactElement;
  players: Player[];
  teams: Team[];
  tournaments: Tournament[];
  homeAnnouncementForm: HomeAnnouncementForm;
  setHomeAnnouncementForm: Dispatch<SetStateAction<HomeAnnouncementForm>>;
  saveHomeAnnouncement: () => void;
  handleHomeAnnouncementImageChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
};

export default function AdminGeneral(props: Props) {
  const {
    adminText,
    PremiumSelect,
    players,
    teams,
    tournaments,
    homeAnnouncementForm,
    setHomeAnnouncementForm,
    saveHomeAnnouncement,
    handleHomeAnnouncementImageChange,
  } = props;

  return (
      <div id="admin-section-general" className="two-col reverse">
        <div className="panel">
          <h2 className="panel-title">{adminText.homeAnnouncement}</h2>

          <div className="form-col">
            <div className="field-block">
              <label className="field-label">{adminText.title}</label>
              <input
                className="input"
                placeholder={adminText.tournamentTitlePlaceholder}
                value={homeAnnouncementForm.title}
                onChange={(e) =>
                  setHomeAnnouncementForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.subtitle}</label>
              <input
                className="input"
                placeholder={adminText.subtitlePlaceholder}
                value={homeAnnouncementForm.subtitle}
                onChange={(e) =>
                  setHomeAnnouncementForm((prev) => ({
                    ...prev,
                    subtitle: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.bannerImageUrl}</label>
              <input
                className="input"
                type="text"
                placeholder={adminText.imageUrlPlaceholder}
                value={homeAnnouncementForm.imageUrl || ""}
                onChange={handleHomeAnnouncementImageChange}
              />

              {homeAnnouncementForm.imageUrl ? (
                <img
                  src={homeAnnouncementForm.imageUrl}
                  alt={adminText.homeBannerPreviewAlt}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
              ) : null}
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">{adminText.date}</label>
                <input
                  className="input"
                  type="date"
                  value={homeAnnouncementForm.date}
                  onChange={(e) =>
                    setHomeAnnouncementForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>

<div className="field-block">
  <label className="field-label">{adminText.participantsCount}</label>
  <input
    className="input"
    type="number"
    min={0}
    value={homeAnnouncementForm.participantCount}
    onChange={(e) =>
      setHomeAnnouncementForm((prev) => ({
        ...prev,
        participantCount: Number(e.target.value),
      }))
    }
  />
</div>

<div className="field-block">
  <label className="field-label">{adminText.participantType}</label>
  <PremiumSelect
    value={homeAnnouncementForm.participantLabelType || "players"}
    placeholder={adminText.playersOption}
    options={[
      { value: "players", label: adminText.playersOption },
      { value: "teams", label: adminText.teamsOption },
    ]}
    onChange={(value) =>
      setHomeAnnouncementForm((prev) => ({
        ...prev,
        participantLabelType: value as "players" | "teams",
      }))
    }
  />
</div>
            </div>

            <div className="form-grid two">
              <div className="field-block">
                <label className="field-label">{adminText.format}</label>
                <input
                  className="input"
                  placeholder={adminText.format}
                  value={homeAnnouncementForm.format}
                  onChange={(e) =>
                    setHomeAnnouncementForm((prev) => ({
                      ...prev,
                      format: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-block">
                <label className="field-label">{adminText.status}</label>
                <input
                  className="input"
                  placeholder={adminText.statusPlaceholder}
                  value={homeAnnouncementForm.status}
                  onChange={(e) =>
                    setHomeAnnouncementForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.prize}</label>
              <input
                className="input"
                placeholder={adminText.prize}
                value={homeAnnouncementForm.prize}
                onChange={(e) =>
                  setHomeAnnouncementForm((prev) => ({
                    ...prev,
                    prize: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.linkedTournament}</label>
              <PremiumSelect
                value={homeAnnouncementForm.tournamentId || 0}
                placeholder={adminText.noLinkedTournament}
                options={[...tournaments]
                  .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id))
                  .map((tournament) => ({
                    value: tournament.id,
                    label: tournament.title || adminText.tournamentFallback,
                  }))}
                onChange={(value) =>
                  setHomeAnnouncementForm((prev) => ({
                    ...prev,
                    tournamentId: Number(value) > 0 ? Number(value) : undefined,
                  }))
                }
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.description}</label>
              <textarea
                className="input textarea"
                placeholder={adminText.announcementDescriptionPlaceholder}
                value={homeAnnouncementForm.description}
                onChange={(e) =>
                  setHomeAnnouncementForm((prev) => ({
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
                  checked={Boolean(homeAnnouncementForm.isVisible)}
                  onChange={(e) =>
                    setHomeAnnouncementForm((prev) => ({
                      ...prev,
                      isVisible: e.target.checked,
                    }))
                  }
                />
                <span>{adminText.showOnHome}</span>
              </label>
            </div>

            <div className="btn-row">
              <button className="primary-btn" onClick={saveHomeAnnouncement}>
                {adminText.saveHomeAnnouncement}
              </button>
            </div>
          </div>
        </div>
      </div>

  );
}
