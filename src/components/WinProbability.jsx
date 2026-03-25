import { getWinExpectancy } from '../utils/winExpectancy';
import { getTeamById } from '../data/teams';

export default function WinProbability({ data }) {
  if (!data?.inning) return null;

  const homeWp = getWinExpectancy(
    data.inning,
    data.inningHalf,
    data.outs,
    data.home?.runs || 0,
    data.away?.runs || 0,
    data.runners
  );

  const awayWp = 1 - homeWp;
  const homePct = Math.round(homeWp * 100);
  const awayPct = Math.round(awayWp * 100);

  const awayTeam = getTeamById(data.away?.team?.id);
  const homeTeam = getTeamById(data.home?.team?.id);

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
        Win Probability
      </h4>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono font-bold w-10 text-right">{awayPct}%</span>
        <span className="text-gray-400 w-8 text-right">{awayTeam?.abbr || 'AWY'}</span>
        <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden flex">
          <div
            className="h-full transition-all duration-500 ease-out rounded-l-full"
            style={{
              width: `${awayPct}%`,
              backgroundColor: awayTeam?.primary || '#666',
            }}
          />
          <div
            className="h-full transition-all duration-500 ease-out rounded-r-full"
            style={{
              width: `${homePct}%`,
              backgroundColor: homeTeam?.primary || '#999',
            }}
          />
        </div>
        <span className="text-gray-400 w-8">{homeTeam?.abbr || 'HME'}</span>
        <span className="font-mono font-bold w-10">{homePct}%</span>
      </div>
    </div>
  );
}
