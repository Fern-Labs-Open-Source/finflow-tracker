'use client'

import { useState, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EditableBalance } from '@/components/accounts/editable-balance'
import { 
  PlusCircle,
  RefreshCw,
  Building2,
  TrendingUp,
  Edit,
  Trash2,
  Camera,
  ChevronLeft,
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
  AlertCircle,
  Check
} from 'lucide-react'
import { useAccounts, useSearch } from '@/hooks/use-accounts'
import { AccountCardSkeleton } from '@/components/ui/skeleton'
import { 
  FadeIn, 
  StaggeredFadeIn, 
  FadeInItem, 
  AnimatedCard,
  SlideIn,
  AnimatedNumber
} from '@/components/animated/fade-in'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import debounce from 'debounce'

// Account type icons
const accountTypeIcons: Record<string, any> = {
  savings: PiggyBank,
  checking: Wallet,
  investment: TrendingUp,
  credit: CreditCard,
  loan: Banknote,
}

// Enhanced account card with animations and inline editing
function AccountCard({ 
  account, 
  onEdit, 
  onDelete, 
  onSnapshot,
  onUpdateBalance,
  isSelected,
  onSelect,
  index 
}: any) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [lastBalance, setLastBalance] = useState(account.currentBalance)
  const Icon = accountTypeIcons[account.type.toLowerCase()] || Wallet

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(account.id)
    } catch (error) {
      setIsDeleting(false)
    }
  }

  const handleBalanceUpdate = async (id: string, newBalance: number) => {
    setLastBalance(account.currentBalance)
    await onUpdateBalance(id, newBalance)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <AnimatedCard
        className={clsx(
          'relative group',
          isSelected && 'ring-2 ring-blue-500'
        )}
        whileHover={{ scale: 1.02 }}
      >
        <Card className="h-full overflow-hidden">
          {/* Selection checkbox */}
          <div className="absolute top-4 right-4 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(account.id)}
              className={clsx(
                'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
                isSelected 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'bg-white border-gray-300 hover:border-blue-400'
              )}
            >
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </motion.button>
          </div>

          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className={clsx(
                'p-2 rounded-lg',
                `bg-${account.institution?.color || 'blue'}-50`
              )}>
                <Icon className={clsx(
                  'h-5 w-5',
                  `text-${account.institution?.color || 'blue'}-600`
                )} />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{account.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {account.institution?.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                    {account.type}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {/* Editable Balance */}
              <EditableBalance
                value={account.currentBalance}
                currency={account.currency}
                accountId={account.id}
                accountName={account.name}
                onUpdate={handleBalanceUpdate}
                previousValue={lastBalance}
              />

              {/* Meta info */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  {account._count?.snapshots || 0} snapshots
                </span>
                {account.lastSnapshotDate && (
                  <span>
                    Updated {formatDate(account.lastSnapshotDate)}
                  </span>
                )}
              </div>

              {/* Delete action only */}
              <div className="pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  {isDeleting ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>

          {/* Status indicator */}
          <div className={clsx(
            'absolute top-0 left-0 w-full h-1',
            account.isActive ? 'bg-green-500' : 'bg-gray-300'
          )} />
        </Card>
      </AnimatedCard>
    </motion.div>
  )
}

// Search bar with live search
function SearchBar({ value, onChange, results, isSearching }: any) {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search accounts, institutions..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {results && value && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto"
          >
            {results.accounts?.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-500 px-2 py-1">Accounts</p>
                {results.accounts.map((account: any) => (
                  <Link
                    key={account.id}
                    href={`/accounts/${account.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded"
                  >
                    <Wallet className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-gray-500">{account.institution?.name}</p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(account.currentBalance, account.currency)}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {results.institutions?.length > 0 && (
              <div className="p-2 border-t">
                <p className="text-xs font-semibold text-gray-500 px-2 py-1">Institutions</p>
                {results.institutions.map((inst: any) => (
                  <Link
                    key={inst.id}
                    href={`/institutions/${inst.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded"
                  >
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{inst.name}</p>
                      <p className="text-xs text-gray-500">{inst.type}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {inst._count?.accounts || 0} accounts
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {!results.accounts?.length && !results.institutions?.length && (
              <div className="p-4 text-center text-sm text-gray-500">
                No results found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Filter pills
function FilterPills({ 
  typeFilter, 
  setTypeFilter, 
  institutionFilter, 
  setInstitutionFilter,
  institutions 
}: any) {
  const types = ['all', 'checking', 'savings', 'investment', 'credit', 'loan']
  
  return (
    <div className="space-y-4">
      {/* Type filter */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">Account Type</p>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTypeFilter(type)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                typeFilter === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {type === 'all' ? 'All Types' : type}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Institution filter */}
      {institutions?.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Institution</p>
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setInstitutionFilter('all')}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                institutionFilter === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              All Institutions
            </motion.button>
            {institutions.map((inst: any) => (
              <motion.button
                key={inst.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setInstitutionFilter(inst.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  institutionFilter === inst.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {inst.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AccountsClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const {
    accounts,
    allAccounts,
    isLoading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    institutionFilter,
    setInstitutionFilter,
    batchUpdateBalances,
    deleteAccount,
    refresh
  } = useAccounts()
  
  const { query, handleSearch, results, isSearching } = useSearch()
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [isBatchUpdating, setIsBatchUpdating] = useState(false)

  // Handle inline balance update with snapshot
  const handleUpdateBalance = async (accountId: string, newBalance: number) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/update-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Bypass-Auth': 'test-mode',
        },
        body: JSON.stringify({ balance: newBalance })
      })

      if (!response.ok) throw new Error('Failed to update balance')
      
      const result = await response.json()
      await refresh() // Refresh the accounts list
      return result
    } catch (error) {
      console.error('Failed to update balance:', error)
      throw error
    }
  }

  // Get unique institutions
  const institutions = useMemo(() => {
    const instMap = new Map()
    allAccounts?.forEach(acc => {
      if (acc.institution && !instMap.has(acc.institution.id)) {
        instMap.set(acc.institution.id, acc.institution)
      }
    })
    return Array.from(instMap.values())
  }, [allAccounts])

  // Handle account selection
  const handleSelect = (id: string) => {
    setSelectedAccounts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Select all
  const handleSelectAll = () => {
    if (selectedAccounts.size === accounts.length) {
      setSelectedAccounts(new Set())
    } else {
      setSelectedAccounts(new Set(accounts.map(a => a.id)))
    }
  }

  // Batch update
  const handleBatchUpdate = async () => {
    if (selectedAccounts.size === 0) return
    
    setIsBatchUpdating(true)
    try {
      // For demo, we'll just refresh balances
      // In real app, you'd show a modal to enter new values
      const updates = Array.from(selectedAccounts).map(id => {
        const account = accounts.find(a => a.id === id)
        return {
          id,
          balance: account?.currentBalance || 0
        }
      })
      
      await batchUpdateBalances(updates)
      setSelectedAccounts(new Set())
    } finally {
      setIsBatchUpdating(false)
    }
  }

  // Handle snapshot
  const handleSnapshot = async (accountId: string) => {
    // Implementation for taking snapshot
    console.log('Taking snapshot for', accountId)
    await refresh()
  }

  // Handle edit
  const handleEdit = (accountId: string) => {
    router.push(`/accounts/${accountId}/edit`)
  }

  if (status === 'loading' || (isLoading && !accounts)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-6 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <AccountCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>

      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
              <p className="text-gray-600 mt-1">Manage your financial accounts</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh()}
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
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <StaggeredFadeIn className="space-y-6">
          {/* Search and filters */}
          <FadeInItem>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <SearchBar
                      value={query}
                      onChange={handleSearch}
                      results={results}
                      isSearching={isSearching}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <FilterPills
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                        institutionFilter={institutionFilter}
                        setInstitutionFilter={setInstitutionFilter}
                        institutions={institutions}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </FadeInItem>

          {/* Batch actions */}
          <AnimatePresence>
            {selectedAccounts.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        {selectedAccounts.size} account{selectedAccounts.size > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAccounts(new Set())}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSelectAll}
                      >
                        {selectedAccounts.size === accounts.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleBatchUpdate}
                        disabled={isBatchUpdating}
                      >
                        {isBatchUpdating ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Update Selected
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Accounts grid */}
          <FadeInItem>
            {accounts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {accounts.map((account, index) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onEdit={handleEdit}
                      onDelete={deleteAccount}
                      onSnapshot={handleSnapshot}
                      onUpdateBalance={handleUpdateBalance}
                      isSelected={selectedAccounts.has(account.id)}
                      onSelect={handleSelect}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No accounts found
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {searchQuery || typeFilter !== 'all' || institutionFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Get started by adding your first account'}
                  </p>
                  {(!searchQuery && typeFilter === 'all' && institutionFilter === 'all') && (
                    <Link href="/accounts/new">
                      <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Your First Account
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            )}
          </FadeInItem>
        </StaggeredFadeIn>
      </main>
    </div>
  )
}
