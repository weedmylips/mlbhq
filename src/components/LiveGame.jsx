import { useLiveGame } from '../hooks/useTeamData';
import { getTeamById } from '../data/teams';
import PitchLog from './PitchLog';

import PitchZone from './PitchZone';
import BatterVsPitcher, { BvpInline } from './BatterVsPitcher';
import PitcherEfficiency from './PitcherEfficiency';

function BaseRunners({ runners }) {
  const baseStyle = (active) =>
    `w-5 h-5 rotate-45 border-2 ${
      active
        ? 'bg-[var(--team-highlight)] border-[var(--team-highlight)]'
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

function LineScore({ innings, away, home, awayTeam, homeTeam }) {
  if (!innings || innings.length === 0) return null;
  const awayAbbr = awayTeam?.abbr || away?.team?.abbreviation || 'AWY';
  const homeAbbr = homeTeam?.abbr || home?.team?.abbreviation || 'HME';

  return (
    <div className="overflow-x-auto mt-4">
      <table className="mx-auto text-xs">
        <thead>
          <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
            <th className="text-left font-normal pb-0.5 pr-3 w-10"></th>
            {innings.map((inn) => (
              <th key={inn.num} className="text-right font-normal pb-0.5 px-1 min-w-[16px]">{inn.num}</th>
            ))}
            <th className="text-right font-bold pb-0.5 pl-3 px-1">R</th>
            <th className="text-right font-normal pb-0.5 px-1">H</th>
            <th className="text-right font-normal pb-0.5 px-1">E</th>
          </tr>
        </thead>
        <tbody>
          {[
            { side: 'away', abbr: awayAbbr, team: away },
            { side: 'home', abbr: homeAbbr, team: home },
          ].map(({ side, abbr, team }) => (
            <tr key={side} className="text-gray-300">
              <td className="text-left font-semibold py-0.5 pr-3">{abbr}</td>
              {innings.map((inn) => (
                <td key={inn.num} className="text-right px-1">
                  {inn[side]?.runs ?? '–'}
                </td>
              ))}
              <td className="text-right font-bold pl-3 px-1">{team?.runs ?? 0}</td>
              <td className="text-right px-1">{team?.hits ?? 0}</td>
              <td className="text-right px-1">{team?.errors ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function playerHeadshot(playerId) {
  if (!playerId) return null;
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

function PlayerBadge({ player, label }) {
  if (!player?.id) return null;
  const name = player.fullName?.split(' ').at(-1) ?? '';
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <img
        src={playerHeadshot(player.id)}
        alt={name}
        className="w-6 h-6 rounded-full object-cover bg-gray-700"
      />
      <span className="text-xs text-gray-400">{label}: {name}</span>
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
  const detailedState = data.gameData?.status?.detailedState || '';
  const isDelayed = detailedState.includes('Delayed');
  const inningHalf = data.inningHalf === 'Top' ? '\u25B2' : '\u25BC';

  const batter = data.currentBatter;
  const pitcher = data.currentPitcher;
  const awayId = data.away?.team?.id;

  // Use explicit team IDs from offense/defense to assign players to correct side
  const awayIsBatting = data.battingTeamId === awayId;
  const awayPlayer = awayIsBatting ? batter : pitcher;
  const homePlayer = awayIsBatting ? pitcher : batter;
  const awayLabel = awayIsBatting ? 'AB' : 'P';
  const homeLabel = awayIsBatting ? 'P' : 'AB';
  const awayPerspective = awayIsBatting ? 'batter' : 'pitcher';
  const homePerspective = awayIsBatting ? 'pitcher' : 'batter';

  return (
    <div className="card md:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Live Game
        </h3>
        {isDelayed ? (
          <span className="flex items-center gap-1 bg-yellow-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            Delayed
          </span>
        ) : (
          <span className="flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            <span className="w-2 h-2 bg-white rounded-full live-dot" />
            {inningHalf} {data.inning}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between">
        {/* Away */}
        <div className="flex flex-col items-center text-center w-24 sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:text-left">
          {awayTeam && (
            <img src={awayTeam.logo} alt={awayTeam.abbr} className="w-10 h-10 sm:w-12 sm:h-12" />
          )}
          <div>
            <div className="font-bold text-sm sm:text-lg">
              {data.away?.team?.teamName || 'Away'}
            </div>
            <PlayerBadge player={awayPlayer} label={awayLabel} />
            {batter?.id && pitcher?.id && <BvpInline batterId={batter.id} pitcherId={pitcher.id} perspective={awayPerspective} />}
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3 sm:gap-4 pt-2">
          <span className="stat-number text-2xl sm:text-3xl">{data.away?.runs}</span>
          <span className="text-gray-600 text-lg sm:text-xl">-</span>
          <span className="stat-number text-2xl sm:text-3xl">{data.home?.runs}</span>
        </div>

        {/* Home */}
        <div className="flex flex-col items-center text-center w-24 sm:w-auto sm:flex-row-reverse sm:items-center sm:gap-3 sm:text-right">
          {homeTeam && (
            <img src={homeTeam.logo} alt={homeTeam.abbr} className="w-10 h-10 sm:w-12 sm:h-12" />
          )}
          <div>
            <div className="font-bold text-sm sm:text-lg">
              {data.home?.team?.teamName || 'Home'}
            </div>
            <PlayerBadge player={homePlayer} label={homeLabel} />
            {batter?.id && pitcher?.id && <BvpInline batterId={batter.id} pitcherId={pitcher.id} perspective={homePerspective} />}
          </div>
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

      <LineScore
        innings={data.innings}
        away={data.away}
        home={data.home}
        awayTeam={awayTeam}
        homeTeam={homeTeam}
      />

      {data.lastPlay && (
        <p className="text-sm text-gray-400 mt-3 text-center italic">
          {data.lastPlay}
        </p>
      )}

      {/* Scoring Plays */}
      {data.scoringPlays?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Scoring Plays
          </h4>
          <div className="space-y-1 max-h-[200px] overflow-y-auto scrollbar-none">
            {data.scoringPlays.map((play, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 px-2 rounded bg-white/[0.03]">
                <span className="text-[10px] font-mono text-gray-500 shrink-0 w-6 text-right">
                  {play.halfInning === 'top' ? '\u25B2' : '\u25BC'}{play.inning}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 bg-green-500/15 text-green-400 border-green-500/20">
                  {play.event}
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed flex-1 min-w-0">{play.description}</p>
                <span className="text-[11px] font-mono font-bold text-gray-300 shrink-0">
                  {play.awayScore}-{play.homeScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
        <PitchZone pitches={data.currentAtBat} />
        <div>
          <PitcherEfficiency
            pitchCount={data.awayPitchCount}
            pitcherName={data.awayPitchCount?.name || 'Pitcher'}
            teamAbbr={awayTeam?.abbr}
          />
          <PitcherEfficiency
            pitchCount={data.homePitchCount}
            pitcherName={data.homePitchCount?.name || 'Pitcher'}
            teamAbbr={homeTeam?.abbr}
          />
        </div>
      </div>

      <PitchLog currentAtBat={data.currentAtBat} recentPlays={data.recentPlays} />
    </div>
  );
}
