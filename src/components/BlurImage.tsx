import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface BlurImageProps {
  src: string
  alt: string
  className?: string
  placeholderColor?: string
}

export function BlurImage({
  src,
  alt,
  className = '',
  placeholderColor = 'bg-mayssa-cream'
}: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
  }, [src])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder with shimmer effect */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: isLoaded ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className={`absolute inset-0 ${placeholderColor}`}
      >
        {/* Shimmer animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
      </motion.div>

      {/* Actual image */}
      {!hasError && (
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{
            opacity: isLoaded ? 1 : 0,
            scale: isLoaded ? 1 : 1.1
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full h-full object-cover"
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className={`absolute inset-0 flex items-center justify-center ${placeholderColor}`}>
          <span className="text-4xl">🧁</span>
        </div>
      )}
    </div>
  )
}
