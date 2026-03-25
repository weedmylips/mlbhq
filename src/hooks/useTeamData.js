import { useQuery } from '@tanstack/react-query';

async function fetchApi(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useGames(teamId) {
  return useQuery({
    queryKey: ['games', teamId],
    queryFn: () => fetchApi(`/api/games?teamId=${teamId}`),
    refetchInterval: 30000,
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

export function useRoster(teamId) {
  return useQuery({
    queryKey: ['roster', teamId],
    queryFn: () => fetchApi(`/api/roster?teamId=${teamId}`),
    refetchInterval: 300000,
    enabled: !!teamId,
  });
}

export function useTeamStats(teamId, leagueId) {
  return useQuery({
    queryKey: ['stats', teamId, leagueId],
    queryFn: () => fetchApi(`/api/stats?teamId=${teamId}&leagueId=${leagueId}`),
    refetchInterval: 300000,
    enabled: !!teamId && !!leagueId,
  });
}

export function useStandings(leagueId, type = 'regularSeason') {
  return useQuery({
    queryKey: ['standings', leagueId, type],
    queryFn: () => fetchApi(`/api/standings?leagueId=${leagueId}&type=${type}`),
    refetchInterval: 300000,
    enabled: !!leagueId,
  });
}

export function useNews(teamId) {
  return useQuery({
    queryKey: ['news', teamId],
    queryFn: () => fetchApi(`/api/news?teamId=${teamId}`),
    refetchInterval: 900000,
    enabled: !!teamId,
    select: (data) => data.articles,
  });
}

export function useBoxScore(gamePk) {
  return useQuery({
    queryKey: ['boxscore', gamePk],
    queryFn: () => fetchApi(`/api/boxscore?gamePk=${gamePk}`),
    enabled: !!gamePk,
    staleTime: 300000,
  });
}

export function useH2H(teamId, opponentId) {
  return useQuery({
    queryKey: ['h2h', teamId, opponentId],
    queryFn: () => fetchApi(`/api/h2h?teamId=${teamId}&opponentId=${opponentId}`),
    enabled: !!teamId && !!opponentId,
    staleTime: 300000,
  });
}

export function useHighlights(gamePk) {
  return useQuery({
    queryKey: ['highlights', gamePk],
    queryFn: () => fetchApi(`/api/highlights?gamePk=${gamePk}`),
    enabled: !!gamePk,
    staleTime: 600000,
  });
}

export function useTeamLeaders(teamId) {
  return useQuery({
    queryKey: ['leaders', teamId],
    queryFn: () => fetchApi(`/api/leaders?teamId=${teamId}`),
    refetchInterval: 300000,
    enabled: !!teamId,
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
    staleTime: 600000,
  });
}

export function useTransactions(teamId) {
  return useQuery({
    queryKey: ['transactions', teamId],
    queryFn: () => fetchApi(`/api/transactions?teamId=${teamId}`),
    refetchInterval: 900000,
    enabled: !!teamId,
  });
}

export function usePlayerDetail(playerId) {
  return useQuery({
    queryKey: ['player', playerId],
    queryFn: () => fetchApi(`/api/player?playerId=${playerId}`),
    enabled: !!playerId,
    staleTime: 300000,
  });
}

export function useHotCold(teamId) {
  return useQuery({
    queryKey: ['hotcold', teamId],
    queryFn: () => fetchApi(`/api/hotcold?teamId=${teamId}`),
    refetchInterval: 300000,
    enabled: !!teamId,
  });
}

