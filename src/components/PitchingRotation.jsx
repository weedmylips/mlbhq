import { useTeam } from '../context/TeamContext';
import { useGames, usePlayerDetail } from '../hooks/useTeamData';
import { getTeamById } from '../data/teams';

function StarterRow({ game, teamId }) {
  const isHome = game.teams?.home?.team?.id === teamId;
  const pitcher = isHome
    ? game.teams?.home?.probablePitcher
    : game.teams?.away?.probablePitcher;
  const oppSide = isHome ? game.teams?.away : game.teams?.home;
  const oppTeam = getTeamById(oppSide?.team?.id);

  const { data: playerData } = usePlayerDetail(pitcher?.id);

  const gameDate = new Date(game.gameDate);
  const dayStr = gameDate.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const stats = playerData?.seasonPitching;

  return (
    <div className="flex items-center gap-3 py-2 px-2 rounded bg-white/5">
      <div className="shrink-0 text-center w-12">
        <div className="text-xs font-bold text-gray-300">{dayStr}</div>
        <div className="text-[10px] text-gray-500">{dateStr}</div>
      </div>

      <div className="shrink-0">
        <span className="text-[10px] text-gray-500">{isHome ? 'vs' : '@'}</span>
        {oppTeam && (
          <img src={oppTeam.logo} alt={oppTeam.abbr} className="w-5 h-5 inline ml-1" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {pitcher?.fullName || 'TBD'}
        </div>
        {stats && (
          <div className="text-[11px] text-gray-500 font-mono">
            {stats.era ?? '-'} ERA &middot; {stats.wins ?? 0}-{stats.losses ?? 0} &middot; {stats.strikeOuts ?? 0} K
          </div>
        )}
      </div>
    </div>
  );
}

export default function PitchingRotation() {
  const { team } = useTeam();
  const { data: gamesData, isLoading } = useGames(team.id);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  const allGames = gamesData?.allGames || [];
  const now = new Date();

  // Get upcoming games with probable pitchers assigned
  const rotation = allGames
    .filter((g) => {
      if (g.status?.abstractGameState !== 'Preview') return false;
      if (new Date(g.gameDate) <= now) return false;
      const isHome = g.teams?.home?.team?.id === team.id;
      const pitcher = isHome
        ? g.teams?.home?.probablePitcher
        : g.teams?.away?.probablePitcher;
      return !!pitcher;
    })
    .sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate))
    .slice(0, 5);

  if (rotation.length === 0) return null;

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
        Upcoming Starters
      </h3>
      <div className="space-y-1.5">
        {rotation.map((game) => (
          <StarterRow key={game.gamePk} game={game} teamId={team.id} />
        ))}
      </div>
    </div>
  );
}
