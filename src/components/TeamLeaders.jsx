import { useTeamLeaders } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { Swords, Flame } from 'lucide-react';

const HITTING_CATS = new Set(['battingAverage', 'homeRuns', 'runsBattedIn', 'stolenBases', 'strikeouts']);

function LeaderCategory({ category }) {
  if (!category.leaders?.length) return null;

  return (
    <div className="bg-[rgba(var(--team-primary-rgb),0.03)] rounded-lg p-3">
      <h4 className="text-[11px] font-bold text-[var(--team-accent)] uppercase tracking-wider mb-2">
        {category.label}
      </h4>
      <div className="space-y-1.5">
        {category.leaders.map((leader, i) => (
            <div key={leader.playerId || i} className="flex items-center gap-2">
              <span
                className={`text-[10px] w-3 text-right shrink-0 font-mono ${
                  i === 0 ? 'text-[var(--team-accent)]' : 'text-gray-600'
                }`}
              >
                {leader.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <span
                    className={`text-[11px] truncate ${
                      i === 0 ? 'text-gray-200 font-medium' : 'text-gray-400'
                    }`}
                  >
                    {leader.name}
                  </span>
                  <span
                    className={`text-[11px] font-mono shrink-0 ${
                      i === 0 ? 'text-gray-200' : 'text-gray-500'
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
      <Icon size={14} className="text-[var(--team-accent)]" />
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </h3>
      <div className="flex-1 h-px bg-[var(--team-divider)]" />
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
    <div className="space-y-6">
      {hitting.length > 0 && (
        <div className="card">
          <SectionHeader icon={Swords} label="Batting Leaders" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {hitting.map((cat) => (
              <LeaderCategory key={cat.category} category={cat} />
            ))}
          </div>
        </div>
      )}
      {pitching.length > 0 && (
        <div className="card">
          <SectionHeader icon={Flame} label="Pitching Leaders" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pitching.map((cat) => (
              <LeaderCategory key={cat.category} category={cat} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
