import { Router } from 'express';
import { XMLParser } from 'fast-xml-parser';
import { getCached, setCached } from '../cache.js';

const router = Router();

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();
}

router.get('/news', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `news-${teamId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://www.mlb.com/feeds/news/rss.xml?teamId=${teamId}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`RSS fetch failed: ${resp.status}`);
    const xml = await resp.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      cdataPropName: '__cdata',
    });
    const parsed = parser.parse(xml);

    const raw = parsed?.rss?.channel?.item;
    if (!raw) return res.json({ articles: [] });

    const items = Array.isArray(raw) ? raw : [raw];

    const articles = items.slice(0, 8).map((item) => {
      const title = item.title?.__cdata ?? item.title ?? '';
      const description = item.description?.__cdata ?? item.description ?? '';
      const link = item.link ?? item.guid?.['#text'] ?? item.guid ?? '';
      let pubDate = null;
      try { pubDate = new Date(item.pubDate).toISOString(); } catch (_) {}
      const thumbnail = item.enclosure?.['@_url'] ?? item['media:thumbnail']?.['@_url'] ?? null;

      return {
        title: stripHtml(title).trim(),
        summary: stripHtml(description).slice(0, 220),
        link: typeof link === 'string' ? link : '',
        pubDate,
        thumbnail,
      };
    }).filter((a) => a.title && a.link);

    const result = { articles };
    setCached(cacheKey, result, 900);
    res.json(result);
  } catch (err) {
    console.error('News error:', err.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
