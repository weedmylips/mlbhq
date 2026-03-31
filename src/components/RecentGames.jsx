import { useState } from 'react';
import { useTeam } from '../context/TeamContext';
import { getTeamById } from '../data/teams';
import GameDetailModal from './GameDetailModal';

function GameRow({ game, teamId }) {
  const [modalOpen, setModalOpen] = useState(false);

  const isHome = game.teams?.home?.team?.id === teamId;
  const teamScore = isHome ? game.teams?.home?.score : game.teams?.away?.score;
  const oppScore = isHome ? game.teams?.away?.score : game.teams?.home?.score;
  const oppData = isHome ? game.teams?.away : game.teams?.home;
  const oppTeam = getTeamById(oppData?.team?.id);
  const won = teamScore > oppScore;
  const gameDate = new Date(game.gameDate);

  return (
    <>
      <button
        className="w-full flex items-center justify-between py-1.5 px-2 text-left rounded bg-white/[0.02] hover:bg-white/10 transition-colors cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold w-5 text-center rounded px-1 py-0.5 ${
              won ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
            }`}
          >
            {won ? 'W' : 'L'}
          </span>
          <span className="text-xs text-gray-500">{isHome ? 'vs' : '@'}</span>
          {oppTeam && (
            <img src={oppTeam.logo} alt={oppTeam.abbr} className="w-5 h-5" />
          )}
          <span className="text-sm">{oppTeam?.abbr || oppData?.team?.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold">
            {teamScore}-{oppScore}
          </span>
          <span className="text-xs text-gray-500">
            {gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <svg className="w-3.5 h-3.5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
      <GameDetailModal
        game={game}
        teamId={teamId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

export default function RecentGames({ games = [] }) {
  const { team } = useTeam();
  const last5 = games.slice(0, 5);

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
        Recent Games
      </h3>
      {last5.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent games</p>
      ) : (
        <div className="space-y-2">
          {last5.map((game) => (
            <GameRow key={game.gamePk} game={game} teamId={team.id} />
          ))}
        </div>
      )}
    </div>
  );
}
