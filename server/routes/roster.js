import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getOrFetch } from '../cache.js';
import { mergeRosterData } from '../../src/utils/rosterMerge.js';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));
const INJURIES_PATH = join(__dirname, '../../src/data/injuries.json');

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
    const cacheKey = `roster-v5-${teamId}`;
    const result = await getOrFetch(cacheKey, async () => {
      const [activeResp, fullResp] = await Promise.all([
        fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active&hydrate=person(stats(type=season,group=[hitting,pitching]))`),
        fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=40Man`),
      ]);

      const activeData = await activeResp.json();
      const fullData = await fullResp.json();
      const scraped = getScrapedInjuries(teamId);

      return mergeRosterData(activeData, fullData, scraped);
    }, 600);
    res.json(result);
  } catch (err) {
    console.error('Roster error:', err.message);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

export default router;
