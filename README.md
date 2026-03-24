# MLB Team Dashboard

A full-stack real-time MLB team dashboard built with React, Vite, Tailwind CSS, and Express.js. Select any of the 30 MLB teams and see live stats, schedule, roster, standings, and weather — all themed in your team's colors.

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

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS + TanStack React Query
- **Backend**: Express.js with node-cache for in-memory caching
- **Data Sources**: MLB Stats API (free), OpenWeatherMap (free tier)
- **Proxy**: Vite dev server proxies `/api` to Express on port 3001
