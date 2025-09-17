// Performance monitoring and optimization utilities
import { useEffect, useRef, useCallback } from 'react'

// Performance metrics collector
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private marks: Map<string, number> = new Map()

  // Start timing a specific operation
  startMark(name: string) {
    this.marks.set(name, performance.now())
  }

  // End timing and record the metric
  endMark(name: string, label?: string) {
    const start = this.marks.get(name)
    if (!start) return

    const duration = performance.now() - start
    const metricName = label || name
    
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, [])
    }
    
    this.metrics.get(metricName)!.push(duration)
    this.marks.delete(name)
    
    return duration
  }

  // Get average duration for a metric
  getAverage(name: string): number {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return 0
    
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  // Get all metrics
  getAllMetrics() {
    const result: Record<string, any> = {}
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        count: values.length,
        average: this.getAverage(name),
        min: Math.min(...values),
        max: Math.max(...values),
        last: values[values.length - 1]
      }
    })
    
    return result
  }

  // Clear all metrics
  clear() {
    this.metrics.clear()
    this.marks.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Hook to measure component render time
export function useRenderTime(componentName: string) {
  const renderCount = useRef(0)
  
  useEffect(() => {
    renderCount.current++
    performanceMonitor.startMark(`${componentName}-render-${renderCount.current}`)
    
    return () => {
      const duration = performanceMonitor.endMark(
        `${componentName}-render-${renderCount.current}`, 
        `${componentName}-render`
      )
      
      if (duration && duration > 16) { // Log slow renders (> 1 frame)
        console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`)
      }
    }
  })
}

// Hook for lazy loading with intersection observer
export function useLazyLoad(
  threshold = 0.1,
  rootMargin = '100px'
) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [threshold, rootMargin, hasLoaded])

  return { ref, isVisible }
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 3
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    
    return { startIndex, endIndex }
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan])
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
  }, [items, visibleRange])
  
  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.startIndex * itemHeight
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    }
  }
}

// Debounced callback with loading state
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const [isDebouncing, setIsDebouncing] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)
  
  callbackRef.current = callback
  
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    setIsDebouncing(true)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
      setIsDebouncing(false)
    }, delay)
  }, [delay])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return { debouncedCallback, isDebouncing }
}

// Request Animation Frame hook for smooth animations
export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()
  const callbackRef = useRef(callback)
  
  callbackRef.current = callback
  
  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current
        callbackRef.current(deltaTime)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }
    
    requestRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])
}

// Prefetch hook for preloading data
export function usePrefetch(urls: string[]) {
  useEffect(() => {
    const prefetchLinks = urls.map(url => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      document.head.appendChild(link)
      return link
    })
    
    return () => {
      prefetchLinks.forEach(link => {
        document.head.removeChild(link)
      })
    }
  }, [urls])
}

// Memory usage monitor
export function useMemoryMonitor(threshold = 100 * 1024 * 1024) { // 100MB default
  const [isHighMemory, setIsHighMemory] = useState(false)
  
  useEffect(() => {
    if (!('memory' in performance)) return
    
    const checkMemory = () => {
      const memory = (performance as any).memory
      const usedMemory = memory.usedJSHeapSize
      
      setIsHighMemory(usedMemory > threshold)
      
      if (usedMemory > threshold) {
        console.warn(`High memory usage detected: ${(usedMemory / 1024 / 1024).toFixed(2)}MB`)
      }
    }
    
    const interval = setInterval(checkMemory, 5000) // Check every 5 seconds
    
    return () => clearInterval(interval)
  }, [threshold])
  
  return isHighMemory
}

// Batch updates for reducing re-renders
export function useBatchedUpdates<T>(
  initialValue: T,
  batchDelay = 100
) {
  const [value, setValue] = useState(initialValue)
  const pendingUpdates = useRef<T[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const batchUpdate = useCallback((newValue: T) => {
    pendingUpdates.current.push(newValue)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      // Apply the last update in the batch
      const lastUpdate = pendingUpdates.current[pendingUpdates.current.length - 1]
      setValue(lastUpdate)
      pendingUpdates.current = []
    }, batchDelay)
  }, [batchDelay])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return [value, batchUpdate] as const
}

// Missing imports
import { useState, useMemo } from 'react'

export default {
  performanceMonitor,
  useRenderTime,
  useLazyLoad,
  useVirtualScroll,
  useDebouncedCallback,
  useAnimationFrame,
  usePrefetch,
  useMemoryMonitor,
  useBatchedUpdates
}
