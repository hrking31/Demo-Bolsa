const WIDTH = 96;
const HEIGHT = 32;

// Mini gráfico en SVG. Toma el color del texto (currentColor).
export default function Sparkline({ values, className = "", delay = 0 }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const path = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * WIDTH;
      const y = HEIGHT - 3 - ((v - min) / span) * (HEIGHT - 6);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      className={className}
      aria-hidden="true"
    >
      <path
        d={path}
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="spark-draw"
        style={{ animationDelay: `${delay}ms` }}
      />
    </svg>
  );
}
