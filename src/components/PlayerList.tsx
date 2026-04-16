import { Player } from "../types";

type Props = {
  players: Player[];
  onSelect: (player: Player) => void;
};

export default function PlayerList({ players, onSelect }: Props) {
  return (
    <div className="card">
      <h2>Players</h2>

      {players.map((p) => (
        <div key={p.id} onClick={() => onSelect(p)} className="item">
          {p.nickname} ({p.elo})
        </div>
      ))}
    </div>
  );
}
