import { useStandings, useHasLiveGame } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';

function RecordRow({ label, record }) {
  if (!record) return null;
  const [w, l] = record.split('-').map(Number);
  const isWinning = w > l;
  const isLosing = w < l;

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded bg-white/5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`font-mono text-sm font-medium ${
        isWinning ? 'text-green-400' : isLosing ? 'text-red-400' : 'text-gray-300'
      }`}>
        {record}
      </span>
    </div>
  );
}

function StreakRow({ label, value }) {
  const display = value && value !== '-' ? value : '-';
  const isWin = display.startsWith('W');
  const isLoss = display.startsWith('L');

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded bg-white/5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`font-mono text-sm font-medium ${
        isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-300'
      }`}>
        {display}
      </span>
    </div>
  );
}

export default function RecordBreakdown() {
  const { team } = useTeam();
  const leagueId = team.league === 'AL' ? 103 : 104;
  const hasLiveGame = useHasLiveGame(team.id);
  const { data, isLoading } = useStandings(leagueId, 'regularSeason', hasLiveGame);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  // Find our team in the standings data
  let teamRecord = null;
  for (const division of (data || [])) {
    const found = division.teams.find((t) => t.teamId === team.id);
    if (found) { teamRecord = found; break; }
  }

  if (!teamRecord?.splits) return null;

  const { splits, streak, lastTen } = teamRecord;

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
        Record Breakdown
      </h3>
      <div className="grid grid-cols-2 gap-1.5">
        <RecordRow label="Home" record={splits.home} />
        <RecordRow label="Away" record={splits.away} />
        <StreakRow label="Streak" value={streak} />
        <RecordRow label="L10" record={lastTen} />
        <RecordRow label="1-Run Games" record={splits.oneRun} />
        <RecordRow label="Extra Innings" record={splits.extraInnings} />
        <RecordRow label="Day Games" record={splits.day} />
        <RecordRow label="Night Games" record={splits.night} />
        <RecordRow label="Interleague" record={splits.interLeague} />
      </div>
    </div>
  );
}
