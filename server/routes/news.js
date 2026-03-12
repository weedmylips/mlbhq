import { Router } from 'express';
import { getCached, setCached } from '../cache.js';

const router = Router();

router.get('/news', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `news-${teamId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://dapi.cms.mlbinfra.com/v2/content/en-us/sel-t${teamId}-news-list`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`CMS fetch failed: ${resp.status}`);
    const data = await resp.json();

    const articles = (data.items || [])
      .sort((a, b) => new Date(b.contentDate) - new Date(a.contentDate))
      .slice(0, 8).map((item) => ({
      title: item.headline || '',
      summary: item.summary || '',
      link: `https://www.mlb.com/news/${item.slug}`,
      pubDate: item.contentDate || null,
      thumbnail: item.thumbnail?.thumbnailUrl || null,
    })).filter((a) => a.title && a.link);

    const result = { articles };
    setCached(cacheKey, result, 900);
    res.json(result);
  } catch (err) {
    console.error('News error:', err.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
