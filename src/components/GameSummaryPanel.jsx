import { useBoxScore } from '../hooks/useTeamData';
import Highlights from './Highlights';

const DECISION_COLORS = { W: 'text-green-400', L: 'text-red-400', SV: 'text-blue-400' };

const TH = 'text-right font-normal pb-0.5 px-2';
const TD = 'text-right px-2';

const isQualityStart = (p) => parseFloat(p.stats.ip) >= 6.0 && p.stats.er <= 3;

function PitchingTable({ pitcherData }) {
  if (!pitcherData?.pitchers?.length) return null;
  return (
    <div>
      <table>
        <thead>
          <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
            <th className="text-left font-normal pb-0.5 pr-3 min-w-[100px]"></th>
            <th className={TH}>IP</th>
            <th className={TH}>H</th>
            <th className={TH}>ER</th>
            <th className={TH}>BB</th>
            <th className={TH}>K</th>
          </tr>
        </thead>
        <tbody>
          {pitcherData.pitchers.map((p, i) => (
            <tr key={i} className={`text-gray-300 ${i % 2 === 1 ? 'bg-white/[0.03]' : ''}`}>
              <td className="text-left py-0.5 pr-3">
                <span className={`truncate block max-w-[100px] ${isQualityStart(p) ? 'text-green-300' : ''}`}>
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
            <th className="text-left font-normal pb-0.5 pr-3 min-w-[100px]"></th>
            <th className={TH}>AB</th>
            <th className={TH}>H</th>
            <th className={TH}>RBI</th>
            <th className={TH}>HR</th>
            <th className={TH}>BB</th>
          </tr>
        </thead>
        <tbody>
          {hitterData.hitters.map((h, i) => (
            <tr key={i} className={`text-gray-300 ${i % 2 === 1 ? 'bg-white/[0.03]' : ''}`}>
              <td className="text-left py-0.5 pr-3">
                <span className="truncate block max-w-[100px]">
                  {h.name.split(' ').slice(-1)[0]}
                </span>
              </td>
              <td className={TD}>{h.ab}</td>
              <td className={`${TD} ${h.h >= 2 ? 'text-white font-medium' : ''}`}>{h.h}</td>
              <td className={`${TD} ${h.rbi >= 3 ? 'text-white font-medium' : ''}`}>{h.rbi}</td>
              <td className={`${TD} ${h.hr > 0 ? 'text-yellow-400 font-bold' : ''}`}>{h.hr}</td>
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
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1 h-4 rounded-full ${side === 'home' ? 'bg-[var(--team-primary)]' : 'bg-gray-500'}`} />
        <span className="text-gray-200 font-bold text-xs tracking-wide uppercase">
          {pitcherData?.abbr || hitterData?.abbr}
        </span>
      </div>
      {pitcherData?.pitchers?.length > 0 && (
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-[10px] font-bold mb-1 flex items-center gap-1">
            <span className="w-2 h-px bg-gray-500 inline-block" />
            Pitching
          </p>
          <PitchingTable pitcherData={pitcherData} />
        </div>
      )}
      {hitterData?.hitters?.length > 0 && (
        <div className={pitcherData?.pitchers?.length > 0 ? 'mt-2 pt-2 border-t border-white/5' : ''}>
          <p className="text-gray-400 uppercase tracking-wider text-[10px] font-bold mb-1 flex items-center gap-1">
            <span className="w-2 h-px bg-gray-500 inline-block" />
            Hitting
          </p>
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
    <div className="mt-2 pt-2 border-t border-white/10 text-xs space-y-3">

      {/* Line score — centered */}
      <div className="flex justify-center overflow-x-auto">
        <table className="font-mono">
          <thead>
            <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
              <th className="text-left font-normal pb-0.5 pr-3 w-10 font-sans"></th>
              {innings.map((inn) => (
                <th key={inn.num} className="text-center font-normal pb-0.5 px-1 min-w-[20px]">{inn.num}</th>
              ))}
              <th className="text-center font-bold pb-0.5 pl-2 px-1 border-l border-white/10">R</th>
              <th className="text-center font-normal pb-0.5 px-1">H</th>
              <th className="text-center font-normal pb-0.5 px-1">E</th>
            </tr>
          </thead>
          <tbody>
            {[
              { side: 'away', team: away },
              { side: 'home', team: home },
            ].map(({ side, team }) => {
              const isWinner = side === 'away'
                ? away?.runs > home?.runs
                : home?.runs > away?.runs;
              return team ? (
                <tr key={side} className="text-gray-300">
                  <td className="text-left font-semibold py-0.5 pr-3 text-gray-400 font-sans">{team.team?.abbreviation}</td>
                  {innings.map((inn) => (
                    <td key={inn.num} className="text-center px-1">{inn[side] ?? '–'}</td>
                  ))}
                  <td className={`text-center pl-2 px-1 border-l border-white/10 font-bold ${isWinner ? 'text-white' : 'text-gray-400'}`}>{team.runs}</td>
                  <td className="text-center px-1">{team.hits}</td>
                  <td className="text-center px-1">{team.errors}</td>
                </tr>
              ) : null;
            })}
          </tbody>
        </table>
      </div>

      {/* Team columns — away left, home right */}
      <div className="bg-white/[0.02] rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
        <TeamStatsColumn side="away" pitchers={pitchers} topHitters={topHitters} />
        <TeamStatsColumn side="home" pitchers={pitchers} topHitters={topHitters} />
      </div>

      <Highlights gamePk={gamePk} />
    </div>
  );
}
