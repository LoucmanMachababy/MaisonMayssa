import { motion, useAnimation } from 'framer-motion'
import { useState } from 'react'
import { 
  Plus, 
  Check, 
  ArrowRight, 
  Gift, 
  Star,
  Heart,
  MessageCircle
} from 'lucide-react'

interface EnhancedCTAProps {
  variant: 'primary' | 'secondary' | 'urgency' | 'social' | 'gift'
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  badge?: string | number
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  glow?: boolean
  className?: string
}

export function EnhancedCTA({
  variant,
  children,
  onClick,
  disabled = false,
  loading = false,
  icon,
  badge,
  animated = true,
  size = 'md',
  pulse = false,
  glow = false,
  className = ''
}: EnhancedCTAProps) {
  const controls = useAnimation()
  const [isHovered, setIsHovered] = useState(false)

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-2 text-sm'
      case 'lg': return 'px-8 py-4 text-lg'
      default: return 'px-6 py-3 text-base'
    }
  }

  const getVariantClasses = () => {
    const baseClasses = `relative overflow-hidden font-bold rounded-2xl transition-all duration-300 ${getSizeClasses()}`
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-mayssa-brown text-white hover:bg-mayssa-caramel shadow-lg hover:shadow-xl`
      case 'secondary':
        return `${baseClasses} bg-white text-mayssa-brown border-2 border-mayssa-brown hover:bg-mayssa-brown hover:text-white shadow-md hover:shadow-lg`
      case 'urgency':
        return `${baseClasses} bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-red-200`
      case 'social':
        return `${baseClasses} bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-blue-200`
      case 'gift':
        return `${baseClasses} bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-emerald-200`
      default:
        return baseClasses
    }
  }

  const handleClick = () => {
    if (disabled || loading) return
    
    if (animated) {
      controls.start({
        scale: [1, 0.95, 1.05, 1],
        transition: { duration: 0.3 }
      })
    }
    
    onClick()
  }

  const pulseAnimation = pulse ? {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity }
  } : {}

  const glowAnimation = glow ? {
    boxShadow: [
      "0 0 0 rgba(139, 69, 19, 0)",
      "0 0 20px rgba(139, 69, 19, 0.4)",
      "0 0 0 rgba(139, 69, 19, 0)"
    ],
    transition: { duration: 2, repeat: Infinity }
  } : {}

  return (
    <motion.button
      className={`${getVariantClasses()} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={{ ...pulseAnimation, ...glowAnimation }}
      whileHover={animated && !disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={animated && !disabled ? { scale: 0.98 } : {}}
      disabled={disabled || loading}
    >
      {/* Background animation */}
      {animated && isHovered && !disabled && (
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-2xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.6 }}
        />
      )}

      {/* Shimmer effect */}
      {variant === 'urgency' && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      )}

      <div className="relative flex items-center justify-center gap-2">
        {loading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon && <span className="flex-shrink-0">{icon}</span>
        )}
        
        <span className="font-bold">{children}</span>
        
        {badge && (
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}

        {variant === 'primary' && !loading && (
          <motion.span
            animate={{ x: isHovered ? 5 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight size={16} />
          </motion.span>
        )}
      </div>
    </motion.button>
  )
}

// Composant pour un bouton d'ajout au panier amélioré
export function AddToCartButton({
  onAdd,
  disabled = false,
  stock,
  price
}: {
  onAdd: () => void
  disabled?: boolean
  stock?: number
  price?: number
}) {
  const [isAdded, setIsAdded] = useState(false)
  const [showPriceAnimation, setShowPriceAnimation] = useState(false)

  const handleAdd = () => {
    onAdd()
    setIsAdded(true)
    if (price) setShowPriceAnimation(true)
    
    setTimeout(() => {
      setIsAdded(false)
      setShowPriceAnimation(false)
    }, 2000)
  }

  const getUrgencyProps = () => {
    if (stock && stock <= 3) {
      return {
        variant: 'urgency' as const,
        pulse: true,
        glow: true,
        badge: `${stock} restant${stock > 1 ? 's' : ''}`,
        children: isAdded ? '✓ Ajouté !' : `🔥 Ajouter (${stock} restant${stock > 1 ? 's' : ''})`
      }
    }

    return {
      variant: 'primary' as const,
      children: isAdded ? '✓ Ajouté !' : 'Ajouter au panier',
      icon: isAdded ? <Check size={20} /> : <Plus size={20} />
    }
  }

  const urgencyProps = getUrgencyProps()

  return (
    <div className="relative">
      <EnhancedCTA
        {...urgencyProps}
        onClick={handleAdd}
        disabled={disabled || isAdded}
        className="w-full"
      />

      {/* Price animation */}
      {showPriceAnimation && price && (
        <motion.div
          className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full"
          initial={{ scale: 0, y: 0 }}
          animate={{ scale: 1, y: -30, opacity: [1, 1, 0] }}
          transition={{ duration: 1.5 }}
        >
          +{price.toFixed(2).replace('.', ',')} €
        </motion.div>
      )}
    </div>
  )
}

// Composant pour encourager l'achat avec des messages psychologiques
export function PsychologicalCTA({ 
  totalAmount, 
  freeDeliveryThreshold = 30,
  cartCount = 0 
}: {
  totalAmount: number
  freeDeliveryThreshold?: number
  cartCount?: number
}) {
  const amountNeeded = freeDeliveryThreshold - totalAmount
  const isEligibleForFreeDelivery = amountNeeded <= 0

  if (cartCount === 0) return null

  return (
    <div className="space-y-3">
      {/* Free delivery incentive */}
      {!isEligibleForFreeDelivery && (
        <motion.div
          className="p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Gift className="text-emerald-600" size={16} />
            <span className="text-sm font-semibold text-emerald-700">
              Plus que {amountNeeded.toFixed(2).replace('.', ',')} € pour la livraison gratuite !
            </span>
          </div>
          <p className="text-xs text-emerald-600">
            🎁 Économisez 5€ de frais de livraison
          </p>
        </motion.div>
      )}

      {/* Success message */}
      {isEligibleForFreeDelivery && totalAmount > 0 && (
        <motion.div
          className="p-3 bg-emerald-50 rounded-xl border border-emerald-200"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-emerald-700">
              🎉 Félicitations ! Livraison gratuite débloquée
            </span>
          </div>
        </motion.div>
      )}

      {/* Social proof */}
      <motion.div
        className="flex items-center justify-center gap-4 text-xs text-mayssa-brown/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-1">
          <Star size={12} className="text-yellow-500" />
          <span>4.8/5 (124 avis)</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart size={12} className="text-red-500" />
          <span>💝 Fait avec amour</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle size={12} className="text-blue-500" />
          <span>Livraison rapide</span>
        </div>
      </motion.div>
    </div>
  )
}