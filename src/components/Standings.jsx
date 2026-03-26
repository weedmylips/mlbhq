import { useState } from 'react';
import { useStandings, useHasLiveGame } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { getTeamById } from '../data/teams';
import { expectedWins, magicNumber } from '../utils/statsCalculations';

const LEAGUE_NAMES = { 103: 'American League', 104: 'National League' };

function TeamRow({ t, isSelected, divisionLeaderLosses }) {
  const teamData = getTeamById(t.teamId);
  const gp = (t.wins || 0) + (t.losses || 0);
  const expW = gp > 0 ? expectedWins(t.runsScored, t.runsAllowed, gp) : null;
  const luck = expW !== null ? t.wins - expW : null;
  const magic = divisionLeaderLosses !== undefined
    ? magicNumber(t.wins, t.wins, divisionLeaderLosses)
    : null;

  return (
    <tr
      className={`border-b border-white/5 ${
        isSelected
          ? 'bg-[var(--team-primary)]/10 team-glow'
          : 'hover:bg-white/5'
      }`}
    >
      <td className="py-2 pr-4">
        <div className="flex items-center gap-2">
          {teamData && (
            <img src={teamData.logo} alt={teamData.abbr} className="w-5 h-5" />
          )}
          <span className={isSelected ? 'font-bold' : ''}>
            {teamData ? teamData.shortName : t.teamName}
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
      <td className="text-right px-2 font-mono text-gray-400">
        {expW !== null ? `${expW}-${gp - expW}` : '-'}
      </td>
      <td className="text-right px-2 font-mono">
        {luck !== null ? (
          <span className={luck > 0 ? 'text-green-400' : luck < 0 ? 'text-red-400' : 'text-gray-400'}>
            {luck > 0 ? '+' : ''}{luck}
          </span>
        ) : '-'}
      </td>
    </tr>
  );
}

function DivisionTable({ division, selectedTeam }) {
  // Find division leader's losses for magic number calculation
  const leader = division.teams[0];
  const leaderLosses = leader?.losses ?? 0;

  return (
    <div className="card overflow-x-auto">
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
            <th className="text-right px-2 font-mono" title="Pythagorean Expected Record">xW-L</th>
            <th className="text-right px-2 font-mono" title="Wins above expected (luck)">Luck</th>
          </tr>
        </thead>
        <tbody>
          {division.teams.map((t) => (
            <TeamRow
              key={t.teamId}
              t={t}
              isSelected={t.teamId === selectedTeam.id}
              divisionLeaderLosses={leaderLosses}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WildCardTable({ leagueId, data, selectedTeam }) {
  // Flatten all teams from all division records, then sort by wins desc
  const allTeams = data.flatMap((d) => d.teams);
  const divisionLeaders = allTeams.filter((t) => t.divisionLeader);
  const wildCardTeams = allTeams.filter((t) => !t.divisionLeader);

  // Sort division leaders by wins desc, then WC teams by wins desc
  const sortByRecord = (a, b) => b.wins - a.wins || a.losses - b.losses;
  divisionLeaders.sort(sortByRecord);
  wildCardTeams.sort(sortByRecord);

  const WC_SPOTS = 3;

  return (
    <div className="card overflow-x-auto">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
        {LEAGUE_NAMES[leagueId]} Wild Card
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs border-b border-border">
            <th className="text-left py-2 pr-4">Team</th>
            <th className="text-right px-2 font-mono">W</th>
            <th className="text-right px-2 font-mono">L</th>
            <th className="text-right px-2 font-mono">PCT</th>
            <th className="text-right px-2 font-mono">WCGB</th>
            <th className="text-right px-2 font-mono">STRK</th>
            <th className="text-right px-2 font-mono">L10</th>
            <th className="text-right px-2 font-mono">DIFF</th>
            <th className="text-right px-2 font-mono" title="Pythagorean Expected Record">xW-L</th>
            <th className="text-right px-2 font-mono" title="Wins above expected (luck)">Luck</th>
          </tr>
        </thead>
        <tbody>
          {/* Division Leaders Section */}
          <tr>
            <td
              colSpan={10}
              className="pt-2 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest"
            >
              Division Leaders
            </td>
          </tr>
          {divisionLeaders.map((t) => {
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
                      {teamData
                        ? teamData.shortName
                        : t.teamName}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-1">
                      {t.divisionName?.split(' ').pop() || ''}
                    </span>
                  </div>
                </td>
                <td className="text-right px-2 font-mono">{t.wins}</td>
                <td className="text-right px-2 font-mono">{t.losses}</td>
                <td className="text-right px-2 font-mono">{t.pct}</td>
                <td className="text-right px-2 font-mono text-gray-500">-</td>
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
                {(() => {
                  const gp = (t.wins || 0) + (t.losses || 0);
                  const expW = gp > 0 ? expectedWins(t.runsScored, t.runsAllowed, gp) : null;
                  const luck = expW !== null ? t.wins - expW : null;
                  return (
                    <>
                      <td className="text-right px-2 font-mono text-gray-400">
                        {expW !== null ? `${expW}-${gp - expW}` : '-'}
                      </td>
                      <td className="text-right px-2 font-mono">
                        {luck !== null ? (
                          <span className={luck > 0 ? 'text-green-400' : luck < 0 ? 'text-red-400' : 'text-gray-400'}>
                            {luck > 0 ? '+' : ''}{luck}
                          </span>
                        ) : '-'}
                      </td>
                    </>
                  );
                })()}
              </tr>
            );
          })}

          {/* Wild Card Section */}
          <tr>
            <td
              colSpan={10}
              className="pt-4 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest"
            >
              Wild Card
            </td>
          </tr>
          {wildCardTeams.map((t, idx) => {
            const teamData = getTeamById(t.teamId);
            const isSelected = t.teamId === selectedTeam.id;
            const isBelowCutoff = idx >= WC_SPOTS;
            return (
              <tr
                key={t.teamId}
                className={`${
                  idx === WC_SPOTS ? 'border-t-2 border-red-500/40' : 'border-b border-white/5'
                } ${
                  isSelected
                    ? 'bg-[var(--team-primary)]/10 team-glow'
                    : 'hover:bg-white/5'
                }`}
              >
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono w-4 text-right ${
                        isBelowCutoff ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    {teamData && (
                      <img
                        src={teamData.logo}
                        alt={teamData.abbr}
                        className="w-5 h-5"
                      />
                    )}
                    <span
                      className={`${isSelected ? 'font-bold' : ''} ${
                        isBelowCutoff ? 'text-gray-500' : ''
                      }`}
                    >
                      {teamData
                        ? teamData.shortName
                        : t.teamName}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-1">
                      {t.divisionName?.split(' ').pop() || ''}
                    </span>
                  </div>
                </td>
                <td
                  className={`text-right px-2 font-mono ${
                    isBelowCutoff ? 'text-gray-500' : ''
                  }`}
                >
                  {t.wins}
                </td>
                <td
                  className={`text-right px-2 font-mono ${
                    isBelowCutoff ? 'text-gray-500' : ''
                  }`}
                >
                  {t.losses}
                </td>
                <td
                  className={`text-right px-2 font-mono ${
                    isBelowCutoff ? 'text-gray-500' : ''
                  }`}
                >
                  {t.pct}
                </td>
                <td className="text-right px-2 font-mono">
                  <span className={isBelowCutoff ? 'text-red-400/70' : 'text-gray-300'}>
                    {t.wcGb === '0' || t.wcGb === '-' ? '-' : t.wcGb}
                  </span>
                </td>
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
                <td
                  className={`text-right px-2 font-mono ${
                    isBelowCutoff ? 'text-gray-500' : ''
                  }`}
                >
                  {t.lastTen}
                </td>
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
                {(() => {
                  const gp = (t.wins || 0) + (t.losses || 0);
                  const expW = gp > 0 ? expectedWins(t.runsScored, t.runsAllowed, gp) : null;
                  const luck = expW !== null ? t.wins - expW : null;
                  return (
                    <>
                      <td className={`text-right px-2 font-mono ${isBelowCutoff ? 'text-gray-600' : 'text-gray-400'}`}>
                        {expW !== null ? `${expW}-${gp - expW}` : '-'}
                      </td>
                      <td className="text-right px-2 font-mono">
                        {luck !== null ? (
                          <span className={
                            isBelowCutoff
                              ? 'text-gray-600'
                              : luck > 0 ? 'text-green-400' : luck < 0 ? 'text-red-400' : 'text-gray-400'
                          }>
                            {luck > 0 ? '+' : ''}{luck}
                          </span>
                        ) : '-'}
                      </td>
                    </>
                  );
                })()}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LeagueSection({ leagueId, data, selectedTeam, viewType }) {
  if (viewType === 'wildCard') {
    return <WildCardTable leagueId={leagueId} data={data} selectedTeam={selectedTeam} />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-300 uppercase tracking-widest px-1">
        {LEAGUE_NAMES[leagueId]}
      </h2>
      {data.map((division) => (
        <DivisionTable
          key={division.divisionId}
          division={division}
          selectedTeam={selectedTeam}
        />
      ))}
    </div>
  );
}

export default function Standings() {
  const { team } = useTeam();
  const [viewType, setViewType] = useState('division');
  const primaryLeagueId = team.league === 'AL' ? 103 : 104;
  const secondaryLeagueId = team.league === 'AL' ? 104 : 103;

  const standingsType = viewType === 'wildCard' ? 'wildCard' : 'regularSeason';
  const hasLiveGame = useHasLiveGame(team.id);
  const { data: primaryData, isLoading: primaryLoading } = useStandings(primaryLeagueId, standingsType, hasLiveGame);
  const { data: secondaryData, isLoading: secondaryLoading } = useStandings(secondaryLeagueId, standingsType, hasLiveGame);

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
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-card border border-border rounded-lg p-0.5">
          <button
            onClick={() => setViewType('division')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewType === 'division'
                ? 'bg-[var(--team-primary)]/20 text-[var(--team-highlight)] border border-[var(--team-primary)]/30'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Division
          </button>
          <button
            onClick={() => setViewType('wildCard')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewType === 'wildCard'
                ? 'bg-[var(--team-primary)]/20 text-[var(--team-highlight)] border border-[var(--team-primary)]/30'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Wild Card
          </button>
        </div>
      </div>

      {primaryData?.length > 0 && (
        <LeagueSection
          leagueId={primaryLeagueId}
          data={primaryData}
          selectedTeam={team}
          viewType={viewType}
        />
      )}
      {secondaryData?.length > 0 && (
        <LeagueSection
          leagueId={secondaryLeagueId}
          data={secondaryData}
          selectedTeam={team}
          viewType={viewType}
        />
      )}
    </div>
  );
}
