/**
 * SVG sparkline chart for inline trend visualization.
 * @param {number[]} data - Array of numeric values
 * @param {number} width - SVG width (default 60)
 * @param {number} height - SVG height (default 20)
 * @param {string} color - Stroke color (default team highlight)
 * @param {boolean} showDots - Show dots on data points
 */
export default function Sparkline({
  data = [],
  width = 60,
  height = 20,
  color = 'var(--team-highlight)',
  showDots = false,
}) {
  if (!data?.length || data.length < 2) return null;

  const values = data.map((v) => (typeof v === 'number' ? v : parseFloat(v) || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * innerW;
    const y = padding + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Trend: compare last value to first
  const isUp = values[values.length - 1] > values[0];
  const trendColor = color === 'auto'
    ? (isUp ? '#22c55e' : '#ef4444')
    : color;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle"
    >
      <path
        d={pathD}
        fill="none"
        stroke={trendColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 2 : 1}
          fill={i === points.length - 1 ? trendColor : 'transparent'}
          stroke={trendColor}
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
}
