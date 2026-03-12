import { createContext, useContext, useState, useEffect } from 'react';
import { getTeamById } from '../data/teams';

const TeamContext = createContext(null);

const DEFAULT_TEAM_ID = 147; // NYY

export function TeamProvider({ children }) {
  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    const saved = localStorage.getItem('mlb-selected-team');
    return saved ? Number(saved) : DEFAULT_TEAM_ID;
  });

  const team = getTeamById(selectedTeamId) || getTeamById(DEFAULT_TEAM_ID);

  useEffect(() => {
    localStorage.setItem('mlb-selected-team', String(selectedTeamId));
  }, [selectedTeamId]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--team-primary', team.primary);
    root.style.setProperty('--team-accent', team.accent);
    root.style.setProperty('--team-text', team.textColor);
  }, [team]);

  return (
    <TeamContext.Provider value={{ team, selectedTeamId, setSelectedTeamId }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
