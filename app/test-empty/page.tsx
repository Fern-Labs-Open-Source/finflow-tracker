'use client'

import { EmptyPortfolioState } from '../../src/components/dashboard/EmptyPortfolioState'

export default function TestEmptyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard - Empty State Test</h1>
              <p className="text-gray-600 mt-1">Testing the empty portfolio UI</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        <EmptyPortfolioState />
      </main>
    </div>
  )
}
