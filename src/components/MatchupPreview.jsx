import { useMatchup } from '../hooks/useTeamData';

function PitcherColumn({ pitcher, align }) {
  if (!pitcher) {
    return (
      <div className={`flex-1 text-${align}`}>
        <p className="text-xs text-gray-500">TBD</p>
      </div>
    );
  }

  const s = pitcher.season;
  const headshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${pitcher.id}/headshot/67/current`;

  return (
    <div className={`flex-1 ${align === 'right' ? 'text-right' : ''}`}>
      <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <img
          src={headshotUrl}
          alt={pitcher.name}
          className="w-8 h-8 rounded-full bg-white/[0.02] object-cover shrink-0"
        />
        <div>
          <p className="text-xs font-bold">{pitcher.name}</p>
          <p className="text-[10px] text-gray-500">
            {pitcher.pitchHand === 'R' ? 'RHP' : 'LHP'}
          </p>
        </div>
      </div>

      {s && (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
          <StatLine label="W-L" value={`${s.wins}-${s.losses}`} align={align} />
          <StatLine label="ERA" value={s.era} align={align} />
          <StatLine label="WHIP" value={s.whip} align={align} />
          <StatLine label="K/9" value={s.k9} align={align} />
          <StatLine label="IP" value={s.ip} align={align} />
          <StatLine label="K" value={s.k} align={align} />
        </div>
      )}

      {pitcher.lastStarts?.length > 0 && (
        <div className="mt-2">
          <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">
            Last {pitcher.lastStarts.length} Starts
          </p>
          {pitcher.lastStarts.map((g, i) => (
            <div
              key={i}
              className={`text-[10px] text-gray-500 flex gap-1.5 ${
                align === 'right' ? 'justify-end' : ''
              }`}
            >
              <span
                className={`font-bold ${
                  g.result === 'W'
                    ? 'text-green-400'
                    : g.result === 'L'
                    ? 'text-red-400'
                    : 'text-gray-500'
                }`}
              >
                {g.result}
              </span>
              <span className="font-mono">{g.ip}IP</span>
              <span className="font-mono">{g.k}K</span>
              <span className="font-mono">{g.er}ER</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatLine({ label, value, align }) {
  return (
    <div
      className={`flex items-baseline gap-1 text-[10px] ${
        align === 'right' ? 'flex-row-reverse' : ''
      }`}
    >
      <span className="text-gray-600">{label}</span>
      <span className="font-mono text-gray-300">{value ?? '-'}</span>
    </div>
  );
}

export default function MatchupPreview({ pitcher1Id, pitcher2Id }) {
  const { data, isLoading } = useMatchup(pitcher1Id, pitcher2Id);

  if (isLoading) {
    return <div className="skeleton h-20 w-full mt-3 rounded" />;
  }

  if (!data || (!data.home && !data.away)) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold text-center mb-2">
        Pitching Matchup
      </p>
      <div className="flex gap-4">
        <PitcherColumn pitcher={data.home} align="left" />
        <div className="flex items-center text-gray-600 text-xs font-bold shrink-0">vs</div>
        <PitcherColumn pitcher={data.away} align="right" />
      </div>
    </div>
  );
}
