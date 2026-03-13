import { useTeamStats } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';

function StatBox({ label, value, rank, leagueAbbr }) {
  return (
    <div className="text-center">
      <div className="stat-number text-xl">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
      {rank && leagueAbbr && (
        <div className="text-[9px] text-[var(--team-primary)] font-semibold mt-0.5 leading-tight">
          {rank} in {leagueAbbr}
        </div>
      )}
    </div>
  );
}

function PlayerRow({ name, stats }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs py-0.5">
      <span className="text-gray-300 truncate min-w-0">{name}</span>
      <span className="text-gray-500 tabular-nums whitespace-nowrap shrink-0">{stats}</span>
    </div>
  );
}

export default function TeamStats() {
  const { team } = useTeam();
  const leagueId = team.league === 'AL' ? 103 : 104;
  const { data, isLoading } = useTeamStats(team.id, leagueId);

  if (isLoading) {
    return (
      <>
        <div className="card"><div className="skeleton h-32 w-full" /></div>
        <div className="card"><div className="skeleton h-32 w-full" /></div>
      </>
    );
  }

  if (!data) return null;

  const leagueAbbr = team.league;

  return (
    <>
      <div className="card">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Team Batting
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatBox label="AVG" value={data.hitting.avg} rank={data.hittingRanks?.avg} leagueAbbr={leagueAbbr} />
          <StatBox label="OPS" value={data.hitting.ops} rank={data.hittingRanks?.ops} leagueAbbr={leagueAbbr} />
          <StatBox label="HR" value={data.hitting.hr} rank={data.hittingRanks?.hr} leagueAbbr={leagueAbbr} />
          <StatBox label="Runs" value={data.hitting.runs} rank={data.hittingRanks?.runs} leagueAbbr={leagueAbbr} />
          <StatBox label="SB" value={data.hitting.sb} rank={data.hittingRanks?.sb} leagueAbbr={leagueAbbr} />
          <StatBox label="RBI" value={data.hitting.rbi} rank={data.hittingRanks?.rbi} leagueAbbr={leagueAbbr} />
        </div>
        {data.topBatters?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Top Batters</div>
            <div>
              {data.topBatters.map((p, i) => (
                <PlayerRow
                  key={i}
                  name={p.name}
                  stats={`${p.avg} · ${p.hr} HR · ${p.rbi} RBI`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="card">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Team Pitching
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatBox label="ERA" value={data.pitching.era} rank={data.pitchingRanks?.era} leagueAbbr={leagueAbbr} />
          <StatBox label="WHIP" value={data.pitching.whip} rank={data.pitchingRanks?.whip} leagueAbbr={leagueAbbr} />
          <StatBox label="K" value={data.pitching.k} rank={data.pitchingRanks?.k} leagueAbbr={leagueAbbr} />
          <StatBox label="Saves" value={data.pitching.saves} rank={data.pitchingRanks?.saves} leagueAbbr={leagueAbbr} />
          <StatBox label="W" value={data.pitching.wins} rank={data.pitchingRanks?.wins} leagueAbbr={leagueAbbr} />
          <StatBox label="L" value={data.pitching.losses} rank={data.pitchingRanks?.losses} leagueAbbr={leagueAbbr} />
        </div>
        {data.topPitchers?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Top Pitchers</div>
            <div>
              {data.topPitchers.map((p, i) => (
                <PlayerRow
                  key={i}
                  name={p.name}
                  stats={`${p.era} ERA · ${p.wins}-${p.losses} · ${p.k} K`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
