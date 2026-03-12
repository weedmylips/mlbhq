import puppeteer from 'puppeteer';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 21600 }); // 6-hour TTL
let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    browser.on('disconnected', () => { browser = null; });
  }
  return browser;
}

function parseInjuryArticle(text) {
  // Extract the injuries section — some teams use "LATEST INJURIES", others "INJURY UPDATES"
  const sectionMatch = text.match(/(?:LATEST INJURIES|INJURY UPDATES)\s*([\s\S]*?)(?:•\s*More|LATEST TRANSACTIONS|$)/);
  if (!sectionMatch) return [];

  const section = sectionMatch[1].trim();

  // Split into individual player blocks (separated by blank lines)
  const blocks = section.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  const results = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    // First line: "[POSITION] [Player Name]"
    // Position codes: 1B, 2B, 3B, SS, LF, CF, RF, OF, C, DH, SP, RP, LHP, RHP, etc.
    const firstLine = lines[0];
    const playerMatch = firstLine.match(/^([A-Z0-9]{1,3}(?:-[A-Z0-9]{1,3})?)\s+(.+)/);
    if (!playerMatch) continue;

    const playerName = playerMatch[2].trim();
    let injury = null;
    let expectedReturn = null;
    let status = null;

    for (const line of lines.slice(1)) {
      if (line.startsWith('Injury:')) {
        injury = line.replace('Injury:', '').trim();
      } else if (line.startsWith('Expected return:')) {
        expectedReturn = line.replace('Expected return:', '').trim();
      } else if (line.startsWith('Status:')) {
        // Strip "(updated ...)" / "(Last updated: ...)" and "More >>" from status
        status = line
          .replace('Status:', '')
          .replace(/\s*\((Last )?[Uu]pdated[^)]*\)\s*/g, '')
          .replace(/More\s*>>.*/, '')
          .trim();
      }
    }

    if (playerName && (injury || expectedReturn)) {
      results.push({ playerName, injury, expectedReturn, status });
    }
  }

  return results;
}

export async function scrapeTeamInjuries(newsSlug) {
  const cached = cache.get(newsSlug);
  if (cached !== undefined) return cached;

  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.goto(
      `https://www.mlb.com/news/${newsSlug}-injuries-and-roster-moves`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );

    // Give React time to render the article body
    await new Promise((r) => setTimeout(r, 5000));

    const text = await page.evaluate(() => {
      const el = document.querySelector('[class*="article-body"], [class*="ArticleBody"], article, main');
      return el ? el.innerText : document.body.innerText;
    });

    const injuries = parseInjuryArticle(text);
    cache.set(newsSlug, injuries);
    console.log(`[scraper] ${newsSlug}: found ${injuries.length} injured players`);
    return injuries;
  } catch (err) {
    console.error(`[scraper] ${newsSlug} failed:`, err.message);
    cache.set(newsSlug, []); // cache empty to avoid hammering on repeated failures
    return [];
  } finally {
    await page.close();
  }
}
