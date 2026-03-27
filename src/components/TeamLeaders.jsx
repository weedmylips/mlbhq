import { useState } from 'react';
import { useTeamLeaders, useLeagueLeaders, useHasLiveGame } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { Swords, Flame } from 'lucide-react';

// Stats where lower is better
const INVERSE_STATS = new Set(['earnedRunAverage', 'walksAndHitsPerInningPitched', 'strikeoutRate']);

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

function LeaderCategory({ category, showTeam }) {
  if (!category.leaders?.length) return null;

  const isInverse = INVERSE_STATS.has(category.category);
  const values = category.leaders.map((l) => parseFloat(l.value) || 0);
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
                  {leader.name}
                  {showTeam && leader.teamAbbr && (
                    <span className="text-[9px] text-gray-600 ml-1">{leader.teamAbbr}</span>
                  )}
                </span>
                <span
                  className={`text-[11px] font-mono shrink-0 font-medium ${
                    i === 0 ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  {leader.value}
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

function ViewToggle({ active, onChange }) {
  return (
    <div className="flex gap-1 mb-3">
      {['traditional', 'advanced'].map((view) => (
        <button
          key={view}
          onClick={() => onChange(view)}
          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${
            active === view
              ? 'bg-gray-400/15 text-gray-300 border border-gray-400/30'
              : 'text-gray-500 hover:text-gray-300 border border-transparent'
          }`}
        >
          {view}
        </button>
      ))}
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
  const HITTING_KEYS = new Set(['battingAverage', 'homeRuns', 'runsBattedIn', 'stolenBases', 'onBasePercentage', 'strikeouts',
    'onBasePlusSlugging', 'sluggingPercentage', 'isolatedPower', 'strikeoutRate', 'walksPerPlateAppearance']);
  const ADV_HITTING_KEYS = new Set(['onBasePlusSlugging', 'sluggingPercentage', 'isolatedPower', 'strikeoutRate', 'walksPerPlateAppearance']);
  const ADV_PITCHING_KEYS = new Set(['walksAndHitsPerInningPitched', 'strikeoutWalkRatio', 'groundOutsToAirouts']);

  const hasGroupField = categories.some((c) => c.group);
  return categories.map((c) => {
    if (hasGroupField && c.group) return c;
    const isHitting = HITTING_KEYS.has(c.category);
    const isAdvanced = isHitting ? ADV_HITTING_KEYS.has(c.category) : ADV_PITCHING_KEYS.has(c.category);
    return { ...c, group: isHitting ? 'hitting' : 'pitching', type: isAdvanced ? 'advanced' : 'traditional' };
  });
}

function LeadersGrid({ categories, hittingView, setHittingView, pitchingView, setPitchingView, showTeam }) {
  const classified = classifyCategories(categories);

  const hittingDisplay = classified.filter((c) => c.group === 'hitting' && c.type === hittingView);
  const pitchingDisplay = classified.filter((c) => c.group === 'pitching' && c.type === pitchingView);
  const hasAdvHitting = classified.some((c) => c.group === 'hitting' && c.type === 'advanced');
  const hasAdvPitching = classified.some((c) => c.group === 'pitching' && c.type === 'advanced');
  const allHitting = classified.filter((c) => c.group === 'hitting');
  const allPitching = classified.filter((c) => c.group === 'pitching');

  return (
    <div className="space-y-6">
      {allHitting.length > 0 && (
        <div className="card">
          <SectionHeader icon={Swords} label="Batting Leaders" />
          {hasAdvHitting && <ViewToggle active={hittingView} onChange={setHittingView} />}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {hittingDisplay.map((cat) => (
              <LeaderCategory key={cat.category} category={cat} showTeam={showTeam} />
            ))}
          </div>
        </div>
      )}
      {allPitching.length > 0 && (
        <div className="card">
          <SectionHeader icon={Flame} label="Pitching Leaders" />
          {hasAdvPitching && <ViewToggle active={pitchingView} onChange={setPitchingView} />}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {pitchingDisplay.map((cat) => (
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
  const [scope, setScope] = useState('team');
  const [hittingView, setHittingView] = useState('traditional');
  const [pitchingView, setPitchingView] = useState('traditional');

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
    <div>
      <ScopeToggle active={scope} onChange={setScope} />
      {categories?.length > 0 ? (
        <LeadersGrid
          categories={categories}
          hittingView={hittingView}
          setHittingView={setHittingView}
          pitchingView={pitchingView}
          setPitchingView={setPitchingView}
          showTeam={scope === 'league'}
        />
      ) : (
        <div className="card">
          <p className="text-gray-500 text-center py-8">No leader data available</p>
        </div>
      )}
    </div>
  );
}
