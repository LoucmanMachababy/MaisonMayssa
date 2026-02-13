import { useEffect, useState, useCallback, useRef } from 'react'

/**
 * Hook pour gérer les optimisations de performance basées sur les capacités du device
 */
export function usePerformanceOptimizations() {
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    isLowEnd: false,
    prefersReducedMotion: false,
    prefersReducedData: false,
    connectionSpeed: 'unknown' as 'slow' | 'medium' | 'fast' | 'unknown'
  })

  useEffect(() => {
    // Détection des capacités du device
    const hardwareConcurrency = navigator.hardwareConcurrency || 4
    const deviceMemory = (navigator as any).deviceMemory || 4
    
    // Détection de la connexion
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    let connectionSpeed: 'slow' | 'medium' | 'fast' | 'unknown' = 'unknown'
    if (connection) {
      const effectiveType = connection.effectiveType
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        connectionSpeed = 'slow'
      } else if (effectiveType === '3g') {
        connectionSpeed = 'medium'
      } else if (effectiveType === '4g') {
        connectionSpeed = 'fast'
      }
    }

    setDeviceCapabilities({
      isLowEnd: hardwareConcurrency <= 2 || deviceMemory <= 2,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersReducedData: connection?.saveData || false,
      connectionSpeed
    })
  }, [])

  return deviceCapabilities
}

/**
 * Hook pour adapter les animations selon les performances
 */
export function useAdaptiveAnimations() {
  const { isLowEnd, prefersReducedMotion } = usePerformanceOptimizations()
  
  const getAnimationProps = useCallback((baseProps: any) => {
    if (prefersReducedMotion) {
      return {
        initial: baseProps.animate || {},
        animate: baseProps.animate || {},
        transition: { duration: 0 }
      }
    }

    if (isLowEnd) {
      return {
        ...baseProps,
        transition: {
          ...baseProps.transition,
          duration: (baseProps.transition?.duration || 0.3) * 0.7 // Animations plus rapides
        }
      }
    }

    return baseProps
  }, [isLowEnd, prefersReducedMotion])

  return { getAnimationProps, shouldAnimate: !prefersReducedMotion && !isLowEnd }
}

/**
 * Hook pour la gestion intelligente du lazy loading
 */
export function useSmartLazyLoading() {
  const { connectionSpeed, prefersReducedData } = usePerformanceOptimizations()
  
  const shouldEagerLoad = connectionSpeed === 'fast' && !prefersReducedData
  const rootMargin = connectionSpeed === 'slow' ? '10px' : '50px'
  
  return {
    shouldEagerLoad,
    rootMargin,
    threshold: connectionSpeed === 'slow' ? 0.1 : 0.3
  }
}

/**
 * Hook pour la gestion de la qualité des images selon la performance
 */
export function useImageQuality() {
  const { connectionSpeed, prefersReducedData, isLowEnd } = usePerformanceOptimizations()
  
  let quality: 'low' | 'medium' | 'high' = 'medium'
  
  if (prefersReducedData || connectionSpeed === 'slow') {
    quality = 'low'
  } else if (connectionSpeed === 'fast' && !isLowEnd) {
    quality = 'high'
  }
  
  return { 
    quality,
    shouldUseWebP: connectionSpeed !== 'slow',
    shouldPreloadImages: connectionSpeed === 'fast' && !prefersReducedData
  }
}

/**
 * Hook pour débouncer les opérations coûteuses
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook pour throttler les événements fréquents (scroll, resize)
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + interval) {
      lastExecuted.current = Date.now()
      setThrottledValue(value)
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now()
        setThrottledValue(value)
      }, interval)

      return () => clearTimeout(timerId)
    }
  }, [value, interval])

  return throttledValue
}

/**
 * Hook pour mesurer les performances de rendu
 */
export function useRenderPerformance(componentName: string) {
  const renderStartTime = useRef<number | null>(null)

  useEffect(() => {
    renderStartTime.current = performance.now()
  })

  useEffect(() => {
    if (renderStartTime.current && typeof window !== 'undefined') {
      const renderTime = performance.now() - renderStartTime.current
      if (renderTime > 16) { // Plus de 16ms = problème de performance
        console.warn(`⚡ ${componentName} rendered in ${renderTime.toFixed(2)}ms (>16ms)`)
      }
    }
  })
}

/**
 * Hook pour gérer le chargement progressif des ressources
 */
export function useProgressiveLoading<T>(
  items: T[], 
  batchSize: number = 10, 
  delay: number = 100
): { visibleItems: T[], loadMore: () => void, hasMore: boolean } {
  const [visibleCount, setVisibleCount] = useState(batchSize)
  const timeoutRef = useRef<number | null>(null)

  const loadMore = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    
    timeoutRef.current = window.setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + batchSize, items.length))
    }, delay)
  }, [batchSize, delay, items.length])

  useEffect(() => {
    setVisibleCount(batchSize)
  }, [items.length, batchSize])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    visibleItems: items.slice(0, visibleCount),
    loadMore,
    hasMore: visibleCount < items.length
  }
}