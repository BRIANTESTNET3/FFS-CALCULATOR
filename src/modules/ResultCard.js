export default function ResultCard({ pass, rerate, title, subtitle, metrics }) {
  const cls = pass ? 'r-pass' : rerate ? 'r-rerate' : 'r-fail';
  const icon = pass ? '✓' : rerate ? '⚠' : '✗';
  return (
    <div className={cls}>
      <div className={`r-title ${pass?'pass':rerate?'rerate':'fail'}`}>{icon} {title}</div>
      <div className={`r-sub ${pass?'pass':rerate?'rerate':'fail'}`}>{subtitle}</div>
      <div className="metrics">
        {metrics.map((m,i) => (
          <div key={i} className="metric">
            <div className="mlb">{m.label}</div>
            <div className="mvl">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
