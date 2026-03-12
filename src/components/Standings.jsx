import { useStandings } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { getTeamById } from '../data/teams';

export default function Standings() {
  const { team } = useTeam();
  const leagueId = team.league === 'AL' ? 103 : 104;
  const { data, isLoading } = useStandings(leagueId);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center py-6">Standings unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((division) => (
        <div key={division.divisionId} className="card overflow-x-auto">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            {division.division}
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
                const isSelected = t.teamId === team.id;
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
