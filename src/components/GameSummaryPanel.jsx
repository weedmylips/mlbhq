import { useBoxScore } from '../hooks/useTeamData';

const DECISION_COLORS = { W: 'text-green-400', L: 'text-red-400', SV: 'text-blue-400' };

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

  const { innings = [], teams, pitchers, topHitters } = data;
  const away = teams?.away;
  const home = teams?.home;

  return (
    <div className="mt-2 pt-2 border-t border-white/10 space-y-3 text-xs">

      {/* Inning-by-inning line score */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
              <th className="text-left font-normal pb-0.5 pr-2 w-10"></th>
              {innings.map((inn) => (
                <th key={inn.num} className="text-right font-normal pb-0.5 w-5">{inn.num}</th>
              ))}
              <th className="text-right font-bold pb-0.5 pl-2 w-6">R</th>
              <th className="text-right font-normal pb-0.5 w-6">H</th>
              <th className="text-right font-normal pb-0.5 w-6">E</th>
            </tr>
          </thead>
          <tbody>
            {[
              { side: 'away', team: away },
              { side: 'home', team: home },
            ].map(({ side, team }) =>
              team ? (
                <tr key={side} className="text-gray-300">
                  <td className="text-left font-semibold py-0.5 pr-2">{team.team?.abbreviation}</td>
                  {innings.map((inn) => (
                    <td key={inn.num} className="text-right w-5">
                      {inn[side] ?? '–'}
                    </td>
                  ))}
                  <td className="text-right font-bold pl-2 w-6">{team.runs}</td>
                  <td className="text-right w-6">{team.hits}</td>
                  <td className="text-right w-6">{team.errors}</td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </div>

      {/* Pitchers */}
      {pitchers?.length > 0 && (
        <div>
          <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-1">Pitching</p>
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                <th className="text-left font-normal pb-0.5"></th>
                <th className="text-right font-normal pb-0.5 w-8">IP</th>
                <th className="text-right font-normal pb-0.5 w-8">H</th>
                <th className="text-right font-normal pb-0.5 w-8">ER</th>
                <th className="text-right font-normal pb-0.5 w-8">BB</th>
                <th className="text-right font-normal pb-0.5 w-8">K</th>
              </tr>
            </thead>
            <tbody>
              {pitchers.map((p, i) => (
                <tr key={i} className="text-gray-300">
                  <td className="text-left py-0.5 pr-2">
                    <span className="truncate block max-w-[120px]">
                      {p.decision && (
                        <span className={`font-bold mr-1 ${DECISION_COLORS[p.decision] ?? ''}`}>
                          {p.decision}
                        </span>
                      )}
                      {p.name.split(' ').slice(-1)[0]}
                      <span className="text-gray-500 ml-1">({p.teamAbbr})</span>
                    </span>
                  </td>
                  <td className="text-right w-8 font-mono">{p.stats.ip}</td>
                  <td className="text-right w-8">{p.stats.h}</td>
                  <td className="text-right w-8">{p.stats.er}</td>
                  <td className="text-right w-8">{p.stats.bb}</td>
                  <td className="text-right w-8">{p.stats.so}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top hitters */}
      {topHitters?.length > 0 && (
        <div>
          <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-1">Top Hitters</p>
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                <th className="text-left font-normal pb-0.5"></th>
                <th className="text-right font-normal pb-0.5 w-8">AB</th>
                <th className="text-right font-normal pb-0.5 w-8">H</th>
                <th className="text-right font-normal pb-0.5 w-8">RBI</th>
                <th className="text-right font-normal pb-0.5 w-8">HR</th>
                <th className="text-right font-normal pb-0.5 w-8">BB</th>
              </tr>
            </thead>
            <tbody>
              {topHitters.map((h, i) => (
                <tr key={i} className="text-gray-300">
                  <td className="text-left py-0.5 pr-2">
                    <span className="truncate block max-w-[120px]">
                      {h.name.split(' ').slice(-1)[0]}
                      <span className="text-gray-500 ml-1">({h.teamAbbr})</span>
                    </span>
                  </td>
                  <td className="text-right w-8">{h.ab}</td>
                  <td className="text-right w-8">{h.h}</td>
                  <td className="text-right w-8">{h.rbi}</td>
                  <td className="text-right w-8">{h.hr}</td>
                  <td className="text-right w-8">{h.bb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
