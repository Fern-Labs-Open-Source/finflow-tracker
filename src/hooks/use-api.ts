import useSWR, { SWRConfiguration } from 'swr';
import { apiClient } from '@/lib/api/client';

const fetcher = (url: string) => apiClient.get(url);

export function useApi<T = any>(
  endpoint: string | null,
  options?: SWRConfiguration
) {
  const { data, error, mutate, isLoading } = useSWR<T>(
    endpoint,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

// Custom hooks for specific endpoints
export function useInstitutions() {
  return useApi<any[]>('/api/institutions');
}

export function useAccounts(includeInactive = false) {
  const params = includeInactive ? '?includeInactive=true' : '';
  return useApi<any[]>(`/api/accounts${params}`);
}

export function useAccount(id: string | undefined) {
  return useApi(id ? `/api/accounts/${id}` : null);
}

export function usePortfolioSummary() {
  return useApi('/api/portfolio/summary');
}

export function usePortfolioHistory(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const queryString = params.toString();
  return useApi(`/api/portfolio/history${queryString ? `?${queryString}` : ''}`);
}

export function useCurrencyBreakdown() {
  return useApi('/api/portfolio/currencies');
}
