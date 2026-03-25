export default function PlayerGameLog({ gameLog, isPitcher }) {
  if (!gameLog?.length) {
    return <p className="text-gray-500 text-xs py-2">No game log available</p>;
  }

  if (isPitcher) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 text-[10px] border-b border-border">
              <th className="text-left py-1 pr-2">Date</th>
              <th className="text-left px-1">Opp</th>
              <th className="text-right px-1 font-mono">IP</th>
              <th className="text-right px-1 font-mono">H</th>
              <th className="text-right px-1 font-mono">ER</th>
              <th className="text-right px-1 font-mono">BB</th>
              <th className="text-right px-1 font-mono">K</th>
              <th className="text-right px-1 font-mono">ERA</th>
            </tr>
          </thead>
          <tbody>
            {gameLog.map((g, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="py-1 pr-2 text-gray-400">
                  {new Date(g.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                </td>
                <td className="px-1 text-gray-300">
                  {g.isHome ? 'vs' : '@'} {g.opponent}
                </td>
                <td className="text-right px-1 font-mono">{g.stat?.inningsPitched ?? '-'}</td>
                <td className="text-right px-1 font-mono">{g.stat?.hits ?? '-'}</td>
                <td className="text-right px-1 font-mono">{g.stat?.earnedRuns ?? '-'}</td>
                <td className="text-right px-1 font-mono">{g.stat?.baseOnBalls ?? '-'}</td>
                <td className="text-right px-1 font-mono">{g.stat?.strikeOuts ?? '-'}</td>
                <td className="text-right px-1 font-mono">{g.stat?.era ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 text-[10px] border-b border-border">
            <th className="text-left py-1 pr-2">Date</th>
            <th className="text-left px-1">Opp</th>
            <th className="text-right px-1 font-mono">AB</th>
            <th className="text-right px-1 font-mono">H</th>
            <th className="text-right px-1 font-mono">HR</th>
            <th className="text-right px-1 font-mono">RBI</th>
            <th className="text-right px-1 font-mono">BB</th>
            <th className="text-right px-1 font-mono">K</th>
            <th className="text-right px-1 font-mono">AVG</th>
          </tr>
        </thead>
        <tbody>
          {gameLog.map((g, i) => (
            <tr key={i} className="border-b border-white/5">
              <td className="py-1 pr-2 text-gray-400">
                {new Date(g.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
              </td>
              <td className="px-1 text-gray-300">
                {g.isHome ? 'vs' : '@'} {g.opponent}
              </td>
              <td className="text-right px-1 font-mono">{g.stat?.atBats ?? '-'}</td>
              <td className="text-right px-1 font-mono">{g.stat?.hits ?? '-'}</td>
              <td className="text-right px-1 font-mono">{g.stat?.homeRuns ?? '-'}</td>
              <td className="text-right px-1 font-mono">{g.stat?.rbi ?? '-'}</td>
              <td className="text-right px-1 font-mono">{g.stat?.baseOnBalls ?? '-'}</td>
              <td className="text-right px-1 font-mono">{g.stat?.strikeOuts ?? '-'}</td>
              <td className="text-right px-1 font-mono">{g.stat?.avg ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
