/**
 * Simplified win expectancy lookup table based on historical MLB data.
 * Key: `${inning}-${halfInning}-${outs}-${runDiff}-${baseState}`
 * Values are win probability for the HOME team.
 *
 * Base states: 0=empty, 1=1st, 2=2nd, 3=3rd, 4=1st+2nd, 5=1st+3rd, 6=2nd+3rd, 7=loaded
 *
 * This is a compressed approximation. For run diffs beyond +/-5, we clamp.
 */

// Base win expectancy by inning and run differential (simplified)
// Format: [inning][runDiff+5] where runDiff is clamped to [-5, +5]
// Values are home team win probability
const BASE_WE = [
  // Inn 1-9, index 0 = runDiff -5, index 10 = runDiff +5
  [0.07, 0.11, 0.17, 0.24, 0.34, 0.50, 0.66, 0.76, 0.83, 0.89, 0.93], // Inn 1
  [0.06, 0.10, 0.16, 0.23, 0.33, 0.50, 0.67, 0.77, 0.84, 0.90, 0.94], // Inn 2
  [0.05, 0.09, 0.15, 0.22, 0.33, 0.50, 0.67, 0.78, 0.85, 0.91, 0.95], // Inn 3
  [0.04, 0.08, 0.13, 0.21, 0.32, 0.50, 0.68, 0.79, 0.87, 0.92, 0.96], // Inn 4
  [0.03, 0.07, 0.12, 0.19, 0.31, 0.50, 0.69, 0.81, 0.88, 0.93, 0.97], // Inn 5
  [0.03, 0.06, 0.10, 0.17, 0.30, 0.50, 0.70, 0.83, 0.90, 0.94, 0.97], // Inn 6
  [0.02, 0.05, 0.09, 0.16, 0.28, 0.50, 0.72, 0.84, 0.91, 0.95, 0.98], // Inn 7
  [0.01, 0.04, 0.07, 0.14, 0.26, 0.50, 0.74, 0.86, 0.93, 0.96, 0.99], // Inn 8
  [0.01, 0.02, 0.05, 0.11, 0.22, 0.50, 0.78, 0.89, 0.95, 0.98, 0.99], // Inn 9
];

// Outs modifier: adjusts probability slightly based on outs
// More outs = less opportunity to change the score, so extreme diffs matter more
const OUTS_MODIFIER = [0.02, 0.01, -0.01]; // 0 outs, 1 out, 2 outs

// Runners modifier: having runners increases chance of scoring
// Applied towards the batting team
const RUNNERS_MODIFIER = {
  0: 0,      // empty
  1: 0.02,   // 1st
  2: 0.03,   // 2nd
  3: 0.04,   // 3rd
  4: 0.04,   // 1st+2nd
  5: 0.05,   // 1st+3rd
  6: 0.06,   // 2nd+3rd
  7: 0.07,   // loaded
};

function getBaseState(runners) {
  const f = runners?.first ? 1 : 0;
  const s = runners?.second ? 1 : 0;
  const t = runners?.third ? 1 : 0;
  return f * 1 + s * 2 + t * 4;
  // This gives: 0=empty, 1=1st, 2=2nd, 3=1st+2nd, 4=3rd, 5=1st+3rd, 6=2nd+3rd, 7=loaded
}

/**
 * Calculate home team win probability
 * @param {number} inning - Current inning (1-9+)
 * @param {string} inningHalf - 'Top' or 'Bottom'
 * @param {number} outs - 0, 1, or 2
 * @param {number} homeRuns - Home team runs
 * @param {number} awayRuns - Away team runs
 * @param {object} runners - { first, second, third } booleans
 * @returns {number} Win probability for home team (0-1)
 */
export function getWinExpectancy(inning, inningHalf, outs, homeRuns, awayRuns, runners) {
  if (inning == null) return 0.5;

  const innIdx = Math.min(Math.max(inning, 1), 9) - 1;
  const runDiff = homeRuns - awayRuns; // positive = home leading
  const clampedDiff = Math.min(Math.max(runDiff, -5), 5);
  const diffIdx = clampedDiff + 5;

  let wp = BASE_WE[innIdx][diffIdx];

  // Apply outs modifier
  const outsVal = Math.min(Math.max(outs || 0, 0), 2);
  const outsAdj = OUTS_MODIFIER[outsVal];
  // If home is ahead, more outs is better for home
  if (runDiff > 0) wp += outsAdj;
  else if (runDiff < 0) wp -= outsAdj;

  // Apply runners modifier — benefits the batting team
  const baseState = getBaseState(runners);
  const runnerAdj = RUNNERS_MODIFIER[baseState] || 0;
  const isHomeBatting = inningHalf === 'Bottom';

  if (isHomeBatting) {
    wp += runnerAdj; // runners help home when home is batting
  } else {
    wp -= runnerAdj; // runners help away when away is batting
  }

  // Extra innings: closer to 50/50 when tied, more extreme otherwise
  if (inning > 9) {
    wp = 0.5 + (wp - 0.5) * 0.9;
  }

  return Math.min(Math.max(wp, 0.01), 0.99);
}
