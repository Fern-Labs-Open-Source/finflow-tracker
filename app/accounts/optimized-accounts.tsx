'use client'

import { useState, useCallback, useMemo, memo, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Input } from '../../src/components/ui/input'
import { formatCurrency, formatDate } from '../../src/lib/utils'
import { EditableBalance } from '../../src/components/accounts/editable-balance'
import { invalidatePortfolioData } from '../../src/hooks/use-portfolio'
import { 
  PlusCircle,
  RefreshCw,
  Building2,
  TrendingUp,
  Trash2,
  Search,
  Filter,
  Download,
  CheckCircle,
  X,
  Wallet,
  Eye,
  EyeOff,
  Banknote,
  CreditCard,
  PiggyBank,
  TrendingDown,
  AlertCircle
} from 'lucide-react'
import { useAccounts, useSearch } from '../../src/hooks/use-accounts'
import { AccountCardSkeleton } from '../../src/components/ui/skeleton'
import { VirtualList } from '../../src/components/ui/virtual-list'
import { AnimatedCard } from '../../src/components/animated/fade-in'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import clsx from 'clsx'
import { dataFetcher } from '../../src/lib/data-fetcher'
import { useRenderTime, useDebouncedCallback, usePrefetch } from '../../src/lib/performance'

// Account type configuration
const accountTypeConfig = {
  savings: { icon: PiggyBank, color: 'green' },
  checking: { icon: Wallet, color: 'blue' },
  investment: { icon: TrendingUp, color: 'purple' },
  credit: { icon: CreditCard, color: 'orange' },
  loan: { icon: Banknote, color: 'red' },
} as const

// Memoized account card for virtual list
const AccountCard = memo(({ 
  account, 
  onEdit, 
  onDelete, 
  onUpdateBalance,
  isSelected,
  onSelect
}: any) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const config = accountTypeConfig[account.type.toLowerCase() as keyof typeof accountTypeConfig] || 
                 { icon: Wallet, color: 'gray' }
  const Icon = config.icon

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      await onDelete(account.id)
    } catch (error) {
      setIsDeleting(false)
    }
  }, [account.id, onDelete])

  const colorClasses = {
    green: 'border-green-200 bg-green-50/50',
    blue: 'border-blue-200 bg-blue-50/50',
    purple: 'border-purple-200 bg-purple-50/50',
    orange: 'border-orange-200 bg-orange-50/50',
    red: 'border-red-200 bg-red-50/50',
    gray: 'border-gray-200 bg-gray-50/50'
  }[config.color]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-2"
    >
      <Card className={clsx(
        'relative group transition-all duration-200 border-2',
        colorClasses,
        isSelected && 'ring-2 ring-blue-500',
        isDeleting && 'opacity-50 pointer-events-none'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={clsx(
                'p-2 rounded-lg',
                `bg-${config.color}-100`
              )}>
                <Icon className={clsx('h-5 w-5', `text-${config.color}-600`)} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  {account.name}
                </CardTitle>
                <p className="text-sm text-gray-600 capitalize">
                  {account.type} • {account.institution?.name || 'No Institution'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {/* Editable Balance */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Balance</span>
              <EditableBalance
                accountId={account.id}
                accountName={account.name}
                value={account.currentBalance}
                currency={account.currency}
                onUpdate={onUpdateBalance}
                className="text-xl font-bold tabular-nums"
              />
            </div>
            
            {/* Performance Indicator */}
            {account.lastSnapshot && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: showDetails ? 'auto' : 0, opacity: showDetails ? 1 : 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="font-medium">
                      {formatDate(account.lastSnapshot)}
                    </span>
                  </div>
                  {account.performance && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Performance</span>
                      <span className={clsx(
                        'font-medium',
                        account.performance > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {account.performance > 0 ? '+' : ''}{account.performance.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

AccountCard.displayName = 'AccountCard'

// Main Optimized Accounts Component
export default function OptimizedAccounts() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { accounts, isLoading, refresh: refreshAccounts } = useAccounts()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'type'>('balance')
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [showStats, setShowStats] = useState(true)
  
  // Performance monitoring
  useRenderTime('OptimizedAccounts')
  
  // Prefetch related data
  usePrefetch(['/api/institutions', '/api/portfolio/summary'])
  
  // Debounced search
  const { debouncedCallback: handleSearch } = useDebouncedCallback(
    (value: string) => setSearchTerm(value),
    300
  )
  
  // Filter and sort accounts
  const processedAccounts = useMemo(() => {
    if (!accounts) return []
    
    let filtered = [...accounts]
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.institution?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply type filter
    if (filterType) {
      filtered = filtered.filter(account => account.type === filterType)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'balance':
          return b.currentBalance - a.currentBalance
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })
    
    return filtered
  }, [accounts, searchTerm, filterType, sortBy])
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!accounts) return null
    
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
    const avgBalance = totalBalance / accounts.length
    const typeDistribution = accounts.reduce((acc, account) => {
      acc[account.type] = (acc[account.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: accounts.length,
      totalBalance,
      avgBalance,
      typeDistribution
    }
  }, [accounts])
  
  // Handlers
  const handleDeleteAccount = useCallback(async (id: string) => {
    try {
      await dataFetcher.fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        priority: 'high'
      })
      
      // Optimistic update
      mutate((accounts: any[]) => 
        accounts?.filter(acc => acc.id !== id),
        false
      )
      
      // Invalidate portfolio data to reflect the changes
      invalidatePortfolioData()
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }, [mutate])
  
  const handleUpdateBalance = useCallback(async (id: string, newBalance: number) => {
    try {
      await dataFetcher.fetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ currentBalance: newBalance }),
        headers: { 'Content-Type': 'application/json' }
      })
      
      // Optimistic update
      mutate((accounts: any[]) => 
        accounts?.map(acc => 
          acc.id === id ? { ...acc, currentBalance: newBalance } : acc
        ),
        false
      )
      
      // Invalidate portfolio data to reflect the new balance
      invalidatePortfolioData()
    } catch (error) {
      console.error('Failed to update balance:', error)
    }
  }, [mutate])
  
  const handleBulkDelete = useCallback(async () => {
    if (selectedAccounts.size === 0) return
    
    const promises = Array.from(selectedAccounts).map(id => 
      handleDeleteAccount(id)
    )
    
    await Promise.all(promises)
    setSelectedAccounts(new Set())
  }, [selectedAccounts, handleDeleteAccount])
  
  // Virtual list render function
  const renderAccount = useCallback((account: any) => (
    <AccountCard
      key={account.id}
      account={account}
      onDelete={handleDeleteAccount}
      onUpdateBalance={handleUpdateBalance}
      isSelected={selectedAccounts.has(account.id)}
      onSelect={(id: string) => {
        setSelectedAccounts(prev => {
          const next = new Set(prev)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return next
        })
      }}
    />
  ), [handleDeleteAccount, handleUpdateBalance, selectedAccounts])
  
  if (status === 'loading' || (isLoading && !accounts)) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <AccountCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
              <p className="text-gray-600">Manage your financial accounts</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshAccounts()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/accounts/new">
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Stats Bar */}
      {showStats && stats && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <span>
                  <strong>{stats.total}</strong> accounts
                </span>
                <span>
                  Total: <strong className="tabular-nums">{formatCurrency(stats.totalBalance, 'EUR')}</strong>
                </span>
                <span>
                  Average: <strong className="tabular-nums">{formatCurrency(stats.avgBalance, 'EUR')}</strong>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters and Search */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search accounts..."
              className="pl-10"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 border rounded-lg text-sm"
            value={filterType || ''}
            onChange={(e) => setFilterType(e.target.value || null)}
          >
            <option value="">All Types</option>
            {Object.keys(accountTypeConfig).map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            className="px-4 py-2 border rounded-lg text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="balance">Sort by Balance</option>
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
          </select>
          
          {selectedAccounts.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              Delete {selectedAccounts.size} selected
            </Button>
          )}
        </div>
      </div>
      
      {/* Accounts List with Virtual Scrolling */}
      <main className="container mx-auto px-6 py-4">
        <LayoutGroup>
          {processedAccounts.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border" style={{ height: '600px' }}>
              <VirtualList
                items={processedAccounts}
                height="100%"
                itemHeight={140}
                renderItem={renderAccount}
                overscan={5}
                className="p-2"
                getItemKey={(item) => item.id}
                emptyState={
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Wallet className="h-12 w-12 mb-4" />
                    <p>No accounts found</p>
                  </div>
                }
              />
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No accounts match your search' : 'No accounts yet'}
                </p>
                <Link href="/accounts/new">
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Your First Account
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </LayoutGroup>
      </main>
    </div>
  )
}

// Add mutate import
import { mutate } from 'swr'
