'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '../ui/button'
import { 
  LogOut,
  RefreshCw,
  BarChart3,
  Wallet,
  Building2,
  Home,
  Activity
} from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  
  // Don't show navigation on login page
  if (pathname === '/login' || pathname === '/') {
    return null
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/accounts', label: 'Accounts', icon: Wallet },
    { href: '/institutions', label: 'Institutions', icon: Building2 },
    { href: '/portfolio', label: 'Analytics', icon: Activity },
  ]

  return (
    <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer">
                FinFlow Tracker
              </h1>
            </Link>
            
            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'relative px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
                      isActive 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {isActive && (
                      <motion.div 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                        layoutId="navbar-indicator"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30
                        }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            {status === 'authenticated' && (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {session?.user?.name || 'User'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        <nav className="md:hidden mt-4 flex gap-1 overflow-x-auto pb-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap',
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
