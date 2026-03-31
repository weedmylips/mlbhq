import { useState } from 'react';
import { useTeamStats, useAnalytics, useHasLiveGame } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';

function statColor(value, leagueAvg, inverse) {
  if (value == null || leagueAvg == null) return '';
  const v = parseFloat(value);
  const avg = parseFloat(leagueAvg);
  if (isNaN(v) || isNaN(avg) || v === avg) return '';
  const isBetter = inverse ? v < avg : v > avg;
  return isBetter ? 'text-green-400' : 'text-red-400';
}

function StatBox({ label, value, rank, leagueAvg, inverse }) {
  const color = statColor(value, leagueAvg, inverse);

  return (
    <div className="text-center">
      <div className={`stat-number text-xl ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
      {rank && (
        <div className="text-[9px] text-white font-semibold mt-0.5 leading-tight">
          {rank} in MLB
        </div>
      )}
    </div>
  );
}

function InfoTip({ text }) {
  return (
    <div className="relative group ml-1.5">
      <span className="text-gray-600 hover:text-gray-400 cursor-help text-xs leading-none">&#9432;</span>
      <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-1 w-56 p-2.5 rounded bg-gray-900 border border-white/10 text-[11px] text-gray-300 leading-relaxed shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-20">
        {text}
      </div>
    </div>
  );
}

function AdvToggle({ active, onChange }) {
  return (
    <div className="flex gap-1 ml-auto">
      {['standard', 'advanced'].map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${
            active === v
              ? 'bg-gray-400/15 text-gray-300 border border-gray-400/30'
              : 'text-gray-500 hover:text-gray-300 border border-transparent'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function PlayerRow({ name, stats }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs py-0.5">
      <span className="text-gray-300 truncate min-w-0">{name}</span>
      <span className="text-gray-500 tabular-nums whitespace-nowrap shrink-0">{stats}</span>
    </div>
  );
}

export default function TeamStats() {
  const { team } = useTeam();
  const hasLiveGame = useHasLiveGame(team.id);
  const { data, isLoading } = useTeamStats(team.id, null, hasLiveGame);
  const { data: advData } = useAnalytics(team.id, null, hasLiveGame);
  const [battingView, setBattingView] = useState('standard');
  const [pitchingView, setPitchingView] = useState('standard');

  if (isLoading) {
    return (
      <>
        <div className="card"><div className="skeleton h-32 w-full" /></div>
        <div className="card"><div className="skeleton h-32 w-full" /></div>
      </>
    );
  }

  if (!data) return null;

  const th = advData?.teamHitting;
  const tp = advData?.teamPitching;
  const ahr = advData?.hittingRanks;
  const apr = advData?.pitchingRanks;
  const lah = data.leagueAvgHitting;
  const lap = data.leagueAvgPitching;
  const alah = advData?.leagueAvgHitting;
  const alap = advData?.leagueAvgPitching;

  return (
    <>
      <div className="card">
        <div className="flex items-center mb-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Team Batting
          </h3>
          <InfoTip text={<><p className="font-semibold text-gray-200 mb-1">Stat Colors</p><p><span className="text-green-400">Green</span> = above MLB average</p><p><span className="text-red-400">Red</span> = below MLB average</p></>} />
          <AdvToggle active={battingView} onChange={setBattingView} />
        </div>

        {battingView === 'standard' ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatBox label="AVG" value={data.hitting.avg} rank={data.hittingRanks?.avg} leagueAvg={lah?.avg} />
            <StatBox label="OPS" value={data.hitting.ops} rank={data.hittingRanks?.ops} leagueAvg={lah?.ops} />
            <StatBox label="HR" value={data.hitting.hr} rank={data.hittingRanks?.hr} leagueAvg={lah?.hr} />
            <StatBox label="Runs" value={data.hitting.runs} rank={data.hittingRanks?.runs} leagueAvg={lah?.runs} />
            <StatBox label="SB" value={data.hitting.sb} rank={data.hittingRanks?.sb} leagueAvg={lah?.sb} />
            <StatBox label="RBI" value={data.hitting.rbi} rank={data.hittingRanks?.rbi} leagueAvg={lah?.rbi} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatBox label="wOBA" value={th?.woba ?? '-'} rank={ahr?.woba} leagueAvg={alah?.woba} />
            <StatBox label="ISO" value={th?.iso ?? '-'} rank={ahr?.iso} leagueAvg={alah?.iso} />
            <StatBox label="BABIP" value={th?.babip ?? '-'} rank={ahr?.babip} leagueAvg={alah?.babip} />
            <StatBox label="K%" value={th?.kPct ? `${th.kPct}%` : '-'} rank={ahr?.kPct} leagueAvg={alah?.kPct} inverse />
            <StatBox label="BB%" value={th?.bbPct ? `${th.bbPct}%` : '-'} rank={ahr?.bbPct} leagueAvg={alah?.bbPct} />
            <StatBox label="SB" value={th?.sb ?? '-'} rank={ahr?.sb} leagueAvg={alah?.sb} />
          </div>
        )}

        {data.topBatters?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Top Batters</div>
            <div>
              {data.topBatters.map((p, i) => (
                <PlayerRow
                  key={i}
                  name={p.name}
                  stats={`${p.avg} · ${p.hr} HR · ${p.rbi} RBI`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="card">
        <div className="flex items-center mb-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Team Pitching
          </h3>
          <InfoTip text={<><p className="font-semibold text-gray-200 mb-1">Stat Colors</p><p><span className="text-green-400">Green</span> = above MLB average</p><p><span className="text-red-400">Red</span> = below MLB average</p><p className="text-gray-500 mt-1">For pitching, lower ERA/WHIP/BB% = green. Higher K/Saves/Wins = green.</p></>} />
          <AdvToggle active={pitchingView} onChange={setPitchingView} />
        </div>

        {pitchingView === 'standard' ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatBox label="ERA" value={data.pitching.era} rank={data.pitchingRanks?.era} leagueAvg={lap?.era} inverse />
            <StatBox label="WHIP" value={data.pitching.whip} rank={data.pitchingRanks?.whip} leagueAvg={lap?.whip} inverse />
            <StatBox label="K" value={data.pitching.k} rank={data.pitchingRanks?.k} leagueAvg={lap?.k} />
            <StatBox label="Saves" value={data.pitching.saves} rank={data.pitchingRanks?.saves} leagueAvg={lap?.saves} />
            <StatBox label="W" value={data.pitching.wins} rank={data.pitchingRanks?.wins} leagueAvg={lap?.wins} />
            <StatBox label="L" value={data.pitching.losses} rank={data.pitchingRanks?.losses} leagueAvg={lap?.losses} inverse />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatBox label="FIP" value={tp?.fip ?? '-'} rank={apr?.fip} leagueAvg={alap?.fip} inverse />
            <StatBox label="BABIP" value={tp?.babip ?? '-'} rank={apr?.babip} leagueAvg={alap?.babip} inverse />
            <StatBox label="K%" value={tp?.kPct ? `${tp.kPct}%` : '-'} rank={apr?.kPct} leagueAvg={alap?.kPct} />
            <StatBox label="BB%" value={tp?.bbPct ? `${tp.bbPct}%` : '-'} rank={apr?.bbPct} leagueAvg={alap?.bbPct} inverse />
            <StatBox label="K-BB%" value={tp?.kBBPct ? `${tp.kBBPct}%` : '-'} rank={apr?.kBBPct} leagueAvg={alap?.kBBPct} />
            <StatBox label="HR/9" value={tp?.hr9 ?? '-'} rank={apr?.hr9} leagueAvg={alap?.hr9} inverse />
          </div>
        )}

        {data.topPitchers?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Top Pitchers</div>
            <div>
              {data.topPitchers.map((p, i) => (
                <PlayerRow
                  key={i}
                  name={p.name}
                  stats={`${p.era} ERA · ${p.wins}-${p.losses} · ${p.k} K`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
