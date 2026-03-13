import { useBoxScore } from '../hooks/useTeamData';

const DECISION_COLORS = { W: 'text-green-400', L: 'text-red-400', SV: 'text-blue-400' };

const STAT_HEADER_CLASSES = 'text-right font-normal pb-0.5 w-8';
const STAT_CELL_CLASSES = 'text-right w-8';

function PitchingTable({ pitcherData }) {
  if (!pitcherData?.pitchers?.length) return null;
  return (
    <div>
      <p className="text-gray-400 font-semibold mb-0.5">{pitcherData.abbr}</p>
      <table className="w-full">
        <thead>
          <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
            <th className="text-left font-normal pb-0.5"></th>
            <th className={STAT_HEADER_CLASSES}>IP</th>
            <th className={STAT_HEADER_CLASSES}>H</th>
            <th className={STAT_HEADER_CLASSES}>ER</th>
            <th className={STAT_HEADER_CLASSES}>BB</th>
            <th className={STAT_HEADER_CLASSES}>K</th>
          </tr>
        </thead>
        <tbody>
          {pitcherData.pitchers.map((p, i) => (
            <tr key={i} className="text-gray-300">
              <td className="text-left py-0.5 pr-2">
                <span className="truncate block max-w-[110px]">
                  {p.decision && (
                    <span className={`font-bold mr-1 ${DECISION_COLORS[p.decision] ?? ''}`}>
                      {p.decision}
                    </span>
                  )}
                  {p.name.split(' ').slice(-1)[0]}
                </span>
              </td>
              <td className={`${STAT_CELL_CLASSES} font-mono`}>{p.stats.ip}</td>
              <td className={STAT_CELL_CLASSES}>{p.stats.h}</td>
              <td className={STAT_CELL_CLASSES}>{p.stats.er}</td>
              <td className={STAT_CELL_CLASSES}>{p.stats.bb}</td>
              <td className={STAT_CELL_CLASSES}>{p.stats.so}</td>
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
      <table className="w-full">
        <thead>
          <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
            <th className="text-left font-normal pb-0.5"></th>
            <th className={STAT_HEADER_CLASSES}>AB</th>
            <th className={STAT_HEADER_CLASSES}>H</th>
            <th className={STAT_HEADER_CLASSES}>RBI</th>
            <th className={STAT_HEADER_CLASSES}>HR</th>
            <th className={STAT_HEADER_CLASSES}>BB</th>
          </tr>
        </thead>
        <tbody>
          {hitterData.hitters.map((h, i) => (
            <tr key={i} className="text-gray-300">
              <td className="text-left py-0.5 pr-2">
                <span className="truncate block max-w-[110px]">
                  {h.name.split(' ').slice(-1)[0]}
                </span>
              </td>
              <td className={STAT_CELL_CLASSES}>{h.ab}</td>
              <td className={STAT_CELL_CLASSES}>{h.h}</td>
              <td className={STAT_CELL_CLASSES}>{h.rbi}</td>
              <td className={STAT_CELL_CLASSES}>{h.hr}</td>
              <td className={STAT_CELL_CLASSES}>{h.bb}</td>
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
                    <td key={inn.num} className="text-right w-5">{inn[side] ?? '–'}</td>
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

      {/* Pitching — two team sections */}
      {(pitchers?.away?.pitchers?.length > 0 || pitchers?.home?.pitchers?.length > 0) && (
        <div className="space-y-2">
          <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Pitching</p>
          <PitchingTable pitcherData={pitchers?.away} />
          <PitchingTable pitcherData={pitchers?.home} />
        </div>
      )}

      {/* Hitting — two team sections */}
      {(topHitters?.away?.hitters?.length > 0 || topHitters?.home?.hitters?.length > 0) && (
        <div className="space-y-2">
          <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Top Hitters</p>
          <HittingTable hitterData={topHitters?.away} />
          <HittingTable hitterData={topHitters?.home} />
        </div>
      )}

    </div>
  );
}
