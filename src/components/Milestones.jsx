import { useTeam } from '../context/TeamContext';
import { useTeamStats } from '../hooks/useTeamData';
import { Trophy } from 'lucide-react';

export default function Milestones() {
  const { team } = useTeam();
  const { data } = useTeamStats(team.id);

  const milestones = [];
  if (data) {
    const hr = Number(data.hitting.hr);
    const k = Number(data.pitching.k);
    const sb = Number(data.hitting.sb);
    const wins = Number(data.pitching.wins);

    if (hr > 0) milestones.push({ label: 'Home Runs', value: hr, target: Math.ceil(hr / 50) * 50 });
    if (k > 0) milestones.push({ label: 'Strikeouts', value: k, target: Math.ceil(k / 100) * 100 });
    if (sb > 0) milestones.push({ label: 'Stolen Bases', value: sb, target: Math.ceil(sb / 25) * 25 });
    if (wins > 0) milestones.push({ label: 'Wins', value: wins, target: Math.ceil(wins / 25) * 25 });
  }

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Trophy size={14} className="text-[var(--team-accent)]" />
        Milestones
      </h3>
      {milestones.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          Season stats loading...
        </p>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const pct = Math.min((m.value / m.target) * 100, 100);
            return (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{m.label}</span>
                  <span className="font-mono">
                    {m.value}/{m.target}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, var(--team-primary), var(--team-accent))`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
