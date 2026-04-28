import type { MouseEvent } from "react";

const spotlightSelector = [
  ".player-card",
  ".simple-card",
  ".button-card",
  ".primary-btn",
  ".secondary-btn",
  ".danger-btn",
  ".ghost-btn",
  ".tab-btn",
  ".admin-create-btn",
  ".admin-quick-nav-btn",
  ".picker-btn",
  ".checkbox-label",
  ".admin-premium-select-trigger",
  ".admin-premium-select-option",
  ".admin-list-btn",
  ".leader-row",
  ".tournament-card-button",
  ".participant-card",
  ".result-card",
  ".match-card",
  ".tournament-match-card",
  ".team-roster-card",
  ".team-history-card",
  ".stat-card",
  ".tournament-stat-card",
  ".overview-stat-card",
  ".results-placement-card",
  ".participant-stat-box",
  ".profile-primary-card",
  ".profile-mini-stat-card",
  ".tournament-history-info-card",
  ".achievement-card",
  ".champion-card",
  ".player-row.new",
  ".home-featured-banner",
  ".welcome-hero",
  ".welcome-preview-card",
  ".welcome-mini-card",
  ".welcome-feature-card",
  ".welcome-nav-card",
  ".welcome-activity-row",
].join(",");

export const handleSpotlightMove = (event: MouseEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty(
    "--x",
    `${event.clientX - rect.left}px`
  );
  event.currentTarget.style.setProperty(
    "--y",
    `${event.clientY - rect.top}px`
  );
};

export const handleSpotlightMoveCapture = (
  event: MouseEvent<HTMLElement>
) => {
  const source = event.target;
  const root = event.currentTarget;

  if (!(source instanceof Element)) return;

  const spotlightTarget = source.closest<HTMLElement>(spotlightSelector);
  if (!spotlightTarget || !root.contains(spotlightTarget)) return;

  const rect = spotlightTarget.getBoundingClientRect();
  spotlightTarget.style.setProperty(
    "--x",
    `${event.clientX - rect.left}px`
  );
  spotlightTarget.style.setProperty(
    "--y",
    `${event.clientY - rect.top}px`
  );
};
