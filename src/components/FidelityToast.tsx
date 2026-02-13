import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, Crown, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface FidelityToastProps {
  trigger: boolean
  productName: string
  onSignUpClick: () => void
}

export function FidelityToast({ trigger, productName, onSignUpClick }: FidelityToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!trigger || isAuthenticated) return

    // Vérifier si l'utilisateur a déjà vu trop de notifications fidélité
    const toastCount = parseInt(localStorage.getItem('fidelity-toast-count') || '0')
    const lastShown = localStorage.getItem('fidelity-toast-last')
    const now = Date.now()
    
    // Ne montrer qu'une fois par session et max 3 fois au total
    if (toastCount >= 3) return
    
    // Attendre au moins 1 heure entre les notifications
    if (lastShown && (now - parseInt(lastShown)) < 3600000) return

    setIsVisible(true)
    localStorage.setItem('fidelity-toast-count', (toastCount + 1).toString())
    localStorage.setItem('fidelity-toast-last', now.toString())

    // Auto-dismiss après 8 secondes
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 8000)

    return () => clearTimeout(timer)
  }, [trigger, isAuthenticated])

  const handleSignUp = () => {
    setIsVisible(false)
    onSignUpClick()
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible || isAuthenticated) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-24 md:bottom-8 right-4 z-40 max-w-sm"
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="bg-gradient-to-r from-mayssa-brown to-mayssa-caramel rounded-2xl shadow-2xl text-white overflow-hidden border border-white/20">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
          >
            <X size={14} />
          </button>

          <div className="p-4 pr-12">
            {/* Header with animated crown */}
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Crown size={18} className="text-yellow-300" />
              </motion.div>
              <span className="font-bold text-sm">Programme Fidélité</span>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <p className="text-sm opacity-90">
                <strong>{productName}</strong> ajouté ! 🎉
              </p>
              
              <div className="flex items-center gap-2 text-xs opacity-80">
                <Sparkles size={14} />
                <span>Gagnez des points sur chaque commande</span>
              </div>
              
              <div className="bg-white/10 rounded-lg p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span>🎁 Bonus inscription</span>
                  <strong className="text-yellow-300">+15 points</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>💰 Cette commande</span>
                  <strong className="text-green-300">+€ en points</strong>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              onClick={handleSignUp}
              className="w-full mt-3 bg-white text-mayssa-brown font-bold py-2 px-4 rounded-xl text-sm hover:bg-mayssa-cream transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ⚡ Créer mon compte (gratuit)
            </motion.button>
          </div>

          {/* Animated border */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-yellow-300/30 pointer-events-none"
            animate={{
              boxShadow: [
                '0 0 0 0px rgba(253, 224, 71, 0.3)',
                '0 0 0 4px rgba(253, 224, 71, 0.1)',
                '0 0 0 0px rgba(253, 224, 71, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Composant pour une notification plus subtile lors du checkout
interface FidelityCheckoutReminderProps {
  totalAmount: number
  onSignUpClick: () => void
}

export function FidelityCheckoutReminder({ totalAmount, onSignUpClick }: FidelityCheckoutReminderProps) {
  const { isAuthenticated } = useAuth()
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Reset le dismiss si nouveau montant (nouvelle commande)
    setIsDismissed(false)
  }, [totalAmount])

  if (isAuthenticated || isDismissed || totalAmount === 0) return null

  const potentialPoints = Math.round(totalAmount)

  return (
    <motion.div
      className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4 mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Star size={20} className="text-white" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">
            Gagnez {potentialPoints} points avec cette commande ! 🎯
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Créez votre compte fidélité maintenant et commencez à collecter des points pour des récompenses exclusives.
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <span>🎁 +15 pts à l'inscription</span>
            <span>💝 Récompenses dès 50 pts</span>
            <span>⚡ Offres exclusives</span>
          </div>

          <button
            onClick={onSignUpClick}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-xl text-sm hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
          >
            🚀 Créer mon compte fidélité
          </button>
        </div>
      </div>
    </motion.div>
  )
}