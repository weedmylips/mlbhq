import { useState } from 'react';
import { useTeamStats, useAnalytics, useHasLiveGame } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';

function StatBox({ label, value, rank, leagueAbbr }) {
  return (
    <div className="text-center">
      <div className="stat-number text-xl">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
      {rank && leagueAbbr && (
        <div className="text-[9px] text-white font-semibold mt-0.5 leading-tight">
          {rank} in {leagueAbbr}
        </div>
      )}
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
  const leagueId = team.league === 'AL' ? 103 : 104;
  const hasLiveGame = useHasLiveGame(team.id);
  const { data, isLoading } = useTeamStats(team.id, leagueId, hasLiveGame);
  const { data: advData } = useAnalytics(team.id, leagueId, hasLiveGame);
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

  const leagueAbbr = team.league;
  const th = advData?.teamHitting;
  const tp = advData?.teamPitching;
  const ahr = advData?.hittingRanks;
  const apr = advData?.pitchingRanks;

  return (
    <>
      <div className="card">
        <div className="flex items-center mb-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Team Batting
          </h3>
          <AdvToggle active={battingView} onChange={setBattingView} />
        </div>

        {battingView === 'standard' ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatBox label="AVG" value={data.hitting.avg} rank={data.hittingRanks?.avg} leagueAbbr={leagueAbbr} />
            <StatBox label="OPS" value={data.hitting.ops} rank={data.hittingRanks?.ops} leagueAbbr={leagueAbbr} />
            <StatBox label="HR" value={data.hitting.hr} rank={data.hittingRanks?.hr} leagueAbbr={leagueAbbr} />
            <StatBox label="Runs" value={data.hitting.runs} rank={data.hittingRanks?.runs} leagueAbbr={leagueAbbr} />
            <StatBox label="SB" value={data.hitting.sb} rank={data.hittingRanks?.sb} leagueAbbr={leagueAbbr} />
            <StatBox label="RBI" value={data.hitting.rbi} rank={data.hittingRanks?.rbi} leagueAbbr={leagueAbbr} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatBox label="wOBA" value={th?.woba ?? '-'} rank={ahr?.woba} leagueAbbr={leagueAbbr} />
            <StatBox label="ISO" value={th?.iso ?? '-'} rank={ahr?.iso} leagueAbbr={leagueAbbr} />
            <StatBox label="BABIP" value={th?.babip ?? '-'} rank={ahr?.babip} leagueAbbr={leagueAbbr} />
            <StatBox label="K%" value={th?.kPct ? `${th.kPct}%` : '-'} rank={ahr?.kPct} leagueAbbr={leagueAbbr} />
            <StatBox label="BB%" value={th?.bbPct ? `${th.bbPct}%` : '-'} rank={ahr?.bbPct} leagueAbbr={leagueAbbr} />
            <StatBox label="SB" value={th?.sb ?? '-'} rank={ahr?.sb} leagueAbbr={leagueAbbr} />
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
          <AdvToggle active={pitchingView} onChange={setPitchingView} />
        </div>

        {pitchingView === 'standard' ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatBox label="ERA" value={data.pitching.era} rank={data.pitchingRanks?.era} leagueAbbr={leagueAbbr} />
            <StatBox label="WHIP" value={data.pitching.whip} rank={data.pitchingRanks?.whip} leagueAbbr={leagueAbbr} />
            <StatBox label="K" value={data.pitching.k} rank={data.pitchingRanks?.k} leagueAbbr={leagueAbbr} />
            <StatBox label="Saves" value={data.pitching.saves} rank={data.pitchingRanks?.saves} leagueAbbr={leagueAbbr} />
            <StatBox label="W" value={data.pitching.wins} rank={data.pitchingRanks?.wins} leagueAbbr={leagueAbbr} />
            <StatBox label="L" value={data.pitching.losses} rank={data.pitchingRanks?.losses} leagueAbbr={leagueAbbr} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatBox label="FIP" value={tp?.fip ?? '-'} rank={apr?.fip} leagueAbbr={leagueAbbr} />
            <StatBox label="BABIP" value={tp?.babip ?? '-'} rank={apr?.babip} leagueAbbr={leagueAbbr} />
            <StatBox label="K%" value={tp?.kPct ? `${tp.kPct}%` : '-'} rank={apr?.kPct} leagueAbbr={leagueAbbr} />
            <StatBox label="BB%" value={tp?.bbPct ? `${tp.bbPct}%` : '-'} rank={apr?.bbPct} leagueAbbr={leagueAbbr} />
            <StatBox label="K-BB%" value={tp?.kBBPct ? `${tp.kBBPct}%` : '-'} rank={apr?.kBBPct} leagueAbbr={leagueAbbr} />
            <StatBox label="HR/9" value={tp?.hr9 ?? '-'} rank={apr?.hr9} leagueAbbr={leagueAbbr} />
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
