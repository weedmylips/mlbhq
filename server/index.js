import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import gamesRouter from './routes/games.js';
import rosterRouter from './routes/roster.js';
import standingsRouter from './routes/standings.js';
import statsRouter from './routes/stats.js';
import newsRouter from './routes/news.js';
import h2hRouter from './routes/h2h.js';
import hotcoldRouter from './routes/hotcold.js';
import playerRouter from './routes/player.js';
import transactionsRouter from './routes/transactions.js';
import matchupRouter from './routes/matchup.js';
import leadersRouter from './routes/leaders.js';
import highlightsRouter from './routes/highlights.js';
import scoreboardRouter from './routes/scoreboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', gamesRouter);
app.use('/api', rosterRouter);
app.use('/api', standingsRouter);
app.use('/api', statsRouter);
app.use('/api', newsRouter);
app.use('/api', h2hRouter);
app.use('/api', hotcoldRouter);
app.use('/api', playerRouter);
app.use('/api', transactionsRouter);
app.use('/api', matchupRouter);
app.use('/api', leadersRouter);
app.use('/api', highlightsRouter);
app.use('/api', scoreboardRouter);

app.listen(PORT, () => {
  console.log(`MLB Dashboard API running on port ${PORT}`);
});
