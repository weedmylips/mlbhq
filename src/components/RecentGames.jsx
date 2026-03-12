import { useTeam } from '../context/TeamContext';
import { getTeamById } from '../data/teams';

export default function RecentGames({ games = [] }) {
  const { team } = useTeam();
  const last5 = games.slice(0, 5);

  return (
    <div className="card md:col-span-2">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
        Recent Games
      </h3>
      {last5.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent games</p>
      ) : (
        <div className="space-y-2">
          {last5.map((game) => {
            const isHome = game.teams?.home?.team?.id === team.id;
            const teamScore = isHome
              ? game.teams?.home?.score
              : game.teams?.away?.score;
            const oppScore = isHome
              ? game.teams?.away?.score
              : game.teams?.home?.score;
            const oppData = isHome ? game.teams?.away : game.teams?.home;
            const oppTeam = getTeamById(oppData?.team?.id);
            const won = teamScore > oppScore;
            const gameDate = new Date(game.gameDate);

            return (
              <div
                key={game.gamePk}
                className="flex items-center justify-between py-1.5 px-2 rounded bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold w-5 text-center rounded px-1 py-0.5 ${
                      won
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-red-600/20 text-red-400'
                    }`}
                  >
                    {won ? 'W' : 'L'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {isHome ? 'vs' : '@'}
                  </span>
                  {oppTeam && (
                    <img
                      src={oppTeam.logo}
                      alt={oppTeam.abbr}
                      className="w-5 h-5"
                    />
                  )}
                  <span className="text-sm">
                    {oppTeam?.abbr || oppData?.team?.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold">
                    {teamScore}-{oppScore}
                  </span>
                  <span className="text-xs text-gray-500">
                    {gameDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
