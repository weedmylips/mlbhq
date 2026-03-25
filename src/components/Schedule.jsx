import { useState } from 'react';
import { useGames } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { getTeamById } from '../data/teams';
import GameSummaryPanel from './GameSummaryPanel';
import GamePreviewPanel from './GamePreviewPanel';

function ScheduleGameRow({ game, teamId }) {
  const [expanded, setExpanded] = useState(false);

  const isHome = game.teams?.home?.team?.id === teamId;
  const oppData = isHome ? game.teams?.away : game.teams?.home;
  const oppTeam = getTeamById(oppData?.team?.id);
  const gameDate = new Date(game.gameDate);
  const isFinal = game.status?.abstractGameState === 'Final';
  const isLive = game.status?.abstractGameState === 'Live';
  const isUpcoming = !isFinal && !isLive;
  const teamScore = isHome ? game.teams?.home?.score : game.teams?.away?.score;
  const oppScore = isHome ? game.teams?.away?.score : game.teams?.home?.score;
  const won = isFinal && teamScore > oppScore;
  const lost = isFinal && teamScore < oppScore;
  const probPitcher = isHome
    ? game.teams?.home?.probablePitcher
    : game.teams?.away?.probablePitcher;

  const rowContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs text-gray-500 w-16 shrink-0">
          {gameDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </span>
        <span className="text-xs text-gray-500 w-6">{isHome ? 'vs' : '@'}</span>
        {oppTeam && (
          <img src={oppTeam.logo} alt={oppTeam.abbr} className="w-5 h-5 shrink-0" />
        )}
        <span className="truncate">{oppTeam?.name || oppData?.team?.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {isLive && (
          <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            <span className="w-1.5 h-1.5 bg-white rounded-full live-dot" />
            LIVE
          </span>
        )}
        {isFinal ? (
          <span className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-1 rounded ${
                won ? 'text-green-400 bg-green-600/20' : 'text-red-400 bg-red-600/20'
              }`}
            >
              {won ? 'W' : lost ? 'L' : 'T'}
            </span>
            <span className="font-mono text-xs">
              {teamScore}-{oppScore}
            </span>
          </span>
        ) : !isLive ? (
          <span className="text-xs text-gray-400">
            {gameDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        ) : null}
        {(isFinal || isUpcoming) && (
          <svg
            className={`w-3 h-3 text-gray-500 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </div>
  );

  if (isLive) {
    return (
      <div className="py-2 px-3 rounded text-sm bg-[rgba(var(--team-primary-rgb),0.03)]">
        {rowContent}
      </div>
    );
  }

  return (
    <div className="rounded text-sm bg-[rgba(var(--team-primary-rgb),0.04)] team-hover">
      <button
        className="w-full py-2 px-3 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {rowContent}
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          {isFinal ? (
            <GameSummaryPanel gamePk={game.gamePk} />
          ) : (
            <GamePreviewPanel game={game} teamId={teamId} />
          )}
        </div>
      )}
    </div>
  );
}

export default function Schedule() {
  const { team } = useTeam();
  const { data, isLoading } = useGames(team.id);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  const games = (data?.allGames || []).sort(
    (a, b) => new Date(a.gameDate) - new Date(b.gameDate)
  );

  const grouped = {};
  games.forEach((g) => {
    const d = new Date(g.gameDate);
    const key = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(g);
  });

  return (
    <div className="card">
      <h3 className="text-sm font-bold team-section-header uppercase tracking-wider mb-4">
        Schedule
      </h3>
      {Object.entries(grouped).map(([month, monthGames]) => (
        <div key={month} className="mb-4">
          <h4 className="text-xs font-bold text-[var(--team-accent)] uppercase mb-2">
            {month}
          </h4>
          <div className="space-y-1">
            {monthGames.map((game) => (
              <ScheduleGameRow key={game.gamePk} game={game} teamId={team.id} />
            ))}
          </div>
        </div>
      ))}
      {games.length === 0 && (
        <p className="text-gray-500 text-center py-6">No games found</p>
      )}
    </div>
  );
}
