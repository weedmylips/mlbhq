import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function PitchBadge({ pitch }) {
  const colorClass = pitch.isInPlay
    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    : pitch.isStrike
    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    : 'bg-green-500/20 text-green-300 border-green-500/30';

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[10px] text-gray-500 font-mono w-4 text-right shrink-0">
        {pitch.pitchNumber}
      </span>
      <span
        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${colorClass}`}
      >
        {pitch.type || 'Pitch'}
      </span>
      {pitch.speed && (
        <span className="text-[11px] font-mono text-gray-400 shrink-0">
          {Math.round(pitch.speed)} mph
        </span>
      )}
      <span className="text-[11px] text-gray-500 truncate">{pitch.call}</span>
    </div>
  );
}

function PlayEntry({ play }) {
  return (
    <div className="py-1.5 border-b border-white/5 last:border-0">
      <div className="flex items-start gap-2">
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${
            play.isOut
              ? 'bg-red-500/15 text-red-400 border-red-500/20'
              : play.rbi > 0
              ? 'bg-green-500/15 text-green-400 border-green-500/20'
              : 'bg-gray-500/15 text-gray-400 border-gray-500/20'
          }`}
        >
          {play.event || 'Play'}
        </span>
        <p className="text-[11px] text-gray-400 leading-relaxed">{play.description}</p>
      </div>
    </div>
  );
}

export default function PitchLog({ currentAtBat, recentPlays }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasPitches = currentAtBat?.length > 0;
  const hasPlays = recentPlays?.length > 0;

  if (!hasPitches && !hasPlays) return null;

  return (
    <div className="mt-3 border-t border-border pt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors w-full"
      >
        <ChevronDown
          size={14}
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
        <span className="font-medium uppercase tracking-wider text-[10px]">
          Play-by-Play
        </span>
        {hasPitches && (
          <span className="text-[10px] text-gray-600 ml-1">
            {currentAtBat.length} pitch{currentAtBat.length !== 1 ? 'es' : ''} this AB
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-3">
          {/* Current At-Bat Pitches */}
          {hasPitches && (
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Current At-Bat
              </h4>
              <div className="bg-white/[0.02] rounded px-2">
                {currentAtBat.map((pitch, i) => (
                  <PitchBadge key={i} pitch={pitch} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Plays */}
          {hasPlays && (
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Recent Plays
              </h4>
              <div className="bg-white/[0.02] rounded px-2">
                {recentPlays.map((play, i) => (
                  <PlayEntry key={i} play={play} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
