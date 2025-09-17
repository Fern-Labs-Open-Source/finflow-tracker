'use client'

import { useEffect, useState } from 'react'
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
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface PortfolioSummary {
  totalNetWorth: number
  totalNetWorthInBaseCurrency: number
  baseCurrency: string
  accountsByType: {
    type: string
    count: number
    totalBalance: number
    totalBalanceInBaseCurrency: number
  }[]
  accountsByCurrency: {
    currency: string
    count: number
    totalBalance: number
    totalBalanceInBaseCurrency: number
  }[]
  changeFromLastSnapshot: {
    absolute: number
    percentage: number
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [portfolioData, setPortfolioData] = useState<PortfolioSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPortfolioSummary()
    }
  }, [status])

  const fetchPortfolioSummary = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/portfolio/summary')
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data')
      }
      const data = await response.json()
      setPortfolioData(data)
    } catch (error) {
      setError('Failed to load portfolio data')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/csv')
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
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your financial data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-500 text-center">{error}</p>
            <Button onClick={fetchPortfolioSummary} className="w-full mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPositiveChange = portfolioData?.changeFromLastSnapshot?.percentage ?? 0 >= 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold">FinFlow Tracker</h1>
              <nav className="flex gap-4">
                <Link href="/dashboard" className="text-blue-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/accounts" className="text-gray-600 hover:text-gray-900">
                  Accounts
                </Link>
                <Link href="/institutions" className="text-gray-600 hover:text-gray-900">
                  Institutions
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name || 'User'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Net Worth Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Total Net Worth</CardTitle>
            <CardDescription>
              Your complete financial picture across all accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold">
                {formatCurrency(portfolioData?.totalNetWorthInBaseCurrency || 0, portfolioData?.baseCurrency || 'EUR')}
              </span>
              {portfolioData?.changeFromLastSnapshot && (
                <div className={`flex items-center gap-1 ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositiveChange ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {formatCurrency(Math.abs(portfolioData.changeFromLastSnapshot.absolute), portfolioData.baseCurrency)}
                  </span>
                  <span className="text-sm">
                    ({formatPercentage(Math.abs(portfolioData.changeFromLastSnapshot.percentage))})
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Link href="/accounts/new">
            <Button className="w-full" variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </Link>
          <Link href="/accounts">
            <Button className="w-full" variant="outline">
              <Wallet className="h-4 w-4 mr-2" />
              View Accounts
            </Button>
          </Link>
          <Link href="/portfolio">
            <Button className="w-full" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Portfolio Details
            </Button>
          </Link>
          <Button onClick={handleExport} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* By Account Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Account Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolioData?.accountsByType?.map((type) => (
                  <div key={type.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium capitalize">
                        {type.type} ({type.count})
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(type.totalBalanceInBaseCurrency, portfolioData.baseCurrency)}
                    </span>
                  </div>
                ))}
                {(!portfolioData?.accountsByType || portfolioData.accountsByType.length === 0) && (
                  <p className="text-sm text-gray-500">No accounts yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* By Currency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolioData?.accountsByCurrency?.map((currency) => (
                  <div key={currency.currency} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {currency.currency} ({currency.count})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(currency.totalBalance, currency.currency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ≈ {formatCurrency(currency.totalBalanceInBaseCurrency, portfolioData.baseCurrency)}
                      </div>
                    </div>
                  </div>
                ))}
                {(!portfolioData?.accountsByCurrency || portfolioData.accountsByCurrency.length === 0) && (
                  <p className="text-sm text-gray-500">No accounts yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Accounts</span>
                  <span className="text-sm font-semibold">
                    {portfolioData?.accountsByType?.reduce((sum, type) => sum + type.count, 0) || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Currencies</span>
                  <span className="text-sm font-semibold">
                    {portfolioData?.accountsByCurrency?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Base Currency</span>
                  <span className="text-sm font-semibold">
                    {portfolioData?.baseCurrency || 'EUR'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
