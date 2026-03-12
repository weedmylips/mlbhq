import { useTeam } from '../context/TeamContext';
import { useGames } from '../hooks/useTeamData';
import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header() {
  const { team } = useTeam();
  const { data } = useGames(team.id);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hasLive = !!data?.live;

  return (
    <div
      className="px-6 py-4 flex items-center justify-between"
      style={{
        background: `linear-gradient(135deg, ${team.primary} 0%, ${team.primary}dd 50%, ${team.primary}99 100%)`,
        transition: 'background 0.4s ease',
      }}
    >
      <div className="flex items-center gap-4">
        <img src={team.logo} alt={team.name} className="w-14 h-14 drop-shadow-lg" />
        <div>
          <h1
            className="text-2xl font-serif font-bold"
            style={{ color: team.textColor }}
          >
            {team.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {hasLive && (
              <span className="flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                <span className="w-2 h-2 bg-white rounded-full live-dot" />
                LIVE
              </span>
            )}
            <span
              className="text-sm opacity-80"
              style={{ color: team.textColor }}
            >
              {team.division} &middot; {team.stadium}
            </span>
          </div>
        </div>
      </div>
      <div
        className="flex items-center gap-2 text-sm opacity-80"
        style={{ color: team.textColor }}
      >
        <Clock size={16} />
        {time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
        })}
      </div>
    </div>
  );
}
