import { useState } from 'react';
import { useRoster } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { AlertCircle, ChevronDown } from 'lucide-react';

export default function InjuryReport() {
  const { team } = useTeam();
  const { data, isLoading } = useRoster(team.id);
  const [expanded, setExpanded] = useState(new Set());

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  const injured = data?.injured || [];

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
        <div className="space-y-1">
          {injured.map((p) => {
            const isOpen = expanded.has(p.name);
            return (
              <div key={p.name} className="rounded overflow-hidden">
                <button
                  onClick={() => toggle(p.name)}
                  className="w-full flex items-center justify-between py-1.5 px-1 text-sm text-left hover:bg-white/5 cursor-pointer rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">{p.name}</span>
                    <span className="text-xs text-gray-500">{p.position}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                      {p.status}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                {isOpen && (
                  <div className="bg-white/5 rounded-b px-3 pb-2 pt-1 text-xs text-gray-400 space-y-1">
                    <div>
                      <span className="text-gray-500">Injury: </span>
                      {p.injury || '—'}
                    </div>
                    <div>
                      <span className="text-gray-500">Expected Return: </span>
                      {p.expectedReturn || '—'}
                    </div>
                    <div>
                      <span className="text-gray-500">Status: </span>
                      {p.note || p.status || '—'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
