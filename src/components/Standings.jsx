import { useStandings } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { getTeamById } from '../data/teams';

const LEAGUE_NAMES = { 103: 'American League', 104: 'National League' };

function LeagueSection({ leagueId, data, selectedTeam }) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-300 uppercase tracking-widest px-1">
        {LEAGUE_NAMES[leagueId]}
      </h2>
      {data.map((division) => (
        <div key={division.divisionId} className="card overflow-x-auto">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            {division.division ||
              getTeamById(division.teams[0]?.teamId)?.division ||
              'Division'}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-border">
                <th className="text-left py-2 pr-4">Team</th>
                <th className="text-right px-2 font-mono">W</th>
                <th className="text-right px-2 font-mono">L</th>
                <th className="text-right px-2 font-mono">PCT</th>
                <th className="text-right px-2 font-mono">GB</th>
                <th className="text-right px-2 font-mono">STRK</th>
                <th className="text-right px-2 font-mono">L10</th>
                <th className="text-right px-2 font-mono">DIFF</th>
              </tr>
            </thead>
            <tbody>
              {division.teams.map((t) => {
                const teamData = getTeamById(t.teamId);
                const isSelected = t.teamId === selectedTeam.id;
                return (
                  <tr
                    key={t.teamId}
                    className={`border-b border-white/5 ${
                      isSelected
                        ? 'bg-[var(--team-primary)]/10 team-glow'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        {teamData && (
                          <img
                            src={teamData.logo}
                            alt={teamData.abbr}
                            className="w-5 h-5"
                          />
                        )}
                        <span className={isSelected ? 'font-bold' : ''}>
                          {teamData?.name || t.teamName}
                        </span>
                      </div>
                    </td>
                    <td className="text-right px-2 font-mono">{t.wins}</td>
                    <td className="text-right px-2 font-mono">{t.losses}</td>
                    <td className="text-right px-2 font-mono">{t.pct}</td>
                    <td className="text-right px-2 font-mono">{t.gb}</td>
                    <td className="text-right px-2 font-mono">
                      <span
                        className={
                          t.streak?.startsWith('W')
                            ? 'text-green-400'
                            : t.streak?.startsWith('L')
                            ? 'text-red-400'
                            : ''
                        }
                      >
                        {t.streak}
                      </span>
                    </td>
                    <td className="text-right px-2 font-mono">{t.lastTen}</td>
                    <td className="text-right px-2 font-mono">
                      <span
                        className={
                          t.runDiff > 0
                            ? 'text-green-400'
                            : t.runDiff < 0
                            ? 'text-red-400'
                            : ''
                        }
                      >
                        {t.runDiff > 0 ? '+' : ''}
                        {t.runDiff}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default function Standings() {
  const { team } = useTeam();
  const primaryLeagueId = team.league === 'AL' ? 103 : 104;
  const secondaryLeagueId = team.league === 'AL' ? 104 : 103;
  const { data: primaryData, isLoading: primaryLoading } = useStandings(primaryLeagueId);
  const { data: secondaryData, isLoading: secondaryLoading } = useStandings(secondaryLeagueId);

  if (primaryLoading || secondaryLoading) {
    return (
      <div className="card">
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (!primaryData?.length && !secondaryData?.length) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center py-6">Standings unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {primaryData?.length > 0 && (
        <LeagueSection leagueId={primaryLeagueId} data={primaryData} selectedTeam={team} />
      )}
      {secondaryData?.length > 0 && (
        <LeagueSection leagueId={secondaryLeagueId} data={secondaryData} selectedTeam={team} />
      )}
    </div>
  );
}
