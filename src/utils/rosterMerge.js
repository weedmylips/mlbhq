// Map MLB API status.code values to human-readable IL badge labels
function mlbStatusToBadge(code) {
  const map = {
    D60: '60-Day IL',
    D10: '10-Day IL',
    D7: '7-Day IL',
    DTD: 'Day-To-Day',
    IN: 'Ineligible List',
    SU: 'Suspended',
  };
  return map[code] || null;
}

// IL-related status codes from the MLB API
const IL_CODES = new Set(['D60', 'D10', 'D7', 'DTD', 'IN', 'SU']);

// Text-based fallback for codes not in IL_CODES
const IL_KEYWORDS = ['Injured', 'IL', '10-Day', '60-Day', 'Paternity', 'Bereavement'];
function isInjuredByText(description) {
  if (!description) return false;
  return IL_KEYWORDS.some((k) => description.includes(k));
}

// Derive a short IL badge label from scraped text when no API code is available
function deriveILBadge(s) {
  const text = `${s.status || ''} ${s.expectedReturn || ''}`.toLowerCase();
  if (/60.day/.test(text)) return '60-Day IL';
  if (/10.day\s*(il|injured)/.test(text)) return '10-Day IL';
  if (/7.day\s*(il|injured)/.test(text)) return '7-Day IL';
  if (/day.to.day/.test(text)) return 'Day-To-Day';
  return 'IL';
}

/**
 * Parses raw MLB API roster responses and merges with scraped injury data.
 *
 * Merge priority for badge (status field):
 *   1. MLB API status.code → mlbStatusToBadge() (most reliable)
 *   2. MLB API status.description text match (fallback for unmapped codes)
 *   3. deriveILBadge() from scraped text (scraped-only players)
 *
 * Scraper fills in: injury description, expectedReturn, and long status note.
 *
 * @param {object} activeData - Response from the active roster API endpoint
 * @param {object} fullData   - Response from the full roster API endpoint
 * @param {Array}  scraped    - Scraped injury entries for the team
 * @returns {{ batters, pitchers, full, injured }}
 */
export function mergeRosterData(activeData, fullData, scraped) {
  const roster = (activeData.roster || []).map((entry) => {
    const person = entry.person || {};
    const stats = person.stats || [];
    const hittingStats = stats.find((s) => s.group?.displayName === 'hitting');
    const pitchingStats = stats.find((s) => s.group?.displayName === 'pitching');

    return {
      id: person.id,
      name: person.fullName,
      number: entry.jerseyNumber,
      position: entry.position?.abbreviation,
      positionType: entry.position?.type,
      status: entry.status?.description,
      hitting: hittingStats?.splits?.[0]?.stat || null,
      pitching: pitchingStats?.splits?.[0]?.stat || null,
    };
  });

  const apiInjured = (fullData.roster || [])
    .filter((entry) => {
      const code = entry.status?.code;
      return IL_CODES.has(code) || isInjuredByText(entry.status?.description);
    })
    .map((entry) => ({
      id: entry.person?.id,
      name: entry.person?.fullName,
      position: entry.position?.abbreviation,
      // Badge: prefer mapped code label, fall back to raw description
      status: mlbStatusToBadge(entry.status?.code) || entry.status?.description,
      note: entry.note || null,
    }));

  // Build name→position lookup from active roster for scraped-only player fallback
  const activePositionByName = new Map(roster.map((p) => [p.name.toLowerCase(), p.position]));

  // Merge with scraped injury data from static JSON (updated by GitHub Actions cron)
  const scrapedMap = new Map(scraped.map((s) => [s.playerName.toLowerCase(), s]));

  const injured = apiInjured
    .map((p) => {
      const match = scrapedMap.get(p.name.toLowerCase());
      return {
        ...p,
        injury: match?.injury || p.note || null,
        expectedReturn: match?.expectedReturn || null,
        // Long status paragraph from scraper; fall back to brief MLB API note
        note: match?.status || p.note || null,
      };
    })
    .filter((p) => p.injury !== null);

  // Add scraped players not in the API injured list (day-to-day, spring training, etc.)
  const apiNames = new Set(apiInjured.map((p) => p.name.toLowerCase()));
  for (const s of scraped) {
    if (!apiNames.has(s.playerName.toLowerCase()) && s.playerName) {
      injured.push({
        id: null,
        name: s.playerName,
        position: activePositionByName.get(s.playerName.toLowerCase()) || null,
        status: deriveILBadge(s),
        note: s.status || null,
        injury: s.injury || null,
        expectedReturn: s.expectedReturn || null,
      });
    }
  }

  const batters = roster
    .filter((p) => p.positionType !== 'Pitcher' || (p.hitting && !p.pitching))
    .sort((a, b) => {
      const opsA = parseFloat(a.hitting?.ops) || 0;
      const opsB = parseFloat(b.hitting?.ops) || 0;
      return opsB - opsA;
    });

  const pitchers = roster
    .filter((p) => p.positionType === 'Pitcher')
    .sort((a, b) => {
      const whipA = parseFloat(a.pitching?.whip);
      const whipB = parseFloat(b.pitching?.whip);
      if (isNaN(whipA) && isNaN(whipB)) return 0;
      if (isNaN(whipA)) return 1;
      if (isNaN(whipB)) return -1;
      return whipA - whipB;
    });

  return { batters, pitchers, full: roster, injured };
}
