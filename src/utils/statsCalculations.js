/**
 * Pythagorean win expectation using the 1.83 exponent (Pythagenpat)
 * @param {number} runsScored
 * @param {number} runsAllowed
 * @returns {number} Expected win percentage (0-1)
 */
export function pythagoreanWinPct(runsScored, runsAllowed) {
  if (!runsScored && !runsAllowed) return 0;
  if (!runsAllowed) return 1;
  const exp = 1.83;
  const rsExp = Math.pow(runsScored, exp);
  return rsExp / (rsExp + Math.pow(runsAllowed, exp));
}

/**
 * Calculate expected wins based on pythagorean expectation
 * @param {number} runsScored
 * @param {number} runsAllowed
 * @param {number} gamesPlayed (wins + losses)
 * @returns {number} Expected wins (rounded to nearest int)
 */
export function expectedWins(runsScored, runsAllowed, gamesPlayed) {
  return Math.round(pythagoreanWinPct(runsScored, runsAllowed) * gamesPlayed);
}

/**
 * Magic number to clinch division
 * @param {number} teamWins
 * @param {number} secondPlaceWins
 * @param {number} secondPlaceLosses
 * @returns {number|null} Magic number, or null if eliminated / already clinched
 */
export function magicNumber(teamWins, secondPlaceWins, secondPlaceLosses) {
  const magic = 163 - teamWins - secondPlaceLosses;
  if (magic <= 0) return 0; // clinched
  return magic;
}
