import { useTeamStats } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';

function StatBox({ label, value }) {
  return (
    <div className="text-center">
      <div className="stat-number text-xl">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function TeamStats() {
  const { team } = useTeam();
  const { data, isLoading } = useTeamStats(team.id);

  if (isLoading) {
    return (
      <>
        <div className="card"><div className="skeleton h-32 w-full" /></div>
        <div className="card"><div className="skeleton h-32 w-full" /></div>
      </>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="card">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Team Batting
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="AVG" value={data.hitting.avg} />
          <StatBox label="OPS" value={data.hitting.ops} />
          <StatBox label="HR" value={data.hitting.hr} />
          <StatBox label="Runs" value={data.hitting.runs} />
          <StatBox label="SB" value={data.hitting.sb} />
          <StatBox label="RBI" value={data.hitting.rbi} />
        </div>
      </div>
      <div className="card">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Team Pitching
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="ERA" value={data.pitching.era} />
          <StatBox label="WHIP" value={data.pitching.whip} />
          <StatBox label="K" value={data.pitching.k} />
          <StatBox label="Saves" value={data.pitching.saves} />
          <StatBox label="W" value={data.pitching.wins} />
          <StatBox label="L" value={data.pitching.losses} />
        </div>
      </div>
    </>
  );
}
