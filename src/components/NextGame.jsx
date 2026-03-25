import { getTeamById } from '../data/teams';
import { useTeam } from '../context/TeamContext';
import { useH2H } from '../hooks/useTeamData';
import { Calendar } from 'lucide-react';
import MatchupPreview from './MatchupPreview';
import LineupCard from './LineupCard';

export default function NextGame({ game }) {
  const { team } = useTeam();

  if (!game) {
    return (
      <div className="card md:col-span-2">
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

  const { data: h2h } = useH2H(team.id, opponentData?.team?.id);

  return (
    <div className="card md:col-span-2">
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

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <img src={team.logo} alt={team.abbr} className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-sm sm:text-base truncate">{team.abbr}</div>
            <div className="text-xs text-gray-400 truncate">
              {probPitcher?.fullName ? probPitcher.fullName.split(' ').pop() : ''}
            </div>
          </div>
        </div>

        <div className="text-center shrink-0">
          <div className="text-xs text-gray-500 uppercase">
            {isHome ? 'Home' : 'Away'}
          </div>
          <div className="text-base sm:text-lg font-bold font-mono">
            {gameDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
          <div className="text-xs text-gray-500">vs</div>
        </div>

        <div className="flex items-center gap-2 min-w-0 justify-end">
          <div className="text-right min-w-0">
            <div className="font-bold text-sm sm:text-base truncate">{opponentTeam?.abbr || opponentData?.team?.abbreviation}</div>
            <div className="text-xs text-gray-400 truncate">
              {oppProbPitcher?.fullName ? oppProbPitcher.fullName.split(' ').pop() : ''}
            </div>
          </div>
          {opponentTeam && (
            <img
              src={opponentTeam.logo}
              alt={opponentTeam.abbr}
              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0"
            />
          )}
        </div>
      </div>

      {h2h && h2h.gamesPlayed > 0 && (
        <div className="mt-3 pt-2 border-t border-white/5 text-center text-xs text-gray-500">
          <span className="font-mono font-bold text-gray-300">{h2h.wins}-{h2h.losses}</span>
          {' '}vs {opponentTeam?.abbr} this season
        </div>
      )}
      {h2h && h2h.gamesPlayed === 0 && (
        <div className="mt-3 pt-2 border-t border-white/5 text-center text-xs text-gray-500">
          First meeting this season
        </div>
      )}

      {(probPitcher?.id || oppProbPitcher?.id) && (
        <MatchupPreview
          pitcher1Id={probPitcher?.id}
          pitcher2Id={oppProbPitcher?.id}
        />
      )}

      {game.gamePk && <LineupCard gamePk={game.gamePk} />}
    </div>
  );
}
