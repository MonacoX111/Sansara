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
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`tab-btn ${active === tab ? "tab-btn-active" : ""}`}
          onClick={() => onChange(tab)}
        >
          {navText[tab] || "My Profile"}
        </button>
      ))}
    </div>
  );
}
