import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Flame, TrendingUp, Users, Eye, ShoppingCart } from 'lucide-react'

interface UrgencyBannerProps {
  type: 'limited_time' | 'low_stock' | 'high_demand' | 'recent_activity'
  message: string
  duration?: number // en millisecondes
  priority?: 'low' | 'medium' | 'high'
}

export function UrgencyBanner({ type, message, duration = 8000, priority = 'medium' }: UrgencyBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => setIsVisible(false), duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const getStyles = () => {
    const baseStyles = "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg border"
    
    switch (type) {
      case 'limited_time':
        return `${baseStyles} bg-red-50 border-red-200 text-red-700`
      case 'low_stock':
        return `${baseStyles} bg-amber-50 border-amber-200 text-amber-700`
      case 'high_demand':
        return `${baseStyles} bg-purple-50 border-purple-200 text-purple-700`
      case 'recent_activity':
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-700`
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-700`
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'limited_time': return <Clock size={16} />
      case 'low_stock': return <Flame size={16} />
      case 'high_demand': return <TrendingUp size={16} />
      case 'recent_activity': return <Users size={16} />
      default: return null
    }
  }

  const getAnimation = () => {
    switch (priority) {
      case 'high':
        return {
          animate: { 
            scale: [1, 1.02, 1],
            boxShadow: [
              "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              "0 10px 15px -3px rgba(239, 68, 68, 0.3)",
              "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            ]
          },
          transition: { duration: 1.5, repeat: Infinity }
        }
      case 'medium':
        return {
          animate: { scale: [1, 1.01, 1] },
          transition: { duration: 3, repeat: Infinity }
        }
      default:
        return {}
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        className={getStyles()}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        {...getAnimation()}
      >
        {getIcon()}
        <span>{message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-auto text-current opacity-50 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

// Composant pour afficher l'activité récente en temps réel
export function LiveActivityFeed({ activities }: { activities: Array<{
  type: 'purchase' | 'view' | 'add_to_cart'
  productName: string
  location?: string
  timeAgo: string
}> }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (activities.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activities.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [activities.length])

  if (activities.length === 0) return null

  const currentActivity = activities[currentIndex]

  const getActivityIcon = () => {
    switch (currentActivity.type) {
      case 'purchase': return <ShoppingCart size={12} />
      case 'view': return <Eye size={12} />
      case 'add_to_cart': return <ShoppingCart size={12} />
    }
  }

  const getActivityText = () => {
    switch (currentActivity.type) {
      case 'purchase': return `${currentActivity.productName} commandé`
      case 'view': return `${currentActivity.productName} consulté`
      case 'add_to_cart': return `${currentActivity.productName} ajouté au panier`
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs font-medium text-green-700"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {getActivityIcon()}
        <span className="flex-1">
          {getActivityText()}
          {currentActivity.location && ` à ${currentActivity.location}`}
        </span>
        <span className="text-green-600 opacity-75">{currentActivity.timeAgo}</span>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook pour générer des indicateurs d'urgence intelligents
export function useUrgencyIndicators(product: any, stock?: number) {
  const [indicators, setIndicators] = useState<UrgencyBannerProps[]>([])

  useEffect(() => {
    const newIndicators: UrgencyBannerProps[] = []

    // Rupture de stock imminente
    if (stock && stock <= 3 && stock > 0) {
      newIndicators.push({
        type: 'low_stock',
        message: `🔥 Plus que ${stock} ${product.name} disponible${stock > 1 ? 's' : ''} !`,
        priority: 'high',
        duration: 0 // Reste visible
      })
    }

    // Produit populaire (simulé)
    if (Math.random() > 0.7) { // 30% de chance d'être "populaire"
      newIndicators.push({
        type: 'high_demand',
        message: `✨ ${product.name} - Très demandé cette semaine`,
        priority: 'medium'
      })
    }

    // Activité récente (simulé)
    if (Math.random() > 0.8) { // 20% de chance
      newIndicators.push({
        type: 'recent_activity',
        message: `👀 3 personnes regardent ce produit en ce moment`,
        priority: 'low'
      })
    }

    setIndicators(newIndicators)
  }, [product, stock])

  return indicators
}

// Composant pour afficher un countdown timer
export function CountdownTimer({ 
  endTime, 
  onComplete, 
  message = "Offre limitée se termine dans :" 
}: { 
  endTime: Date
  onComplete?: () => void
  message?: string 
}) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = endTime.getTime() - now

      if (distance < 0) {
        onComplete?.()
        return
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [endTime, onComplete])

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
      <span className="text-xs font-semibold text-red-700">{message}</span>
      <div className="flex gap-2">
        {[
          { label: 'H', value: timeLeft.hours },
          { label: 'M', value: timeLeft.minutes },
          { label: 'S', value: timeLeft.seconds }
        ].map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <motion.div
              className="bg-red-600 text-white font-bold text-lg px-2 py-1 rounded-md min-w-[32px] text-center"
              animate={{ scale: unit.label === 'S' && timeLeft.seconds === 59 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.2 }}
            >
              {unit.value.toString().padStart(2, '0')}
            </motion.div>
            <span className="text-[10px] text-red-600 font-medium mt-0.5">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}