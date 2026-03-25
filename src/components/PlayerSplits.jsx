function SplitRow({ label, stat, isPitcher }) {
  if (!stat) return null;

  if (isPitcher) {
    return (
      <tr className="border-b border-white/5">
        <td className="py-1 pr-3 text-gray-400 text-xs font-medium">{label}</td>
        <td className="text-right px-1 font-mono text-xs">{stat.era ?? '-'}</td>
        <td className="text-right px-1 font-mono text-xs">{stat.whip ?? '-'}</td>
        <td className="text-right px-1 font-mono text-xs">{stat.inningsPitched ?? '-'}</td>
        <td className="text-right px-1 font-mono text-xs">{stat.strikeOuts ?? '-'}</td>
        <td className="text-right px-1 font-mono text-xs">{stat.baseOnBalls ?? '-'}</td>
        <td className="text-right px-1 font-mono text-xs">{stat.avg ?? '-'}</td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-white/5">
      <td className="py-1 pr-3 text-gray-400 text-xs font-medium">{label}</td>
      <td className="text-right px-1 font-mono text-xs">{stat.avg ?? '-'}</td>
      <td className="text-right px-1 font-mono text-xs">{stat.obp ?? '-'}</td>
      <td className="text-right px-1 font-mono text-xs">{stat.slg ?? '-'}</td>
      <td className="text-right px-1 font-mono text-xs">{stat.ops ?? '-'}</td>
      <td className="text-right px-1 font-mono text-xs">{stat.homeRuns ?? '-'}</td>
      <td className="text-right px-1 font-mono text-xs">{stat.hits ?? '-'}</td>
      <td className="text-right px-1 font-mono text-xs">{stat.atBats ?? '-'}</td>
    </tr>
  );
}

export default function PlayerSplits({ splits, isPitcher }) {
  if (!splits) {
    return <p className="text-gray-500 text-xs py-2">No splits available</p>;
  }

  const { vsLeft, vsRight, home, away, byMonth } = splits;
  const hasData = vsLeft || vsRight || home || away || byMonth?.length > 0;

  if (!hasData) {
    return <p className="text-gray-500 text-xs py-2">No splits available</p>;
  }

  const pitcherHeaders = (
    <tr className="text-gray-500 text-[10px] border-b border-border">
      <th className="text-left py-1">Split</th>
      <th className="text-right px-1 font-mono">ERA</th>
      <th className="text-right px-1 font-mono">WHIP</th>
      <th className="text-right px-1 font-mono">IP</th>
      <th className="text-right px-1 font-mono">K</th>
      <th className="text-right px-1 font-mono">BB</th>
      <th className="text-right px-1 font-mono">AVG</th>
    </tr>
  );

  const hitterHeaders = (
    <tr className="text-gray-500 text-[10px] border-b border-border">
      <th className="text-left py-1">Split</th>
      <th className="text-right px-1 font-mono">AVG</th>
      <th className="text-right px-1 font-mono">OBP</th>
      <th className="text-right px-1 font-mono">SLG</th>
      <th className="text-right px-1 font-mono">OPS</th>
      <th className="text-right px-1 font-mono">HR</th>
      <th className="text-right px-1 font-mono">H</th>
      <th className="text-right px-1 font-mono">AB</th>
    </tr>
  );

  return (
    <div className="space-y-3">
      {/* Platoon splits */}
      {(vsLeft || vsRight) && (
        <div>
          <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            {isPitcher ? 'vs Batter Hand' : 'vs Pitcher Hand'}
          </h5>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>{isPitcher ? pitcherHeaders : hitterHeaders}</thead>
              <tbody>
                <SplitRow label="vs LH" stat={vsLeft} isPitcher={isPitcher} />
                <SplitRow label="vs RH" stat={vsRight} isPitcher={isPitcher} />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Home/Away */}
      {(home || away) && (
        <div>
          <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Home / Away
          </h5>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>{isPitcher ? pitcherHeaders : hitterHeaders}</thead>
              <tbody>
                <SplitRow label="Home" stat={home} isPitcher={isPitcher} />
                <SplitRow label="Away" stat={away} isPitcher={isPitcher} />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly */}
      {byMonth?.length > 0 && (
        <div>
          <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            By Month
          </h5>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>{isPitcher ? pitcherHeaders : hitterHeaders}</thead>
              <tbody>
                {byMonth.map((m, i) => (
                  <SplitRow key={i} label={m.month} stat={m.stat} isPitcher={isPitcher} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
