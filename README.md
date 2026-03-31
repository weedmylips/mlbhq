# MLB Team Dashboard

A full-stack real-time MLB team dashboard built with React, Vite, Tailwind CSS, and Express.js. Select any of the 30 MLB teams and get a comprehensive view — live game tracking, schedule, roster with injury data, standings, advanced stats, bullpen health, player comparisons, video highlights, and more — all themed in your team's colors.

## Prerequisites

- Node.js 18+
- npm

## Installation

```bash
git clone <repo-url>
cd mlb-dashboard
npm install
```

## Configuration

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

## Running Locally

```bash
npm run dev
```

This starts both the Express backend (port 3001) and the Vite dev server (port 5173) concurrently. Open [http://localhost:5173](http://localhost:5173).

## MLB Stats API Notes

- The MLB Stats API (`statsapi.mlb.com`) is free and requires no authentication
- Be respectful of rate limits — the backend uses in-memory caching (60s for live data, 5min for static data)
- API documentation: https://statsapi.mlb.com/docs/

## Updating Team Colors

Team colors are defined in `src/data/teams.js`. Each team entry has:
- `primary`: Main brand color (used for header, accents)
- `accent`: Secondary color (used for borders, highlights)
- `textColor`: `#fff` or `#000` based on primary darkness

## Features

- **Live Game Tracking** — Real-time linescore, runner positions, pitch-by-pitch, win probability
- **Team Overview** — Next game with pitching matchup, recent results, record breakdown
- **Roster & Injuries** — Active roster with IL badges, injury details, and expected return dates (scraped every 6h via GitHub Actions)
- **Stats & Analytics** — Team batting/pitching with league rankings, advanced metrics (FIP, K%, BABIP, OPS+), situational splits
- **Standings** — Division, league, and wild card standings
- **Leaderboards** — Team and league-wide statistical leaders
- **Bullpen Health** — Reliever availability based on recent workload
- **Pitching Rotation** — Starting rotation schedule with stats
- **Hot & Cold Players** — Top/bottom performers over the last 7 days
- **Player Profiles** — Detailed stats, game log, splits, and player-vs-player comparisons
- **Scoreboard** — League-wide daily scores
- **News & Transactions** — Latest team news from MLB CMS and recent roster moves
- **Video Highlights** — Game highlight clips with thumbnails
- **Team Theming** — Dynamic CSS variables apply each team's colors across the entire UI

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS + TanStack React Query
- **Backend**: Express.js with node-cache for in-memory caching
- **Deployment**: Vercel (serverless functions in `api/` mirror `server/routes/`)
- **Data Sources**: MLB Stats API (free, no auth required)
- **Injury Data**: Puppeteer scraper on GitHub Actions cron (every 6h) → `src/data/injuries.json`
- **Proxy**: Vite dev server proxies `/api` to Express on port 3001
