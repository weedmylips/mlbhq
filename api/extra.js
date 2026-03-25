import { createCache } from './_cache.js';

const playerCache = createCache(1800, 120);
const transactionsCache = createCache(1800, 120);
const matchupCache = createCache(3600, 60);
const leadersCache = createCache(3600, 60);
const highlightsCache = createCache(3600, 60);

// --- Player ---
async function handlePlayer(req, res) {
  const { playerId } = req.query;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });

  const cacheKey = `player-${playerId}`;
  const player = await playerCache.getOrFetch(cacheKey, async () => {
    const url = `https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=stats(group=[hitting,pitching],type=[season,career]),currentTeam`;
    const resp = await fetch(url);
    const data = await resp.json();
    const person = data.people?.[0];
    if (!person) return null;

    const stats = person.stats || [];
    const findStats = (group, type) => {
      const entry = stats.find(
        (s) => s.group?.displayName === group && s.type?.displayName === type
      );
      return entry?.splits?.[0]?.stat || null;
    };

    return {
      id: person.id,
      fullName: person.fullName,
      firstName: person.firstName,
      lastName: person.lastName,
      birthDate: person.birthDate,
      age: person.currentAge,
      birthCity: person.birthCity,
      birthCountry: person.birthCountry,
      height: person.height,
      weight: person.weight,
      position: person.primaryPosition?.abbreviation,
      batSide: person.batSide?.code,
      pitchHand: person.pitchHand?.code,
      number: person.primaryNumber,
      debutDate: person.mlbDebutDate,
      draftYear: person.draftYear,
      team: person.currentTeam?.name,
      seasonHitting: findStats('hitting', 'season'),
      careerHitting: findStats('hitting', 'career'),
      seasonPitching: findStats('pitching', 'season'),
      careerPitching: findStats('pitching', 'career'),
    };
  }, 1800);

  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
}

// --- Transactions ---
const TYPE_MAP = {
  Trade: 'trade',
  'Free Agent Signing': 'signing',
  'Designated for Assignment': 'dfa',
  Optioned: 'option',
  Recalled: 'recall',
  Claimed: 'claim',
  Released: 'release',
  Signed: 'signing',
};

function classifyType(typeDesc) {
  for (const [key, value] of Object.entries(TYPE_MAP)) {
    if (typeDesc?.includes(key)) return value;
  }
  return 'other';
}

async function handleTransactions(req, res) {
  const { teamId } = req.query;
  if (!teamId) return res.status(400).json({ error: 'teamId required' });

  const cacheKey = `transactions-${teamId}`;
  const transactions = await transactionsCache.getOrFetch(cacheKey, async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const fmt = (d) => d.toISOString().slice(0, 10);

    const url = `https://statsapi.mlb.com/api/v1/transactions?teamId=${teamId}&startDate=${fmt(start)}&endDate=${fmt(end)}`;
    const resp = await fetch(url);
    const data = await resp.json();

    return (data.transactions || [])
      .filter((t) => t.description)
      .map((t) => ({
        id: t.id,
        date: t.date,
        type: classifyType(t.typeDesc),
        typeDesc: t.typeDesc,
        description: t.description,
        player: t.person
          ? { id: t.person.id, name: t.person.fullName }
          : null,
      }))
      .slice(0, 30);
  }, 1800);

  res.json(transactions);
}

// --- Matchup ---
async function fetchPitcherStats(pitcherId) {
  const url = `https://statsapi.mlb.com/api/v1/people/${pitcherId}?hydrate=stats(group=[pitching],type=[season,gameLog])`;
  const resp = await fetch(url);
  const data = await resp.json();
  const person = data.people?.[0];
  if (!person) return null;

  const stats = person.stats || [];
  const seasonSplit = stats.find(
    (s) => s.group?.displayName === 'pitching' && s.type?.displayName === 'season'
  );
  const gameLogSplit = stats.find(
    (s) => s.group?.displayName === 'pitching' && s.type?.displayName === 'gameLog'
  );

  const season = seasonSplit?.splits?.[0]?.stat || null;
  const lastStarts = (gameLogSplit?.splits || []).slice(-3).reverse().map((g) => ({
    date: g.date,
    opponent: g.opponent?.name,
    result: g.isWin ? 'W' : g.isLoss ? 'L' : '-',
    ip: g.stat?.inningsPitched,
    hits: g.stat?.hits,
    er: g.stat?.earnedRuns,
    k: g.stat?.strikeOuts,
    bb: g.stat?.baseOnBalls,
    era: g.stat?.era,
  }));

  return {
    id: person.id,
    name: person.fullName,
    number: person.primaryNumber,
    pitchHand: person.pitchHand?.code,
    season: season
      ? {
          wins: season.wins,
          losses: season.losses,
          era: season.era,
          whip: season.whip,
          k: season.strikeOuts,
          ip: season.inningsPitched,
          k9: season.strikeoutsPer9Inn,
          bb9: season.walksPer9Inn,
          avg: season.avg,
        }
      : null,
    lastStarts,
  };
}

async function handleMatchup(req, res) {
  const { pitcher1, pitcher2 } = req.query;
  if (!pitcher1 && !pitcher2) {
    return res.status(400).json({ error: 'At least one pitcher ID required' });
  }

  const cacheKey = `matchup-${pitcher1 || 0}-${pitcher2 || 0}`;
  const result = await matchupCache.getOrFetch(cacheKey, async () => {
    const [p1, p2] = await Promise.all([
      pitcher1 ? fetchPitcherStats(pitcher1) : null,
      pitcher2 ? fetchPitcherStats(pitcher2) : null,
    ]);
    return { home: p1, away: p2 };
  }, 3600);

  res.json(result);
}

// --- Leaders ---
const CATEGORIES = [
  'battingAverage',
  'homeRuns',
  'runsBattedIn',
  'stolenBases',
  'earnedRunAverage',
  'wins',
  'saves',
  'strikeouts',
];

const CATEGORY_LABELS = {
  battingAverage: 'AVG',
  homeRuns: 'HR',
  runsBattedIn: 'RBI',
  stolenBases: 'SB',
  earnedRunAverage: 'ERA',
  wins: 'W',
  saves: 'SV',
  strikeouts: 'K',
};

async function handleLeaders(req, res) {
  const { teamId } = req.query;
  if (!teamId) return res.status(400).json({ error: 'teamId required' });

  const cacheKey = `leaders-${teamId}`;
  const leaders = await leadersCache.getOrFetch(cacheKey, async () => {
    const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/leaders?leaderCategories=${CATEGORIES.join(',')}&season=2025&limit=5`;
    const resp = await fetch(url);
    const data = await resp.json();

    return (data.teamLeaders || []).map((cat) => ({
      category: cat.leaderCategory,
      label: CATEGORY_LABELS[cat.leaderCategory] || cat.leaderCategory,
      leaders: (cat.leaders || []).map((l) => ({
        rank: l.rank,
        name: l.person?.fullName,
        playerId: l.person?.id,
        value: l.value,
      })),
    }));
  }, 3600);

  res.json(leaders);
}

// --- Highlights ---
async function handleHighlights(req, res) {
  const { gamePk } = req.query;
  if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

  const cacheKey = `highlights-${gamePk}`;
  const highlights = await highlightsCache.getOrFetch(cacheKey, async () => {
    const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/content`;
    const resp = await fetch(url);
    const data = await resp.json();

    const items = data.highlights?.highlights?.items || [];
    return items
      .filter((item) => item.type === 'video')
      .slice(0, 10)
      .map((item) => {
        const mp4 = item.playbacks?.find(
          (p) => p.name === 'mp4Avc' || p.name?.includes('mp4')
        );
        const thumb =
          item.image?.cuts?.find((c) => c.width >= 300 && c.width <= 640) ||
          item.image?.cuts?.[0];

        return {
          id: item.id,
          title: item.title || item.headline || '',
          description: item.blurb || item.description || '',
          duration: item.duration,
          thumbnail: thumb?.src || null,
          videoUrl: mp4?.url || null,
        };
      })
      .filter((h) => h.videoUrl || h.thumbnail);
  }, 3600);

  res.json(highlights);
}

// --- Router ---
const handlers = {
  player: handlePlayer,
  transactions: handleTransactions,
  matchup: handleMatchup,
  leaders: handleLeaders,
  highlights: handleHighlights,
};

export default async function handler(req, res) {
  try {
    const route = req.query.route;
    const fn = handlers[route];
    if (!fn) return res.status(404).json({ error: `Unknown route: ${route}` });
    await fn(req, res);
  } catch (err) {
    console.error('Extra API error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
