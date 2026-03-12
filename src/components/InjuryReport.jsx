import { useRoster } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { AlertCircle } from 'lucide-react';

export default function InjuryReport() {
  const { team } = useTeam();
  const { data, isLoading } = useRoster(team.id);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  const injured = (data?.full || []).filter(
    (p) => p.status && p.status !== 'Active'
  );

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <AlertCircle size={14} className="text-red-400" />
        Injury Report
      </h3>
      {injured.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          No players on the injured list
        </p>
      ) : (
        <div className="space-y-2">
          {injured.slice(0, 8).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between py-1 text-sm"
            >
              <div>
                <span className="text-gray-300">{p.name}</span>
                <span className="text-xs text-gray-500 ml-2">{p.position}</span>
              </div>
              <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
