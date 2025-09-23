'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { formatCurrency, formatPercentage, formatDate } from '../../src/lib/utils'
import { 
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Activity,
  Calendar,
  DollarSign,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Info
} from 'lucide-react'
import { usePortfolioHistory, usePortfolioSummary, usePortfolioQuickStats } from '../../src/hooks/use-portfolio'
import { ChartSkeleton } from '../../src/components/ui/skeleton'
import { 
  FadeIn, 
  StaggeredFadeIn, 
  FadeInItem, 
  AnimatedCard,
  SlideIn,
  AnimatedNumber
} from '../../src/components/animated/fade-in'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-3 rounded-lg shadow-lg border"
    >
      <p className="font-medium text-sm">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value, 'EUR')}
        </p>
      ))}
    </motion.div>
  )
}

// Performance chart with smooth animations
function PerformanceChart({ data, isLoading }: any) {
  if (isLoading) return <ChartSkeleton />

  const chartData = data?.map((item: any) => ({
    date: formatDate(item.date),
    value: item.totalValue,
    change: item.changePercent
  })) || []

  const minValue = Math.min(...chartData.map((d: any) => d.value))
  const maxValue = Math.max(...chartData.map((d: any) => d.value))
  const latestValue = chartData[chartData.length - 1]?.value || 0
  const firstValue = chartData[0]?.value || 0
  const totalChange = firstValue ? ((latestValue - firstValue) / firstValue) * 100 : 0

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Portfolio Performance
            </CardTitle>
            <CardDescription>30-day performance history</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {formatCurrency(latestValue, 'EUR')}
            </p>
            <p className={clsx(
              'text-sm font-medium flex items-center justify-end gap-1',
              totalChange >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {totalChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {formatPercentage(Math.abs(totalChange))}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => value.split(' ')[0]}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              domain={[minValue * 0.95, maxValue * 1.05]}
              tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#colorValue)"
              animationDuration={1000}
            />
            <ReferenceLine 
              y={firstValue} 
              stroke="#9CA3AF" 
              strokeDasharray="5 5"
              label={{ value: "Start", position: "left", fontSize: 10 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Allocation pie chart
function AllocationChart({ data, title, dataKey }: any) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  const chartData = data?.map((item: any, index: number) => ({
    name: item[dataKey] || item.name || item.type || item.currency,
    value: item.valueEur || item.value,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length]
  })) || []

  const total = chartData.reduce((sum: number, item: any) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-purple-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }) => percentage > 5 ? `${percentage.toFixed(0)}%` : ''}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationDuration={800}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => formatCurrency(value, 'EUR')}
              content={<CustomTooltip />}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {chartData.map((item: any) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm capitalize">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium">
                  {formatCurrency(item.value, 'EUR')}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Monthly comparison chart
function MonthlyComparison({ data }: any) {
  if (!data || data.length === 0) return null

  // Group by week for better visualization
  const weeklyData = useMemo(() => {
    const weeks: any = {}
    data.forEach((item: any) => {
      const date = new Date(item.date)
      const weekNumber = Math.floor((date.getDate() - 1) / 7) + 1
      const weekKey = `Week ${weekNumber}`
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { week: weekKey, total: 0, count: 0 }
      }
      weeks[weekKey].total += item.totalValue
      weeks[weekKey].count++
    })

    return Object.values(weeks).map((week: any) => ({
      week: week.week,
      value: week.total / week.count
    }))
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-600" />
          Weekly Average
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={12}
              tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="#10B981"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Key metrics cards
function MetricCard({ title, value, change, icon: Icon, color, prefix = '' }: {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  prefix?: string;
}) {
  const isPositive = change !== undefined && change >= 0
  const colorClasses = color ? {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  }[color] : 'bg-gray-50 text-gray-600 border-gray-200'

  return (
    <AnimatedCard>
      <div className={clsx(
        'p-4 rounded-lg border-2 transition-all',
        colorClasses
      )}>
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5" />
          <span className="text-xs font-medium opacity-75">{title}</span>
        </div>
        <p className="text-2xl font-bold">
          {prefix}
          {typeof value === 'string' ? (
            <span>{value}</span>
          ) : (
            <AnimatedNumber value={value} format={(v: number) => v.toLocaleString()} />
          )}
        </p>
        {change !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 mt-1 text-sm',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {formatPercentage(Math.abs(change))}
          </div>
        )}
      </div>
    </AnimatedCard>
  )
}

export default function PortfolioClient() {
  const { data: session } = useSession()
  const { stats, isLoading: statsLoading, refresh: refreshStats } = usePortfolioQuickStats()
  const { portfolio, isLoading: portfolioLoading } = usePortfolioSummary()
  const { history, isLoading: historyLoading } = usePortfolioHistory(30)
  const [view, setView] = useState<'overview' | 'details'>('overview')

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/csv', {
        headers: { 'X-Test-Bypass-Auth': 'test-mode' }
      })
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Calculate additional metrics
  const metrics = useMemo(() => {
    if (!history || history.length === 0) return null
    
    const values = history.map((h: any) => h.totalValue)
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)
    const volatility = Math.sqrt(
      values.reduce((sum: number, val: number) => sum + Math.pow(val - avg, 2), 0) / values.length
    )
    
    return {
      average: avg,
      maximum: max,
      minimum: min,
      volatility: (volatility / avg) * 100, // as percentage
      range: max - min
    }
  }, [history])

  if (statsLoading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-6 py-8">
          <div className="grid gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Portfolio Analytics
              </h1>
              <p className="text-gray-600 mt-1">Analyze your portfolio performance and allocation</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshStats()}
              >
                <RefreshCw className={clsx('h-4 w-4 mr-2', statsLoading && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <StaggeredFadeIn className="space-y-8">
          {/* View Toggle */}
          <FadeInItem>
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm w-fit">
              <Button
                size="sm"
                variant={view === 'overview' ? 'default' : 'ghost'}
                onClick={() => setView('overview')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Overview
              </Button>
              <Button
                size="sm"
                variant={view === 'details' ? 'default' : 'ghost'}
                onClick={() => setView('details')}
              >
                <Info className="h-4 w-4 mr-2" />
                Details
              </Button>
            </div>
          </FadeInItem>

          <AnimatePresence mode="wait">
            {view === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Value"
                    value={stats?.totalValue?.eur || 0}
                    change={stats?.dailyChange?.percent}
                    icon={DollarSign}
                    color="blue"
                    prefix="€"
                  />
                  <MetricCard
                    title="30D Average"
                    value={metrics?.average || 0}
                    icon={TrendingUp}
                    color="green"
                    prefix="€"
                  />
                  <MetricCard
                    title="Volatility"
                    value={metrics?.volatility || 0}
                    icon={Activity}
                    color="orange"
                    prefix=""
                  />
                  <MetricCard
                    title="Accounts"
                    value={stats?.accountCount || 0}
                    icon={Calendar}
                    color="purple"
                  />
                </div>

                {/* Performance Chart */}
                <FadeInItem>
                  <PerformanceChart data={history} isLoading={historyLoading} />
                </FadeInItem>

                {/* Allocation Charts */}
                <FadeInItem>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AllocationChart
                      data={stats?.distribution?.byType}
                      title="By Type"
                      dataKey="type"
                    />
                    <AllocationChart
                      data={stats?.distribution?.byCurrency}
                      title="By Currency"
                      dataKey="currency"
                    />
                    <AllocationChart
                      data={stats?.distribution?.byInstitution}
                      title="By Institution"
                      dataKey="name"
                    />
                  </div>
                </FadeInItem>

                {/* Weekly Comparison */}
                <FadeInItem>
                  <MonthlyComparison data={history} />
                </FadeInItem>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Detailed Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Statistics</CardTitle>
                    <CardDescription>Complete portfolio metrics and analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <h3 className="font-medium text-sm text-gray-600">Value Metrics</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Current Value</span>
                            <span className="font-medium">{formatCurrency(stats?.totalValue?.eur || 0, 'EUR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">30-Day High</span>
                            <span className="font-medium">{formatCurrency(metrics?.maximum || 0, 'EUR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">30-Day Low</span>
                            <span className="font-medium">{formatCurrency(metrics?.minimum || 0, 'EUR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">30-Day Range</span>
                            <span className="font-medium">{formatCurrency(metrics?.range || 0, 'EUR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="font-medium text-sm text-gray-600">Performance Metrics</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Daily Change</span>
                            <span className={clsx(
                              'font-medium',
                              (stats?.dailyChange?.percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {stats?.dailyChange?.formatted || '€0'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Volatility (30D)</span>
                            <span className="font-medium">{metrics?.volatility?.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Total Accounts</span>
                            <span className="font-medium">{stats?.accountCount || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Active Currencies</span>
                            <span className="font-medium">{stats?.distribution?.byCurrency?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Details Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Type</th>
                            <th className="text-right py-2">Count</th>
                            <th className="text-right py-2">Value (EUR)</th>
                            <th className="text-right py-2">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats?.distribution?.byType?.map((item: any) => (
                            <tr key={item.type} className="border-b">
                              <td className="py-2 capitalize">{item.type}</td>
                              <td className="text-right">{item.count}</td>
                              <td className="text-right font-medium">
                                {formatCurrency(item.value, 'EUR')}
                              </td>
                              <td className="text-right text-gray-500">
                                {formatPercentage(item.percentage)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </StaggeredFadeIn>
      </main>
    </div>
  )
}
