'use client'

import { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { formatCurrency, formatPercentage, formatCompactNumber } from '../../src/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  Building2,
  RefreshCw,
  FileDown,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PlusCircle
} from 'lucide-react'
import Link from 'next/link'
import { usePortfolioQuickStats, usePortfolioSummary } from '../../src/hooks/use-portfolio'
import { QuickStatsSkeleton } from '../../src/components/ui/skeleton'
import { 
  FadeIn, 
  StaggeredFadeIn, 
  FadeInItem, 
  AnimatedCard,
  AnimatedNumber,
  Pulse
} from '../../src/components/animated/fade-in'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import clsx from 'clsx'
import { dataFetcher } from '../../src/lib/data-fetcher'
import { useRenderTime, useLazyLoad, useDebouncedCallback, useMemoryMonitor } from '../../src/lib/performance'
import dynamic from 'next/dynamic'

// Lazy load heavy components
const DistributionCard = lazy(() => import('../../src/components/dashboard/distribution-card'))
const PortfolioChart = lazy(() => import('../../src/components/charts/portfolio-chart'))

// Memoized components
const QuickStatCard = memo(({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue',
  delay = 0 
}: any) => {
  const isPositive = change > 0
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  }[color]

  // Use CSS transforms for better performance
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      style={{ willChange: 'transform' }}
    >
      <Card className={clsx(
        'relative overflow-hidden border-2 rounded-xl p-4 transition-shadow hover:shadow-lg',
        colorClasses
      )}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">
              {typeof value === 'string' ? value : formatCompactNumber(value)}
            </p>
            {change !== undefined && (
              <div className={clsx('flex items-center gap-1 mt-2 text-sm tabular-nums', 
                isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{formatPercentage(Math.abs(change))}</span>
              </div>
            )}
          </div>
          <div className="p-2 bg-white/50 rounded-lg">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
})

QuickStatCard.displayName = 'QuickStatCard'

// Optimized Portfolio Value Card
const PortfolioValueCard = memo(({ stats, isLoading }: any) => {
  const { ref, isVisible } = useLazyLoad()
  const isPositive = stats?.dailyChange?.percent >= 0

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div ref={ref}>
      {isVisible && (
        <AnimatedCard>
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Total Portfolio Value</CardTitle>
                  <CardDescription>Your complete financial overview</CardDescription>
                </div>
                <Pulse>
                  <div className="p-3 bg-white/80 rounded-full">
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                  </div>
                </Pulse>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <motion.div 
                    className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tabular-nums"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {stats?.totalValue?.formatted || '€0'}
                  </motion.div>
                  
                  {stats?.dailyChange && (
                    <motion.div 
                      className={clsx(
                        'flex items-center gap-2 mt-3 tabular-nums',
                        isPositive ? 'text-green-600' : 'text-red-600'
                      )}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className={clsx(
                        'p-1 rounded-full',
                        isPositive ? 'bg-green-100' : 'bg-red-100'
                      )}>
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-lg font-semibold">
                        {stats.dailyChange.formatted}
                      </span>
                    </motion.div>
                  )}
                </div>
                
                {/* Optimized mini chart */}
                <div className="pt-4 border-t border-blue-200/30">
                  <svg className="w-full h-16" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <motion.path
                      d="M0,35 L12,30 L25,32 L37,25 L50,28 L62,20 L75,22 L87,15 L100,18"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      )}
    </div>
  )
})

PortfolioValueCard.displayName = 'PortfolioValueCard'

// Main optimized dashboard component
export default function OptimizedDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { stats, isLoading: statsLoading, refresh: refreshStats } = usePortfolioQuickStats()
  const [isExporting, setIsExporting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Performance monitoring
  useRenderTime('OptimizedDashboard')
  const isHighMemory = useMemoryMonitor()
  
  // Prefetch data for faster navigation
  useEffect(() => {
    if (stats) {
      // Prefetch accounts and portfolio data
      dataFetcher.prefetch([
        '/api/accounts',
        '/api/portfolio/history',
        '/api/institutions'
      ])
    }
  }, [stats])

  // Debounced refresh to prevent rapid clicks
  const { debouncedCallback: handleRefresh, isDebouncing } = useDebouncedCallback(
    async () => {
      await refreshStats()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    },
    1000
  )

  // Optimized export with blob handling
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const response = await dataFetcher.fetch('/api/export/csv', {
        priority: 'high'
      })
      
      const blob = new Blob([response], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finflow-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [])

  // Memoized quick actions to prevent re-renders
  const quickActions = useMemo(() => [
    { href: '/accounts/new', icon: PlusCircle, label: 'Add Account', color: 'blue' },
    { href: '/accounts', icon: Wallet, label: 'Manage Accounts', color: 'purple' },
    { href: '/portfolio', icon: BarChart3, label: 'Analytics', color: 'green' },
    { onClick: handleExport, icon: FileDown, label: 'Export Data', color: 'orange', loading: isExporting },
  ], [handleExport, isExporting])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading' || (statsLoading && !stats)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-6 py-8">
          <QuickStatsSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Success!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance warning */}
      {isHighMemory && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          High memory usage detected. Consider refreshing the page for optimal performance.
        </div>
      )}

      {/* Page Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Your financial overview at a glance</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={statsLoading || isDebouncing}
            >
              <RefreshCw className={clsx('h-4 w-4 mr-2', (statsLoading || isDebouncing) && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <LayoutGroup>
          <div className="space-y-8">
            {/* Portfolio Value Section */}
            <section className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <PortfolioValueCard stats={stats} isLoading={statsLoading} />
              </div>
              <div className="space-y-4">
                <QuickStatCard
                  title="Total Accounts"
                  value={stats?.accountCount || 0}
                  icon={Wallet}
                  color="purple"
                  delay={0.1}
                />
                <QuickStatCard
                  title="Active Currencies"
                  value={stats?.distribution?.byCurrency?.length || 0}
                  icon={DollarSign}
                  color="green"
                  delay={0.2}
                />
              </div>
            </section>

            {/* Quick Actions */}
            <section className="grid gap-4 md:grid-cols-4">
              {quickActions.map((action, i) => (
                <motion.div
                  key={i}
                  layout
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {action.href ? (
                    <Link href={action.href} prefetch>
                      <Button 
                        className="w-full group relative overflow-hidden"
                        variant="outline"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <action.icon className="h-4 w-4" />
                          {action.label}
                        </span>
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      onClick={action.onClick}
                      className="w-full"
                      variant="outline"
                      disabled={action.loading}
                    >
                      <action.icon className={clsx('h-4 w-4 mr-2', action.loading && 'animate-spin')} />
                      {action.label}
                    </Button>
                  )}
                </motion.div>
              ))}
            </section>

            {/* Distribution Cards - Lazy loaded */}
            <Suspense fallback={
              <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            }>
              <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <DistributionCard
                  title="By Account Type"
                  data={stats?.distribution?.byType}
                  icon={PieChart}
                  color="blue"
                />
                <DistributionCard
                  title="By Currency"
                  data={stats?.distribution?.byCurrency}
                  icon={DollarSign}
                  color="green"
                />
                <DistributionCard
                  title="By Institution"
                  data={stats?.distribution?.byInstitution}
                  icon={Building2}
                  color="purple"
                />
              </section>
            </Suspense>
          </div>
        </LayoutGroup>
      </main>
    </div>
  )
}

// Missing import
import { memo } from 'react'
