'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  PlusCircle,
  RefreshCw,
  Building2,
  TrendingUp,
  Edit,
  Trash2,
  Camera,
  ChevronLeft
} from 'lucide-react'

interface Institution {
  id: string
  name: string
  type: string
  color?: string
}

interface Account {
  id: string
  name: string
  type: string
  currency: string
  currentBalance: number
  isActive: boolean
  institutionId: string
  institution: Institution
  lastSnapshotDate?: string
  _count?: {
    snapshots: number
  }
}

export default function AccountsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [accountsRes, institutionsRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/institutions')
      ])
      
      if (!accountsRes.ok || !institutionsRes.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const accountsData = await accountsRes.json()
      const institutionsData = await institutionsRes.json()
      
      setAccounts(accountsData)
      setInstitutions(institutionsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return
    
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setAccounts(accounts.filter(acc => acc.id !== accountId))
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  const handleSnapshot = async (accountId: string) => {
    const balance = prompt('Enter current balance:')
    if (!balance) return
    
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/accounts/${accountId}/snapshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          balance: parseFloat(balance),
          date: new Date().toISOString(),
        }),
      })
      
      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to add snapshot:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const filteredAccounts = selectedInstitution === 'all' 
    ? accounts 
    : accounts.filter(acc => acc.institutionId === selectedInstitution)

  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const institutionName = account.institution.name
    if (!groups[institutionName]) {
      groups[institutionName] = {
        institution: account.institution,
        accounts: []
      }
    }
    groups[institutionName].accounts.push(account)
    return groups
  }, {} as Record<string, { institution: Institution, accounts: Account[] }>)

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
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
              <h1 className="text-2xl font-bold">Accounts</h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsRefreshing(true)} variant="outline" disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/accounts/new">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Institution Filter */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedInstitution === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedInstitution('all')}
          >
            All Institutions
          </Button>
          {institutions.map((inst) => (
            <Button
              key={inst.id}
              variant={selectedInstitution === inst.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedInstitution(inst.id)}
            >
              <Building2 className="h-3 w-3 mr-1" />
              {inst.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Accounts List */}
      <main className="container mx-auto px-6 py-4">
        {Object.entries(groupedAccounts).map(([institutionName, group]) => (
          <div key={institutionName} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: group.institution.color || '#6B7280' }}
              />
              <h2 className="text-xl font-semibold">{institutionName}</h2>
              <span className="text-sm text-gray-500">
                ({group.accounts.length} account{group.accounts.length !== 1 ? 's' : ''})
              </span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.accounts.map((account) => (
                <Card key={account.id} className={!account.isActive ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <CardDescription>
                          {account.type} · {account.currency}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSnapshot(account.id)}
                          title="Add snapshot"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                        <Link href={`/accounts/${account.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(account.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">
                          {formatCurrency(account.currentBalance, account.currency)}
                        </span>
                        {!account.isActive && (
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      {account.lastSnapshotDate && (
                        <p className="text-sm text-gray-500">
                          Updated: {formatDate(account.lastSnapshotDate)}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {account._count?.snapshots || 0} snapshots
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {!Object.keys(groupedAccounts).length && (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No accounts found</p>
              <Link href="/accounts/new">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
