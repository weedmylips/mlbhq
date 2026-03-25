import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

// FIP constant approximation by season (historical average ~3.10)
const C_FIP = 3.10;

function computeAdvanced(stat, isPitching) {
  const result = {};

  if (isPitching) {
    const ip = parseFloat(stat.inningsPitched) || 0;
    const hr = stat.homeRuns ?? 0;
    const bb = stat.baseOnBalls ?? 0;
    const hbp = stat.hitByPitch ?? 0;
    const k = stat.strikeOuts ?? 0;
    const h = stat.hits ?? 0;
    const bf = stat.battersFaced ?? stat.atBats ?? 0;

    // FIP = ((13*HR) + (3*(BB+HBP)) - (2*K)) / IP + cFIP
    result.fip = ip > 0
      ? (((13 * hr) + (3 * (bb + hbp)) - (2 * k)) / ip + C_FIP).toFixed(2)
      : null;

    // K% and BB%
    result.kPct = bf > 0 ? ((k / bf) * 100).toFixed(1) : null;
    result.bbPct = bf > 0 ? ((bb / bf) * 100).toFixed(1) : null;

    // BABIP = (H - HR) / (BF - K - HR + SF)
    const sf = stat.sacFlies ?? 0;
    const denom = bf - k - hr + sf;
    result.babip = denom > 0 ? ((h - hr) / denom).toFixed(3) : null;

    // HR/9
    result.hr9 = ip > 0 ? ((hr * 9) / ip).toFixed(2) : null;

    // Groundout/Airout ratio
    result.goAo = stat.groundOutsToAirouts ?? null;

    // Pass through standard
    result.era = stat.era ?? null;
    result.whip = stat.whip ?? null;
    result.k = k;
    result.bb = bb;
    result.ip = stat.inningsPitched;
    result.wins = stat.wins ?? 0;
    result.losses = stat.losses ?? 0;
  } else {
    const ab = stat.atBats ?? 0;
    const h = stat.hits ?? 0;
    const hr = stat.homeRuns ?? 0;
    const bb = stat.baseOnBalls ?? 0;
    const hbp = stat.hitByPitch ?? 0;
    const sf = stat.sacFlies ?? 0;
    const k = stat.strikeOuts ?? 0;
    const pa = stat.plateAppearances ?? (ab + bb + hbp + sf);

    // ISO = SLG - AVG
    const slg = parseFloat(stat.slg) || 0;
    const avg = parseFloat(stat.avg) || 0;
    result.iso = (slg - avg).toFixed(3);

    // K% and BB%
    result.kPct = pa > 0 ? ((k / pa) * 100).toFixed(1) : null;
    result.bbPct = pa > 0 ? ((bb / pa) * 100).toFixed(1) : null;

    // BABIP = (H - HR) / (AB - K - HR + SF)
    const denom = ab - k - hr + sf;
    result.babip = denom > 0 ? ((h - hr) / denom).toFixed(3) : null;

    // wOBA approximation (2024 linear weights)
    const ubb = bb - (stat.intentionalWalks ?? 0);
    const singles = h - (stat.doubles ?? 0) - (stat.triples ?? 0) - hr;
    const woba_num =
      0.69 * ubb +
      0.72 * hbp +
      0.88 * singles +
      1.24 * (stat.doubles ?? 0) +
      1.56 * (stat.triples ?? 0) +
      2.01 * hr;
    const woba_denom = ab + bb - (stat.intentionalWalks ?? 0) + sf + hbp;
    result.woba = woba_denom > 0 ? (woba_num / woba_denom).toFixed(3) : null;

    // Pass through standard
    result.avg = stat.avg ?? null;
    result.obp = stat.obp ?? null;
    result.slg = stat.slg ?? null;
    result.ops = stat.ops ?? null;
    result.hr = hr;
    result.sb = stat.stolenBases ?? 0;
    result.rbi = stat.rbi ?? 0;
    result.runs = stat.runs ?? 0;
  }

  return result;
}

function abbrevName(fullName) {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

router.get('/analytics', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `analytics-${teamId}`;
    const result = await getOrFetch(cacheKey, async () => {
      let season = new Date().getFullYear();

      async function fetchData(s) {
        return Promise.all([
          fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=hitting&season=${s}`).then((r) => r.json()),
          fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=pitching&season=${s}`).then((r) => r.json()),
          fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&season=${s}&teamId=${teamId}&playerPool=All&sportId=1`).then((r) => r.json()),
          fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&season=${s}&teamId=${teamId}&playerPool=All&sportId=1`).then((r) => r.json()),
        ]);
      }

      let [hittingData, pitchingData, playerHitting, playerPitching] = await fetchData(season);

      if (!hittingData.stats?.length) {
        season = season - 1;
        [hittingData, pitchingData, playerHitting, playerPitching] = await fetchData(season);
      }

      const teamHitting = hittingData.stats?.[0]?.splits?.[0]?.stat || {};
      const teamPitching = pitchingData.stats?.[0]?.splits?.[0]?.stat || {};

      // Player-level advanced stats
      const playerHittingSplits = playerHitting.stats?.[0]?.splits || [];
      const advancedBatters = playerHittingSplits
        .filter((s) => (s.stat?.plateAppearances || s.stat?.atBats || 0) >= 20)
        .map((s) => ({
          name: abbrevName(s.player?.fullName),
          playerId: s.player?.id,
          ...computeAdvanced(s.stat, false),
        }))
        .sort((a, b) => parseFloat(b.woba || 0) - parseFloat(a.woba || 0));

      const playerPitchingSplits = playerPitching.stats?.[0]?.splits || [];
      const advancedPitchers = playerPitchingSplits
        .filter((s) => parseFloat(s.stat?.inningsPitched || 0) >= 10)
        .map((s) => ({
          name: abbrevName(s.player?.fullName),
          playerId: s.player?.id,
          ...computeAdvanced(s.stat, true),
        }))
        .sort((a, b) => parseFloat(a.fip || 99) - parseFloat(b.fip || 99));

      return {
        teamHitting: computeAdvanced(teamHitting, false),
        teamPitching: computeAdvanced(teamPitching, true),
        batters: advancedBatters,
        pitchers: advancedPitchers,
      };
    }, 900);
    res.json(result);
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
