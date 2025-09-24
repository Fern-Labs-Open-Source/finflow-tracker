'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../src/components/ui/card'
import { Input } from '../../../src/components/ui/input'
import { Label } from '../../../src/components/ui/label'
import { Button } from '../../../src/components/ui/button'
import { ChevronLeft, Loader2 } from 'lucide-react'

interface Institution {
  id: string
  name: string
  type: string
}

const ACCOUNT_TYPES = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'BROKERAGE_TOTAL', label: 'Brokerage Total' },
  { value: 'BROKERAGE_CASH', label: 'Brokerage Cash' },
  { value: 'BROKERAGE_INVESTMENT', label: 'Brokerage Investment' },
]

const CURRENCIES = [
  'EUR',
  'USD',
  'GBP',
  'SEK',
  'NOK',
  'DKK',
  'CHF',
  'CAD',
  'AUD',
  'JPY',
]

export default function NewAccountPage() {
  const { status } = useSession()
  const router = useRouter()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'CHECKING',
    currency: 'EUR',
    institutionId: '',
    currentBalance: '',
    isActive: true,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInstitutions()
    }
  }, [status])

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/institutions')
      if (response.ok) {
        const data = await response.json()
        setInstitutions(data)
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, institutionId: data[0].id }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch institutions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate institution ID
    if (!formData.institutionId) {
      setError('Please select an institution')
      setIsLoading(false)
      return
    }

    try {
      // First create the account (without currentBalance)
      const accountData = {
        name: formData.name,
        type: formData.type,
        currency: formData.currency,
        institutionId: formData.institutionId,
        isActive: formData.isActive,
      }
      
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      })

      if (response.ok) {
        const account = await response.json()
        
        // Add initial snapshot with the balance
        if (formData.currentBalance && parseFloat(formData.currentBalance) > 0) {
          await fetch(`/api/accounts/${account.id}/snapshot`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              balance: parseFloat(formData.currentBalance),
              date: new Date().toISOString(),
            }),
          })
        }
        
        router.push('/accounts')
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create account')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/accounts">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Add New Account</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-6 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Add a new financial account to track
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Institution */}
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <select
                  id="institution"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.institutionId}
                  onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                  required
                >
                  {!formData.institutionId && <option value="">Select an institution</option>}
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.type})
                    </option>
                  ))}
                </select>
                {institutions.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No institutions found.{' '}
                    <Link href="/institutions/new" className="text-blue-500 hover:underline">
                      Create one first
                    </Link>
                  </p>
                )}
              </div>

              {/* Account Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Main Checking Account"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Account Type</Label>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  required
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Balance */}
              <div className="space-y-2">
                <Label htmlFor="balance">Current Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.currentBalance}
                  onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                  required
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <Label htmlFor="isActive">Account is active</Label>
              </div>

              {error && (
                <div className="text-sm text-red-500">{error}</div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.institutionId}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
                <Link href="/accounts">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
