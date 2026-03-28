import { useState } from 'react';
import { useTeamLeaders, useLeagueLeaders, useSituational, useHasLiveGame } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { Swords, Flame } from 'lucide-react';
import SituationalStats from './SituationalStats';

// Stats where lower is better
const INVERSE_STATS = new Set(['earnedRunAverage', 'walksAndHitsPerInningPitched', 'strikeoutRate']);

// Guard against null/undefined/NaN display values (e.g. K/BB with zero walks)
function sanitizeValue(value) {
  if (value == null) return '—';
  const s = String(value);
  if (s === '-.--' || s === '-.-' || s === 'NaN' || s === 'Infinity' || s.includes('∞')) return '—';
  return s;
}

function playerHeadshot(playerId) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <span className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[10px] font-bold flex items-center justify-center shrink-0">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="w-5 h-5 rounded-full bg-gray-400/15 border border-gray-400/30 text-gray-400 text-[10px] font-bold flex items-center justify-center shrink-0">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="w-5 h-5 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-600 text-[10px] font-bold flex items-center justify-center shrink-0">
        3
      </span>
    );
  }
  return (
    <span className="w-5 h-5 text-[10px] text-gray-600 font-mono flex items-center justify-center shrink-0">
      {rank}
    </span>
  );
}

function abbrevName(name) {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length < 2) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

function LeaderCategory({ category, showTeam }) {
  if (!category.leaders?.length) return null;

  const isInverse = INVERSE_STATS.has(category.category);
  const values = category.leaders.map((l) => {
    const v = parseFloat(l.value);
    return isFinite(v) ? v : 0;
  });
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values.filter((v) => v > 0));

  function barWidth(value) {
    const v = parseFloat(value) || 0;
    if (maxVal === 0) return 0;
    if (isInverse) {
      if (minVal === 0 || maxVal === 0) return 0;
      return Math.max(10, (minVal / v) * 100);
    }
    return Math.max(10, (v / maxVal) * 100);
  }

  return (
    <div className="bg-white/[0.02] rounded-lg p-3">
      <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
        {category.label}
      </h4>
      <div className="space-y-1">
        {category.leaders.map((leader, i) => (
          <div key={leader.playerId || i} className="relative flex items-center gap-1.5 py-1 px-1 rounded overflow-hidden">
            {/* Bar chart background */}
            <div
              className="absolute inset-0 rounded opacity-[0.07]"
              style={{
                width: `${barWidth(leader.value)}%`,
                background: '#9ca3af',
              }}
            />

            <RankBadge rank={leader.rank} />

            <img
              src={playerHeadshot(leader.playerId)}
              alt=""
              className="w-6 h-6 rounded-full object-cover bg-gray-800 shrink-0"
            />

            <div className="flex-1 min-w-0 relative">
              <div className="flex items-baseline justify-between gap-1">
                <span
                  className={`text-[11px] truncate ${
                    i === 0 ? 'text-gray-200 font-medium' : 'text-gray-400'
                  }`}
                >
                  {abbrevName(leader.name)}
                  {showTeam && leader.teamAbbr && (
                    <span className="text-[9px] text-gray-600 ml-1">{leader.teamAbbr}</span>
                  )}
                  {!showTeam && i < 3 && leader.leagueRank && (
                    <span className="text-[8px] text-gray-500 bg-white/[0.06] border border-white/[0.08] rounded-full px-1.5 py-px ml-1 font-mono">
                      #{leader.leagueRank}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[11px] font-mono shrink-0 font-medium ${
                    i === 0 ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  {sanitizeValue(leader.value)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-gray-400" />
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </h3>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}


function ScopeToggle({ active, onChange }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex bg-card border border-border rounded-lg p-0.5">
        {[{ key: 'team', label: 'Team' }, { key: 'league', label: 'League' }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              active === key
                ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function classifyCategories(categories) {
  // Server already provides group/type — use as-is if present, otherwise classify
  const HITTING_KEYS = new Set(['battingAverage', 'homeRuns', 'runsBattedIn', 'hits', 'runs', 'stolenBases',
    'walks', 'strikeouts', 'onBasePercentage', 'sluggingPercentage', 'onBasePlusSlugging']);

  const hasGroupField = categories.some((c) => c.group);
  return categories.map((c) => {
    if (hasGroupField && c.group) return c;
    const isHitting = HITTING_KEYS.has(c.category);
    return { ...c, group: isHitting ? 'hitting' : 'pitching', type: 'traditional' };
  });
}

function LeadersGrid({ categories, showTeam }) {
  const classified = classifyCategories(categories);
  const hitting = classified.filter((c) => c.group === 'hitting');
  const pitching = classified.filter((c) => c.group === 'pitching');

  return (
    <div className="space-y-6">
      {hitting.length > 0 && (
        <div className="card">
          <SectionHeader icon={Swords} label="Batting Leaders" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {hitting.map((cat) => (
              <LeaderCategory key={cat.category} category={cat} showTeam={showTeam} />
            ))}
          </div>
        </div>
      )}
      {pitching.length > 0 && (
        <div className="card">
          <SectionHeader icon={Flame} label="Pitching Leaders" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {pitching.map((cat) => (
              <LeaderCategory key={cat.category} category={cat} showTeam={showTeam} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamLeaders() {
  const { team } = useTeam();
  const hasLiveGame = useHasLiveGame(team.id);
  const { data: teamCategories, isLoading: teamLoading } = useTeamLeaders(team.id, hasLiveGame);
  const { data: leagueCategories, isLoading: leagueLoading } = useLeagueLeaders(hasLiveGame);
  const { data: sitData, isLoading: sitLoading } = useSituational(team.id, hasLiveGame);
  const [scope, setScope] = useState('team');

  const isLoading = scope === 'team' ? teamLoading : leagueLoading;
  const categories = scope === 'team' ? teamCategories : leagueCategories;

  if (isLoading) {
    return (
      <div>
        <ScopeToggle active={scope} onChange={setScope} />
        <div className="card">
          <div className="skeleton h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <ScopeToggle active={scope} onChange={setScope} />
        {categories?.length > 0 ? (
          <LeadersGrid
            categories={categories}
            showTeam={scope === 'league'}
          />
        ) : (
          <div className="card">
            <p className="text-gray-500 text-center py-8">No leader data available</p>
          </div>
        )}
      </div>

      {/* Situational Splits — team scope only */}
      {scope === 'team' && <SituationalStats data={sitData} isLoading={sitLoading} />}
    </div>
  );
}
