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
| `cache.js` | Shared NodeCache instance (default 60s TTL) |
| `injuryScraper.js` | Puppeteer scraper — loads `mlb.com/news/{slug}-injuries-and-roster-moves`, parses "LATEST INJURIES" section |
| `teamSlugs.js` | Maps `teamId → newsSlug` for the scraper |
| `routes/roster.js` | Fetches active roster from MLB API, merges with `injuries.json` and scraper data |

### Frontend (`src/`)

| File | Role |
|------|------|
| `context/TeamContext.jsx` | Global team selection, CSS var injection, localStorage persistence |
| `hooks/useTeamData.js` | All React Query hooks: `useGames`, `useLiveGame`, `useRoster`, `useTeamStats`, `useStandings`, `useNews`, `useWeather` |
| `data/teams.js` | Static data for all 30 teams: colors, stadium coords, division, logo URL |
| `data/injuries.json` | Updated by GitHub Actions cron every 6h via `scripts/scrapeInjuries.js` |

### Injury data pipeline

- **Build-time data**: `src/data/injuries.json` is committed to the repo and refreshed by GitHub Actions (`.github/workflows/scrape-injuries.yml`) every 6 hours
- **Merging**: `server/routes/roster.js` and `api/roster.js` both call `mergeRosterData()` from `src/utils/rosterMerge.js` to combine MLB API injury data with the scraped JSON. Scraped-only players (day-to-day, spring training) get `status: null` (no badge) and `note: s.status` (shown in dropdown)

### Cache TTLs

| Data | TTL |
|------|-----|
| Live game | 15s |
| Games/schedule | 60s (live), 300s (no game) |
| Roster, stats, standings | 300s |
| Weather | 600s |
| News | 900s |

### Deployment

- `vercel.json` rewrites: `/api/*` passes through to serverless functions in `api/`, everything else → `index.html`
- The `api/` directory mirrors `server/routes/` for Vercel serverless — both must stay in sync
- `OPENWEATHER_API_KEY` env var is optional; weather widget silently hides if absent
