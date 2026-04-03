import { useHotCold, useHasLiveGame } from '../hooks/useTeamData';
import { getTeamById } from '../data/teams';
import MatchupPreview from './MatchupPreview';

function WatchList({ teamId }) {
  const hasLiveGame = useHasLiveGame(teamId);
  const { data, isLoading } = useHotCold(teamId, hasLiveGame);
  const team = getTeamById(teamId);

  if (isLoading) return <div className="skeleton h-16 w-full rounded" />;
  if (!data?.hot?.batters?.length) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {team && <img src={team.logo} alt={team.abbr} className="w-3.5 h-3.5" />}
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          {team?.abbr || 'Team'}
        </span>
      </div>
      <div className="space-y-1">
        {data.hot.batters.map((b, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-300">{b.name}</span>
            <span className="text-[11px] font-mono text-gray-500 shrink-0">
              <span className="sm:hidden">{b.avg}</span>
              <span className="hidden sm:inline">{b.avg} · {b.hr}HR · {b.rbi}RBI</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GamePreviewPanel({ game, teamId }) {
  const isHome = game.teams?.home?.team?.id === teamId;
  const myProbPitcher = isHome
    ? game.teams?.home?.probablePitcher
    : game.teams?.away?.probablePitcher;
  const oppProbPitcher = isHome
    ? game.teams?.away?.probablePitcher
    : game.teams?.home?.probablePitcher;
  const oppTeamId = isHome
    ? game.teams?.away?.team?.id
    : game.teams?.home?.team?.id;

  const hasPitchers = myProbPitcher?.id || oppProbPitcher?.id;

  return (
    <div className="pt-2 space-y-3">
      {hasPitchers && (
        <MatchupPreview
          pitcher1Id={myProbPitcher?.id}
          pitcher2Id={oppProbPitcher?.id}
        />
      )}
      <div className={hasPitchers ? 'pt-3 border-t border-white/5' : 'pt-1'}>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">
          Players to Watch
        </p>
        <div className="grid grid-cols-2 gap-4">
          <WatchList teamId={teamId} />
          {oppTeamId && <WatchList teamId={oppTeamId} />}
        </div>
      </div>
    </div>
  );
}
