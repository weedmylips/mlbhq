import { useRoster } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';

export default function RosterTable() {
  const { team } = useTeam();
  const { data, isLoading } = useRoster(team.id);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  const batters = data?.batters || [];
  const pitchers = data?.pitchers || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Batters */}
      <div className="card overflow-x-auto">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Position Players
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-border">
              <th className="text-left py-2 pr-2">Name</th>
              <th className="text-center px-1">Pos</th>
              <th className="text-right px-1 font-mono">AVG</th>
              <th className="text-right px-1 font-mono">OBP</th>
              <th className="text-right px-1 font-mono">SLG</th>
              <th className="text-right px-1 font-mono">OPS</th>
              <th className="text-right px-1 font-mono">HR</th>
              <th className="text-right px-1 font-mono">RBI</th>
              <th className="text-right px-1 font-mono">SB</th>
            </tr>
          </thead>
          <tbody>
            {batters.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-1.5 pr-2 whitespace-nowrap">
                  <span className="text-gray-400 text-xs mr-1">#{p.number}</span>
                  {p.name}
                </td>
                <td className="text-center text-xs text-gray-400">{p.position}</td>
                <td className="text-right font-mono text-xs">{p.hitting?.avg || '-'}</td>
                <td className="text-right font-mono text-xs">{p.hitting?.obp || '-'}</td>
                <td className="text-right font-mono text-xs">{p.hitting?.slg || '-'}</td>
                <td className="text-right font-mono text-xs">{p.hitting?.ops || '-'}</td>
                <td className="text-right font-mono text-xs">{p.hitting?.homeRuns || '-'}</td>
                <td className="text-right font-mono text-xs">{p.hitting?.rbi || '-'}</td>
                <td className="text-right font-mono text-xs">{p.hitting?.stolenBases || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {batters.length === 0 && (
          <p className="text-gray-500 text-center py-4">No batting data available</p>
        )}
      </div>

      {/* Pitchers */}
      <div className="card overflow-x-auto">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Pitchers
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-border">
              <th className="text-left py-2 pr-2">Name</th>
              <th className="text-center px-1">Role</th>
              <th className="text-right px-1 font-mono">ERA</th>
              <th className="text-right px-1 font-mono">WHIP</th>
              <th className="text-right px-1 font-mono">W</th>
              <th className="text-right px-1 font-mono">L</th>
              <th className="text-right px-1 font-mono">SV</th>
              <th className="text-right px-1 font-mono">K</th>
              <th className="text-right px-1 font-mono">IP</th>
            </tr>
          </thead>
          <tbody>
            {pitchers.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-1.5 pr-2 whitespace-nowrap">
                  <span className="text-gray-400 text-xs mr-1">#{p.number}</span>
                  {p.name}
                </td>
                <td className="text-center text-xs text-gray-400">{p.position}</td>
                <td className="text-right font-mono text-xs">{p.pitching?.era || '-'}</td>
                <td className="text-right font-mono text-xs">{p.pitching?.whip || '-'}</td>
                <td className="text-right font-mono text-xs">{p.pitching?.wins || '-'}</td>
                <td className="text-right font-mono text-xs">{p.pitching?.losses || '-'}</td>
                <td className="text-right font-mono text-xs">{p.pitching?.saves || '-'}</td>
                <td className="text-right font-mono text-xs">{p.pitching?.strikeOuts || '-'}</td>
                <td className="text-right font-mono text-xs">{p.pitching?.inningsPitched || '-'}</td>
              </tr>
            ))}
          </tbody>
          </table>
        {pitchers.length === 0 && (
          <p className="text-gray-500 text-center py-4">No pitching data available</p>
        )}
      </div>
    </div>
  );
}
