import { useBoxScore } from '../hooks/useTeamData';
import Highlights from './Highlights';

const DECISION_COLORS = { W: 'text-green-400', L: 'text-red-400', SV: 'text-blue-400' };

const TH = 'text-right font-normal pb-0.5 px-2';
const TD = 'text-right px-2';

function PitchingTable({ pitcherData }) {
  if (!pitcherData?.pitchers?.length) return null;
  return (
    <div>
      <table>
        <thead>
          <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
            <th className="text-left font-normal pb-0.5 pr-3 min-w-[80px]"></th>
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
                <span className="truncate block max-w-[80px]">
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
      <table>
        <thead>
          <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
            <th className="text-left font-normal pb-0.5 pr-3 min-w-[80px]"></th>
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
                <span className="truncate block max-w-[80px]">
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

function TeamStatsColumn({ side, pitchers, topHitters }) {
  const pitcherData = pitchers?.[side];
  const hitterData = topHitters?.[side];
  if (!pitcherData?.pitchers?.length && !hitterData?.hitters?.length) return null;
  return (
    <div className="space-y-3">
      <p className="text-gray-400 font-bold">{pitcherData?.abbr || hitterData?.abbr}</p>
      {pitcherData?.pitchers?.length > 0 && (
        <div>
          <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-1">Pitching</p>
          <PitchingTable pitcherData={pitcherData} />
        </div>
      )}
      {hitterData?.hitters?.length > 0 && (
        <div>
          <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-1">Hitting</p>
          <HittingTable hitterData={hitterData} />
        </div>
      )}
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
    <div className="mt-2 pt-2 border-t border-white/10 text-xs space-y-4">

      {/* Line score — centered */}
      <div className="flex justify-center overflow-x-auto">
        <table>
          <thead>
            <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
              <th className="text-left font-normal pb-0.5 pr-3 w-10"></th>
              {innings.map((inn) => (
                <th key={inn.num} className="text-right font-normal pb-0.5 px-1 min-w-[16px]">{inn.num}</th>
              ))}
              <th className="text-right font-bold pb-0.5 pl-3 px-1">R</th>
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
                  <td className="text-left font-semibold py-0.5 pr-3">{team.team?.abbreviation}</td>
                  {innings.map((inn) => (
                    <td key={inn.num} className="text-right px-1">{inn[side] ?? '–'}</td>
                  ))}
                  <td className="text-right font-bold pl-3 px-1">{team.runs}</td>
                  <td className="text-right px-1">{team.hits}</td>
                  <td className="text-right px-1">{team.errors}</td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </div>

      {/* Team columns — away left, home right */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
        <TeamStatsColumn side="away" pitchers={pitchers} topHitters={topHitters} />
        <TeamStatsColumn side="home" pitchers={pitchers} topHitters={topHitters} />
      </div>

      <Highlights gamePk={gamePk} />
    </div>
  );
}
