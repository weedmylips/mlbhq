import { useState } from 'react';
import { useTeam } from '../context/TeamContext';
import { useGames, usePlayerDetail } from '../hooks/useTeamData';
import { getTeamById } from '../data/teams';

function StarterRow({ game, teamId, isExpanded, onToggle }) {
  const isHome = game.teams?.home?.team?.id === teamId;
  const pitcher = isHome
    ? game.teams?.home?.probablePitcher
    : game.teams?.away?.probablePitcher;
  const oppSide = isHome ? game.teams?.away : game.teams?.home;
  const oppTeam = getTeamById(oppSide?.team?.id);

  const { data: playerData, isLoading: playerLoading } = usePlayerDetail(pitcher?.id);

  const gameDate = new Date(game.gameDate);
  const dayStr = gameDate.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const stats = playerData?.seasonPitching;
  const gameLog = playerData?.gameLog;
  const lastStart = gameLog?.[0];

  // Rest days: diff between this game and last start
  let restDays = null;
  if (lastStart?.date) {
    const lastDate = new Date(lastStart.date);
    const diff = Math.floor((gameDate - lastDate) / (1000 * 60 * 60 * 24));
    if (diff >= 0) restDays = diff;
  }

  const restColor =
    restDays === null ? 'text-gray-600'
    : restDays >= 5 ? 'text-green-400'
    : restDays === 4 ? 'text-yellow-400'
    : 'text-red-400';

  const hasPitcher = !!pitcher;
  const hasDetails = hasPitcher && (stats || lastStart);

  return (
    <div className="rounded bg-white/5 overflow-hidden">
      <button
        type="button"
        onClick={hasDetails ? onToggle : undefined}
        className={`flex items-center gap-3 py-2 px-2 w-full text-left ${hasDetails ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
      >
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
          {playerLoading && hasPitcher && (
            <div className="skeleton h-3 w-24 mt-0.5" />
          )}
          {stats && (
            <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1 flex-wrap">
              <span>{stats.era ?? '-'} ERA</span>
              <span>&middot;</span>
              <span>{stats.wins ?? 0}-{stats.losses ?? 0}</span>
              {restDays !== null && (
                <>
                  <span>&middot;</span>
                  <span className={restColor}>{restDays}d rest</span>
                </>
              )}
            </div>
          )}
        </div>

        {hasDetails && (
          <div className="shrink-0 text-gray-600 text-xs transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </div>
        )}
      </button>

      {isExpanded && hasDetails && (
        <div className="px-3 pb-2 pt-0.5 border-t border-white/5 space-y-1.5">
          {lastStart && (
            <div className="text-[11px] text-gray-400">
              <span className="text-gray-600 uppercase text-[10px]">Last Start </span>
              <span className="font-mono">
                {new Date(lastStart.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' '}{lastStart.isHome ? 'vs' : '@'} {lastStart.opponent}
                {' — '}
                {lastStart.stat?.inningsPitched ?? '-'} IP,{' '}
                {lastStart.stat?.hits ?? 0} H,{' '}
                {lastStart.stat?.earnedRuns ?? 0} ER,{' '}
                {lastStart.stat?.strikeOuts ?? 0} K
              </span>
            </div>
          )}
          {stats && (
            <div className="text-[11px] text-gray-400">
              <span className="text-gray-600 uppercase text-[10px]">Season </span>
              <span className="font-mono">
                {stats.era ?? '-'} ERA | {stats.wins ?? 0}-{stats.losses ?? 0} | {stats.inningsPitched ?? '-'} IP | {stats.strikeOuts ?? 0} K | {stats.whip ?? '-'} WHIP
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PitchingRotation() {
  const { team } = useTeam();
  const { data: gamesData, isLoading } = useGames(team.id);
  const [expandedPk, setExpandedPk] = useState(null);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  const allGames = gamesData?.allGames || [];
  const now = new Date();

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
          <StarterRow
            key={game.gamePk}
            game={game}
            teamId={team.id}
            isExpanded={expandedPk === game.gamePk}
            onToggle={() => setExpandedPk(expandedPk === game.gamePk ? null : game.gamePk)}
          />
        ))}
      </div>
    </div>
  );
}
