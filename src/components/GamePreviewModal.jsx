import Modal from './Modal';
import GamePreviewPanel from './GamePreviewPanel';
import { getTeamById } from '../data/teams';

export default function GamePreviewModal({ game, teamId, open, onClose }) {
  if (!game) return null;

  const awayData = game.teams?.away;
  const homeData = game.teams?.home;
  const awayTeam = getTeamById(awayData?.team?.id);
  const homeTeam = getTeamById(homeData?.team?.id);
  const gameDate = new Date(game.gameDate);

  const awayPitcher = awayData?.probablePitcher;
  const homePitcher = homeData?.probablePitcher;

  function abbrevName(name) {
    if (!name) return 'TBD';
    const parts = name.split(' ');
    if (parts.length < 2) return name;
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  }

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
              {awayData?.leagueRecord && (
                <span className="text-[10px] text-gray-500 font-mono">
                  {awayData.leagueRecord.wins}-{awayData.leagueRecord.losses}
                </span>
              )}
              <span className="text-[10px] text-gray-500">
                {abbrevName(awayPitcher?.fullName)}
              </span>
            </div>

            {/* VS / Time */}
            <div className="flex flex-col items-center">
              <span className="text-gray-600 text-xs uppercase mb-0.5">
                {gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="font-mono text-lg font-bold text-white">
                {gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>

            {/* Home team */}
            <div className="flex flex-col items-center gap-1">
              {homeTeam && (
                <img src={homeTeam.logo} alt={homeTeam.abbr} className="w-10 h-10 sm:w-12 sm:h-12" />
              )}
              <span className={`text-sm font-bold ${homeData?.team?.id === teamId ? 'text-[var(--team-highlight)]' : 'text-gray-400'}`}>
                {homeTeam?.abbr || homeData?.team?.abbreviation}
              </span>
              {homeData?.leagueRecord && (
                <span className="text-[10px] text-gray-500 font-mono">
                  {homeData.leagueRecord.wins}-{homeData.leagueRecord.losses}
                </span>
              )}
              <span className="text-[10px] text-gray-500">
                {abbrevName(homePitcher?.fullName)}
              </span>
            </div>
          </div>
        </div>

        {/* Preview content */}
        <GamePreviewPanel game={game} teamId={teamId} />
      </div>
    </Modal>
  );
}
