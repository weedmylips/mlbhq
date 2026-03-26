import { useEffect } from 'react';
import { Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import { useTeam } from './context/TeamContext';
import { useGames, useGameEndRefresh } from './hooks/useTeamData';
import { getTeamByAbbr } from './data/teams';
import TeamSelector from './components/TeamSelector';
import Header from './components/Header';
import LiveGame from './components/LiveGame';
import NextGame from './components/NextGame';
import RecentGames from './components/RecentGames';
import TeamStats from './components/TeamStats';
import InjuryReport from './components/InjuryReport';
import Schedule from './components/Schedule';
import Standings from './components/Standings';
import RosterTable from './components/RosterTable';
import NewsFeed from './components/NewsFeed';
import HotCold from './components/HotCold';
import TransactionsFeed from './components/TransactionsFeed';
import TeamLeaders from './components/TeamLeaders';
import Scoreboard from './components/Scoreboard';
import AdvancedStats from './components/AdvancedStats';
import PitchingRotation from './components/PitchingRotation';
import RecordBreakdown from './components/RecordBreakdown';
import BullpenHealth from './components/BullpenHealth';
import PlayerComparison from './components/PlayerComparison';
import PlayerSearch from './components/PlayerSearch';
import { LayoutDashboard, Users, CalendarDays, BarChart3, Trophy, Tv2, FlaskConical } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'roster', label: 'Roster', icon: Users },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'standings', label: 'Standings', icon: BarChart3 },
  { id: 'leaders', label: 'Leaders', icon: Trophy },
  { id: 'analytics', label: 'Analytics', icon: FlaskConical },
  { id: 'scores', label: 'Scores', icon: Tv2 },
];

function TeamPage() {
  const { teamAbbr, tab } = useParams();
  const navigate = useNavigate();
  const { team, setSelectedTeamId } = useTeam();

  // Sync URL team → context (only when URL changes, e.g. direct navigation or link)
  useEffect(() => {
    if (teamAbbr) {
      const urlTeam = getTeamByAbbr(teamAbbr);
      if (urlTeam && urlTeam.id !== team.id) {
        setSelectedTeamId(urlTeam.id);
      }
    }
  }, [teamAbbr]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeTab = tab || 'overview';
  const validTab = tabs.find((t) => t.id === activeTab) ? activeTab : 'overview';

  const { data: gamesData, isLoading: gamesLoading } = useGames(team.id);
  const hasLiveGame = !!gamesData?.live;
  useGameEndRefresh(hasLiveGame);
  const isYankees = team.id === 147;

  const setActiveTab = (tabId) => {
    navigate(`/${team.abbr}/${tabId}`);
  };

  return (
    <>
    <div className={`min-h-screen bg-surface overflow-x-hidden ${isYankees ? 'pinstripe-bg' : ''}`}>
      <TeamSelector />
      <Header />

      {/* Nav tabs — desktop top bar */}
      <div className="border-b border-border px-2 sm:px-6 hidden sm:block">
        <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors relative shrink-0 ${
                validTab === id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={15} />
              {label}
              {validTab === id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: 'var(--team-highlight)' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-3 sm:p-6 max-w-[1400px] mx-auto pb-20 sm:pb-6">
        {validTab === 'overview' && (
          <OverviewTab gamesData={gamesData} gamesLoading={gamesLoading} />
        )}
        {validTab === 'roster' && (
          <div className="space-y-4">
            <PlayerComparison />
            <RosterTable />
          </div>
        )}
        {validTab === 'schedule' && <Schedule />}
        {validTab === 'standings' && <Standings />}
        {validTab === 'leaders' && <TeamLeaders />}
        {validTab === 'analytics' && <AdvancedStats />}
        {validTab === 'scores' && <Scoreboard />}
      </div>

      {/* Footer disclaimer */}
      <footer className="border-t border-border mt-8 py-6 px-4 pb-20 sm:pb-6 text-center">
        <p className="text-[11px] text-gray-600 leading-relaxed max-w-2xl mx-auto">
          This is an independent fan site and is not affiliated with, endorsed by, or in any way connected to
          Major League Baseball (MLB), its teams, or MLB Advanced Media. All team names, logos, and related
          marks are trademarks of their respective owners. Data provided by the MLB Stats API.
        </p>
      </footer>

    </div>

    {/* Mobile bottom tab bar — outside main div to avoid transform/filter ancestors breaking fixed */}
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f] border-t border-border sm:hidden z-50" style={{ transform: 'none' }}>
      <div className="flex justify-around py-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-0 ${
              validTab === id ? 'text-[var(--team-highlight)]' : 'text-gray-500'
            }`}
          >
            <Icon size={18} />
            <span className="text-[9px] font-medium truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
    </>
  );
}

export default function App() {
  const { team } = useTeam();

  return (
    <Routes>
      <Route path="/:teamAbbr/:tab" element={<TeamPage />} />
      <Route path="/:teamAbbr" element={<TeamPage />} />
      <Route path="/" element={<Navigate to={`/${team.abbr}/overview`} replace />} />
      <Route path="*" element={<Navigate to={`/${team.abbr}/overview`} replace />} />
    </Routes>
  );
}

function OverviewTab({ gamesData, gamesLoading }) {
  if (gamesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card"><div className="skeleton h-40 w-full" /></div>
        <div className="card"><div className="skeleton h-40 w-full" /></div>
        <div className="md:col-span-2 card"><div className="skeleton h-32 w-full" /></div>
        <div className="card"><div className="skeleton h-32 w-full" /></div>
      </div>
    );
  }

  const liveGame = gamesData?.live;
  const nextGame = gamesData?.next;
  const recentGames = gamesData?.recent || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Row 1 */}
      {liveGame ? (
        <LiveGame gamePk={liveGame.gamePk} />
      ) : (
        <NextGame game={nextGame} />
      )}

      {/* Pitching Rotation + Bullpen */}
      <PitchingRotation />
      <BullpenHealth />

      {/* Row 2 */}
      <RecentGames games={recentGames} />
      <HotCold />

      {/* Row 3 */}
      <TeamStats />
      <RecordBreakdown />
      <InjuryReport />

      {/* Row 4 */}
      <TransactionsFeed />

      {/* Row 5 */}
      <NewsFeed />
    </div>
  );
}
