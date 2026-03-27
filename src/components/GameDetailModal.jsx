import Modal from './Modal';
import GameSummaryPanel from './GameSummaryPanel';
import { getTeamById } from '../data/teams';

export default function GameDetailModal({ game, teamId, open, onClose }) {
  if (!game) return null;

  const awayData = game.teams?.away;
  const homeData = game.teams?.home;
  const awayTeam = getTeamById(awayData?.team?.id);
  const homeTeam = getTeamById(homeData?.team?.id);
  const gameDate = new Date(game.gameDate);

  const isHome = homeData?.team?.id === teamId;
  const teamScore = isHome ? homeData?.score : awayData?.score;
  const oppScore = isHome ? awayData?.score : homeData?.score;
  const won = teamScore > oppScore;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-5 sm:p-6">
        {/* Matchup header */}
        <div className="flex flex-col items-center gap-3 pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Away team */}
            <div className="flex flex-col items-center gap-1">
              {awayTeam && (
                <img src={awayTeam.logo} alt={awayTeam.abbr} className="w-10 h-10 sm:w-12 sm:h-12" />
              )}
              <span className={`text-sm font-bold ${awayData?.team?.id === teamId ? 'text-[var(--team-highlight)]' : 'text-gray-400'}`}>
                {awayTeam?.abbr || awayData?.team?.abbreviation}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-white">{awayData?.score}</span>
              <span className="text-gray-600 text-lg">-</span>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-white">{homeData?.score}</span>
            </div>

            {/* Home team */}
            <div className="flex flex-col items-center gap-1">
              {homeTeam && (
                <img src={homeTeam.logo} alt={homeTeam.abbr} className="w-10 h-10 sm:w-12 sm:h-12" />
              )}
              <span className={`text-sm font-bold ${homeData?.team?.id === teamId ? 'text-[var(--team-highlight)]' : 'text-gray-400'}`}>
                {homeTeam?.abbr || homeData?.team?.abbreviation}
              </span>
            </div>
          </div>

          {/* Date + result badge */}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                won ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
              }`}
            >
              {won ? 'W' : 'L'}
            </span>
            <span className="text-xs text-gray-500">
              {gameDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Boxscore content */}
        <GameSummaryPanel gamePk={game.gamePk} className="text-xs space-y-4" />
      </div>
    </Modal>
  );
}
