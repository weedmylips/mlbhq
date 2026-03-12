import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getCached, setCached } from '../cache.js';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));
const INJURIES_PATH = join(__dirname, '../../src/data/injuries.json');

const IL_STATUSES = ['Injured', 'IL', '10-Day', '60-Day', 'Paternity', 'Bereavement', 'Restricted'];

function isInjured(status) {
  if (!status) return false;
  return IL_STATUSES.some((s) => status.includes(s));
}

function getScrapedInjuries(teamId) {
  try {
    const raw = readFileSync(INJURIES_PATH, 'utf8');
    const data = JSON.parse(raw);
    return data.teams?.[String(teamId)] || [];
  } catch {
    return [];
  }
}

router.get('/roster', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `roster-${teamId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const [activeResp, fullResp] = await Promise.all([
      fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active&hydrate=person(stats(type=season,group=[hitting,pitching]))`),
      fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=fullRoster`),
    ]);

    const activeData = await activeResp.json();
    const fullData = await fullResp.json();

    const roster = (activeData.roster || []).map((entry) => {
      const person = entry.person || {};
      const stats = person.stats || [];
      const hittingStats = stats.find((s) => s.group?.displayName === 'hitting');
      const pitchingStats = stats.find((s) => s.group?.displayName === 'pitching');

      return {
        id: person.id,
        name: person.fullName,
        number: entry.jerseyNumber,
        position: entry.position?.abbreviation,
        positionType: entry.position?.type,
        status: entry.status?.description,
        hitting: hittingStats?.splits?.[0]?.stat || null,
        pitching: pitchingStats?.splits?.[0]?.stat || null,
      };
    });

    const apiInjured = (fullData.roster || [])
      .filter((entry) => isInjured(entry.status?.description))
      .map((entry) => ({
        id: entry.person?.id,
        name: entry.person?.fullName,
        position: entry.position?.abbreviation,
        status: entry.status?.description,
        note: entry.note || null,
      }));

    // Merge with scraped injury data from static JSON (updated by GitHub Actions cron)
    const scraped = getScrapedInjuries(teamId);
    const scrapedMap = new Map(scraped.map((s) => [s.playerName.toLowerCase(), s]));

    const injured = apiInjured.map((p) => {
      const match = scrapedMap.get(p.name.toLowerCase());
      return {
        ...p,
        injury: match?.injury || p.note || null,
        expectedReturn: match?.expectedReturn || null,
      };
    });

    // Add scraped players not in the API injured list (day-to-day, spring training, etc.)
    const apiNames = new Set(apiInjured.map((p) => p.name.toLowerCase()));
    for (const s of scraped) {
      if (!apiNames.has(s.playerName.toLowerCase()) && s.playerName) {
        injured.push({
          id: null,
          name: s.playerName,
          position: null,
          status: null,
          note: null,
          injury: s.injury || null,
          expectedReturn: s.expectedReturn || null,
        });
      }
    }

    const batters = roster.filter(
      (p) => p.positionType !== 'Pitcher' || (p.hitting && !p.pitching)
    );
    const pitchers = roster.filter((p) => p.positionType === 'Pitcher');

    const result = { batters, pitchers, full: roster, injured };
    setCached(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    console.error('Roster error:', err.message);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

export default router;
