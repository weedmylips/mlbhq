import { useTeam } from '../context/TeamContext';
import { useGames } from '../hooks/useTeamData';

export default function Header() {
  const { team } = useTeam();
  const { data } = useGames(team.id);

  const hasLive = !!data?.live;

  return (
    <div
      className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between"
      style={{
        background: `linear-gradient(135deg, ${team.primary} 0%, ${team.primary}dd 50%, ${team.primary}99 100%)`,
        transition: 'background 0.4s ease',
      }}
    >
      <div className="flex items-center gap-4">
        <img src={team.logo} alt={team.name} className="w-10 h-10 sm:w-14 sm:h-14 shrink-0" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.3)) drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }} />
        <div>
          <h1
            className="text-lg sm:text-2xl font-serif font-bold leading-tight"
            style={{ color: team.textColor }}
          >
            {team.name}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {hasLive && (
              <span className="flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                <span className="w-2 h-2 bg-white rounded-full live-dot" />
                LIVE
              </span>
            )}
            <span
              className="text-xs sm:text-sm opacity-80 truncate"
              style={{ color: team.textColor }}
            >
              {team.division} &middot; <span className="hidden sm:inline">{team.stadium}</span><span className="sm:hidden">{team.abbr}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
