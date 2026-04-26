import { TabKey } from "../types";
import { Lang, t } from "../utils/translations";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  showAdmin?: boolean;
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

export default function Tabs({
  active,
  onChange,
  showAdmin = false,
  lang,
}: Props) {
  const tabs: TabKey[] = showAdmin ? [...baseTabs, "admin"] : baseTabs;
  const text = t[lang] || t.en;

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`tab-btn ${active === tab ? "tab-btn-active" : ""}`}
          onClick={() => onChange(tab)}
        >
          {text.nav[tab]}
        </button>
      ))}
    </div>
  );
}