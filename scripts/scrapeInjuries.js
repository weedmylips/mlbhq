import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scrapeTeamInjuries } from '../server/injuryScraper.js';
import { TEAM_NEWS_SLUGS } from '../server/teamSlugs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/data/injuries.json');

async function run() {
  const results = { lastUpdated: new Date().toISOString(), teams: {} };
  const teamIds = Object.keys(TEAM_NEWS_SLUGS);

  console.log(`Scraping injury data for ${teamIds.length} teams...`);

  for (const teamId of teamIds) {
    const slug = TEAM_NEWS_SLUGS[teamId];
    try {
      console.log(`  [${teamId}] ${slug}...`);
      const injuries = await scrapeTeamInjuries(slug);
      results.teams[teamId] = injuries;
      console.log(`  [${teamId}] ${injuries.length} players found`);
    } catch (err) {
      console.error(`  [${teamId}] failed: ${err.message}`);
      results.teams[teamId] = [];
    }
  }

  mkdirSync(join(__dirname, '../src/data'), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\nDone. Written to ${OUTPUT_PATH}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
