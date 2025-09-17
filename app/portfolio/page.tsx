'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PortfolioChart } from '@/components/charts/portfolio-chart'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { 
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  PieChart,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react'

interface HistoricalData {
  date: string
  totalValue: number
  breakdown?: any[]
}

export default function PortfolioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [portfolioData, setPortfolioData] = useState<any>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [timeRange, setTimeRange] = useState('1M')
  const [isLoading, setIsLoading] = useState(true)
  const [chartType, setChartType] = useState<'area' | 'line'>('area')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPortfolioData()
    }
  }, [status, timeRange])

  const fetchPortfolioData = async () => {
    setIsLoading(true)
    try {
      // Fetch current portfolio summary
      const summaryRes = await fetch('/api/portfolio/summary')
      const summaryData = await summaryRes.json()
      setPortfolioData(summaryData)

      // Fetch historical data
      const historyRes = await fetch(`/api/portfolio/history?period=${timeRange}`)
      const historyData = await historyRes.json()
      setHistoricalData(historyData)
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading portfolio data...</p>
        </div>
      </div>
    )
  }

  const pieChartData = portfolioData?.accountsByType?.map((type: any) => ({
    name: type.type.replace('_', ' '),
    value: type.totalBalanceInBaseCurrency,
  })) || []

  const currencyChartData = portfolioData?.accountsByCurrency?.map((currency: any) => ({
    name: currency.currency,
    value: currency.totalBalanceInBaseCurrency,
  })) || []

  const performanceMetrics = {
    dayChange: portfolioData?.changeFromLastSnapshot?.absolute || 0,
    dayChangePercent: portfolioData?.changeFromLastSnapshot?.percentage || 0,
    weekChange: 2500, // Mock data for now
    weekChangePercent: 4.3,
    monthChange: 5000,
    monthChangePercent: 9.0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Portfolio Analysis</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setChartType(chartType === 'area' ? 'line' : 'area')}>
                <Activity className="h-4 w-4 mr-2" />
                {chartType === 'area' ? 'Line Chart' : 'Area Chart'}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Performance Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Net Worth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(portfolioData?.totalNetWorthInBaseCurrency || 0, 'EUR')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Day Change</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center gap-2 ${performanceMetrics.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {performanceMetrics.dayChange >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-2xl font-bold">
                  {formatCurrency(Math.abs(performanceMetrics.dayChange), 'EUR')}
                </span>
                <span className="text-sm">
                  ({formatPercentage(Math.abs(performanceMetrics.dayChangePercent))})
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Week Change</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center gap-2 ${performanceMetrics.weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {performanceMetrics.weekChange >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-2xl font-bold">
                  {formatCurrency(Math.abs(performanceMetrics.weekChange), 'EUR')}
                </span>
                <span className="text-sm">
                  ({formatPercentage(Math.abs(performanceMetrics.weekChangePercent))})
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Month Change</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center gap-2 ${performanceMetrics.monthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {performanceMetrics.monthChange >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-2xl font-bold">
                  {formatCurrency(Math.abs(performanceMetrics.monthChange), 'EUR')}
                </span>
                <span className="text-sm">
                  ({formatPercentage(Math.abs(performanceMetrics.monthChangePercent))})
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {['1W', '1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>

        {/* Main Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Portfolio Value Over Time</CardTitle>
            <CardDescription>
              Track your portfolio's performance over the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historicalData.length > 0 ? (
              <PortfolioChart 
                data={historicalData} 
                type={chartType}
                height={400}
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                No historical data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Asset Allocation</CardTitle>
              <CardDescription>Distribution by account type</CardDescription>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <PortfolioChart 
                  data={pieChartData} 
                  type="pie"
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency Distribution</CardTitle>
              <CardDescription>Portfolio breakdown by currency</CardDescription>
            </CardHeader>
            <CardContent>
              {currencyChartData.length > 0 ? (
                <PortfolioChart 
                  data={currencyChartData} 
                  type="pie"
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statistics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Portfolio Statistics</CardTitle>
            <CardDescription>Detailed breakdown of your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="font-semibold mb-3">By Account Type</h3>
                <div className="space-y-2">
                  {portfolioData?.accountsByType?.map((type: any) => (
                    <div key={type.type} className="flex justify-between text-sm">
                      <span className="text-gray-600">{type.type.replace('_', ' ')}</span>
                      <span className="font-medium">
                        {formatCurrency(type.totalBalanceInBaseCurrency, 'EUR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">By Currency</h3>
                <div className="space-y-2">
                  {portfolioData?.accountsByCurrency?.map((currency: any) => (
                    <div key={currency.currency} className="flex justify-between text-sm">
                      <span className="text-gray-600">{currency.currency}</span>
                      <span className="font-medium">
                        {formatCurrency(currency.totalBalance, currency.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Account Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Accounts</span>
                    <span className="font-medium">
                      {portfolioData?.accountsByType?.reduce((sum: number, type: any) => sum + type.count, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Currencies</span>
                    <span className="font-medium">
                      {portfolioData?.accountsByCurrency?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Currency</span>
                    <span className="font-medium">{portfolioData?.baseCurrency || 'EUR'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
