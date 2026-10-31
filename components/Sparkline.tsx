export function Sparkline({ values, target }: { values: number[]; target: number | null }) {
  const width = 132;
  const height = 48;
  const pad = 4;
  const nums = [...values];
  if (target != null) nums.push(target);
  const min = nums.length ? Math.min(...nums) : 0;
  const max = nums.length ? Math.max(...nums) : 1;
  const span = max - min || 1;
  const coords = values.map((value, index) => {
    const x = values.length <= 1 ? width / 2 : pad + (index / (values.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" ");
  const area =
    coords.length > 1
      ? `${line} L${coords[coords.length - 1][0].toFixed(1)} ${height - 2} L${coords[0][0].toFixed(1)} ${height - 2} Z`
      : "";
  const targetY = target == null ? null : pad + (1 - (target - min) / span) * (height - pad * 2);
  const last = coords[coords.length - 1];

  return (
    <svg data-testid="card-sparkline" className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Score trend">
      {area ? <path d={area} fill="rgba(92,214,140,.18)" /> : null}
      {line ? <path d={line} fill="none" stroke="#5CD68C" strokeWidth="2" /> : null}
      {targetY != null ? (
        <line data-target-line="" x1={pad} x2={width - pad} y1={targetY} y2={targetY} stroke="#8C97A4" strokeDasharray="3 3" strokeWidth="1" />
      ) : (
        <line data-target-line="" x1={pad} x2={pad} y1={0} y2={0} stroke="transparent" />
      )}
      {last ? <circle cx={last[0]} cy={last[1]} r="3" fill="#5CD68C" /> : null}
    </svg>
  );
}
