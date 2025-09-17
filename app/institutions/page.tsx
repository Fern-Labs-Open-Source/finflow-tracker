'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { 
  Building2,
  PlusCircle,
  Edit,
  Trash2,
  ChevronLeft,
  Palette
} from 'lucide-react'

interface Institution {
  id: string
  name: string
  type: string
  color?: string
  sortOrder: number
  _count?: {
    accounts: number
  }
}

const INSTITUTION_TYPES = {
  bank: { label: 'Bank', icon: '🏦' },
  brokerage: { label: 'Brokerage', icon: '📈' },
  investment: { label: 'Investment', icon: '💰' },
  retirement: { label: 'Retirement', icon: '🏖️' },
  other: { label: 'Other', icon: '📊' },
}

export default function InstitutionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    setIsLoading(true)
    try {
      const response = await fetch('/api/institutions')
      if (response.ok) {
        const data = await response.json()
        setInstitutions(data.sort((a: Institution, b: Institution) => a.sortOrder - b.sortOrder))
      }
    } catch (error) {
      console.error('Failed to fetch institutions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will also delete all associated accounts.')) return
    
    try {
      const response = await fetch(`/api/institutions/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setInstitutions(institutions.filter(inst => inst.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete institution:', error)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Building2 className="h-8 w-8 animate-pulse" />
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
              <h1 className="text-2xl font-bold">Institutions</h1>
            </div>
            <Link href="/institutions/new">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Institution
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Institutions Grid */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {institutions.map((institution) => {
            const typeInfo = INSTITUTION_TYPES[institution.type as keyof typeof INSTITUTION_TYPES] || INSTITUTION_TYPES.other
            
            return (
              <Card key={institution.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: institution.color || '#E5E7EB' }}
                      >
                        {typeInfo.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{institution.name}</CardTitle>
                        <CardDescription>{typeInfo.label}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/institutions/${institution.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(institution.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {institution._count?.accounts || 0} account{institution._count?.accounts !== 1 ? 's' : ''}
                    </span>
                    {institution.color && (
                      <div className="flex items-center gap-1">
                        <Palette className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-400">{institution.color}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {institutions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No institutions added yet</p>
              <Link href="/institutions/new">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Your First Institution
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
