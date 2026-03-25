# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Express (port 3001) + Vite dev server concurrently
npm run server           # Express backend only
npm run build            # Vite production build
npm run scrape-injuries  # Run Puppeteer scraper → writes src/data/injuries.json
```

No test suite exists in this project.

## Architecture

**MLB team dashboard** — React 18 SPA + Express backend, deployed on Vercel.

### Data flow

1. User selects a team → `TeamContext` updates `selectedTeamId`, applies CSS vars (`--team-primary`, `--team-accent`, `--team-text`) to `:root`
2. Components call hooks in `src/hooks/useTeamData.js` → React Query fetches `/api/*`
3. In dev, Vite proxies `/api` → `http://localhost:3001` (Express). In prod, Vercel rewrites handle it
4. Express routes check `server/cache.js` (NodeCache), fetch from MLB Stats API if cold, cache and return

### Backend (`server/`)

| File | Role |
|------|------|
| `index.js` | Express app, mounts all routers |
| `cache.js` | Shared NodeCache instance (default 60s TTL) with `getOrFetch()` helper and pending request deduplication |
| `injuryScraper.js` | Puppeteer scraper — loads `mlb.com/news/{slug}-injuries-and-roster-moves`, parses "LATEST INJURIES" section |
| `teamSlugs.js` | Maps `teamId → newsSlug` for the scraper |
| `routes/games.js` | 7 days prior + 14 days future schedule; returns `{live, next, recent, allGames}`; dynamic TTL |
| `routes/roster.js` | Fetches active roster from MLB API, merges with `injuries.json` and scraper data |
| `routes/standings.js` | League standings by division |
| `routes/stats.js` | Team & league-wide stats with rankings; returns hitting/pitching stats, ranks, top batters/pitchers |
| `routes/news.js` | Team news from MLB CMS; top 8 articles |
| `routes/h2h.js` | Head-to-head record between two teams (`teamId` + `opponentId` params) |
| `routes/hotcold.js` | Hot/cold players over last 7 days; top 3 batters + 2 pitchers each way |
| `routes/boxscore.js` | Detailed boxscore by `gamePk` with inning-by-inning, pitcher/hitter stats |
| `routes/live.js` | Dedicated live game details endpoint |

### Vercel serverless (`api/`)

Mirrors `server/routes/` for production. Uses a different cache pattern than the dev server:

| File | Role |
|------|------|
| `_cache.js` | Cache factory `createCache(stdTTL, checkperiod)` — each serverless function gets its own instance (can't share process state) |
| `games.js`, `roster.js`, `standings.js`, `stats.js`, `news.js`, `h2h.js`, `hotcold.js`, `boxscore.js`, `live.js` | Mirror their `server/routes/` counterparts |

### Frontend (`src/`)

| File | Role |
|------|------|
| `main.jsx` | React entry point; sets up React Query client (staleTime: 30s, retry: 2, no focus refetch) |
| `App.jsx` | Main layout coordinator |
| `context/TeamContext.jsx` | Global team selection, CSS var injection, localStorage persistence |
| `hooks/useTeamData.js` | All React Query hooks: `useGames`, `useLiveGame`, `useRoster`, `useTeamStats`, `useStandings`, `useNews`, `useWeather` |
| `data/teams.js` | Static data for all 30 teams: colors, stadium coords, division, logo URL |
| `data/injuries.json` | Updated by GitHub Actions cron every 6h via `scripts/scrapeInjuries.js` |
| `utils/rosterMerge.js` | `mergeRosterData()` — merges MLB API roster with scraped injury data |

#### Components (`src/components/`)

| Component | Role |
|-----------|------|
| `Header.jsx` | Top navigation bar with team selection |
| `TeamSelector.jsx` | Team selection dropdown |
| `TeamStats.jsx` | Offensive/pitching stats with league rankings |
| `RosterTable.jsx` | Active roster with injury badges and expected return dates |
| `InjuryReport.jsx` | Dedicated injury report view |
| `Schedule.jsx` | Full team schedule |
| `NextGame.jsx` | Upcoming game details (time, opponent, probable pitchers) |
| `LiveGame.jsx` | Real-time live game with inning-by-inning, runner positions, count |
| `GameSummaryPanel.jsx` | Completed game boxscore summary |
| `RecentGames.jsx` | Last N completed games |
| `PitchingTable.jsx` | Pitcher stats table |
| `Standings.jsx` | Divisional/league standings |
| `NewsFeed.jsx` | Recent team news articles |
| `HotCold.jsx` | Hot/cold player performers |
| `Milestones.jsx` | Player milestones |
| `TeamUpdates.jsx` | General team updates widget |

### Injury data pipeline

- **Build-time data**: `src/data/injuries.json` is committed to the repo and refreshed by GitHub Actions (`.github/workflows/scrape-injuries.yml`) every 6 hours
- **Script**: `scripts/scrapeInjuries.js` orchestrates scraping all 30 teams and writes the JSON
- **Merging**: both `server/routes/roster.js` and `api/roster.js` call `mergeRosterData()` from `src/utils/rosterMerge.js`

#### Merge priority in `rosterMerge.js`

| Field | Source | Notes |
|-------|--------|-------|
| `status` (IL badge) | MLB API `status.code` → `mlbStatusToBadge()` | `D60`=60-Day IL, `D10`=10-Day IL, `D7`=7-Day IL, `DTD`=Day-To-Day. Falls back to description text, then `deriveILBadge()` for scraped-only players |
| `injury` | Scraper `injury` field | Falls back to MLB API `note` |
| `expectedReturn` | Scraper `expectedReturn` field | null if not scraped |
| `note` | Scraper `status` paragraph | Long descriptive text shown in dropdown; falls back to MLB API `note` |

- API-only players (no scraper match) get `injury`/`expectedReturn`/`note` from the MLB API's `note` field
- Scraped-only players (not on official IL) get their badge from `deriveILBadge()` which parses `expectedReturn` text for "Day to day", "60-day", etc.

### Cache TTLs

| Data | TTL |
|------|-----|
| Live game | 15s |
| Games/schedule | 60s (live), 300s (no game) |
| Roster | 300s (server) / 600s (api) |
| Stats, standings | 900s |
| News | 1800s |
| Boxscore, H2H | 3600s |
| Hot/Cold players | 7200s |

### Deployment

- `vercel.json` rewrites: `/api/*` passes through to serverless functions in `api/`, everything else → `index.html`
- The `api/` directory mirrors `server/routes/` for Vercel serverless — both must stay in sync
- `api/_cache.js` uses a factory pattern (vs shared singleton in `server/cache.js`) because Vercel serverless functions cannot share process-level state
