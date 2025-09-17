'use client'

import { useState, useEffect, useRef, CSSProperties } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty' | 'shimmer'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
  style?: CSSProperties
  sizes?: string
  loading?: 'lazy' | 'eager'
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'shimmer',
  blurDataURL,
  onLoad,
  onError,
  style,
  sizes,
  loading = 'lazy'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Setup Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [priority])

  // Preload image when in view
  useEffect(() => {
    if (!isInView || !src) return

    const img = new Image()
    
    const handleLoad = () => {
      setIsLoaded(true)
      onLoad?.()
    }

    const handleError = () => {
      setHasError(true)
      onError?.()
    }

    img.addEventListener('load', handleLoad)
    img.addEventListener('error', handleError)
    
    // Set sizes for responsive loading
    if (sizes) {
      img.sizes = sizes
    }
    
    // Set image source with quality parameter if it's a relative URL
    if (src.startsWith('/') && !src.includes('?')) {
      img.src = `${src}?q=${quality}`
    } else {
      img.src = src
    }

    return () => {
      img.removeEventListener('load', handleLoad)
      img.removeEventListener('error', handleError)
    }
  }, [isInView, src, quality, sizes, onLoad, onError])

  // Generate srcset for responsive images
  const generateSrcSet = () => {
    if (!src || !width) return undefined
    
    const widths = [320, 640, 960, 1280, 1920]
    const validWidths = widths.filter(w => w <= width * 2) // Don't go beyond 2x original size
    
    return validWidths
      .map(w => {
        const path = src.includes('?') 
          ? `${src}&w=${w}&q=${quality}` 
          : `${src}?w=${w}&q=${quality}`
        return `${path} ${w}w`
      })
      .join(', ')
  }

  const aspectRatio = width && height ? width / height : undefined

  return (
    <div
      ref={containerRef}
      className={clsx('relative overflow-hidden', className)}
      style={{
        ...style,
        aspectRatio,
        width: width || '100%',
        height: height || 'auto'
      }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0">
          {placeholder === 'blur' && blurDataURL ? (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover filter blur-lg scale-110"
              aria-hidden="true"
            />
          ) : placeholder === 'shimmer' ? (
            <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
          ) : null}
        </div>
      )}

      {/* Main Image */}
      {isInView && !hasError && (
        <motion.img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : loading}
          decoding="async"
          srcSet={generateSrcSet()}
          sizes={sizes}
          className={clsx(
            'w-full h-full object-cover',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0,
            scale: isLoaded ? 1 : 1.1
          }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Picture component for art-directed responsive images
export function OptimizedPicture({
  sources,
  fallback,
  alt,
  className,
  priority = false
}: {
  sources: Array<{
    srcSet: string
    media?: string
    type?: string
  }>
  fallback: string
  alt: string
  className?: string
  priority?: boolean
}) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <picture className={className}>
      {sources.map((source, index) => (
        <source
          key={index}
          srcSet={source.srcSet}
          media={source.media}
          type={source.type}
        />
      ))}
      <motion.img
        src={fallback}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={clsx(
          'w-full h-auto',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </picture>
  )
}

// CSS for shimmer effect (add to global styles)
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #f8f8f8 50%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
  }
`

export default OptimizedImage
