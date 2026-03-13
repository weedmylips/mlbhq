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

export function useStandings(leagueId) {
  return useQuery({
    queryKey: ['standings', leagueId],
    queryFn: () => fetchApi(`/api/standings?leagueId=${leagueId}`),
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

export function useHotCold(teamId) {
  return useQuery({
    queryKey: ['hotcold', teamId],
    queryFn: () => fetchApi(`/api/hotcold?teamId=${teamId}`),
    refetchInterval: 300000,
    enabled: !!teamId,
  });
}

export function useWeather(lat, lng, venue) {
  return useQuery({
    queryKey: ['weather', lat, lng],
    queryFn: () =>
      fetchApi(`/api/weather?lat=${lat}&lng=${lng}&venue=${encodeURIComponent(venue)}`),
    refetchInterval: 600000,
    enabled: !!lat && !!lng,
  });
}
