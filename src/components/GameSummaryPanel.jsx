import { useBoxScore } from '../hooks/useTeamData';

export default function GameSummaryPanel({ gamePk }) {
  const { data, isLoading, isError } = useBoxScore(gamePk);

  if (isLoading) {
    return (
      <div className="mt-2 pt-2 border-t border-white/10 text-center text-xs text-gray-500 py-2">
        Loading game summary…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mt-2 pt-2 border-t border-white/10 text-xs text-gray-500 py-1">
        Could not load game summary.
      </div>
    );
  }

  const { teams, decisions, topHitters } = data;
  const away = teams?.away;
  const home = teams?.home;

  return (
    <div className="mt-2 pt-2 border-t border-white/10 space-y-3 text-xs">
      {/* Line score */}
      <div>
        <table className="w-full text-right">
          <thead>
            <tr className="text-gray-500 uppercase tracking-wider">
              <th className="text-left font-normal w-1/2"></th>
              <th className="font-normal px-2">R</th>
              <th className="font-normal px-2">H</th>
              <th className="font-normal px-2">E</th>
            </tr>
          </thead>
          <tbody>
            {[away, home].map((t) =>
              t ? (
                <tr key={t.team?.id} className="text-gray-300">
                  <td className="text-left font-semibold py-0.5">{t.team?.abbreviation}</td>
                  <td className="px-2 font-bold">{t.runs}</td>
                  <td className="px-2">{t.hits}</td>
                  <td className="px-2">{t.errors}</td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </div>

      {/* Pitching decisions */}
      {(decisions?.winner || decisions?.loser || decisions?.save) && (
        <div className="space-y-1">
          <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Pitching</p>
          {[
            { label: 'W', data: decisions.winner },
            { label: 'L', data: decisions.loser },
            { label: 'SV', data: decisions.save },
          ]
            .filter((d) => d.data)
            .map(({ label, data: p }) => (
              <div key={label} className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`font-bold shrink-0 ${
                      label === 'W'
                        ? 'text-green-400'
                        : label === 'L'
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {label}
                  </span>
                  <span className="text-gray-200 truncate">{p.name}</span>
                </span>
                <span className="text-gray-400 shrink-0 font-mono">
                  {p.stats.ip} IP&nbsp;&nbsp;{p.stats.h}H&nbsp;&nbsp;{p.stats.er}ER&nbsp;&nbsp;{p.stats.bb}BB&nbsp;&nbsp;{p.stats.so}K
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Top hitters */}
      {topHitters?.length > 0 && (
        <div className="space-y-1">
          <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Top Hitters</p>
          {topHitters.map((h, i) => (
            <div key={i} className="flex items-baseline justify-between gap-2">
              <span className="text-gray-200 truncate">
                {h.name}{' '}
                <span className="text-gray-500">({h.teamAbbr})</span>
              </span>
              <span className="text-gray-400 shrink-0 font-mono">
                {h.h}-{h.ab}
                {h.rbi > 0 && <>&nbsp;&nbsp;{h.rbi} RBI</>}
                {h.hr > 0 && <>&nbsp;&nbsp;{h.hr} HR</>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
