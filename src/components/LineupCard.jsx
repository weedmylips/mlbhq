import { useLiveGame } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { getTeamById } from '../data/teams';

function LineupList({ lineup, teamAbbr, label }) {
  if (!lineup?.length) return null;

  return (
    <div className="flex-1 min-w-0">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {teamAbbr} {label}
      </h4>
      <div className="space-y-0.5">
        {lineup.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 py-0.5 px-1.5 rounded bg-white/[0.02] text-xs"
          >
            <span className="text-gray-500 font-mono w-3 text-right shrink-0">
              {p.order}
            </span>
            <span className="truncate flex-1">{p.name}</span>
            <span className="text-gray-500 text-[10px] shrink-0">{p.position}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LineupCard({ gamePk }) {
  const { team } = useTeam();
  const { data: liveData } = useLiveGame(gamePk);

  if (!liveData?.lineups) return null;

  const { away, home } = liveData.lineups;
  if (!away?.length && !home?.length) return null;

  const awayTeamId = liveData.away?.team?.id;
  const homeTeamId = liveData.home?.team?.id;
  const awayTeam = getTeamById(awayTeamId);
  const homeTeam = getTeamById(homeTeamId);

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
        Starting Lineups
      </h3>
      <div className="flex gap-4">
        <LineupList
          lineup={away}
          teamAbbr={awayTeam?.abbr || 'Away'}
          label=""
        />
        <LineupList
          lineup={home}
          teamAbbr={homeTeam?.abbr || 'Home'}
          label=""
        />
      </div>
    </div>
  );
}
