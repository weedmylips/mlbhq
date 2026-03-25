import { usePlayerDetail } from '../hooks/useTeamData';

function StatRow({ label, season, career }) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-1 pr-3 text-gray-400 text-xs">{label}</td>
      <td className="text-right font-mono text-xs px-2">{season ?? '-'}</td>
      <td className="text-right font-mono text-xs px-2 text-gray-500">{career ?? '-'}</td>
    </tr>
  );
}

function HittingStats({ season, career }) {
  if (!season && !career) return null;
  return (
    <div>
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
        Hitting
      </h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-600 text-[10px] border-b border-border">
            <th className="text-left py-1">Stat</th>
            <th className="text-right px-2">Season</th>
            <th className="text-right px-2">Career</th>
          </tr>
        </thead>
        <tbody>
          <StatRow label="AVG" season={season?.avg} career={career?.avg} />
          <StatRow label="OBP" season={season?.obp} career={career?.obp} />
          <StatRow label="SLG" season={season?.slg} career={career?.slg} />
          <StatRow label="OPS" season={season?.ops} career={career?.ops} />
          <StatRow label="HR" season={season?.homeRuns} career={career?.homeRuns} />
          <StatRow label="RBI" season={season?.rbi} career={career?.rbi} />
          <StatRow label="SB" season={season?.stolenBases} career={career?.stolenBases} />
          <StatRow label="H" season={season?.hits} career={career?.hits} />
          <StatRow label="AB" season={season?.atBats} career={career?.atBats} />
        </tbody>
      </table>
    </div>
  );
}

function PitchingStats({ season, career }) {
  if (!season && !career) return null;
  return (
    <div>
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
        Pitching
      </h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-600 text-[10px] border-b border-border">
            <th className="text-left py-1">Stat</th>
            <th className="text-right px-2">Season</th>
            <th className="text-right px-2">Career</th>
          </tr>
        </thead>
        <tbody>
          <StatRow label="ERA" season={season?.era} career={career?.era} />
          <StatRow label="WHIP" season={season?.whip} career={career?.whip} />
          <StatRow label="W-L" season={season ? `${season.wins}-${season.losses}` : null} career={career ? `${career.wins}-${career.losses}` : null} />
          <StatRow label="K" season={season?.strikeOuts} career={career?.strikeOuts} />
          <StatRow label="IP" season={season?.inningsPitched} career={career?.inningsPitched} />
          <StatRow label="SV" season={season?.saves} career={career?.saves} />
          <StatRow label="BB" season={season?.baseOnBalls} career={career?.baseOnBalls} />
          <StatRow label="K/9" season={season?.strikeoutsPer9Inn} career={career?.strikeoutsPer9Inn} />
        </tbody>
      </table>
    </div>
  );
}

export default function PlayerDetailCard({ playerId }) {
  const { data: player, isLoading } = usePlayerDetail(playerId);

  if (isLoading) {
    return (
      <div className="py-3 px-4">
        <div className="skeleton h-32 w-full rounded" />
      </div>
    );
  }

  if (!player) return null;

  const headshotUrl = `https://img.mlb.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${player.id}/headshot/67/current`;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white/[0.03] border-t border-border px-4 py-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Bio Section */}
        <div className="flex gap-3 sm:w-48 shrink-0">
          <img
            src={headshotUrl}
            alt={player.fullName}
            className="w-16 h-16 rounded-lg bg-white/5 object-cover"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-bold truncate">{player.fullName}</h3>
            <p className="text-xs text-gray-400">
              #{player.number} {player.position}
            </p>
            <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
              <p>
                {player.batSide && `B: ${player.batSide}`}
                {player.batSide && player.pitchHand && ' / '}
                {player.pitchHand && `T: ${player.pitchHand}`}
              </p>
              {player.age && (
                <p>Age {player.age}</p>
              )}
              {player.height && (
                <p>
                  {player.height}, {player.weight} lbs
                </p>
              )}
              {player.debutDate && (
                <p>Debut: {formatDate(player.debutDate)}</p>
              )}
              {player.birthCity && (
                <p>
                  {player.birthCity}, {player.birthCountry}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          <HittingStats
            season={player.seasonHitting}
            career={player.careerHitting}
          />
          <PitchingStats
            season={player.seasonPitching}
            career={player.careerPitching}
          />
        </div>
      </div>
    </div>
  );
}
