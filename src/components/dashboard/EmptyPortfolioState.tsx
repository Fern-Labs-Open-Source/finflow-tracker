'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import Link from 'next/link'
import {
  Wallet,
  Building2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  PlusCircle,
  Target,
  ChevronRight
} from 'lucide-react'

export function EmptyPortfolioState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Welcome Message */}
      <Card className="relative overflow-hidden border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="h-32 w-32 text-blue-600" />
        </div>
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl">Welcome to FinFlow Tracker! 🎉</CardTitle>
          <CardDescription className="text-base mt-2">
            Let's get started by setting up your financial accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 2
              }}
            >
              <div className="text-6xl font-bold text-blue-600">€0.00</div>
            </motion.div>
          </div>
          
          <p className="text-center text-gray-600">
            Your portfolio is empty. Add your first institution and account to start tracking your finances.
          </p>
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
            <Link href="/institutions/new">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    Step 1
                  </span>
                </div>
                <CardTitle className="mt-4">Add Institution</CardTitle>
                <CardDescription>
                  Start by adding your bank or financial institution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Institution
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </CardContent>
            </Link>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200 opacity-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                  Step 2
                </span>
              </div>
              <CardTitle className="mt-4">Create Account</CardTitle>
              <CardDescription>
                Add your checking, savings, or investment accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                <Wallet className="h-4 w-4 mr-2" />
                Add Account
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200 opacity-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                  Step 3
                </span>
              </div>
              <CardTitle className="mt-4">Track Progress</CardTitle>
              <CardDescription>
                Monitor your portfolio growth and financial health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                <Target className="h-4 w-4 mr-2" />
                View Analytics
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Features Preview */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-xl">What you can do with FinFlow Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <motion.div 
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium">Track Portfolio Performance</p>
                <p className="text-sm text-gray-600">Monitor your investments and see growth over time</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Set Financial Goals</p>
                <p className="text-sm text-gray-600">Create and track savings goals</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Wallet className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Manage Multiple Accounts</p>
                <p className="text-sm text-gray-600">Keep all your accounts in one place</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Sparkles className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Get Financial Insights</p>
                <p className="text-sm text-gray-600">Understand your spending patterns</p>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
