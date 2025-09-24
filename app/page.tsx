'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '../src/components/ui/button'
import { ArrowRight, TrendingUp, PiggyBank, Target } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 text-gray-900">
            FinFlow Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Take control of your finances with powerful tracking and visualization tools
          </p>
          
          <div className="grid gap-8 md:grid-cols-3 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <TrendingUp className="h-10 w-10 text-blue-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Track Net Worth</h2>
              <p className="text-gray-600">
                Monitor your total net worth across all accounts and currencies
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <PiggyBank className="h-10 w-10 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Manage Accounts</h2>
              <p className="text-gray-600">
                Track bank accounts, investments, and brokerage portfolios
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Target className="h-10 w-10 text-purple-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Visualize Progress</h2>
              <p className="text-gray-600">
                See your financial journey with intuitive charts and insights
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/login')}
              className="flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            Demo account available: username <code className="bg-gray-100 px-2 py-1 rounded">demo</code> password <code className="bg-gray-100 px-2 py-1 rounded">demo123</code>
          </div>
          
          <div className="mt-4 text-center text-xs text-gray-400">
            v1.2.0 • Deployed via Netlify • Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </main>
    </div>
  )
}
