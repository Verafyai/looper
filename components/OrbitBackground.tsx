type Dot = { duration: number; delay: number };

type Ring = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
  dots: Dot[];
};

const rings: Ring[] = [
  { cx: 1040, cy: 168, rx: 470, ry: 138, rot: -18, dots: [{ duration: 84, delay: -20 }, { duration: 108, delay: -70 }] },
  { cx: 900, cy: 250, rx: 360, ry: 112, rot: 14, dots: [{ duration: 72, delay: -8 }, { duration: 96, delay: -44 }] },
  { cx: 1160, cy: 120, rx: 230, ry: 72, rot: -28, dots: [{ duration: 120, delay: -16 }] },
];

function ellipsePath(ring: Ring): string {
  const rot = (ring.rot * Math.PI) / 180;
  let path = "";
  const steps = 72;
  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    const x = ring.rx * Math.cos(angle);
    const y = ring.ry * Math.sin(angle);
    const px = ring.cx + x * Math.cos(rot) - y * Math.sin(rot);
    const py = ring.cy + x * Math.sin(rot) + y * Math.cos(rot);
    path += `${index === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)} `;
  }
  return `${path}Z`;
}

const stars = Array.from({ length: 42 }, (_, index) => ({
  cx: (index * 137) % 1440,
  cy: (index * 89) % 560,
  r: index % 4 === 0 ? 1.5 : 0.9,
  opacity: 0.18 + (index % 5) * 0.07,
}));

export function OrbitBackground() {
  return (
    <div data-testid="orbit-bg" className="orbit" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMin slice">
        <defs>
          <radialGradient id="orbit-glow" cx="78%" cy="8%" r="48%">
            <stop offset="0%" stopColor="#1d6a45" stopOpacity="0.45" />
            <stop offset="42%" stopColor="#16324d" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#07090C" stopOpacity="0" />
          </radialGradient>
          <filter id="orbit-dot-glow">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="1440" height="900" fill="url(#orbit-glow)" />
        {stars.map((star) => (
          <circle key={`${star.cx}-${star.cy}`} cx={star.cx} cy={star.cy} r={star.r} fill="#F2F5F8" opacity={star.opacity} />
        ))}
        {rings.map((ring) => {
          const path = ellipsePath(ring);
          return (
            <g key={`${ring.cx}-${ring.cy}`}>
              <path d={path} fill="none" stroke="#5CD68C" strokeOpacity="0.28" strokeWidth="1.2" />
              {ring.dots.map((dot) => (
                <circle
                  key={`${ring.cx}-${dot.duration}`}
                  data-orbit-dot=""
                  r="5"
                  cx="0"
                  cy="0"
                  fill="#5CD68C"
                  filter="url(#orbit-dot-glow)"
                  style={{
                    offsetPath: `path('${path}')`,
                    animationDuration: `${dot.duration}s`,
                    animationDelay: `${dot.delay}s`,
                  }}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="orbit-fade" />
    </div>
  );
}
