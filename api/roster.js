import NodeCache from 'node-cache';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mergeRosterData } from '../src/utils/rosterMerge.js';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const __dirname = dirname(fileURLToPath(import.meta.url));
const INJURIES_PATH = join(__dirname, '../src/data/injuries.json');

function getScrapedInjuries(teamId) {
  try {
    const raw = readFileSync(INJURIES_PATH, 'utf8');
    const data = JSON.parse(raw);
    return data.teams?.[String(teamId)] || [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `roster-${teamId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const [activeResp, fullResp] = await Promise.all([
      fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active&hydrate=person(stats(type=season,group=[hitting,pitching]))`),
      fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=fullRoster`),
    ]);

    const activeData = await activeResp.json();
    const fullData = await fullResp.json();
    const scraped = getScrapedInjuries(teamId);

    const result = mergeRosterData(activeData, fullData, scraped);
    cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    console.error('Roster error:', err.message);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
}
