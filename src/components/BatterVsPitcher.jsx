import { useBvp } from '../hooks/useTeamData';

export default function BatterVsPitcher({ batterId, pitcherId, batterName, pitcherName }) {
  const { data, isLoading } = useBvp(batterId, pitcherId);

  if (isLoading || !data || data.atBats === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {batterName || 'Batter'} vs {pitcherName || 'Pitcher'} — Career
      </h4>
      <div className="flex gap-4 text-xs">
        <div>
          <span className="text-gray-500">AB: </span>
          <span className="font-mono font-bold">{data.atBats}</span>
        </div>
        <div>
          <span className="text-gray-500">H: </span>
          <span className="font-mono font-bold">{data.hits}</span>
        </div>
        <div>
          <span className="text-gray-500">AVG: </span>
          <span className="font-mono font-bold">{data.avg}</span>
        </div>
        <div>
          <span className="text-gray-500">HR: </span>
          <span className="font-mono font-bold">{data.hr}</span>
        </div>
        <div>
          <span className="text-gray-500">BB: </span>
          <span className="font-mono font-bold">{data.bb}</span>
        </div>
        <div>
          <span className="text-gray-500">K: </span>
          <span className="font-mono font-bold">{data.k}</span>
        </div>
      </div>
    </div>
  );
}

export function BvpInline({ batterId, pitcherId, perspective = 'batter' }) {
  const { data, isLoading } = useBvp(batterId, pitcherId);

  if (isLoading || !data || data.atBats === 0) return null;

  if (perspective === 'pitcher') {
    return (
      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
        vs: {data.avg} <span className="text-gray-600">({data.hits}-{data.atBats})</span>
        {data.hr > 0 && <>, {data.hr} HR</>}
        {data.bb > 0 && <>, {data.bb} BB</>}
      </div>
    );
  }

  return (
    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
      vs: {data.avg} <span className="text-gray-600">({data.hits}-{data.atBats})</span>
      {data.hr > 0 && <>, {data.hr} HR</>}
      {data.k > 0 && <>, {data.k} K</>}
    </div>
  );
}
