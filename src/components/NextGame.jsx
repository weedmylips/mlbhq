import { getTeamById } from '../data/teams';
import { useTeam } from '../context/TeamContext';
import { Calendar } from 'lucide-react';

export default function NextGame({ game }) {
  const { team } = useTeam();

  if (!game) {
    return (
      <div className="card col-span-2">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Next Game
        </h3>
        <p className="text-gray-500 text-center py-6">No upcoming games scheduled</p>
      </div>
    );
  }

  const isHome = game.teams?.home?.team?.id === team.id;
  const opponentData = isHome ? game.teams?.away : game.teams?.home;
  const opponentTeam = getTeamById(opponentData?.team?.id);
  const gameDate = new Date(game.gameDate);
  const probPitcher = isHome
    ? game.teams?.home?.probablePitcher
    : game.teams?.away?.probablePitcher;
  const oppProbPitcher = isHome
    ? game.teams?.away?.probablePitcher
    : game.teams?.home?.probablePitcher;

  return (
    <div className="card col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Next Game
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar size={14} />
          {gameDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={team.logo} alt={team.abbr} className="w-12 h-12" />
          <div>
            <div className="font-bold">{team.name}</div>
            <div className="text-xs text-gray-400">
              {probPitcher?.fullName ? `P: ${probPitcher.fullName}` : ''}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase">
            {isHome ? 'Home' : 'Away'}
          </div>
          <div className="text-lg font-bold font-mono">
            {gameDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
          <div className="text-xs text-gray-500">vs</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-bold">
              {opponentTeam?.name || opponentData?.team?.name}
            </div>
            <div className="text-xs text-gray-400">
              {oppProbPitcher?.fullName ? `P: ${oppProbPitcher.fullName}` : ''}
            </div>
          </div>
          {opponentTeam && (
            <img
              src={opponentTeam.logo}
              alt={opponentTeam.abbr}
              className="w-12 h-12"
            />
          )}
        </div>
      </div>
    </div>
  );
}
