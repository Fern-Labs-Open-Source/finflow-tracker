'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { motion } from 'framer-motion'
import clsx from 'clsx'

interface DistributionCardProps {
  title: string
  data: Array<{
    type?: string
    currency?: string
    name?: string
    institution?: string
    value: number
    valueEur?: number
    percentage?: number
  }> | null | undefined
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'orange'
}

const DistributionCard = memo(({ 
  title, 
  data, 
  icon: Icon, 
  color 
}: DistributionCardProps) => {
  const maxValue = Math.max(...(data?.map(d => d.value) || [1]))
  
  const colorVariants = {
    blue: {
      icon: 'text-blue-600',
      bar: 'bg-blue-500',
      barLight: 'bg-blue-100'
    },
    green: {
      icon: 'text-green-600',
      bar: 'bg-green-500',
      barLight: 'bg-green-100'
    },
    purple: {
      icon: 'text-purple-600',
      bar: 'bg-purple-500',
      barLight: 'bg-purple-100'
    },
    orange: {
      icon: 'text-orange-600',
      bar: 'bg-orange-500',
      barLight: 'bg-orange-100'
    }
  }
  
  const colors = colorVariants[color]
  
  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className={clsx('h-5 w-5', colors.icon)} />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data?.length ? (
            data.map((item, index) => {
              const label = item.type || item.currency || item.name || item.institution || 'Unknown'
              const displayValue = item.valueEur || item.value
              const percentage = (item.value / maxValue) * 100
              
              return (
                <motion.div 
                  key={`${label}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: index * 0.05,
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize truncate max-w-[60%]">
                      {label}
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {formatCurrency(displayValue, 'EUR')}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <div className={clsx('w-full h-2 rounded-full', colors.barLight)}>
                      <motion.div 
                        className={clsx('h-2 rounded-full relative overflow-hidden', colors.bar)}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ 
                          delay: index * 0.05 + 0.2, 
                          duration: 0.5,
                          ease: "easeOut"
                        }}
                      >
                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                      -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </motion.div>
                    </div>
                    
                    {item.percentage !== undefined && (
                      <motion.span 
                        className="text-xs text-gray-500 mt-0.5 block tabular-nums"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.5 }}
                      >
                        {formatPercentage(item.percentage)}
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No data available</p>
              <p className="text-xs text-gray-400 mt-1">Add accounts to see distribution</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

DistributionCard.displayName = 'DistributionCard'

export default DistributionCard
