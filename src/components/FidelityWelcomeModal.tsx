import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Gift, Crown, Zap, Cake } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface FidelityWelcomeModalProps {
  onLoginClick: () => void
  onRegisterClick: () => void
}

export function FidelityWelcomeModal({ onLoginClick, onRegisterClick }: FidelityWelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenSeen, setHasBeenSeen] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    // Ne pas afficher si l'utilisateur est déjà connecté
    if (isAuthenticated) return

    // Vérifier si le modal a déjà été vu
    const seenBefore = localStorage.getItem('fidelity-welcome-seen')
    if (seenBefore) {
      setHasBeenSeen(true)
      return
    }

    // Afficher le modal après 1.5 secondes
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [isAuthenticated])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('fidelity-welcome-seen', 'true')
    setHasBeenSeen(true)
  }

  const handleLogin = () => {
    handleClose()
    onLoginClick()
  }

  const handleRegister = () => {
    handleClose()
    onRegisterClick()
  }

  const handleLater = () => {
    setIsVisible(false)
    // Reproposer dans 24h
    const tomorrow = new Date()
    tomorrow.setHours(tomorrow.getHours() + 24)
    localStorage.setItem('fidelity-welcome-remind', tomorrow.toISOString())
  }

  if (!isVisible || hasBeenSeen || isAuthenticated) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-mayssa-soft via-white to-mayssa-rose/20" />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-mayssa-caramel rounded-full"
                initial={{ 
                  x: Math.random() * 400, 
                  y: Math.random() * 600,
                  opacity: 0 
                }}
                animate={{ 
                  y: -50,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 3, 
                  delay: i * 0.3, 
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              />
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-mayssa-brown/60 hover:text-mayssa-brown hover:bg-white transition-colors"
          >
            <X size={16} />
          </button>

          {/* Content */}
          <div className="relative p-6 sm:p-8 text-center">
            {/* Header with crown icon */}
            <motion.div
              className="mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-mayssa-caramel to-mayssa-brown rounded-2xl text-white mb-4 shadow-lg">
                <Crown size={28} />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-2xl sm:text-3xl font-display font-bold text-mayssa-brown mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Bienvenue chez Maison Mayssa ! 🎉
            </motion.h2>

            <motion.p
              className="text-mayssa-brown/80 text-sm sm:text-base mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Rejoignez notre programme de fidélité et profitez d'avantages exclusifs
            </motion.p>

            {/* Benefits */}
            <motion.div
              className="space-y-2 mb-6 text-left"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[
                { icon: Gift, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', label: '15 points offerts', desc: "Dès l'inscription" },
                { icon: Cake, color: 'pink', bg: 'bg-pink-50', text: 'text-pink-600', label: 'Cadeau d\'anniversaire', desc: 'Un produit offert chaque année' },
                { icon: Star, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', label: '1 euro = 1 point', desc: 'Sur chaque commande' },
                { icon: Crown, color: 'purple', bg: 'bg-purple-50', text: 'text-purple-600', label: '3 niveaux VIP', desc: 'Douceur, Gourmand, Prestige' },
                { icon: Zap, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', label: 'Récompenses exclusives', desc: 'Box, réductions, surprises' },
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-mayssa-soft/50"
                >
                  <div className={`w-9 h-9 ${benefit.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <benefit.icon size={18} className={benefit.text} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-mayssa-brown">{benefit.label}</p>
                    <p className="text-[10px] text-mayssa-brown/60">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="space-y-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <button
                onClick={handleRegister}
                className="w-full py-3 bg-gradient-to-r from-mayssa-brown to-mayssa-caramel text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                🆕 Créer mon compte fidélité
              </button>
              
              <button
                onClick={handleLogin}
                className="w-full py-3 bg-white border-2 border-mayssa-brown text-mayssa-brown font-bold rounded-2xl hover:bg-mayssa-brown hover:text-white transition-all duration-300"
              >
                👤 J'ai déjà un compte
              </button>
            </motion.div>

            {/* Footer actions */}
            <motion.div
              className="flex items-center justify-center gap-4 mt-4 text-xs text-mayssa-brown/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <button
                onClick={handleLater}
                className="hover:text-mayssa-brown transition-colors"
              >
                ⏰ Plus tard
              </button>
              <span>•</span>
              <button
                onClick={handleClose}
                className="hover:text-mayssa-brown transition-colors"
              >
                ❌ Ne plus afficher
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook pour gérer la logique de réaffichage
export function useFidelityWelcomeModal() {
  const [shouldShow, setShouldShow] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) return

    const checkShouldShow = () => {
      const seenBefore = localStorage.getItem('fidelity-welcome-seen')
      const remindTime = localStorage.getItem('fidelity-welcome-remind')

      if (!seenBefore) {
        // Jamais vu, afficher
        setShouldShow(true)
        return
      }

      if (remindTime) {
        const remindDate = new Date(remindTime)
        const now = new Date()
        
        if (now >= remindDate) {
          // Le délai de rappel est écoulé, réafficher
          localStorage.removeItem('fidelity-welcome-remind')
          setShouldShow(true)
        }
      }
    }

    // Vérifier au montage du composant
    checkShouldShow()

    // Vérifier périodiquement (pour les utilisateurs qui laissent l'onglet ouvert)
    const interval = setInterval(checkShouldShow, 60000) // Chaque minute

    return () => clearInterval(interval)
  }, [isAuthenticated])

  return shouldShow
}

// Composant pour mobile avec design adapté
export function FidelityWelcomeBanner({ onRegisterClick }: { onRegisterClick: () => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) return
    
    const seenBefore = localStorage.getItem('fidelity-banner-seen')
    if (seenBefore) return

    const timer = setTimeout(() => setIsVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [isAuthenticated])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('fidelity-banner-seen', 'true')
  }

  const handleRegister = () => {
    handleDismiss()
    onRegisterClick()
  }

  if (!isVisible || isAuthenticated) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 left-4 right-4 z-50 md:hidden"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
      >
        <div className="bg-gradient-to-r from-mayssa-brown to-mayssa-caramel rounded-2xl p-4 shadow-2xl text-white">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-white"
          >
            <X size={14} />
          </button>
          
          <div className="pr-8">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={20} />
              <span className="font-bold">Programme fidélité</span>
            </div>
            <p className="text-sm opacity-90 mb-3">
              15 points offerts + cadeau d'anniversaire !
            </p>
            <button
              onClick={handleRegister}
              className="bg-white text-mayssa-brown px-4 py-2 rounded-xl text-sm font-bold hover:bg-mayssa-cream transition-colors"
            >
              Rejoindre maintenant
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}