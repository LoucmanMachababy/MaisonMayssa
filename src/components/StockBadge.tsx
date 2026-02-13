import { motion } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react'

interface StockBadgeProps {
  stock: number | null
  isPreorderDay: boolean
  dayNames: string
  compact?: boolean
  showTrend?: boolean
  popularityScore?: number // 0-100, pour indiquer la popularité
}

export function StockBadge({ 
  stock, 
  isPreorderDay, 
  dayNames, 
  compact = false, 
  showTrend = false,
  popularityScore = 0
}: StockBadgeProps) {
  // Not a managed product
  if (stock === null) return null

  const baseClasses = compact 
    ? 'text-[8px] px-1.5 py-0.5 rounded-md gap-0.5' 
    : 'text-[10px] px-2 py-1 rounded-lg gap-1'

  // Sold out - avec effet dramatique
  if (stock <= 0) {
    return (
      <motion.span 
        className={`inline-flex items-center font-bold text-red-600 bg-red-50 border border-red-200 ${baseClasses}`}
        animate={{ 
          backgroundColor: ['#fef2f2', '#fee2e2', '#fef2f2'],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <AlertTriangle size={compact ? 8 : 10} />
        Rupture de stock
      </motion.span>
    )
  }

  // Not the right day - avec indicateur de temps
  if (!isPreorderDay) {
    return (
      <motion.span 
        className={`inline-flex items-center font-bold text-orange-600 bg-orange-50 border border-orange-200 ${baseClasses}`}
        whileHover={{ scale: 1.05 }}
      >
        <Clock size={compact ? 8 : 10} />
        Dispo {dayNames}
      </motion.span>
    )
  }

  // Critical low stock (1-2 items) - effet pulsant
  if (stock <= 2) {
    return (
      <motion.span 
        className={`inline-flex items-center font-bold text-red-600 bg-red-50 border border-red-200 ${baseClasses}`}
        animate={{ 
          scale: [1, 1.02, 1],
          backgroundColor: ['#fef2f2', '#fee2e2', '#fef2f2']
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <AlertTriangle size={compact ? 8 : 10} />
        🔥 Plus que {stock} !
      </motion.span>
    )
  }

  // Low stock warning (3-5 items) - avec urgence psychologique
  if (stock <= 5) {
    return (
      <motion.span 
        className={`inline-flex items-center font-bold text-amber-600 bg-amber-50 border border-amber-200 ${baseClasses}`}
        whileHover={{ scale: 1.03 }}
        animate={!compact ? { 
          boxShadow: [
            '0 0 0 rgba(251, 191, 36, 0)',
            '0 0 8px rgba(251, 191, 36, 0.3)',
            '0 0 0 rgba(251, 191, 36, 0)'
          ]
        } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <AlertTriangle size={compact ? 8 : 10} />
        Plus que {stock} !
      </motion.span>
    )
  }

  // Available with popularity indicator
  const isPopular = popularityScore > 60
  const isTrending = popularityScore > 80

  return (
    <motion.span 
      className={`inline-flex items-center font-bold ${
        isTrending 
          ? 'text-purple-600 bg-purple-50 border border-purple-200'
          : isPopular
          ? 'text-blue-600 bg-blue-50 border border-blue-200'
          : 'text-emerald-600 bg-emerald-50 border border-emerald-200'
      } ${baseClasses}`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isTrending && <TrendingUp size={compact ? 8 : 10} />}
      {isPopular && !isTrending && <CheckCircle size={compact ? 8 : 10} />}
      {!isPopular && <CheckCircle size={compact ? 8 : 10} />}
      
      {isTrending && '🔥 Tendance'}
      {isPopular && !isTrending && `✨ ${stock} disponibles`}
      {!isPopular && `${stock} disponibles`}
      
      {showTrend && popularityScore > 50 && !compact && (
        <span className="ml-1 text-[8px] opacity-75">
          ({popularityScore}% populaire)
        </span>
      )}
    </motion.span>
  )
}

// Composant pour afficher des indicateurs de social proof
export function SocialProofBadge({ 
  viewCount, 
  recentPurchases, 
  compact = false 
}: { 
  viewCount?: number
  recentPurchases?: number
  compact?: boolean 
}) {
  if (!viewCount && !recentPurchases) return null

  return (
    <motion.div 
      className={`flex items-center gap-1 ${compact ? 'text-[8px]' : 'text-[10px]'} text-mayssa-brown/60`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {viewCount && (
        <span>👀 {viewCount}+ vues</span>
      )}
      {viewCount && recentPurchases && ' • '}
      {recentPurchases && (
        <span>🛒 {recentPurchases} récemment commandé{recentPurchases > 1 ? 's' : ''}</span>
      )}
    </motion.div>
  )
}
