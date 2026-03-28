function SituationRow({ situation }) {
  if (!situation?.stat) return null;
  const s = situation.stat;

  return (
    <tr className="border-b border-white/5 hover:bg-white/5">
      <td className="py-2 pr-3 text-sm font-medium">{situation.label}</td>
      <td className="text-right px-1.5 font-mono text-xs">{s.avg}</td>
      <td className="text-right px-1.5 font-mono text-xs">{s.obp}</td>
      <td className="text-right px-1.5 font-mono text-xs">{s.slg}</td>
      <td className="text-right px-1.5 font-mono text-xs">{s.ops}</td>
      <td className="text-right px-1.5 font-mono text-xs">{s.hr}</td>
      <td className="text-right px-1.5 font-mono text-xs">{s.rbi}</td>
      <td className="text-right px-1.5 font-mono text-xs">{s.ab}</td>
      <td className="text-right px-1.5 font-mono text-xs">{s.hits}</td>
      <td className="text-right px-1.5 font-mono text-xs">{s.bb}</td>
      <td className="text-right px-1.5 font-mono text-xs">{s.k}</td>
    </tr>
  );
}

export default function SituationalStats({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center py-6">Situational data unavailable</p>
      </div>
    );
  }

  const withData = data.filter((s) => s.stat);
  if (withData.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center py-6">No situational data for this season yet</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
        Situational Hitting
      </h3>

      {/* Visual comparison cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {withData.map((sit) => {
          if (!sit.stat) return null;
          const ops = parseFloat(sit.stat.ops) || 0;
          return (
            <div key={sit.code} className="bg-white/5 rounded-lg p-2.5 text-center">
              <div className="text-[10px] text-gray-500 uppercase">{sit.label}</div>
              <div
                className={`text-lg font-mono font-bold mt-0.5 ${
                  ops >= 0.8 ? 'text-green-400' : ops >= 0.7 ? 'text-gray-200' : 'text-red-400'
                }`}
              >
                {sit.stat.ops}
              </div>
              <div className="text-[10px] text-gray-500">OPS</div>
              <div className="text-xs font-mono text-gray-400 mt-1">
                {sit.stat.avg} AVG &middot; {sit.stat.hr} HR
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 text-[10px] border-b border-border">
              <th className="text-left py-1.5 pr-3">Situation</th>
              <th className="text-right px-1.5 font-mono">AVG</th>
              <th className="text-right px-1.5 font-mono">OBP</th>
              <th className="text-right px-1.5 font-mono">SLG</th>
              <th className="text-right px-1.5 font-mono">OPS</th>
              <th className="text-right px-1.5 font-mono">HR</th>
              <th className="text-right px-1.5 font-mono">RBI</th>
              <th className="text-right px-1.5 font-mono">AB</th>
              <th className="text-right px-1.5 font-mono">H</th>
              <th className="text-right px-1.5 font-mono">BB</th>
              <th className="text-right px-1.5 font-mono">K</th>
            </tr>
          </thead>
          <tbody>
            {withData.map((sit) => (
              <SituationRow key={sit.code} situation={sit} />
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
