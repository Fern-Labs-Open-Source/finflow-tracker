'use client'

import React, { useRef, useState, useEffect, useCallback, memo, CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

interface VirtualListProps<T> {
  items: T[]
  height: number | string
  itemHeight: number | ((index: number) => number)
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
  gap?: number
  onScroll?: (scrollTop: number) => void
  estimatedItemHeight?: number
  getItemKey?: (item: T, index: number) => string | number
  header?: React.ReactNode
  footer?: React.ReactNode
  emptyState?: React.ReactNode
  loadingState?: React.ReactNode
  isLoading?: boolean
  onEndReached?: () => void
  endReachedThreshold?: number
}

// Memoized item wrapper for performance
const VirtualItem = memo(({ 
  children, 
  style 
}: { 
  children: React.ReactNode
  style: CSSProperties 
}) => (
  <div style={style}>
    {children}
  </div>
))

VirtualItem.displayName = 'VirtualItem'

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  gap = 0,
  onScroll,
  estimatedItemHeight = 50,
  getItemKey,
  header,
  footer,
  emptyState,
  loadingState,
  isLoading = false,
  onEndReached,
  endReachedThreshold = 100
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  const heightCacheRef = useRef<Map<number, number>>(new Map())
  const endReachedRef = useRef(false)

  // Calculate item heights
  const getItemHeight = useCallback((index: number): number => {
    if (typeof itemHeight === 'function') {
      // Check cache first
      if (heightCacheRef.current.has(index)) {
        return heightCacheRef.current.get(index)!
      }
      
      const height = itemHeight(index)
      heightCacheRef.current.set(index, height)
      return height
    }
    return itemHeight
  }, [itemHeight])

  // Calculate item positions
  const getItemOffset = useCallback((index: number): number => {
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i) + (i > 0 ? gap : 0)
    }
    return offset
  }, [getItemHeight, gap])

  // Calculate total height
  const totalHeight = items.reduce((acc, _, index) => {
    return acc + getItemHeight(index) + (index > 0 ? gap : 0)
  }, 0)

  // Calculate visible range
  const calculateVisibleRange = useCallback(() => {
    if (!containerHeight || items.length === 0) {
      return { start: 0, end: 0 }
    }

    let accumulatedHeight = 0
    let start = 0
    let end = items.length

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const itemOffset = getItemOffset(i)
      if (itemOffset + getItemHeight(i) >= scrollTop) {
        start = Math.max(0, i - overscan)
        break
      }
    }

    // Find end index
    for (let i = start; i < items.length; i++) {
      if (getItemOffset(i) > scrollTop + containerHeight) {
        end = Math.min(items.length, i + overscan)
        break
      }
    }

    return { start, end }
  }, [items.length, containerHeight, scrollTop, overscan, getItemHeight, getItemOffset])

  const { start, end } = calculateVisibleRange()
  const visibleItems = items.slice(start, end)

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)
    onScroll?.(scrollTop)
    
    // Set scrolling state
    setIsScrolling(true)
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    // Set new timeout to detect scroll end
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 150)
    
    // Check if end reached
    if (onEndReached && !endReachedRef.current) {
      const distanceFromEnd = totalHeight - (scrollTop + containerHeight)
      if (distanceFromEnd <= endReachedThreshold) {
        endReachedRef.current = true
        onEndReached()
        
        // Reset after a delay to allow re-triggering
        setTimeout(() => {
          endReachedRef.current = false
        }, 1000)
      }
    }
  }, [onScroll, onEndReached, totalHeight, containerHeight, endReachedThreshold])

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()
    
    const resizeObserver = new ResizeObserver(updateHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  // Reset scroll position when items change significantly
  useEffect(() => {
    heightCacheRef.current.clear()
  }, [items])

  if (isLoading && loadingState) {
    return <div className={className}>{loadingState}</div>
  }

  if (items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>
  }

  return (
    <div
      ref={containerRef}
      className={clsx('relative overflow-auto', className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      {header}
      
      <div
        ref={scrollElementRef}
        style={{ height: totalHeight, position: 'relative' }}
      >
        <AnimatePresence mode="sync">
          {visibleItems.map((item, visibleIndex) => {
            const actualIndex = start + visibleIndex
            const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex
            const offset = getItemOffset(actualIndex)
            
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.2,
                  delay: visibleIndex * 0.02
                }}
                style={{
                  position: 'absolute',
                  top: offset,
                  left: 0,
                  right: 0,
                  height: getItemHeight(actualIndex),
                  willChange: isScrolling ? 'transform' : 'auto'
                }}
              >
                {renderItem(item, actualIndex)}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      
      {footer}
    </div>
  )
}

// Windowed list for simpler use cases
export function WindowedList<T>({
  items,
  itemHeight,
  renderItem,
  className,
  gap = 0
}: {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  gap?: number
}) {
  return (
    <VirtualList
      items={items}
      height="100%"
      itemHeight={itemHeight}
      renderItem={renderItem}
      className={className}
      gap={gap}
      overscan={5}
    />
  )
}

// Infinite scroll list
export function InfiniteList<T>({
  items,
  loadMore,
  hasMore,
  itemHeight,
  renderItem,
  className,
  loadingComponent,
  threshold = 200
}: {
  items: T[]
  loadMore: () => void | Promise<void>
  hasMore: boolean
  itemHeight: number | ((index: number) => number)
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  loadingComponent?: React.ReactNode
  threshold?: number
}) {
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const handleEndReached = async () => {
    if (!hasMore || isLoadingMore) return
    
    setIsLoadingMore(true)
    try {
      await loadMore()
    } finally {
      setIsLoadingMore(false)
    }
  }
  
  return (
    <VirtualList
      items={items}
      height="100%"
      itemHeight={itemHeight}
      renderItem={renderItem}
      className={className}
      onEndReached={handleEndReached}
      endReachedThreshold={threshold}
      footer={
        isLoadingMore && loadingComponent ? (
          <div className="p-4 text-center">
            {loadingComponent}
          </div>
        ) : null
      }
    />
  )
}

export default VirtualList
