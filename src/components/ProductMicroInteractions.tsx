import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Heart, Star, Sparkles } from 'lucide-react'
import { useAdaptiveAnimations } from '../hooks/usePerformanceOptimizations'

/**
 * Effet de hover sophistiqué pour les cartes produits
 */
interface ProductCardHoverProps {
  children: React.ReactNode
  className?: string
  onHover?: (isHovered: boolean) => void
}

export function ProductCardHover({ children, className = '', onHover }: ProductCardHoverProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { getAnimationProps } = useAdaptiveAnimations()

  const handleHover = (hovered: boolean) => {
    setIsHovered(hovered)
    onHover?.(hovered)
  }

  const hoverProps = getAnimationProps({
    whileHover: {
      scale: 1.02,
      y: -5,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    whileTap: { scale: 0.98 }
  })

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
      {...hoverProps}
    >
      {/* Glow effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-mayssa-caramel/20 to-mayssa-rose/20 rounded-2xl blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative bg-white rounded-2xl overflow-hidden">
        {children}
        
        {/* Overlay sparkles */}
        <AnimatePresence>
          {isHovered && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none text-mayssa-caramel"
                  initial={{ 
                    opacity: 0, 
                    scale: 0, 
                    x: Math.random() * 200 + 50, 
                    y: Math.random() * 200 + 50 
                  }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360] 
                  }}
                  transition={{ 
                    duration: 2, 
                    delay: i * 0.2,
                    ease: "easeOut" 
                  }}
                >
                  <Sparkles size={16} />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/**
 * Animation d'ajout aux favoris
 */
interface HeartAnimationProps {
  isFavorite: boolean
  onClick: () => void
  size?: number
  className?: string
}

export function HeartAnimation({ isFavorite, onClick, size = 20, className = '' }: HeartAnimationProps) {
  const [showBurst, setShowBurst] = useState(false)
  const { getAnimationProps } = useAdaptiveAnimations()

  const handleClick = () => {
    onClick()
    if (!isFavorite) {
      setShowBurst(true)
      setTimeout(() => setShowBurst(false), 600)
    }
  }

  const heartProps = getAnimationProps({
    whileHover: { scale: 1.2 },
    whileTap: { scale: 0.8 },
    animate: isFavorite ? {
      scale: [1, 1.3, 1],
      transition: { duration: 0.3, ease: "easeOut" }
    } : {}
  })

  return (
    <div className="relative">
      <motion.button
        className={`relative z-10 ${className}`}
        onClick={handleClick}
        {...heartProps}
      >
        <Heart 
          size={size} 
          className={`transition-colors duration-200 ${
            isFavorite ? 'text-red-500 fill-red-500' : 'text-mayssa-brown/40 hover:text-red-400'
          }`} 
        />
      </motion.button>

      {/* Burst effect */}
      <AnimatePresence>
        {showBurst && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-red-400 rounded-full"
                initial={{ scale: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * 60) * Math.PI / 180) * 20,
                  y: Math.sin((i * 60) * Math.PI / 180) * 20,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Animation de rating avec étoiles
 */
interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: number
  animated?: boolean
  className?: string
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 16, 
  animated = true, 
  className = '' 
}: StarRatingProps) {

  return (
    <div className={`flex gap-1 ${className}`}>
      {[...Array(maxRating)].map((_, index) => {
        const isFullStar = index < Math.floor(rating)
        const isHalfStar = index < rating && index >= Math.floor(rating)
        
        return (
          <motion.div
            key={index}
            initial={animated ? { scale: 0, rotate: -180 } : {}}
            animate={animated ? { scale: 1, rotate: 0 } : {}}
            transition={{ 
              delay: index * 0.1, 
              duration: 0.4, 
              ease: "easeOut",
              type: "spring",
              stiffness: 200
            }}
          >
            <div className="relative">
              <Star 
                size={size} 
                className={`transition-colors duration-200 ${
                  isFullStar ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                }`} 
              />
              {isHalfStar && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star size={size} className="text-yellow-500 fill-yellow-500" />
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/**
 * Animation de succès pour l'ajout au panier
 */
interface AddToCartSuccessProps {
  trigger: boolean
  productName: string
  price: number
}

export function AddToCartSuccess({ trigger, productName, price }: AddToCartSuccessProps) {
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Success notification */}
          <motion.div
            className="bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl max-w-sm mx-4"
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -50 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                ✓
              </motion.div>
              <div>
                <p className="font-bold">Ajouté au panier !</p>
                <p className="text-sm opacity-90">{productName}</p>
                <p className="text-xs opacity-75">+{price.toFixed(2).replace('.', ',')} €</p>
              </div>
            </div>
          </motion.div>

          {/* Confetti effect */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 4],
                  left: '50%',
                  top: '50%',
                }}
                initial={{ scale: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Animation de prix avec effet de compteur
 */
interface PriceAnimationProps {
  price: number
  oldPrice?: number
  currency?: string
  className?: string
}

export function PriceAnimation({ price, oldPrice, currency = '€', className = '' }: PriceAnimationProps) {
  const [displayPrice, setDisplayPrice] = useState(oldPrice || price)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (oldPrice && oldPrice !== price) {
      setIsAnimating(true)
      
      const duration = 1000
      const startTime = Date.now()
      const startPrice = oldPrice
      const targetPrice = price

      const animatePrice = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        const currentPrice = startPrice + (targetPrice - startPrice) * easedProgress
        
        setDisplayPrice(currentPrice)

        if (progress < 1) {
          requestAnimationFrame(animatePrice)
        } else {
          setIsAnimating(false)
        }
      }

      requestAnimationFrame(animatePrice)
    }
  }, [price, oldPrice])

  return (
    <motion.span
      className={`font-display font-bold ${className}`}
      animate={isAnimating ? {
        scale: [1, 1.05, 1],
        color: ['#8b4513', '#f7b267', '#8b4513'],
      } : {}}
      transition={{ duration: 0.3 }}
    >
      {displayPrice.toFixed(2).replace('.', ',')} {currency}
    </motion.span>
  )
}

/**
 * Effect de loading avec des points animés
 */
interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export function LoadingDots({ size = 'md', color = 'currentColor', className = '' }: LoadingDotsProps) {
  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizes[size]} rounded-full`}
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

/**
 * Animation de badge avec effet de pop
 */
interface BadgePopProps {
  children: React.ReactNode
  show: boolean
  color?: 'red' | 'green' | 'blue' | 'yellow'
  className?: string
}

export function BadgePop({ children, show, color = 'red', className = '' }: BadgePopProps) {
  const colors = {
    red: 'bg-red-500 text-white',
    green: 'bg-emerald-500 text-white',
    blue: 'bg-blue-500 text-white',
    yellow: 'bg-yellow-500 text-black'
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full shadow-lg ${colors[color]} ${className}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1], 
            opacity: 1,
            transition: { type: "spring", damping: 15, stiffness: 400 }
          }}
          exit={{ 
            scale: 0, 
            opacity: 0,
            transition: { duration: 0.2 }
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}