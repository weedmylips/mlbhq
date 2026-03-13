import { createCache } from './_cache.js';

const { getOrFetch } = createCache(1800, 120);

export default async function handler(req, res) {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `news-${teamId}`;
    const result = await getOrFetch(cacheKey, async () => {
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

      return { articles };
    }, 1800);
    res.json(result);
  } catch (err) {
    console.error('News error:', err.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}
