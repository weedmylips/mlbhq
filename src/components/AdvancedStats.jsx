import { useState } from 'react';
import { useAnalytics, useSituational, useHasLiveGame } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import SituationalStats from './SituationalStats';

function StatCard({ label, value, description }) {
  return (
    <div className="bg-white/[0.02] rounded-lg p-3 text-center">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-mono font-bold mt-1" style={{ color: 'var(--team-highlight)' }}>
        {value ?? '-'}
      </div>
      {description && (
        <div className="text-[10px] text-gray-500 mt-0.5">{description}</div>
      )}
    </div>
  );
}

function PlayerTable({ players, columns, title }) {
  if (!players?.length) return null;

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 text-[10px] border-b border-border">
              <th className="text-left py-1.5 pr-2">Player</th>
              {columns.map((col) => (
                <th key={col.key} className="text-right px-1.5 font-mono" title={col.tooltip}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.slice(0, 10).map((p, i) => (
              <tr key={p.playerId || i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-1.5 pr-2 whitespace-nowrap">
                  <span className="text-gray-500 font-mono mr-1.5">{i + 1}</span>
                  {p.name}
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="text-right px-1.5 font-mono">
                    {p[col.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const BATTER_COLS = [
  { key: 'woba', label: 'wOBA', tooltip: 'Weighted On-Base Average' },
  { key: 'iso', label: 'ISO', tooltip: 'Isolated Power (SLG - AVG)' },
  { key: 'babip', label: 'BABIP', tooltip: 'Batting Average on Balls in Play' },
  { key: 'kPct', label: 'K%', tooltip: 'Strikeout Rate' },
  { key: 'bbPct', label: 'BB%', tooltip: 'Walk Rate' },
  { key: 'avg', label: 'AVG' },
  { key: 'sb', label: 'SB' },
  { key: 'hr', label: 'HR' },
];

const PITCHER_COLS = [
  { key: 'fip', label: 'FIP', tooltip: 'Fielding Independent Pitching' },
  { key: 'babip', label: 'BABIP', tooltip: 'Batting Average on Balls in Play' },
  { key: 'kPct', label: 'K%', tooltip: 'Strikeout Rate' },
  { key: 'bbPct', label: 'BB%', tooltip: 'Walk Rate' },
  { key: 'kBBPct', label: 'K-BB%', tooltip: 'Strikeout minus Walk Rate' },
  { key: 'hr9', label: 'HR/9', tooltip: 'Home Runs per 9 Innings' },
  { key: 'whip', label: 'WHIP' },
  { key: 'ip', label: 'IP' },
];

export default function AdvancedStats() {
  const { team } = useTeam();
  const hasLiveGame = useHasLiveGame(team.id);
  const { data, isLoading } = useAnalytics(team.id, hasLiveGame);
  const { data: sitData, isLoading: sitLoading } = useSituational(team.id, hasLiveGame);
  const [view, setView] = useState('hitting');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="card"><div className="skeleton h-40 w-full" /></div>
        <div className="card"><div className="skeleton h-64 w-full" /></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center py-6">Analytics data unavailable</p>
      </div>
    );
  }

  const th = data.teamHitting;
  const tp = data.teamPitching;

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-card border border-border rounded-lg p-0.5">
          {['hitting', 'pitching', 'situational'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                view === v
                  ? 'bg-[var(--team-primary)]/20 text-[var(--team-highlight)] border border-[var(--team-primary)]/30'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'hitting' && (
        <>
          {/* Team hitting summary */}
          <div className="card">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              Team Hitting — Advanced
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <StatCard label="wOBA" value={th.woba} description="Weighted OBA" />
              <StatCard label="ISO" value={th.iso} description="Isolated Power" />
              <StatCard label="BABIP" value={th.babip} description="Balls in Play" />
              <StatCard label="K%" value={th.kPct ? `${th.kPct}%` : '-'} />
              <StatCard label="BB%" value={th.bbPct ? `${th.bbPct}%` : '-'} />
              <StatCard label="SB" value={th.sb} description="Stolen Bases" />
            </div>
          </div>

          <PlayerTable
            players={data.batters}
            columns={BATTER_COLS}
            title="Batter Advanced Stats"
          />
        </>
      )}

      {view === 'pitching' && (
        <>
          {/* Team pitching summary */}
          <div className="card">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              Team Pitching — Advanced
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              <StatCard label="FIP" value={tp.fip} description="Field Indep. Pitching" />
              <StatCard label="BABIP" value={tp.babip} description="Balls in Play" />
              <StatCard label="K%" value={tp.kPct ? `${tp.kPct}%` : '-'} />
              <StatCard label="BB%" value={tp.bbPct ? `${tp.bbPct}%` : '-'} />
              <StatCard label="K-BB%" value={tp.kBBPct ? `${tp.kBBPct}%` : '-'} description="K% minus BB%" />
              <StatCard label="HR/9" value={tp.hr9} />
              <StatCard label="WHIP" value={tp.whip} />
            </div>
          </div>

          <PlayerTable
            players={data.pitchers}
            columns={PITCHER_COLS}
            title="Pitcher Advanced Stats"
          />
        </>
      )}

      {view === 'situational' && (
        <SituationalStats data={sitData} isLoading={sitLoading} />
      )}
    </div>
  );
}
