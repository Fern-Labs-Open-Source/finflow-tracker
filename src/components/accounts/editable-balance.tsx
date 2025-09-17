'use client'

import { useState, useRef, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Edit2, TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

interface EditableBalanceProps {
  value: number
  currency: string
  accountId: string
  accountName: string
  onUpdate: (id: string, newValue: number) => Promise<void>
  previousValue?: number
  className?: string
}

export function EditableBalance({
  value,
  currency,
  accountId,
  accountName,
  onUpdate,
  previousValue,
  className
}: EditableBalanceProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Calculate change from previous value
  const change = previousValue ? value - previousValue : 0
  const changePercent = previousValue ? (change / previousValue) * 100 : 0
  const isPositive = change >= 0

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(value.toString())
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value.toString())
    setError(null)
  }

  const handleSave = async () => {
    const newValue = parseFloat(editValue)
    
    if (isNaN(newValue) || newValue < 0) {
      setError('Please enter a valid positive number')
      return
    }

    if (newValue === value) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    setError(null)

    try {
      await onUpdate(accountId, newValue)
      setIsEditing(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error) {
      setError('Failed to update balance')
      console.error('Update failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setEditValue(value)
      setError(null)
    }
  }

  if (isEditing) {
    return (
      <div className={clsx('space-y-2', className)}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              {currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!isUpdating) {
                  handleCancel()
                }
              }}
              disabled={isUpdating}
              className={clsx(
                'w-full pl-8 pr-3 py-1.5 text-2xl font-bold border-2 rounded-lg transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                error ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50',
                isUpdating && 'opacity-50 cursor-not-allowed'
              )}
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isUpdating}
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                'bg-green-500 text-white hover:bg-green-600',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Check className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              disabled={isUpdating}
              className="p-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-600"
          >
            {error}
          </motion.p>
        )}
        <p className="text-xs text-gray-500">
          Press Enter to save • Escape to cancel
        </p>
      </div>
    )
  }

  return (
    <div className={clsx('group relative', className)}>
      <div className="flex items-center gap-2">
        <motion.div
          className="flex-1 cursor-pointer"
          onClick={handleStartEdit}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {formatCurrency(value, currency)}
            </span>
            <motion.button
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.1 }}
            >
              <Edit2 className="h-4 w-4 text-gray-400" />
            </motion.button>
          </div>
          
          {change !== 0 && (
            <div className={clsx(
              'flex items-center gap-1 mt-1 text-sm',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {isPositive ? '+' : ''}{formatCurrency(change, currency)}
                {' '}
                ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Success animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              ✓ Updated & Snapshot saved
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
