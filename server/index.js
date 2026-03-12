import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import gamesRouter from './routes/games.js';
import rosterRouter from './routes/roster.js';
import standingsRouter from './routes/standings.js';
import statsRouter from './routes/stats.js';
import weatherRouter from './routes/weather.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', gamesRouter);
app.use('/api', rosterRouter);
app.use('/api', standingsRouter);
app.use('/api', statsRouter);
app.use('/api', weatherRouter);

app.listen(PORT, () => {
  console.log(`MLB Dashboard API running on port ${PORT}`);
});
