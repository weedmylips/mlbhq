import { useTeam } from '../context/TeamContext';
import { useGames } from '../hooks/useTeamData';
import PlayerSearch from './PlayerSearch';

export default function Header() {
  const { team } = useTeam();
  const { data } = useGames(team.id);

  const hasLive = !!data?.live;

  return (
    <div
      className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-lg"
      style={{
        background: `linear-gradient(135deg, ${team.primary} 0%, ${team.primary}dd 50%, ${team.primary}99 100%)`,
        transition: 'background 0.4s ease',
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 rounded-full bg-white/15 flex items-center justify-center">
          <img src={team.logo} alt={team.name} className="w-8 h-8 sm:w-11 sm:h-11 drop-shadow-lg" />
        </div>
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
      <PlayerSearch />
    </div>
  );
}
