import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

async function fetchApi(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Returns whether a live game is in progress for the given team.
 * Safe to call from any component — useGames data is shared via React Query cache.
 */
export function useHasLiveGame(teamId) {
  const { data } = useGames(teamId);
  return !!data?.live;
}

// Query keys for game-dependent data that should refresh when a game ends
const GAME_DEPENDENT_KEYS = [
  'stats', 'standings', 'analytics', 'situational',
  'hotcold', 'bullpen', 'leaders', 'league-leaders',
];

/**
 * Tracks live game state and invalidates game-dependent queries
 * when a game transitions from live → ended.
 */
export function useGameEndRefresh(hasLiveGame) {
  const queryClient = useQueryClient();
  const wasLive = useRef(false);

  useEffect(() => {
    if (hasLiveGame) {
      wasLive.current = true;
    } else if (wasLive.current) {
      // Game just ended — invalidate all game-dependent queries for one final refresh
      wasLive.current = false;
      for (const key of GAME_DEPENDENT_KEYS) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    }
  }, [hasLiveGame, queryClient]);
}

// --- Always polling ---

export function useGames(teamId) {
  return useQuery({
    queryKey: ['games', teamId],
    queryFn: () => fetchApi(`/api/games?teamId=${teamId}`),
    refetchInterval: 60000,
    enabled: !!teamId,
  });
}

export function useLiveGame(gamePk) {
  return useQuery({
    queryKey: ['live', gamePk],
    queryFn: () => fetchApi(`/api/live?gamePk=${gamePk}`),
    refetchInterval: 15000,
    enabled: !!gamePk,
  });
}

export function useScoreboard(date) {
  return useQuery({
    queryKey: ['scoreboard', date],
    queryFn: () => fetchApi(`/api/scoreboard${date ? `?date=${date}` : ''}`),
    refetchInterval: 60000,
  });
}

export function useRoster(teamId) {
  return useQuery({
    queryKey: ['roster', teamId],
    queryFn: () => fetchApi(`/api/roster?teamId=${teamId}`),
    refetchInterval: 1800000,
    enabled: !!teamId,
  });
}

export function useNews(teamId) {
  return useQuery({
    queryKey: ['news', teamId],
    queryFn: () => fetchApi(`/api/news?teamId=${teamId}`),
    refetchInterval: 1800000,
    enabled: !!teamId,
    select: (data) => data.articles,
  });
}

export function useTransactions(teamId) {
  return useQuery({
    queryKey: ['transactions', teamId],
    queryFn: () => fetchApi(`/api/transactions?teamId=${teamId}`),
    refetchInterval: 1800000,
    enabled: !!teamId,
  });
}

// --- Game-dependent (poll during live, stop when no game) ---

export function useTeamStats(teamId, leagueId, hasLiveGame) {
  const leagueParam = leagueId ? `&leagueId=${leagueId}` : '';
  return useQuery({
    queryKey: ['stats', teamId, leagueId || 'mlb'],
    queryFn: () => fetchApi(`/api/stats?teamId=${teamId}${leagueParam}`),
    refetchInterval: hasLiveGame ? 900000 : false,
    staleTime: 900000,
    enabled: !!teamId,
  });
}

export function useStandings(leagueId, type = 'regularSeason', hasLiveGame) {
  return useQuery({
    queryKey: ['standings', leagueId, type],
    queryFn: () => fetchApi(`/api/standings?leagueId=${leagueId}&type=${type}`),
    refetchInterval: hasLiveGame ? 1800000 : false,
    staleTime: 900000,
    enabled: !!leagueId,
  });
}

export function useTeamLeaders(teamId, hasLiveGame) {
  return useQuery({
    queryKey: ['leaders', teamId],
    queryFn: () => fetchApi(`/api/leaders?teamId=${teamId}`),
    refetchInterval: hasLiveGame ? 900000 : false,
    staleTime: 900000,
    enabled: !!teamId,
  });
}

export function useLeagueLeaders(hasLiveGame) {
  return useQuery({
    queryKey: ['league-leaders'],
    queryFn: () => fetchApi('/api/league-leaders'),
    refetchInterval: hasLiveGame ? 900000 : false,
    staleTime: 900000,
  });
}

export function useHotCold(teamId, hasLiveGame) {
  return useQuery({
    queryKey: ['hotcold', teamId],
    queryFn: () => fetchApi(`/api/hotcold?teamId=${teamId}`),
    refetchInterval: hasLiveGame ? 1800000 : false,
    staleTime: 900000,
    enabled: !!teamId,
  });
}

export function useAnalytics(teamId, leagueId, hasLiveGame) {
  const leagueParam = leagueId ? `&leagueId=${leagueId}` : '';
  return useQuery({
    queryKey: ['analytics', teamId, leagueId || 'mlb'],
    queryFn: () => fetchApi(`/api/analytics?teamId=${teamId}${leagueParam}`),
    refetchInterval: hasLiveGame ? 900000 : false,
    staleTime: 900000,
    enabled: !!teamId,
  });
}

export function useSituational(teamId, hasLiveGame) {
  return useQuery({
    queryKey: ['situational', teamId],
    queryFn: () => fetchApi(`/api/situational?teamId=${teamId}`),
    refetchInterval: hasLiveGame ? 900000 : false,
    staleTime: 900000,
    enabled: !!teamId,
  });
}

export function useBullpen(teamId) {
  return useQuery({
    queryKey: ['bullpen', teamId],
    queryFn: () => fetchApi(`/api/bullpen?teamId=${teamId}`),
    refetchInterval: false,
    staleTime: 3600000,
    enabled: !!teamId,
  });
}

export function useVsDivisions(teamId) {
  return useQuery({
    queryKey: ['vsdivisions', teamId],
    queryFn: () => fetchApi(`/api/vsdivisions?teamId=${teamId}`),
    staleTime: 3600000,
    enabled: !!teamId,
  });
}

// --- On-demand only (no auto-refetch) ---

export function useBoxScore(gamePk) {
  return useQuery({
    queryKey: ['boxscore', gamePk],
    queryFn: () => fetchApi(`/api/boxscore?gamePk=${gamePk}`),
    enabled: !!gamePk,
    staleTime: 3600000,
  });
}

export function useH2H(teamId, opponentId) {
  return useQuery({
    queryKey: ['h2h', teamId, opponentId],
    queryFn: () => fetchApi(`/api/h2h?teamId=${teamId}&opponentId=${opponentId}`),
    enabled: !!teamId && !!opponentId,
    staleTime: 1800000,
  });
}

export function useHighlights(gamePk, live) {
  return useQuery({
    queryKey: ['highlights', gamePk],
    queryFn: () => fetchApi(`/api/highlights?gamePk=${gamePk}`),
    enabled: !!gamePk,
    staleTime: live ? 60000 : 3600000,
    refetchInterval: live ? 60000 : false,
  });
}

export function useMatchup(pitcher1Id, pitcher2Id) {
  return useQuery({
    queryKey: ['matchup', pitcher1Id, pitcher2Id],
    queryFn: () =>
      fetchApi(
        `/api/matchup?pitcher1=${pitcher1Id || ''}&pitcher2=${pitcher2Id || ''}`
      ),
    enabled: !!(pitcher1Id || pitcher2Id),
    staleTime: 1800000,
  });
}

export function usePlayerDetail(playerId) {
  return useQuery({
    queryKey: ['player', playerId],
    queryFn: () => fetchApi(`/api/player?playerId=${playerId}`),
    enabled: !!playerId,
    staleTime: 600000,
  });
}

export function useBvp(batterId, pitcherId) {
  return useQuery({
    queryKey: ['bvp', batterId, pitcherId],
    queryFn: () => fetchApi(`/api/bvp?batterId=${batterId}&pitcherId=${pitcherId}`),
    enabled: !!batterId && !!pitcherId,
    staleTime: 3600000,
  });
}
