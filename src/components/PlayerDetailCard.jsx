import { useState } from 'react';
import { usePlayerDetail } from '../hooks/useTeamData';
import PlayerGameLog from './PlayerGameLog';
import PlayerSplits from './PlayerSplits';

function StatRow({ label, season, career }) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-1 pr-3 text-gray-400 text-xs">{label}</td>
      <td className="text-right font-mono text-xs px-2">{season ?? '-'}</td>
      <td className="text-right font-mono text-xs px-2 text-gray-500">{career ?? '-'}</td>
    </tr>
  );
}

function HittingStats({ season, career }) {
  if (!season && !career) return null;
  return (
    <div>
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
        Hitting
      </h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-600 text-[10px] border-b border-border">
            <th className="text-left py-1">Stat</th>
            <th className="text-right px-2">Season</th>
            <th className="text-right px-2">Career</th>
          </tr>
        </thead>
        <tbody>
          <StatRow label="AVG" season={season?.avg} career={career?.avg} />
          <StatRow label="OBP" season={season?.obp} career={career?.obp} />
          <StatRow label="SLG" season={season?.slg} career={career?.slg} />
          <StatRow label="OPS" season={season?.ops} career={career?.ops} />
          <StatRow label="HR" season={season?.homeRuns} career={career?.homeRuns} />
          <StatRow label="RBI" season={season?.rbi} career={career?.rbi} />
          <StatRow label="SB" season={season?.stolenBases} career={career?.stolenBases} />
          <StatRow label="H" season={season?.hits} career={career?.hits} />
          <StatRow label="AB" season={season?.atBats} career={career?.atBats} />
        </tbody>
      </table>
    </div>
  );
}

function PitchingStats({ season, career }) {
  if (!season && !career) return null;
  return (
    <div>
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
        Pitching
      </h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-600 text-[10px] border-b border-border">
            <th className="text-left py-1">Stat</th>
            <th className="text-right px-2">Season</th>
            <th className="text-right px-2">Career</th>
          </tr>
        </thead>
        <tbody>
          <StatRow label="ERA" season={season?.era} career={career?.era} />
          <StatRow label="WHIP" season={season?.whip} career={career?.whip} />
          <StatRow label="W-L" season={season ? `${season.wins}-${season.losses}` : null} career={career ? `${career.wins}-${career.losses}` : null} />
          <StatRow label="K" season={season?.strikeOuts} career={career?.strikeOuts} />
          <StatRow label="IP" season={season?.inningsPitched} career={career?.inningsPitched} />
          <StatRow label="SV" season={season?.saves} career={career?.saves} />
          <StatRow label="BB" season={season?.baseOnBalls} career={career?.baseOnBalls} />
          <StatRow label="K/9" season={season?.strikeoutsPer9Inn} career={career?.strikeoutsPer9Inn} />
        </tbody>
      </table>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'gamelog', label: 'Game Log' },
  { id: 'splits', label: 'Splits' },
];

export default function PlayerDetailCard({ playerId }) {
  const { data: player, isLoading } = usePlayerDetail(playerId);
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="py-3 px-4">
        <div className="skeleton h-32 w-full rounded" />
      </div>
    );
  }

  if (!player) return null;

  const isPitcher = player.positionCode === '1' || player.position === 'P';

  const headshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${player.id}/headshot/67/current`;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white/[0.03] border-t border-border px-4 py-4">
      {/* Bio header - always visible */}
      <div className="flex gap-3 mb-3">
        <img
          src={headshotUrl}
          alt={player.fullName}
          className="w-16 h-16 rounded-lg bg-white/[0.02] object-cover shrink-0"
        />
        <div className="min-w-0">
          <h3 className="text-sm font-bold truncate">{player.fullName}</h3>
          <p className="text-xs text-gray-400">
            #{player.number} {player.position}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
            {player.batSide && <span>B: {player.batSide}</span>}
            {player.pitchHand && <span>T: {player.pitchHand}</span>}
            {player.age && <span>Age {player.age}</span>}
            {player.height && <span>{player.height}, {player.weight} lbs</span>}
            {player.debutDate && <span>Debut: {formatDate(player.debutDate)}</span>}
            {player.birthCity && <span>{player.birthCity}, {player.birthCountry}</span>}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-0.5 border-b border-border mb-3">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-3 py-1.5 text-[11px] font-medium transition-colors relative ${
              activeTab === id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
            {activeTab === id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: 'var(--team-highlight)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Position players: always show hitting, only show pitching if they pitched this season */}
          {/* Pitchers: always show pitching, only show hitting if they hit this season */}
          {(!isPitcher || player.seasonHitting) && (
            <HittingStats season={player.seasonHitting} career={!isPitcher ? player.careerHitting : null} />
          )}
          {(isPitcher || player.seasonPitching) && (
            <PitchingStats season={player.seasonPitching} career={isPitcher ? player.careerPitching : null} />
          )}
        </div>
      )}

      {activeTab === 'gamelog' && (
        <PlayerGameLog gameLog={player.gameLog} isPitcher={isPitcher} />
      )}

      {activeTab === 'splits' && (
        <PlayerSplits splits={player.splits} isPitcher={isPitcher} />
      )}
    </div>
  );
}
