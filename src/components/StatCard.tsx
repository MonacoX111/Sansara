type Props = {
  title: string;
  value: string | number;
  sub?: string;
};

export default function StatCard({ title, value, sub }: Props) {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}
