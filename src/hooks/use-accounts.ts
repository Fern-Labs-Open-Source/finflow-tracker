import useSWR from 'swr'
import { useCallback, useMemo, useState } from 'react'
import debounce from 'debounce'

// Types
export interface Institution {
  id: string
  name: string
  type: string
  color?: string
}

export interface Account {
  id: string
  name: string
  type: string
  currency: string
  currentBalance: number
  isActive: boolean
  institutionId: string
  institution: Institution
  lastSnapshotDate?: string
  _count?: {
    snapshots: number
  }
}

export interface BatchUpdateData {
  updates: Array<{
    id: string
    balance: number
  }>
}

// Fetcher
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      'X-Test-Bypass-Auth': 'test-mode',
    },
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  
  return res.json()
}

// Main accounts hook with filtering
export function useAccounts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [institutionFilter, setInstitutionFilter] = useState<string>('all')
  
  const { data: accounts, error, isLoading, mutate } = useSWR<Account[]>(
    '/api/accounts',
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  )

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    if (!accounts) return []
    
    return accounts.filter(account => {
      // Search filter
      if (searchQuery && !account.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !account.institution.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Type filter
      if (typeFilter !== 'all' && account.type !== typeFilter) {
        return false
      }
      
      // Institution filter
      if (institutionFilter !== 'all' && account.institutionId !== institutionFilter) {
        return false
      }
      
      return true
    })
  }, [accounts, searchQuery, typeFilter, institutionFilter])

  // Batch update accounts
  const batchUpdateBalances = useCallback(async (updates: BatchUpdateData['updates']) => {
    // Optimistic update
    const optimisticData = accounts?.map(account => {
      const update = updates.find(u => u.id === account.id)
      if (update) {
        return { ...account, currentBalance: update.balance }
      }
      return account
    })
    
    mutate(optimisticData, false)
    
    try {
      const response = await fetch('/api/accounts/batch-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Bypass-Auth': 'test-mode',
        },
        body: JSON.stringify({ updates })
      })
      
      if (!response.ok) throw new Error('Batch update failed')
      
      const result = await response.json()
      mutate()  // Revalidate
      return result
    } catch (error) {
      mutate()  // Revert on error
      throw error
    }
  }, [accounts, mutate])

  // Single account update with optimistic UI
  const updateAccount = useCallback(async (id: string, data: Partial<Account>) => {
    const optimisticData = accounts?.map(account => 
      account.id === id ? { ...account, ...data } : account
    )
    
    mutate(optimisticData, false)
    
    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Bypass-Auth': 'test-mode',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Update failed')
      
      const result = await response.json()
      mutate()  // Revalidate
      return result
    } catch (error) {
      mutate()  // Revert on error
      throw error
    }
  }, [accounts, mutate])

  // Delete account with optimistic UI
  const deleteAccount = useCallback(async (id: string) => {
    const optimisticData = accounts?.filter(account => account.id !== id)
    
    mutate(optimisticData, false)
    
    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Test-Bypass-Auth': 'test-mode',
        }
      })
      
      if (!response.ok) throw new Error('Delete failed')
      
      mutate()  // Revalidate
    } catch (error) {
      mutate()  // Revert on error
      throw error
    }
  }, [accounts, mutate])

  return {
    accounts: filteredAccounts,
    allAccounts: accounts || [],
    isLoading,
    isError: error,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    institutionFilter,
    setInstitutionFilter,
    batchUpdateBalances,
    updateAccount,
    deleteAccount,
    refresh: mutate,
  }
}

// Hook for search with debouncing
export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  // Debounced search function
  const search = useMemo(
    () =>
      debounce(async (searchQuery: string) => {
        if (!searchQuery) {
          setResults(null)
          setIsSearching(false)
          return
        }
        
        setIsSearching(true)
        
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=all`, {
            headers: {
              'X-Test-Bypass-Auth': 'test-mode',
            }
          })
          
          if (!response.ok) throw new Error('Search failed')
          
          const data = await response.json()
          setResults(data)
        } catch (error) {
          console.error('Search error:', error)
          setResults(null)
        } finally {
          setIsSearching(false)
        }
      }, 300),
    []
  )
  
  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    search(value)
  }, [search])
  
  return {
    query,
    handleSearch,
    results,
    isSearching,
    clearResults: () => {
      setQuery('')
      setResults(null)
    }
  }
}
