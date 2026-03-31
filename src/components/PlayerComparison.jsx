import { useState } from 'react';
import { useRoster, usePlayerDetail } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';

function PlayerSelect({ players, selectedId, onChange, label }) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
        {label}
      </label>
      <select
        value={selectedId || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="mt-1 w-full bg-white/[0.02] border border-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[var(--team-highlight)]"
      >
        <option value="">Select player...</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.position})
          </option>
        ))}
      </select>
    </div>
  );
}

function ComparisonRow({ label, val1, val2, higherIsBetter = true }) {
  const num1 = parseFloat(val1);
  const num2 = parseFloat(val2);
  const bothValid = !isNaN(num1) && !isNaN(num2) && num1 !== num2;

  let class1 = '';
  let class2 = '';
  if (bothValid) {
    const better = higherIsBetter ? num1 > num2 : num1 < num2;
    class1 = better ? 'text-green-400 font-bold' : '';
    class2 = better ? '' : 'text-green-400 font-bold';
  }

  return (
    <tr className="border-b border-white/5">
      <td className={`text-right py-1 px-2 font-mono text-xs ${class1}`}>{val1 ?? '-'}</td>
      <td className="text-center py-1 px-3 text-gray-500 text-xs">{label}</td>
      <td className={`text-left py-1 px-2 font-mono text-xs ${class2}`}>{val2 ?? '-'}</td>
    </tr>
  );
}

function PlayerHeader({ player }) {
  if (!player) return <div className="h-20" />;

  const headshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${player.id}/headshot/67/current`;

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <img
        src={headshotUrl}
        alt={player.fullName}
        className="w-14 h-14 rounded-lg bg-white/[0.02] object-cover"
      />
      <div className="text-center">
        <div className="text-sm font-bold">{player.fullName}</div>
        <div className="text-[10px] text-gray-500">#{player.number} {player.position}</div>
      </div>
    </div>
  );
}

export default function PlayerComparison() {
  const { team } = useTeam();
  const { data: roster } = useRoster(team.id);
  const [player1Id, setPlayer1Id] = useState(null);
  const [player2Id, setPlayer2Id] = useState(null);

  const { data: p1 } = usePlayerDetail(player1Id);
  const { data: p2 } = usePlayerDetail(player2Id);

  const allPlayers = [...(roster?.batters || []), ...(roster?.pitchers || [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const bothSelected = p1 && p2;
  const isPitcher1 = p1?.positionCode === '1' || p1?.position === 'P';
  const isPitcher2 = p2?.positionCode === '1' || p2?.position === 'P';
  const bothPitchers = isPitcher1 && isPitcher2;
  const bothHitters = !isPitcher1 && !isPitcher2;

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
        Compare Players
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <PlayerSelect
          players={allPlayers}
          selectedId={player1Id}
          onChange={setPlayer1Id}
          label="Player 1"
        />
        <PlayerSelect
          players={allPlayers}
          selectedId={player2Id}
          onChange={setPlayer2Id}
          label="Player 2"
        />
      </div>

      {bothSelected && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <PlayerHeader player={p1} />
            <PlayerHeader player={p2} />
          </div>

          {bothHitters && (
            <table className="w-full">
              <tbody>
                <ComparisonRow label="AVG" val1={p1.seasonHitting?.avg} val2={p2.seasonHitting?.avg} />
                <ComparisonRow label="OBP" val1={p1.seasonHitting?.obp} val2={p2.seasonHitting?.obp} />
                <ComparisonRow label="SLG" val1={p1.seasonHitting?.slg} val2={p2.seasonHitting?.slg} />
                <ComparisonRow label="OPS" val1={p1.seasonHitting?.ops} val2={p2.seasonHitting?.ops} />
                <ComparisonRow label="HR" val1={p1.seasonHitting?.homeRuns} val2={p2.seasonHitting?.homeRuns} />
                <ComparisonRow label="RBI" val1={p1.seasonHitting?.rbi} val2={p2.seasonHitting?.rbi} />
                <ComparisonRow label="SB" val1={p1.seasonHitting?.stolenBases} val2={p2.seasonHitting?.stolenBases} />
                <ComparisonRow label="H" val1={p1.seasonHitting?.hits} val2={p2.seasonHitting?.hits} />
                <ComparisonRow label="BB" val1={p1.seasonHitting?.baseOnBalls} val2={p2.seasonHitting?.baseOnBalls} />
                <ComparisonRow label="K" val1={p1.seasonHitting?.strikeOuts} val2={p2.seasonHitting?.strikeOuts} higherIsBetter={false} />
              </tbody>
            </table>
          )}

          {bothPitchers && (
            <table className="w-full">
              <tbody>
                <ComparisonRow label="ERA" val1={p1.seasonPitching?.era} val2={p2.seasonPitching?.era} higherIsBetter={false} />
                <ComparisonRow label="WHIP" val1={p1.seasonPitching?.whip} val2={p2.seasonPitching?.whip} higherIsBetter={false} />
                <ComparisonRow label="W" val1={p1.seasonPitching?.wins} val2={p2.seasonPitching?.wins} />
                <ComparisonRow label="L" val1={p1.seasonPitching?.losses} val2={p2.seasonPitching?.losses} higherIsBetter={false} />
                <ComparisonRow label="K" val1={p1.seasonPitching?.strikeOuts} val2={p2.seasonPitching?.strikeOuts} />
                <ComparisonRow label="IP" val1={p1.seasonPitching?.inningsPitched} val2={p2.seasonPitching?.inningsPitched} />
                <ComparisonRow label="SV" val1={p1.seasonPitching?.saves} val2={p2.seasonPitching?.saves} />
                <ComparisonRow label="K/9" val1={p1.seasonPitching?.strikeoutsPer9Inn} val2={p2.seasonPitching?.strikeoutsPer9Inn} />
                <ComparisonRow label="BB/9" val1={p1.seasonPitching?.walksPer9Inn} val2={p2.seasonPitching?.walksPer9Inn} higherIsBetter={false} />
                <ComparisonRow label="AVG" val1={p1.seasonPitching?.avg} val2={p2.seasonPitching?.avg} higherIsBetter={false} />
              </tbody>
            </table>
          )}

          {!bothHitters && !bothPitchers && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">
                Select two players of the same type (both hitters or both pitchers) for comparison
              </p>
              {/* Show basic stats for mixed comparison */}
              <table className="w-full mt-3">
                <tbody>
                  <ComparisonRow label="Age" val1={p1.age} val2={p2.age} higherIsBetter={false} />
                  <ComparisonRow
                    label="Pos"
                    val1={p1.position}
                    val2={p2.position}
                    higherIsBetter={false}
                  />
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!bothSelected && player1Id && player2Id && (
        <div className="text-center py-4">
          <div className="skeleton h-32 w-full" />
        </div>
      )}
    </div>
  );
}
