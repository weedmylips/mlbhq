import { useState } from 'react';
import { useTeam } from './context/TeamContext';
import { useGames } from './hooks/useTeamData';
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
import { LayoutDashboard, Users, CalendarDays, BarChart3, Trophy } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'roster', label: 'Roster', icon: Users },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'standings', label: 'Standings', icon: BarChart3 },
  { id: 'leaders', label: 'Leaders', icon: Trophy },
];

export default function App() {
  const { team } = useTeam();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: gamesData, isLoading: gamesLoading } = useGames(team.id);

  const isYankees = team.id === 147;

  return (
    <div className={`min-h-screen bg-surface ${isYankees ? 'pinstripe-bg' : ''}`}>
      <TeamSelector />
      <Header />

      {/* Nav tabs */}
      <div className="border-b border-border px-2 sm:px-6">
        <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors relative shrink-0 ${
                activeTab === id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={15} />
              {label}
              {activeTab === id && (
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
      <div className="p-3 sm:p-6 max-w-[1400px] mx-auto">
        {activeTab === 'overview' && (
          <OverviewTab gamesData={gamesData} gamesLoading={gamesLoading} />
        )}
        {activeTab === 'roster' && <RosterTable />}
        {activeTab === 'schedule' && <Schedule />}
        {activeTab === 'standings' && <Standings />}
        {activeTab === 'leaders' && <TeamLeaders />}
      </div>

      {/* Footer disclaimer */}
      <footer className="border-t border-border mt-8 py-6 px-4 text-center">
        <p className="text-[11px] text-gray-600 leading-relaxed max-w-2xl mx-auto">
          This is an independent fan site and is not affiliated with, endorsed by, or in any way connected to
          Major League Baseball (MLB), its teams, or MLB Advanced Media. All team names, logos, and related
          marks are trademarks of their respective owners. Data provided by the MLB Stats API.
        </p>
      </footer>
    </div>
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

      {/* Row 2 */}
      <RecentGames games={recentGames} />
      <HotCold />

      {/* Row 3 */}
      <TeamStats />
      <InjuryReport />

      {/* Row 4 */}
      <TransactionsFeed />

      {/* Row 5 */}
      <NewsFeed />
    </div>
  );
}
