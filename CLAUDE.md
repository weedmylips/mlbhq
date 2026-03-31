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
| `routes/matchup.js` | Pitcher season stats, last 3 game log entries, H2H splits vs opponent team |
| `routes/player.js` | Full player profile: season, career, game log, L/R, home/away, monthly splits |
| `routes/bvp.js` | Career batter-vs-pitcher head-to-head hitting stats |
| `routes/bullpen.js` | Reliever availability status (available/limited/unavailable) based on recent appearances |
| `routes/highlights.js` | Up to 10 video highlight clips (thumbnail + MP4) for a given `gamePk` |
| `routes/scoreboard.js` | Day's full schedule with live linescore, probable pitchers, decisions |
| `routes/transactions.js` | Recent roster transactions (trades, signings, DFAs, options, recalls) for a team |
| `routes/analytics.js` | Derived advanced metrics (FIP, K%, BB%, BABIP, OPS+) from raw stats |
| `routes/situational.js` | Batter hitting splits: RISP, bases loaded, men on, bases empty, vs LHP/RHP |
| `routes/leaders.js` | MLB leaderboards for traditional and advanced hitting/pitching categories |
| `routes/vsdivisions.js` | Team's season W-L record broken down by opposing division |

### Vercel serverless (`api/`)

Mirrors `server/routes/` for production. Uses a different cache pattern than the dev server:

| File | Role |
|------|------|
| `_cache.js` | Cache factory `createCache(stdTTL, checkperiod)` — each serverless function gets its own instance (can't share process state) |
| `games.js`, `roster.js`, `standings.js`, `stats.js`, `news.js`, `h2h.js`, `hotcold.js`, `boxscore.js` | Mirror their `server/routes/` counterparts |
| `live.js` | Real-time live game feed (linescore, current play, lineups); 15s cache |
| `bullpen.js` | Serverless mirror of bullpen route; 15-min cache |
| `vsdivisions.js` | Serverless mirror of vs-divisions route; 1-hour cache |
| `extra.js` | Consolidated handler bundling player, transactions, matchup, leaders, and highlights endpoints |

### Frontend (`src/`)

| File | Role |
|------|------|
| `main.jsx` | React entry point; sets up React Query client (staleTime: 30s, retry: 2, no focus refetch) |
| `App.jsx` | Main layout coordinator |
| `context/TeamContext.jsx` | Global team selection, CSS var injection, localStorage persistence |
| `hooks/useTeamData.js` | All React Query hooks: `useGames`, `useLiveGame`, `useScoreboard`, `useRoster`, `useNews`, `useTransactions`, `useTeamStats`, `useStandings`, `useTeamLeaders`, `useLeagueLeaders`, `useHotCold`, `useAnalytics`, `useSituational`, `useBullpen`, `useVsDivisions`, `useBoxScore`, `useH2H`, `useHighlights`, `useMatchup`, `usePlayerDetail`, `useBvp`, `useHasLiveGame`, `useGameEndRefresh` |
| `data/teams.js` | Static data for all 30 teams: colors, stadium coords, division, logo URL |
| `data/injuries.json` | Updated by GitHub Actions cron every 6h via `scripts/scrapeInjuries.js` |
| `utils/rosterMerge.js` | `mergeRosterData()` — merges MLB API roster with scraped injury data |

#### Components (`src/components/`)

| Component | Role |
|-----------|------|
| `Header.jsx` | Top navigation bar with team selection |
| `TeamSelector.jsx` | Horizontal scrollable team logo bar (sticky top nav) |
| `TeamPicker.jsx` | Modal for first-visit and change-team selection |
| `TeamStats.jsx` | Offensive/pitching stats with league rankings |
| `AdvancedStats.jsx` | Advanced analytics (FIP, K%, BABIP, OPS+) with stat cards and player tables |
| `SituationalStats.jsx` | Batter situational splits (RISP, bases loaded, vs LHP/RHP) |
| `TeamLeaders.jsx` | Team and league statistical leaderboards with scope toggle |
| `RecordBreakdown.jsx` | W-L records by category (home/away, streak, vs division, 1-run games) |
| `RosterTable.jsx` | Active roster with injury badges and expected return dates |
| `InjuryReport.jsx` | Dedicated injury report view |
| `Schedule.jsx` | Full team schedule |
| `NextGame.jsx` | Upcoming game details (time, opponent, probable pitchers) |
| `MatchupPreview.jsx` | Pitching matchup details with season stats and H2H splits |
| `LiveGame.jsx` | Real-time live game with inning-by-inning, runner positions, count |
| `LineupCard.jsx` | Live game batting lineups for both teams |
| `WinProbability.jsx` | Win probability display during live games |
| `PitchLog.jsx` | Pitch-by-pitch log for current at-bat |
| `PitchZone.jsx` | Visual pitch zone display |
| `PitcherEfficiency.jsx` | Pitcher workload and efficiency metrics |
| `BatterVsPitcher.jsx` | Career batter-vs-pitcher matchup stats |
| `Highlights.jsx` | Video highlight clips with thumbnails for a game |
| `GameSummaryPanel.jsx` | Completed game boxscore summary |
| `GameDetailModal.jsx` | Full game detail modal (boxscore, highlights) |
| `GamePreviewModal.jsx` | Pre-game preview modal |
| `GamePreviewPanel.jsx` | Pre-game preview inline panel |
| `RecentGames.jsx` | Last N completed games |
| `Scoreboard.jsx` | League-wide daily scoreboard with all games |
| `BullpenHealth.jsx` | Reliever availability status based on recent workload |
| `PitchingRotation.jsx` | Starting rotation with upcoming matchups and stats |
| `PitchingTable.jsx` | Pitcher stats table |
| `Standings.jsx` | Divisional/league standings |
| `NewsFeed.jsx` | Recent team news articles |
| `TransactionsFeed.jsx` | Recent roster transactions (trades, signings, DFAs) |
| `HotCold.jsx` | Hot/cold player performers |
| `PlayerSearch.jsx` | Global player search with autocomplete |
| `PlayerDetailCard.jsx` | Expandable player profile with stats, game log, and splits |
| `PlayerGameLog.jsx` | Player's recent game-by-game stats |
| `PlayerSplits.jsx` | Player splits (L/R, home/away, monthly) |
| `PlayerComparison.jsx` | Side-by-side player stat comparison |
| `Milestones.jsx` | Player milestones |
| `TeamUpdates.jsx` | General team updates widget |
| `Modal.jsx` | Reusable modal wrapper |
| `Sparkline.jsx` | Small inline sparkline chart |

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
| Bullpen | 900s (server) / 900s (api) |
| Roster | 300s (server) / 600s (api) |
| Stats, standings, analytics, situational | 900s |
| Leaders | 900s |
| News | 1800s |
| Boxscore, H2H, highlights, matchup | 3600s |
| Vs-divisions, transactions | 3600s |
| Hot/Cold players | 7200s |
| Player detail | 3600s |

### Deployment

- `vercel.json` rewrites: `/api/*` passes through to serverless functions in `api/`, everything else → `index.html`
- The `api/` directory mirrors `server/routes/` for Vercel serverless — both must stay in sync
- `api/_cache.js` uses a factory pattern (vs shared singleton in `server/cache.js`) because Vercel serverless functions cannot share process-level state
