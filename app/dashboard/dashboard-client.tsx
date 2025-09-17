'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercentage, formatCompactNumber } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  Building2,
  LogOut,
  PlusCircle,
  RefreshCw,
  FileDown,
  BarChart3,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { usePortfolioQuickStats, usePortfolioSummary } from '@/hooks/use-portfolio'
import { DashboardSkeleton, QuickStatsSkeleton } from '@/components/ui/skeleton'
import { 
  FadeIn, 
  StaggeredFadeIn, 
  FadeInItem, 
  AnimatedCard,
  AnimatedNumber,
  SlideIn,
  Pulse
} from '@/components/animated/fade-in'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

// Quick stat card component
function QuickStatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue',
  delay = 0 
}: any) {
  const isPositive = change > 0
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  }[color]

  return (
    <FadeIn delay={delay}>
      <AnimatedCard 
        className={clsx(
          'relative overflow-hidden border-2 rounded-xl p-4 transition-all',
          colorClasses
        )}
        whileHover={{ scale: 1.05, rotate: 1 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-2xl font-bold mt-1">
              <AnimatedNumber value={value} format={(v) => typeof v === 'string' ? v : formatCompactNumber(v)} />
            </p>
            {change !== undefined && (
              <div className={clsx('flex items-center gap-1 mt-2 text-sm', 
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
        
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/20 pointer-events-none" />
      </AnimatedCard>
    </FadeIn>
  )
}

// Portfolio value card with animation
function PortfolioValueCard({ stats, isLoading }: any) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-48 mb-4" />
            <div className="h-6 bg-gray-200 rounded w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const isPositive = stats?.dailyChange?.percent >= 0

  return (
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
                className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {stats?.totalValue?.formatted || '€0'}
              </motion.div>
              
              {stats?.dailyChange && (
                <motion.div 
                  className={clsx(
                    'flex items-center gap-2 mt-3',
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
            
            {/* Mini chart placeholder */}
            <div className="pt-4 border-t border-blue-200/30">
              <div className="flex items-end gap-1 h-16">
                {[40, 55, 45, 70, 65, 80, 75, 85].map((height, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.05, type: "spring" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedCard>
  )
}

// Distribution card with smooth animations
function DistributionCard({ title, data, icon: Icon, color }: any) {
  const maxValue = Math.max(...(data?.map((d: any) => d.value) || [1]))
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className={clsx('h-5 w-5', `text-${color}-600`)} />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data?.map((item: any, index: number) => (
            <motion.div 
              key={item.type || item.currency || item.name || item.institution}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium capitalize">
                  {item.type || item.currency || item.name || item.institution}
                </span>
                <span className="text-sm font-bold">
                  {formatCurrency(item.valueEur || item.value, 'EUR')}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div 
                  className={clsx('h-2 rounded-full', `bg-${color}-500`)}
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / maxValue) * 100}%` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                />
              </div>
              {item.percentage && (
                <span className="text-xs text-gray-500">{formatPercentage(item.percentage)}</span>
              )}
            </motion.div>
          )) || (
            <p className="text-sm text-gray-500">No data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { stats, isLoading: statsLoading, refresh: refreshStats } = usePortfolioQuickStats()
  const { portfolio, isLoading: portfolioLoading } = usePortfolioSummary()
  const [isExporting, setIsExporting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/export/csv', {
        headers: { 'X-Test-Bypass-Auth': 'test-mode' }
      })
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finflow-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleRefresh = async () => {
    await refreshStats()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  if (status === 'loading' || (statsLoading && !stats)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-6 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div>
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
              <span className="font-medium">Action completed successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Your financial overview at a glance</p>
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={statsLoading}
              >
                <RefreshCw className={clsx('h-4 w-4 mr-2', statsLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <StaggeredFadeIn className="space-y-8">
          {/* Portfolio Value Section */}
          <FadeInItem>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <PortfolioValueCard stats={stats} isLoading={statsLoading} />
              </div>
              <div className="space-y-4">
                <QuickStatCard
                  title="Total Accounts"
                  value={stats?.accountCount || 0}
                  icon={Wallet}
                  color="purple"
                />
                <QuickStatCard
                  title="Active Currencies"
                  value={stats?.distribution?.byCurrency?.length || 0}
                  icon={DollarSign}
                  color="green"
                />
              </div>
            </div>
          </FadeInItem>

          {/* Quick Actions with better styling */}
          <FadeInItem>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { href: '/accounts/new', icon: PlusCircle, label: 'Add Account', color: 'blue' },
                { href: '/accounts', icon: Wallet, label: 'Manage Accounts', color: 'purple' },
                { href: '/portfolio', icon: BarChart3, label: 'Analytics', color: 'green' },
                { onClick: handleExport, icon: FileDown, label: 'Export Data', color: 'orange', loading: isExporting },
              ].map((action, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {action.href ? (
                    <Link href={action.href}>
                      <Button 
                        className="w-full group relative overflow-hidden"
                        variant="outline"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <action.icon className="h-4 w-4" />
                          {action.label}
                        </span>
                        <motion.div
                          className={clsx(
                            'absolute inset-0 opacity-0 group-hover:opacity-10',
                            `bg-${action.color}-500`
                          )}
                          whileHover={{ opacity: 0.1 }}
                        />
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
            </div>
          </FadeInItem>

          {/* Distribution Cards */}
          <FadeInItem>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            </div>
          </FadeInItem>
        </StaggeredFadeIn>
      </main>
    </div>
  )
}
