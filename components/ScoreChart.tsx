import type { ChartModel } from "@/lib/types";

const width = 640;
const height = 240;
const pad = 12;

function yOf(value: number, yMin: number, yMax: number): number {
  const span = yMax - yMin || 1;
  return pad + (1 - (value - yMin) / span) * (height - pad * 2);
}

function xOf(index: number, count: number): number {
  if (count <= 1) return width / 2;
  return pad + (index / (count - 1)) * (width - pad * 2);
}

function linePath(values: number[], yMin: number, yMax: number): string {
  if (values.length === 0) return "";
  return values
    .map((value, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${xOf(index, values.length).toFixed(1)} ${yOf(value, yMin, yMax).toFixed(1)}`;
    })
    .join(" ");
}

function ticks(yMin: number, yMax: number): number[] {
  const span = yMax - yMin;
  const step = span <= 20 ? 5 : span <= 50 ? 10 : 20;
  const start = Math.ceil(yMin / step) * step;
  const values: number[] = [];
  for (let value = start; value <= yMax; value += step) values.push(value);
  if (values.length < 2) return [yMax, yMin];
  return values.reverse();
}

export function ScoreChart({ chart }: { chart: ChartModel }) {
  const yTicks = ticks(chart.yMin, chart.yMax);
  const extra = chart.series[0]?.key ?? "quality";
  const targetY = chart.target == null ? yOf(chart.yMax, chart.yMin, chart.yMax) : yOf(chart.target, chart.yMin, chart.yMax);

  return (
    <div className="chart-layout">
      <div className="y-axis" aria-hidden="true">
        {yTicks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <div className="chart-main">
        <svg data-testid="score-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Score over time">
          <path data-series="composite" d={linePath(chart.composite, chart.yMin, chart.yMax)} fill="none" stroke="#5CD68C" strokeWidth="2.5" />
          {chart.series.map((series) => (
            <path
              key={series.key}
              data-series={series.key}
              d={linePath(series.values, chart.yMin, chart.yMax)}
              fill="none"
              stroke={series.color}
              strokeWidth="1.5"
            />
          ))}
          {chart.series.length === 0 ? <path data-series={extra} d="" fill="none" /> : null}
          <line data-target-line="" x1={pad} x2={width - pad} y1={targetY} y2={targetY} stroke="#8C97A4" strokeDasharray="4 4" strokeWidth="1" />
          {chart.composite.map((value, index) => {
            const href = chart.pointHrefs?.[index];
            const cx = xOf(index, chart.composite.length);
            const cy = yOf(value, chart.yMin, chart.yMax);
            const dot = <circle cx={cx} cy={cy} r={index === chart.composite.length - 1 ? 4 : 2.2} fill="#5CD68C" />;
            return href ? (
              <a key={href} href={href}>
                {dot}
              </a>
            ) : (
              <g key={index}>{dot}</g>
            );
          })}
        </svg>
        <div className="x-axis">
          {chart.tickLabels.map((tick) => (
            <span
              key={`${tick.text}-${tick.index}`}
              style={{ left: `${Math.min(92, Math.max(8, (xOf(tick.index, Math.max(chart.composite.length, 1)) / width) * 100))}%` }}
            >
              {tick.text}
            </span>
          ))}
        </div>
        <ul className="legend">
          <li>
            <i className="swatch" style={{ background: "#5CD68C" }} /> Quality (score)
          </li>
          {chart.series.map((series) => (
            <li key={series.key}>
              <i className="swatch" style={{ background: series.color }} /> {series.label}
            </li>
          ))}
          <li>
            <i className="swatch swatch-dash" /> Target
          </li>
        </ul>
      </div>
    </div>
  );
}
