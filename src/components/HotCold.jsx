import { useTeam } from '../context/TeamContext';
import { useHotCold } from '../hooks/useTeamData';

function PlayerRow({ name, stats, hot }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs py-0.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm leading-none">{hot ? '🔥' : '🥶'}</span>
        <span className="text-gray-200 truncate">{name}</span>
      </div>
      <span className="text-gray-500 tabular-nums whitespace-nowrap shrink-0">{stats}</span>
    </div>
  );
}

function Section({ title, batters, pitchers, hot }) {
  const hasBatters = batters?.length > 0;
  const hasPitchers = pitchers?.length > 0;
  if (!hasBatters && !hasPitchers) return null;

  return (
    <div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{title}</div>
      {hasBatters && (
        <div className="mb-2">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Batting</div>
          {batters.map((p, i) => (
            <PlayerRow key={i} name={p.name} stats={`${p.avg} AVG · ${p.ops} OPS · ${p.hr} HR`} hot={hot} />
          ))}
        </div>
      )}
      {hasPitchers && (
        <div>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Pitching</div>
          {pitchers.map((p, i) => (
            <PlayerRow key={i} name={p.name} stats={`${p.era} ERA · ${p.wins}-${p.losses} · ${p.k}K`} hot={hot} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HotCold() {
  const { team } = useTeam();
  const { data, isLoading } = useHotCold(team.id);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  const isEmpty = !data?.hot?.batters?.length && !data?.hot?.pitchers?.length &&
                  !data?.cold?.batters?.length && !data?.cold?.pitchers?.length;

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
        Hot &amp; Cold · Last 7 Days
      </h3>
      {isEmpty ? (
        <p className="text-gray-500 text-sm text-center py-4">No recent game data available.</p>
      ) : (
        <div className="space-y-4">
          <Section title="On Fire" batters={data.hot.batters} pitchers={data.hot.pitchers} hot={true} />
          <Section title="In a Slump" batters={data.cold.batters} pitchers={data.cold.pitchers} hot={false} />
        </div>
      )}
    </div>
  );
}
