import { createCache } from './_cache.js';

const { getOrFetch } = createCache(900, 60);

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function abbrevName(fullName) {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

function computeStatus(appearances, today) {
  if (appearances.length === 0) return 'available';
  const mostRecent = new Date(appearances[0].date);
  const daysSinceLast = Math.floor((today - mostRecent) / (1000 * 60 * 60 * 24));
  if (daysSinceLast >= 4) return 'available';

  const fourDaysAgo = new Date(today);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  const recentApps = appearances.filter((a) => new Date(a.date) >= fourDaysAgo);
  const count = recentApps.length;

  let status = count <= 1 ? 'available' : count === 2 ? 'limited' : 'unavailable';

  const hasHighPitch = recentApps.some((a) => (a.pitches || 0) >= 30);
  if (hasHighPitch && status !== 'unavailable') {
    status = status === 'available' ? 'limited' : 'unavailable';
  }

  return status;
}

const STATUS_ORDER = { unavailable: 0, limited: 1, available: 2 };

async function fetchBullpenData(teamId) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const season = today.getFullYear();

  const schedUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&season=${season}&startDate=${formatDate(sevenDaysAgo)}&endDate=${formatDate(today)}&hydrate=linescore`;
  const schedResp = await fetch(schedUrl);
  const schedData = await schedResp.json();
  const allGames = (schedData.dates || []).flatMap((d) => d.games || []);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const fourDaysAgo = new Date(today);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  const recentGames = allGames.filter(
    (g) => g.status?.abstractGameState === 'Final' && new Date(g.gameDate) >= fourDaysAgo && new Date(g.gameDate) <= yesterday
  );

  if (recentGames.length === 0) {
    return { relievers: [], window: `${formatDate(fourDaysAgo)} – ${formatDate(yesterday)}` };
  }

  const boxscorePromises = recentGames.map((g) =>
    fetch(`https://statsapi.mlb.com/api/v1/game/${g.gamePk}/boxscore`).then((r) => r.json())
  );
  const seasonStatsPromise = fetch(
    `https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&season=${season}&teamId=${teamId}&playerPool=All&sportId=1`
  ).then((r) => r.json());
  const rosterPromise = fetch(
    `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster/active?hydrate=person`
  ).then((r) => r.json());

  const [seasonStatsData, rosterData, ...boxscores] = await Promise.all([
    seasonStatsPromise,
    rosterPromise,
    ...boxscorePromises,
  ]);

  // Build pitchHand lookup from roster
  const handMap = {};
  for (const p of rosterData.roster || []) {
    if (p.person?.id) {
      handMap[p.person.id] = p.person.pitchHand?.code || '?';
    }
  }

  const seasonMap = {};
  for (const split of seasonStatsData.stats?.[0]?.splits || []) {
    const pid = split.player?.id;
    if (pid) {
      seasonMap[pid] = {
        era: split.stat?.era || '-.--',
        saves: split.stat?.saves || 0,
        gamesStarted: split.stat?.gamesStarted || 0,
        gamesPlayed: split.stat?.gamesPlayed || 0,
      };
    }
  }

  const relieverApps = {};

  for (let i = 0; i < boxscores.length; i++) {
    const bs = boxscores[i];
    const game = recentGames[i];
    const gameDate = game.gameDate?.slice(0, 10);
    const isHome = game.teams?.home?.team?.id === Number(teamId);
    const side = isHome ? 'home' : 'away';
    const teamData = bs.teams?.[side];
    if (!teamData) continue;

    const pitcherIds = teamData.pitchers || [];
    const players = teamData.players || {};

    for (let j = 1; j < pitcherIds.length; j++) {
      const pid = pitcherIds[j];
      const p = players[`ID${pid}`];
      if (!p) continue;

      const ps = p.stats?.pitching || {};
      if (!relieverApps[pid]) {
        relieverApps[pid] = {
          id: pid,
          name: abbrevName(p.person?.fullName),
          pitchHand: handMap[pid] || '?',
          appearances: [],
        };
      }

      relieverApps[pid].appearances.push({
        date: gameDate,
        ip: ps.inningsPitched || '0.0',
        pitches: ps.pitchesThrown ?? ps.numberOfPitches ?? 0,
        er: ps.earnedRuns ?? 0,
      });
    }
  }

  const relievers = Object.values(relieverApps)
    .filter((r) => {
      const ss = seasonMap[r.id];
      if (!ss) return true;
      return ss.gamesStarted / (ss.gamesPlayed || 1) < 0.5;
    })
    .map((r) => {
      r.appearances.sort((a, b) => b.date.localeCompare(a.date));
      const ss = seasonMap[r.id];
      const totalIP = r.appearances.reduce((sum, a) => sum + parseFloat(a.ip || 0), 0);
      const totalPitches = r.appearances.reduce((sum, a) => sum + (a.pitches || 0), 0);

      return {
        name: r.name,
        pitchHand: r.pitchHand,
        appearances: r.appearances.length,
        ip: totalIP % 1 === 0 ? `${totalIP}.0` : totalIP.toFixed(1),
        pitches: totalPitches,
        pitchesPerApp: r.appearances.map((a) => a.pitches || 0),
        lastAppearance: r.appearances[0]?.date || null,
        era: ss?.era || '-.--',
        saves: ss?.saves || 0,
        status: computeStatus(r.appearances, today),
      };
    })
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name));

  for (const [pidStr, ss] of Object.entries(seasonMap)) {
    const pid = Number(pidStr);
    if (relieverApps[pid]) continue;
    if (ss.gamesStarted / (ss.gamesPlayed || 1) >= 0.5) continue;
    if (ss.gamesPlayed === 0) continue;

    const split = (seasonStatsData.stats?.[0]?.splits || []).find(
      (s) => s.player?.id === pid
    );
    if (!split) continue;

    relievers.push({
      name: abbrevName(split.player?.fullName),
      pitchHand: handMap[pid] || '?',
      appearances: 0,
      ip: '0.0',
      pitches: 0,
      pitchesPerApp: [],
      lastAppearance: null,
      era: ss.era,
      saves: ss.saves,
      status: 'available',
    });
  }

  return {
    relievers,
    window: `${formatDate(fourDaysAgo)} – ${formatDate(yesterday)}`,
  };
}

export default async function handler(req, res) {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `bullpen-${teamId}`;
    const result = await getOrFetch(cacheKey, () => fetchBullpenData(teamId));
    res.json(result);
  } catch (err) {
    console.error('Bullpen error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bullpen data' });
  }
}
