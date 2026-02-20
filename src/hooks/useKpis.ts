import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

/**
 * Generic KPI data-fetching hook backed by React Query.
 *
 * Wraps useQuery with sensible dashboard defaults:
 * - 3 minute stale time (KPIs are updated infrequently)
 * - No window-focus refetch (prevents jarring refreshes mid-dashboard)
 * - Single retry to handle transient errors gracefully
 *
 * Usage:
 *   const { data, isLoading, error } = useKpis(
 *     ['presupuesto', 'kpis', filters],
 *     () => presupuestoApi.getKpis(filters)
 *   );
 */
export function useKpis<T>(
  queryKey: readonly unknown[],
  fetchFn: () => Promise<T>,
  options?: Partial<UseQueryOptions<T, Error>>
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn: fetchFn,
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
}
