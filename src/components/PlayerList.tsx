import { Player } from "../types";
import { Lang, t } from "../utils/translations";

type Props = {
  players: Player[];
  onSelect: (player: Player) => void;
  lang?: Lang;
};

export default function PlayerList({ players, onSelect, lang = "en" }: Props) {
  const text = t[lang] || t.en;

  return (
    <div className="card">
      <h2>{text.playersPage.directory}</h2>

      {players.map((p) => (
        <div key={p.id} onClick={() => onSelect(p)} className="item">
          {p.nickname} ({p.elo})
        </div>
      ))}
    </div>
  );
}
