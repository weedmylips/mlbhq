export default function PitcherEfficiency({ pitchCount, pitcherName }) {
  if (!pitchCount || pitchCount.pitches == null) return null;

  const { pitches, strikes, ip } = pitchCount;
  const strikePct = pitches > 0 ? Math.round((strikes / pitches) * 100) : 0;
  const ipNum = parseFloat(ip) || 0;
  const pitchesPerInning = ipNum > 0 ? (pitches / ipNum).toFixed(1) : '-';

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {pitcherName || 'Pitcher'} — Pitch Count
      </h4>
      <div className="flex gap-4 text-xs">
        <div>
          <span className="text-gray-500">Pitches: </span>
          <span className={`font-mono font-bold ${pitches >= 100 ? 'text-red-400' : pitches >= 85 ? 'text-yellow-400' : ''}`}>
            {pitches}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Strikes: </span>
          <span className="font-mono font-bold">{strikes}</span>
        </div>
        <div>
          <span className="text-gray-500">K%: </span>
          <span className="font-mono font-bold">{strikePct}%</span>
        </div>
        <div>
          <span className="text-gray-500">IP: </span>
          <span className="font-mono font-bold">{ip}</span>
        </div>
        <div>
          <span className="text-gray-500">P/IP: </span>
          <span className="font-mono font-bold">{pitchesPerInning}</span>
        </div>
      </div>
      {/* Pitch count bar */}
      <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            pitches >= 100 ? 'bg-red-500' : pitches >= 85 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min((pitches / 120) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
