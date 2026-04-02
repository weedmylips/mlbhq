import { useState } from 'react';
import { useScoreboard, useHighlights } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { getTeamById } from '../data/teams';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function formatGameTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function InningLine({ innings, away, home }) {
  if (!innings?.length) return null;
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-[11px] font-mono">
        <thead>
          <tr className="text-gray-500">
            <th className="text-left pr-2 w-10"></th>
            {innings.map((inn) => (
              <th key={inn.num} className="text-center px-1 w-5">{inn.num}</th>
            ))}
            <th className="text-center px-1.5 border-l border-white/10 font-bold">R</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-gray-300">
            <td className="pr-2 text-gray-400 font-semibold">{away.abbr}</td>
            {innings.map((inn) => (
              <td key={inn.num} className="text-center px-1">{inn.away ?? '-'}</td>
            ))}
            <td className="text-center px-1.5 border-l border-white/10 font-bold">{away.score ?? 0}</td>
          </tr>
          <tr className="text-gray-300">
            <td className="pr-2 text-gray-400 font-semibold">{home.abbr}</td>
            {innings.map((inn) => (
              <td key={inn.num} className="text-center px-1">{inn.home ?? '-'}</td>
            ))}
            <td className="text-center px-1.5 border-l border-white/10 font-bold">{home.score ?? 0}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function GameHighlights({ gamePk }) {
  const { data: highlights, isLoading } = useHighlights(gamePk, false);

  if (isLoading) return <div className="skeleton h-12 w-full mt-2 rounded" />;
  if (!highlights?.length) return null;

  return (
    <div className="mt-2 pt-2 border-t border-white/5">
      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1.5">Highlights</div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {highlights.slice(0, 8).map((h) => (
          <a
            key={h.id}
            href={h.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 w-32 group"
          >
            <div className="relative">
              {h.thumbnail ? (
                <img src={h.thumbnail} alt="" className="w-32 h-18 rounded object-cover bg-gray-800" />
              ) : (
                <div className="w-32 h-18 rounded bg-gray-800" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 group-hover:text-white mt-1 line-clamp-2 leading-tight">
              {h.title}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

function GameCard({ game, isMyTeam }) {
  const [expanded, setExpanded] = useState(false);
  const awayTeam = getTeamById(game.away.id);
  const homeTeam = getTeamById(game.home.id);
  const isLive = game.state === 'Live';
  const isFinal = game.state === 'Final';
  const isPreview = game.state === 'Preview';

  return (
    <div
      className={`rounded-lg border transition-colors cursor-pointer ${
        isMyTeam
          ? 'border-[var(--team-primary)]/40 bg-[var(--team-primary)]/5'
          : 'border-border bg-card'
      } ${isLive ? 'ring-1 ring-red-500/30' : ''}`}
      onClick={() => isFinal && setExpanded((v) => !v)}
    >
      <div className="p-3">
        {/* Status badge */}
        <div className="flex justify-between items-center mb-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full live-dot" />
              {game.inningHalf === 'Top' ? 'Top' : 'Bot'} {game.inning}
            </span>
          ) : isFinal ? (
            <span className="text-[10px] font-bold text-gray-500 uppercase">Final</span>
          ) : (
            <span className="text-[10px] text-gray-500">{formatGameTime(game.gameDate)}</span>
          )}
          {isFinal && game.decisions?.winner && (
            <span className="text-[10px] text-gray-500">
              W: {game.decisions.winner.name?.split(' ').pop()}
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {awayTeam && <img src={awayTeam.logo} alt={awayTeam.abbr} className="w-5 h-5" />}
            <span className="text-sm font-medium">{awayTeam?.abbr || game.away.abbr}</span>
            {isPreview && (
              <span className="text-[10px] text-gray-500">
                ({game.away.wins}-{game.away.losses})
              </span>
            )}
          </div>
          {!isPreview && (
            <span className={`font-mono text-sm font-bold ${
              isFinal && game.away.score > game.home.score ? 'text-white' : 'text-gray-400'
            }`}>
              {game.away.score ?? 0}
            </span>
          )}
        </div>

        {/* Home team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {homeTeam && <img src={homeTeam.logo} alt={homeTeam.abbr} className="w-5 h-5" />}
            <span className="text-sm font-medium">{homeTeam?.abbr || game.home.abbr}</span>
            {isPreview && (
              <span className="text-[10px] text-gray-500">
                ({game.home.wins}-{game.home.losses})
              </span>
            )}
          </div>
          {!isPreview && (
            <span className={`font-mono text-sm font-bold ${
              isFinal && game.home.score > game.away.score ? 'text-white' : 'text-gray-400'
            }`}>
              {game.home.score ?? 0}
            </span>
          )}
        </div>

        {/* Probable pitchers for preview */}
        {isPreview && (game.away.probablePitcher || game.home.probablePitcher) && (
          <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-gray-500 space-y-0.5">
            {game.away.probablePitcher && (
              <div>{awayTeam?.abbr}: {game.away.probablePitcher.name?.split(' ').pop()}</div>
            )}
            {game.home.probablePitcher && (
              <div>{homeTeam?.abbr}: {game.home.probablePitcher.name?.split(' ').pop()}</div>
            )}
          </div>
        )}
      </div>

      {/* Expanded line score */}
      {expanded && isFinal && game.innings?.length > 0 && (
        <div className="px-3 pb-3 border-t border-white/5">
          <InningLine innings={game.innings} away={game.away} home={game.home} />
          {game.decisions && (
            <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
              {game.decisions.winner && <span>W: {game.decisions.winner.name}</span>}
              {game.decisions.loser && <span>L: {game.decisions.loser.name}</span>}
              {game.decisions.save && <span>SV: {game.decisions.save.name}</span>}
            </div>
          )}
          <GameHighlights gamePk={game.gamePk} />
        </div>
      )}
    </div>
  );
}

export default function Scoreboard() {
  const { team } = useTeam();
  const [dateOffset, setDateOffset] = useState(0);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dateOffset);
  // MLB uses Eastern Time for game dates — use locale date string to avoid UTC offset issues
  const dateStr = targetDate.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

  const { data: games, isLoading } = useScoreboard(dateStr);

  const displayDate = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const liveCount = (games || []).filter((g) => g.state === 'Live').length;

  return (
    <div className="card space-y-4 p-4">
      {/* Date navigator */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setDateOffset((d) => d - 1)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-base font-bold">{displayDate}</h2>
          {dateOffset === 0 && liveCount > 0 && (
            <span className="text-[10px] text-red-400 font-bold uppercase">
              {liveCount} game{liveCount > 1 ? 's' : ''} live
            </span>
          )}
        </div>
        <button
          onClick={() => setDateOffset((d) => d + 1)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight size={18} />
        </button>
        {dateOffset !== 0 && (
          <button
            onClick={() => setDateOffset(0)}
            className="text-[10px] text-gray-500 hover:text-white underline"
          >
            Today
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card"><div className="skeleton h-24 w-full" /></div>
          ))}
        </div>
      ) : !games?.length ? (
        <div className="card text-center py-8">
          <p className="text-gray-500">No games scheduled</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {games.map((game) => {
            const isMyTeam = game.away.id === team.id || game.home.id === team.id;
            return (
              <GameCard key={game.gamePk} game={game} isMyTeam={isMyTeam} />
            );
          })}
        </div>
      )}
    </div>
  );
}
