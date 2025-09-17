import useSWR from 'swr'
import { useCallback } from 'react'

// Types
export interface QuickStats {
  totalValue: {
    eur: number
    formatted: string
  }
  dailyChange?: {
    amount: number
    percent: number
    formatted: string
  }
  accountCount: number
  distribution: {
    byType: Array<{
      type: string
      count: number
      value: number
      percentage: number
    }>
    byCurrency: Array<{
      currency: string
      count: number
      value: number
      valueEur: number
    }>
    byInstitution: Array<{
      institution: string
      count: number
      value: number
      percentage: number
    }>
  }
  lastUpdated?: string
}

// Fetcher function with proper error handling
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      'X-Test-Bypass-Auth': 'test-mode',
    },
  })
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    throw error
  }
  
  return res.json()
}

// Hook for quick portfolio stats (new endpoint)
export function usePortfolioQuickStats() {
  const { data, error, isLoading, mutate } = useSWR<QuickStats>(
    '/api/portfolio/quick-stats',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: false, // Don't refetch on window focus
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  )

  return {
    stats: data,
    isLoading,
    isError: error,
    refresh: mutate
  }
}

// Hook for full portfolio summary (existing endpoint)
export function usePortfolioSummary() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/portfolio/summary',
    fetcher,
    {
      refreshInterval: 120000, // Refresh every 2 minutes
      revalidateOnFocus: true,
    }
  )

  return {
    portfolio: data,
    isLoading,
    isError: error,
    refresh: mutate
  }
}

// Hook for portfolio history
export function usePortfolioHistory(days: number = 30) {
  const { data, error, isLoading } = useSWR(
    `/api/portfolio/history?days=${days}`,
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  )

  return {
    history: data,
    isLoading,
    isError: error
  }
}

// Optimistic update helper
export function useOptimisticUpdate() {
  const optimisticUpdate = useCallback(
    async (
      url: string,
      data: any,
      optimisticData: any,
      mutate: any
    ) => {
      // Show optimistic data immediately
      mutate(optimisticData, false)
      
      try {
        // Make the actual request
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Test-Bypass-Auth': 'test-mode',
          },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) throw new Error('Update failed')
        
        const result = await response.json()
        
        // Update with actual data
        mutate(result, false)
        
        return result
      } catch (error) {
        // Revert on error
        mutate()
        throw error
      }
    },
    []
  )

  return { optimisticUpdate }
}
