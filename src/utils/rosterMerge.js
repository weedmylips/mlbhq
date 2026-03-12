const IL_STATUSES = ['Injured', 'IL', '10-Day', '60-Day', 'Paternity', 'Bereavement', 'Restricted'];

function isInjured(status) {
  if (!status) return false;
  return IL_STATUSES.some((s) => status.includes(s));
}

/**
 * Parses raw MLB API roster responses and merges with scraped injury data.
 * @param {object} activeData - Response from the active roster API endpoint
 * @param {object} fullData - Response from the full roster API endpoint
 * @param {Array} scraped - Scraped injury entries for the team
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
    .filter((entry) => isInjured(entry.status?.description))
    .map((entry) => ({
      id: entry.person?.id,
      name: entry.person?.fullName,
      position: entry.position?.abbreviation,
      status: entry.status?.description,
      note: entry.note || null,
    }));

  // Merge with scraped injury data from static JSON (updated by GitHub Actions cron)
  const scrapedMap = new Map(scraped.map((s) => [s.playerName.toLowerCase(), s]));

  const injured = apiInjured.map((p) => {
    const match = scrapedMap.get(p.name.toLowerCase());
    return {
      ...p,
      injury: match?.injury || p.note || null,
      expectedReturn: match?.expectedReturn || null,
    };
  });

  // Add scraped players not in the API injured list (day-to-day, spring training, etc.)
  const apiNames = new Set(apiInjured.map((p) => p.name.toLowerCase()));
  for (const s of scraped) {
    if (!apiNames.has(s.playerName.toLowerCase()) && s.playerName) {
      injured.push({
        id: null,
        name: s.playerName,
        position: null,
        status: null,
        note: s.status || null,
        injury: s.injury || null,
        expectedReturn: s.expectedReturn || null,
      });
    }
  }

  const batters = roster.filter(
    (p) => p.positionType !== 'Pitcher' || (p.hitting && !p.pitching)
  );
  const pitchers = roster.filter((p) => p.positionType === 'Pitcher');

  return { batters, pitchers, full: roster, injured };
}
