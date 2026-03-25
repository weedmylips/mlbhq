import { useTeamLeaders } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { Trophy } from 'lucide-react';

const HITTING_CATS = new Set(['battingAverage', 'homeRuns', 'runsBattedIn', 'stolenBases']);

function LeaderCategory({ category }) {
  if (!category.leaders?.length) return null;

  const topValue = parseFloat(category.leaders[0]?.value) || 0;
  const isDecimal = category.category === 'battingAverage' || category.category === 'earnedRunAverage';

  return (
    <div>
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {category.label}
      </h4>
      <div className="space-y-1">
        {category.leaders.map((leader, i) => {
          const val = parseFloat(leader.value) || 0;
          const barWidth = topValue > 0 ? Math.max((val / topValue) * 100, 8) : 0;
          // For ERA, invert the bar (lower is better)
          const invertedBar = category.category === 'earnedRunAverage';
          const effectiveWidth = invertedBar
            ? Math.max(100 - (val / (topValue * 2)) * 100, 8)
            : barWidth;

          return (
            <div key={leader.playerId || i} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 w-3 text-right shrink-0">
                {leader.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1 mb-0.5">
                  <span className="text-[11px] text-gray-300 truncate">
                    {leader.name?.split(' ').pop()}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400 shrink-0">
                    {isDecimal ? leader.value : leader.value}
                  </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--team-accent)]/60"
                    style={{ width: `${effectiveWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TeamLeaders() {
  const { team } = useTeam();
  const { data: categories, isLoading } = useTeamLeaders(team.id);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  if (!categories?.length) return null;

  const hitting = categories.filter((c) => HITTING_CATS.has(c.category));
  const pitching = categories.filter((c) => !HITTING_CATS.has(c.category));

  return (
    <div className="card md:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={14} className="text-gray-400" />
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Team Leaders
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {hitting.map((cat) => (
          <LeaderCategory key={cat.category} category={cat} />
        ))}
      </div>
      {pitching.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5">
          {pitching.map((cat) => (
            <LeaderCategory key={cat.category} category={cat} />
          ))}
        </div>
      )}
    </div>
  );
}
