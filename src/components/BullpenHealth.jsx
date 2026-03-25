import { useTeam } from '../context/TeamContext';
import { useBullpen } from '../hooks/useTeamData';

const STATUS_CONFIG = {
  unavailable: { dot: 'bg-red-500', label: 'UNAVAIL', textColor: 'text-red-400' },
  limited: { dot: 'bg-yellow-500', label: 'LIMITED', textColor: 'text-yellow-400' },
  available: { dot: 'bg-green-500', label: 'AVAIL', textColor: 'text-green-400' },
};

function RelieverRow({ reliever }) {
  const cfg = STATUS_CONFIG[reliever.status] || STATUS_CONFIG.available;

  return (
    <div className="flex items-start gap-2 py-1.5 px-2 rounded bg-white/5">
      <div className="flex items-center gap-1.5 shrink-0 w-[72px] pt-0.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
        <span className={`text-[10px] font-bold uppercase ${cfg.textColor}`}>{cfg.label}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{reliever.name}</span>
          <span className="text-[10px] px-1 py-px rounded bg-white/10 text-gray-400 font-mono shrink-0">
            {reliever.pitchHand === 'L' ? 'LHP' : 'RHP'}
          </span>
        </div>
        <div className="text-[11px] text-gray-500 font-mono">
          {reliever.appearances > 0 ? (
            <>
              {reliever.appearances} app &middot; {reliever.ip} IP &middot; {reliever.pitches} P
            </>
          ) : (
            <span>{reliever.era} ERA &middot; {reliever.saves > 0 ? `${reliever.saves} SV` : 'no recent app'}</span>
          )}
        </div>
      </div>

      {reliever.appearances > 0 && (
        <div className="text-[11px] text-gray-500 font-mono shrink-0 pt-0.5">
          {reliever.era} ERA
          {reliever.saves > 0 && <> &middot; {reliever.saves} SV</>}
        </div>
      )}
    </div>
  );
}

export default function BullpenHealth() {
  const { team } = useTeam();
  const { data, isLoading } = useBullpen(team.id);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  const relievers = data?.relievers || [];
  if (relievers.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Bullpen Health
        </h3>
        {data?.window && (
          <span className="text-[10px] text-gray-600 font-mono">{data.window}</span>
        )}
      </div>
      <div className="space-y-1">
        {relievers.map((r) => (
          <RelieverRow key={r.name} reliever={r} />
        ))}
      </div>
    </div>
  );
}
