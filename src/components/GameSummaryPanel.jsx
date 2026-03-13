import { useBoxScore } from '../hooks/useTeamData';

const DECISION_COLORS = { W: 'text-green-400', L: 'text-red-400', SV: 'text-blue-400' };

const TH = 'text-right font-normal pb-0.5 px-2';
const TD = 'text-right px-2';

function PitchingTable({ pitcherData }) {
  if (!pitcherData?.pitchers?.length) return null;
  return (
    <div>
      <p className="text-gray-400 font-semibold mb-0.5">{pitcherData.abbr}</p>
      <table>
        <thead>
          <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
            <th className="text-left font-normal pb-0.5 pr-3 min-w-[90px]"></th>
            <th className={TH}>IP</th>
            <th className={TH}>H</th>
            <th className={TH}>ER</th>
            <th className={TH}>BB</th>
            <th className={TH}>K</th>
          </tr>
        </thead>
        <tbody>
          {pitcherData.pitchers.map((p, i) => (
            <tr key={i} className="text-gray-300">
              <td className="text-left py-0.5 pr-3">
                <span className="truncate block max-w-[90px]">
                  {p.decision && (
                    <span className={`font-bold mr-1 ${DECISION_COLORS[p.decision] ?? ''}`}>
                      {p.decision}
                    </span>
                  )}
                  {p.name.split(' ').slice(-1)[0]}
                </span>
              </td>
              <td className={`${TD} font-mono`}>{p.stats.ip}</td>
              <td className={TD}>{p.stats.h}</td>
              <td className={TD}>{p.stats.er}</td>
              <td className={TD}>{p.stats.bb}</td>
              <td className={TD}>{p.stats.so}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HittingTable({ hitterData }) {
  if (!hitterData?.hitters?.length) return null;
  return (
    <div>
      <p className="text-gray-400 font-semibold mb-0.5">{hitterData.abbr}</p>
      <table>
        <thead>
          <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
            <th className="text-left font-normal pb-0.5 pr-3 min-w-[90px]"></th>
            <th className={TH}>AB</th>
            <th className={TH}>H</th>
            <th className={TH}>RBI</th>
            <th className={TH}>HR</th>
            <th className={TH}>BB</th>
          </tr>
        </thead>
        <tbody>
          {hitterData.hitters.map((h, i) => (
            <tr key={i} className="text-gray-300">
              <td className="text-left py-0.5 pr-3">
                <span className="truncate block max-w-[90px]">
                  {h.name.split(' ').slice(-1)[0]}
                </span>
              </td>
              <td className={TD}>{h.ab}</td>
              <td className={TD}>{h.h}</td>
              <td className={TD}>{h.rbi}</td>
              <td className={TD}>{h.hr}</td>
              <td className={TD}>{h.bb}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

  const hasPitching = pitchers?.away?.pitchers?.length > 0 || pitchers?.home?.pitchers?.length > 0;
  const hasHitting = topHitters?.away?.hitters?.length > 0 || topHitters?.home?.hitters?.length > 0;

  return (
    <div className="mt-2 pt-2 border-t border-white/10 text-xs">

      {/* Desktop: 3-column grid. Mobile: stacked. */}
      <div className="md:grid md:grid-cols-[auto_1fr_1fr] md:gap-6 space-y-3 md:space-y-0">

        {/* Column 1 — Line score */}
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                <th className="text-left font-normal pb-0.5 pr-2 w-10"></th>
                {innings.map((inn) => (
                  <th key={inn.num} className="text-right font-normal pb-0.5 px-1 min-w-[16px]">{inn.num}</th>
                ))}
                <th className="text-right font-bold pb-0.5 pl-2 px-1">R</th>
                <th className="text-right font-normal pb-0.5 px-1">H</th>
                <th className="text-right font-normal pb-0.5 px-1">E</th>
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
                      <td key={inn.num} className="text-right px-1">{inn[side] ?? '–'}</td>
                    ))}
                    <td className="text-right font-bold pl-2 px-1">{team.runs}</td>
                    <td className="text-right px-1">{team.hits}</td>
                    <td className="text-right px-1">{team.errors}</td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        </div>

        {/* Column 2 — Pitching */}
        {hasPitching && (
          <div className="space-y-2">
            <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Pitching</p>
            <PitchingTable pitcherData={pitchers?.away} />
            <PitchingTable pitcherData={pitchers?.home} />
          </div>
        )}

        {/* Column 3 — Hitting */}
        {hasHitting && (
          <div className="space-y-2">
            <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Top Hitters</p>
            <HittingTable hitterData={topHitters?.away} />
            <HittingTable hitterData={topHitters?.home} />
          </div>
        )}

      </div>
    </div>
  );
}
