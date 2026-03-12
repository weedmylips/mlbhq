import { useLiveGame } from '../hooks/useTeamData';
import { getTeamById } from '../data/teams';

function BaseRunners({ runners }) {
  const baseStyle = (active) =>
    `w-5 h-5 rotate-45 border-2 ${
      active
        ? 'bg-[var(--team-accent)] border-[var(--team-accent)]'
        : 'border-gray-600 bg-transparent'
    }`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={baseStyle(runners.second)} />
      <div className="flex gap-6">
        <div className={baseStyle(runners.third)} />
        <div className={baseStyle(runners.first)} />
      </div>
    </div>
  );
}

function CountDisplay({ balls, strikes, outs }) {
  const dots = (count, max, activeColor) =>
    Array.from({ length: max }, (_, i) => (
      <span
        key={i}
        className={`w-3 h-3 rounded-full ${
          i < count ? activeColor : 'bg-gray-700'
        }`}
      />
    ));

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex items-center gap-1">
        <span className="w-4 text-gray-400">B</span>
        {dots(balls || 0, 4, 'bg-green-500')}
      </div>
      <div className="flex items-center gap-1">
        <span className="w-4 text-gray-400">S</span>
        {dots(strikes || 0, 3, 'bg-yellow-500')}
      </div>
      <div className="flex items-center gap-1">
        <span className="w-4 text-gray-400">O</span>
        {dots(outs || 0, 3, 'bg-red-500')}
      </div>
    </div>
  );
}

export default function LiveGame({ gamePk }) {
  const { data, isLoading } = useLiveGame(gamePk);

  if (isLoading || !data) {
    return (
      <div className="card md:col-span-2">
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  const awayTeam = getTeamById(data.away?.team?.id);
  const homeTeam = getTeamById(data.home?.team?.id);
  const inningHalf = data.inningHalf === 'Top' ? '\u25B2' : '\u25BC';

  return (
    <div className="card md:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Live Game
        </h3>
        <span className="flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
          <span className="w-2 h-2 bg-white rounded-full live-dot" />
          {inningHalf} {data.inning}
        </span>
      </div>

      <div className="flex items-center justify-between">
        {/* Away */}
        <div className="flex items-center gap-3">
          {awayTeam && (
            <img src={awayTeam.logo} alt={awayTeam.abbr} className="w-12 h-12" />
          )}
          <div>
            <div className="font-bold text-lg">
              {data.away?.team?.teamName || 'Away'}
            </div>
            <div className="text-xs text-gray-400">Away</div>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-4">
          <span className="stat-number text-3xl">{data.away?.runs}</span>
          <span className="text-gray-600 text-xl">-</span>
          <span className="stat-number text-3xl">{data.home?.runs}</span>
        </div>

        {/* Home */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-bold text-lg">
              {data.home?.team?.teamName || 'Home'}
            </div>
            <div className="text-xs text-gray-400">Home</div>
          </div>
          {homeTeam && (
            <img src={homeTeam.logo} alt={homeTeam.abbr} className="w-12 h-12" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 mt-4">
        <CountDisplay
          balls={data.balls}
          strikes={data.strikes}
          outs={data.outs}
        />
        <BaseRunners runners={data.runners || {}} />
      </div>

      {data.lastPlay && (
        <p className="text-sm text-gray-400 mt-3 text-center italic">
          {data.lastPlay}
        </p>
      )}
    </div>
  );
}
