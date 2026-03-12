const teams = [
  // AL East
  { id: 147, name: 'New York Yankees', abbr: 'NYY', city: 'New York', division: 'AL East', league: 'AL', primary: '#003087', accent: '#c8a951', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/147.svg', stadium: 'Yankee Stadium', stadiumLat: 40.8296, stadiumLng: -73.9262 },
  { id: 111, name: 'Boston Red Sox', abbr: 'BOS', city: 'Boston', division: 'AL East', league: 'AL', primary: '#BD3039', accent: '#0C2340', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/111.svg', stadium: 'Fenway Park', stadiumLat: 42.3467, stadiumLng: -71.0972 },
  { id: 141, name: 'Toronto Blue Jays', abbr: 'TOR', city: 'Toronto', division: 'AL East', league: 'AL', primary: '#134A8E', accent: '#1D2D5C', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/141.svg', stadium: 'Rogers Centre', stadiumLat: 43.6414, stadiumLng: -79.3894 },
  { id: 110, name: 'Baltimore Orioles', abbr: 'BAL', city: 'Baltimore', division: 'AL East', league: 'AL', primary: '#DF4601', accent: '#27251F', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/110.svg', stadium: 'Camden Yards', stadiumLat: 39.2838, stadiumLng: -76.6216 },
  { id: 139, name: 'Tampa Bay Rays', abbr: 'TB', city: 'St. Petersburg', division: 'AL East', league: 'AL', primary: '#092C5C', accent: '#8FBCE6', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/139.svg', stadium: 'Tropicana Field', stadiumLat: 27.7682, stadiumLng: -82.6534 },

  // AL Central
  { id: 114, name: 'Cleveland Guardians', abbr: 'CLE', city: 'Cleveland', division: 'AL Central', league: 'AL', primary: '#00385D', accent: '#E50022', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/114.svg', stadium: 'Progressive Field', stadiumLat: 41.4962, stadiumLng: -81.6852 },
  { id: 116, name: 'Detroit Tigers', abbr: 'DET', city: 'Detroit', division: 'AL Central', league: 'AL', primary: '#0C2340', accent: '#FA4616', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/116.svg', stadium: 'Comerica Park', stadiumLat: 42.3390, stadiumLng: -83.0485 },
  { id: 118, name: 'Kansas City Royals', abbr: 'KC', city: 'Kansas City', division: 'AL Central', league: 'AL', primary: '#004687', accent: '#BD9B60', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/118.svg', stadium: 'Kauffman Stadium', stadiumLat: 39.0517, stadiumLng: -94.4803 },
  { id: 142, name: 'Minnesota Twins', abbr: 'MIN', city: 'Minneapolis', division: 'AL Central', league: 'AL', primary: '#002B5C', accent: '#D31145', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/142.svg', stadium: 'Target Field', stadiumLat: 44.9818, stadiumLng: -93.2775 },
  { id: 145, name: 'Chicago White Sox', abbr: 'CWS', city: 'Chicago', division: 'AL Central', league: 'AL', primary: '#27251F', accent: '#C4CED4', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/145.svg', stadium: 'Guaranteed Rate Field', stadiumLat: 41.8299, stadiumLng: -87.6338 },

  // AL West
  { id: 117, name: 'Houston Astros', abbr: 'HOU', city: 'Houston', division: 'AL West', league: 'AL', primary: '#002D62', accent: '#EB6E1F', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/117.svg', stadium: 'Minute Maid Park', stadiumLat: 29.7573, stadiumLng: -95.3555 },
  { id: 136, name: 'Seattle Mariners', abbr: 'SEA', city: 'Seattle', division: 'AL West', league: 'AL', primary: '#0C2C56', accent: '#005C5C', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/136.svg', stadium: 'T-Mobile Park', stadiumLat: 47.5914, stadiumLng: -122.3325 },
  { id: 140, name: 'Texas Rangers', abbr: 'TEX', city: 'Arlington', division: 'AL West', league: 'AL', primary: '#003278', accent: '#C0111F', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/140.svg', stadium: 'Globe Life Field', stadiumLat: 32.7473, stadiumLng: -97.0845 },
  { id: 108, name: 'Los Angeles Angels', abbr: 'LAA', city: 'Anaheim', division: 'AL West', league: 'AL', primary: '#BA0021', accent: '#003263', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/108.svg', stadium: 'Angel Stadium', stadiumLat: 33.8003, stadiumLng: -117.8827 },
  { id: 133, name: 'Oakland Athletics', abbr: 'OAK', city: 'Oakland', division: 'AL West', league: 'AL', primary: '#003831', accent: '#EFB21E', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/133.svg', stadium: 'Oakland Coliseum', stadiumLat: 37.7516, stadiumLng: -122.2005 },

  // NL East
  { id: 144, name: 'Atlanta Braves', abbr: 'ATL', city: 'Atlanta', division: 'NL East', league: 'NL', primary: '#CE1141', accent: '#13274F', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/144.svg', stadium: 'Truist Park', stadiumLat: 33.8908, stadiumLng: -84.4678 },
  { id: 121, name: 'New York Mets', abbr: 'NYM', city: 'New York', division: 'NL East', league: 'NL', primary: '#002D72', accent: '#FF5910', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/121.svg', stadium: 'Citi Field', stadiumLat: 40.7571, stadiumLng: -73.8458 },
  { id: 143, name: 'Philadelphia Phillies', abbr: 'PHI', city: 'Philadelphia', division: 'NL East', league: 'NL', primary: '#E81828', accent: '#002D72', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/143.svg', stadium: 'Citizens Bank Park', stadiumLat: 39.9061, stadiumLng: -75.1665 },
  { id: 146, name: 'Miami Marlins', abbr: 'MIA', city: 'Miami', division: 'NL East', league: 'NL', primary: '#00A3E0', accent: '#EF3340', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/146.svg', stadium: 'loanDepot park', stadiumLat: 25.7781, stadiumLng: -80.2196 },
  { id: 120, name: 'Washington Nationals', abbr: 'WSH', city: 'Washington', division: 'NL East', league: 'NL', primary: '#AB0003', accent: '#14225A', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/120.svg', stadium: 'Nationals Park', stadiumLat: 38.8730, stadiumLng: -77.0074 },

  // NL Central
  { id: 112, name: 'Chicago Cubs', abbr: 'CHC', city: 'Chicago', division: 'NL Central', league: 'NL', primary: '#0E3386', accent: '#CC3433', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/112.svg', stadium: 'Wrigley Field', stadiumLat: 41.9484, stadiumLng: -87.6553 },
  { id: 158, name: 'Milwaukee Brewers', abbr: 'MIL', city: 'Milwaukee', division: 'NL Central', league: 'NL', primary: '#FFC52F', accent: '#12284B', textColor: '#000', logo: 'https://www.mlbstatic.com/team-logos/158.svg', stadium: 'American Family Field', stadiumLat: 43.0280, stadiumLng: -87.9712 },
  { id: 138, name: 'St. Louis Cardinals', abbr: 'STL', city: 'St. Louis', division: 'NL Central', league: 'NL', primary: '#C41E3A', accent: '#0C2340', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/138.svg', stadium: 'Busch Stadium', stadiumLat: 38.6226, stadiumLng: -90.1928 },
  { id: 134, name: 'Pittsburgh Pirates', abbr: 'PIT', city: 'Pittsburgh', division: 'NL Central', league: 'NL', primary: '#27251F', accent: '#FDB827', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/134.svg', stadium: 'PNC Park', stadiumLat: 40.4469, stadiumLng: -80.0058 },
  { id: 113, name: 'Cincinnati Reds', abbr: 'CIN', city: 'Cincinnati', division: 'NL Central', league: 'NL', primary: '#C6011F', accent: '#27251F', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/113.svg', stadium: 'Great American Ball Park', stadiumLat: 39.0974, stadiumLng: -84.5065 },

  // NL West
  { id: 119, name: 'Los Angeles Dodgers', abbr: 'LAD', city: 'Los Angeles', division: 'NL West', league: 'NL', primary: '#005A9C', accent: '#EF3E42', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/119.svg', stadium: 'Dodger Stadium', stadiumLat: 34.0739, stadiumLng: -118.2400 },
  { id: 137, name: 'San Francisco Giants', abbr: 'SF', city: 'San Francisco', division: 'NL West', league: 'NL', primary: '#FD5A1E', accent: '#27251F', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/137.svg', stadium: 'Oracle Park', stadiumLat: 37.7786, stadiumLng: -122.3893 },
  { id: 135, name: 'San Diego Padres', abbr: 'SD', city: 'San Diego', division: 'NL West', league: 'NL', primary: '#2F241D', accent: '#FFC425', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/135.svg', stadium: 'Petco Park', stadiumLat: 32.7076, stadiumLng: -117.1570 },
  { id: 109, name: 'Arizona Diamondbacks', abbr: 'ARI', city: 'Phoenix', division: 'NL West', league: 'NL', primary: '#A71930', accent: '#E3D4AD', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/109.svg', stadium: 'Chase Field', stadiumLat: 33.4455, stadiumLng: -112.0667 },
  { id: 115, name: 'Colorado Rockies', abbr: 'COL', city: 'Denver', division: 'NL West', league: 'NL', primary: '#33006F', accent: '#C4CED4', textColor: '#fff', logo: 'https://www.mlbstatic.com/team-logos/115.svg', stadium: 'Coors Field', stadiumLat: 39.7559, stadiumLng: -104.9942 },
];

export const divisionOrder = [
  'AL East', 'AL Central', 'AL West',
  'NL East', 'NL Central', 'NL West',
];

export const getTeamById = (id) => teams.find((t) => t.id === id);

export const getTeamsByDivision = () => {
  const grouped = {};
  for (const div of divisionOrder) {
    grouped[div] = teams.filter((t) => t.division === div);
  }
  return grouped;
};

export default teams;
