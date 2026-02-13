import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface BlurImageProps {
  src: string
  alt: string
  className?: string
  placeholderColor?: string
  priority?: boolean // Pour les images critiques
  quality?: 'low' | 'medium' | 'high'
  blur?: boolean // Active/désactive l'effet de flou
}

// Cache simple pour les images chargées
const imageCache = new Set<string>()

// Hook pour l'intersection observer
function useIntersectionObserver(elementRef: React.RefObject<HTMLElement | null>, options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)
    return () => observer.disconnect()
  }, [elementRef, options])

  return isIntersecting
}

export function BlurImage({
  src,
  alt,
  className = '',
  placeholderColor = 'bg-mayssa-cream',
  priority = false,
  quality = 'medium',
  blur = true
}: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(priority)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Utilise Intersection Observer pour le lazy loading
  const isIntersecting = useIntersectionObserver(containerRef, {
    rootMargin: '50px', // Commence à charger 50px avant d'être visible
    threshold: 0.1
  })

  // Détermine si l'image doit être chargée
  useEffect(() => {
    if (priority || isIntersecting) {
      setShouldLoad(true)
    }
  }, [priority, isIntersecting])

  // Génère les sources d'images optimisées
  const optimizedSources = useMemo(() => {
    if (!src) return { webp: '', original: src }
    
    const baseSrc = src.replace(/\.[^/.]+$/, "")
    
    // Génère les sources WebP et originales
    return {
      webp: `${baseSrc}.webp`,
      original: src
    }
  }, [src])

  // Cache et préchargement
  useEffect(() => {
    if (!shouldLoad || !src) return

    // Vérifie si l'image est déjà en cache
    if (imageCache.has(src)) {
      setIsLoaded(true)
      return
    }

    // Précharge l'image
    const img = new Image()
    img.onload = () => {
      imageCache.add(src)
      setIsLoaded(true)
    }
    img.onerror = () => setHasError(true)
    img.src = src
  }, [shouldLoad, src])

  // Reset state when src changes
  useEffect(() => {
    if (imageCache.has(src)) {
      setIsLoaded(true)
      setHasError(false)
    } else {
      setIsLoaded(false)
      setHasError(false)
    }
  }, [src])

  // Animation variants avec respect des préférences d'accessibilité
  const placeholderAnimation = {
    opacity: isLoaded ? 0 : 1
  }
  
  const placeholderTransition = shouldReduceMotion 
    ? undefined
    : { duration: 0.3, ease: "easeOut" as const }

  const imageAnimation = {
    opacity: isLoaded ? 1 : 0,
    scale: shouldReduceMotion ? 1 : (isLoaded ? 1 : 1.05),
    filter: blur && !isLoaded && !shouldReduceMotion ? 'blur(10px)' : 'blur(0px)'
  }
  
  const imageTransition = shouldReduceMotion 
    ? undefined
    : { duration: 0.6, ease: "easeOut" as const }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Enhanced placeholder with better shimmer */}
      <motion.div
        animate={placeholderAnimation}
        transition={placeholderTransition}
        className={`absolute inset-0 ${placeholderColor}`}
      >
        {/* Gradient shimmer animation */}
        {!shouldReduceMotion && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
               style={{ 
                 backgroundSize: '200% 100%',
                 animation: 'shimmer 1.5s infinite linear'
               }} 
          />
        )}
        
        {/* Loading dots indicator */}
        {shouldLoad && !isLoaded && !hasError && !shouldReduceMotion && (
          <div className="absolute bottom-2 right-2 flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-white/60 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Progressive image loading */}
      {shouldLoad && !hasError && (
        <picture>
          {/* WebP source pour les navigateurs compatibles */}
          <source srcSet={optimizedSources.webp} type="image/webp" />
          
          <motion.img
            src={optimizedSources.original}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            {...(priority && { fetchPriority: "high" })}
            onLoad={() => {
              imageCache.add(src)
              setIsLoaded(true)
            }}
            onError={() => setHasError(true)}
            animate={imageAnimation}
            transition={imageTransition}
            className="w-full h-full object-cover"
            style={{
              imageRendering: quality === 'high' ? 'crisp-edges' : 'auto'
            }}
          />
        </picture>
      )}

      {/* Enhanced error fallback */}
      {hasError && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute inset-0 flex flex-col items-center justify-center ${placeholderColor}`}
        >
          <span className="text-4xl mb-2">🧁</span>
          <span className="text-xs text-mayssa-brown/40 font-medium">Image indisponible</span>
        </motion.div>
      )}

    </div>
  )
}
