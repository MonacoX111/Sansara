import { TabKey } from "../types";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  showAdmin?: boolean;
};

const baseTabs: TabKey[] = [
  "home",
  "players",
  "teams",
  "tournaments",
  "leaderboard",
];

export default function Tabs({ active, onChange, showAdmin = false }: Props) {
  const tabs: TabKey[] = showAdmin ? [...baseTabs, "admin"] : baseTabs;

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`tab-btn ${active === tab ? "tab-btn-active" : ""}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
