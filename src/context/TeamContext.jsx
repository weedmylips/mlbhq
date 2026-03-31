import { createContext, useContext, useState, useEffect } from 'react';
import { getTeamById } from '../data/teams';

const TeamContext = createContext(null);

const DEFAULT_TEAM_ID = 147; // NYY
const FAVORITE_KEY = 'mlb-favorite-team';
const SELECTED_KEY = 'mlb-selected-team';

export function getFavoriteTeam() {
  const val = localStorage.getItem(FAVORITE_KEY);
  return val ? Number(val) : null;
}

export function setFavoriteTeam(teamId) {
  localStorage.setItem(FAVORITE_KEY, String(teamId));
}

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function TeamProvider({ children }) {
  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    const saved = localStorage.getItem(SELECTED_KEY);
    return saved ? Number(saved) : (getFavoriteTeam() || DEFAULT_TEAM_ID);
  });

  const [hasFavorite, setHasFavorite] = useState(() => getFavoriteTeam() !== null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const team = getTeamById(selectedTeamId) || getTeamById(DEFAULT_TEAM_ID);

  useEffect(() => {
    localStorage.setItem(SELECTED_KEY, String(selectedTeamId));
  }, [selectedTeamId]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--team-primary', team.primary);
    root.style.setProperty('--team-accent', team.accent);
    root.style.setProperty('--team-text', team.textColor);
    // Pick the brighter of primary/accent so it's always visible on dark backgrounds
    const highlight = luminance(team.primary) > luminance(team.accent) ? team.primary : team.accent;
    root.style.setProperty('--team-highlight', highlight);
  }, [team]);

  return (
    <TeamContext.Provider value={{ team, selectedTeamId, setSelectedTeamId, hasFavorite, setHasFavorite, pickerOpen, setPickerOpen }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
