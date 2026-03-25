/**
 * SVG Strike Zone visualization showing pitch locations from the current at-bat.
 * pX: horizontal position (-2 to 2, 0 = center, negative = inside to RHH)
 * pZ: vertical position (roughly 1.5 to 3.5 for strike zone)
 */

const ZONE_WIDTH = 140;
const ZONE_HEIGHT = 160;
const PADDING = 30;
const SVG_W = ZONE_WIDTH + PADDING * 2;
const SVG_H = ZONE_HEIGHT + PADDING * 2;

// Strike zone boundaries in feet (from pitcher's perspective)
const SZ_LEFT = -0.83;
const SZ_RIGHT = 0.83;
const SZ_TOP = 3.5;
const SZ_BOTTOM = 1.5;

function toSvgX(pX) {
  // Map pX from [-2, 2] to [PADDING, PADDING + ZONE_WIDTH]
  const range = SZ_RIGHT - SZ_LEFT;
  const normalized = (pX - SZ_LEFT) / range;
  return PADDING + normalized * ZONE_WIDTH;
}

function toSvgY(pZ) {
  // Map pZ from [SZ_BOTTOM, SZ_TOP] to [PADDING + ZONE_HEIGHT, PADDING] (inverted Y)
  const range = SZ_TOP - SZ_BOTTOM;
  const normalized = (pZ - SZ_BOTTOM) / range;
  return PADDING + ZONE_HEIGHT - normalized * ZONE_HEIGHT;
}

function getPitchColor(pitch) {
  if (pitch.isInPlay) return '#3b82f6'; // blue
  if (pitch.isStrike) return '#ef4444'; // red
  if (pitch.isBall) return '#22c55e'; // green
  return '#6b7280'; // gray
}

export default function PitchZone({ pitches }) {
  if (!pitches?.length) return null;

  // Only show pitches with coordinates
  const plottable = pitches.filter((p) => p.pX != null && p.pZ != null);
  if (plottable.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
        Pitch Locations
      </h4>
      <div className="flex justify-center">
        <svg
          width={SVG_W}
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="max-w-[200px]"
        >
          {/* Strike zone rectangle */}
          <rect
            x={PADDING}
            y={PADDING}
            width={ZONE_WIDTH}
            height={ZONE_HEIGHT}
            fill="none"
            stroke="#374151"
            strokeWidth={1.5}
          />

          {/* Zone grid (3x3) */}
          {[1, 2].map((i) => (
            <g key={`grid-${i}`}>
              <line
                x1={PADDING + (ZONE_WIDTH / 3) * i}
                y1={PADDING}
                x2={PADDING + (ZONE_WIDTH / 3) * i}
                y2={PADDING + ZONE_HEIGHT}
                stroke="#1f2937"
                strokeWidth={0.5}
              />
              <line
                x1={PADDING}
                y1={PADDING + (ZONE_HEIGHT / 3) * i}
                x2={PADDING + ZONE_WIDTH}
                y2={PADDING + (ZONE_HEIGHT / 3) * i}
                stroke="#1f2937"
                strokeWidth={0.5}
              />
            </g>
          ))}

          {/* Home plate (below zone) */}
          <polygon
            points={`${PADDING + ZONE_WIDTH / 2},${PADDING + ZONE_HEIGHT + 18} ${PADDING + ZONE_WIDTH / 2 - 8},${PADDING + ZONE_HEIGHT + 12} ${PADDING + ZONE_WIDTH / 2 - 8},${PADDING + ZONE_HEIGHT + 6} ${PADDING + ZONE_WIDTH / 2 + 8},${PADDING + ZONE_HEIGHT + 6} ${PADDING + ZONE_WIDTH / 2 + 8},${PADDING + ZONE_HEIGHT + 12}`}
            fill="none"
            stroke="#4b5563"
            strokeWidth={1}
          />

          {/* Pitch dots */}
          {plottable.map((pitch, i) => {
            const cx = toSvgX(pitch.pX);
            const cy = toSvgY(pitch.pZ);
            const color = getPitchColor(pitch);
            const isLatest = i === plottable.length - 1;

            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isLatest ? 7 : 5}
                  fill={color}
                  fillOpacity={isLatest ? 0.9 : 0.6}
                  stroke={isLatest ? '#fff' : 'none'}
                  strokeWidth={isLatest ? 1.5 : 0}
                />
                <text
                  x={cx}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize={isLatest ? 8 : 7}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {pitch.pitchNumber}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-1 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Strike
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Ball
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> In Play
        </span>
      </div>
    </div>
  );
}
