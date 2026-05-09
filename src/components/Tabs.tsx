import { TabKey } from "../types";
import { Lang, t } from "../utils/translations";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  showAdmin?: boolean;
  showMyProfile?: boolean;
  lang: Lang;
};

const baseTabs: TabKey[] = [
  "home",
  "general",
  "players",
  "teams",
  "tournaments",
  "leaderboard",
];

/**
 * Premium cinematic navigation. Component contract is unchanged:
 * `active`, `onChange`, `showAdmin`, `showMyProfile`, `lang` -- callers in
 * App.tsx need no edits. The visual treatment is delivered entirely via
 * the new redesign tokens in `14-redesign-tokens.css` and the dedicated
 * `15-redesign-nav.css` stylesheet.
 *
 * Accessibility: rendered as a semantic <nav role="tablist"> with
 * aria-selected on the active tab so screen readers announce it
 * correctly. Each tab is a real <button> for free keyboard support.
 */
export default function Tabs({
  active,
  onChange,
  showAdmin = false,
  showMyProfile = false,
  lang,
}: Props) {
  const tabs: TabKey[] = [
    ...baseTabs,
    ...(showMyProfile ? (["myProfile"] as TabKey[]) : []),
    ...(showAdmin ? (["admin"] as TabKey[]) : []),
  ];
  const text = t[lang] || t.en;
  const navText = text.nav as Record<string, string>;

  return (
    <nav
      className="rd-nav"
      role="tablist"
      aria-label={navText.primary || "Primary navigation"}
    >
      <div className="rd-nav__inner">
        {tabs.map((tab) => {
          const isActive = active === tab;
          const label = navText[tab] || "My Profile";
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`rd-nav__tab ${isActive ? "is-active" : ""}`}
              data-tab={tab}
              onClick={() => onChange(tab)}
            >
              <span className="rd-nav__dot" aria-hidden="true" />
              <span className="rd-nav__label">{label}</span>
              <span className="rd-nav__indicator" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
