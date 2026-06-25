import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, HandMetal, ShoppingBag, Mic, Heart } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'

const LOGO_URL = '/logo.webp'

interface OnboardingStep {
  id: string
  icon?: React.ElementType
  useLogo?: boolean
  title: string
  description: string
  animation?: 'swipe' | 'tap' | 'drag' | 'speak'
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    useLogo: true,
    title: 'Bienvenue chez Maison Mayssa',
    description: "Découvre nos pâtisseries faites avec amour à Annecy. Voici quelques astuces pour commander facilement.",
  },
  {
    id: 'swipe',
    icon: HandMetal,
    title: 'Glisse pour ajouter',
    description: 'Glisse un produit vers la droite avec ton doigt pour l\'ajouter rapidement au panier. Rapide et satisfaisant !',
    animation: 'swipe',
  },
  {
    id: 'cart',
    icon: ShoppingBag,
    title: 'Ton panier en un tap',
    description: 'Tape sur l\'icône panier en bas pour voir ta commande et la finaliser.',
    animation: 'tap',
  },
  {
    id: 'voice',
    icon: Mic,
    title: 'Recherche vocale',
    description: 'Utilise le micro pour chercher un produit à la voix. Dis simplement "Tiramisu" ou "Cookie" !',
    animation: 'speak',
  },
  {
    id: 'favorite',
    icon: Heart,
    title: 'Double-tap pour aimer',
    description: 'Double-tape sur un produit pour l\'ajouter à tes favoris. Comme sur Insta !',
    animation: 'tap',
  },
]

const STORAGE_KEY = 'maison-mayssa-onboarding-complete'

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY)
    if (!hasSeenOnboarding) {
      // Delay showing onboarding
      const timer = setTimeout(() => {
        setIsVisible(true)
        hapticFeedback('medium')
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsVisible(false)
    hapticFeedback('success')
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
      hapticFeedback('light')
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      hapticFeedback('light')
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const step = STEPS[currentStep]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:hidden"
        >
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-sm cursor-pointer"
          >
            Passer
            <X size={14} />
          </button>

          {/* Step indicator */}
          <div className="absolute top-4 left-4 flex gap-1.5">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === currentStep ? 24 : 8,
                  backgroundColor: i === currentStep ? '#D4A574' : 'rgba(255,255,255,0.3)',
                }}
                className="h-2 rounded-full"
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon with animation */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative mb-8"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-mayssa-caramel to-mayssa-rose shadow-2xl overflow-hidden p-2">
                  {step.useLogo ? (
                    <img
                      src={LOGO_URL}
                      alt="Maison Mayssa"
                      className="w-full h-full object-contain"
                    />
                  ) : step.icon ? (
                    <step.icon size={48} className="text-white" />
                  ) : null}
                </div>

                {/* Animation hint */}
                {step.animation === 'swipe' && (
                  <motion.div
                    animate={{ x: [0, 40, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  >
                    <div className="flex items-center gap-1 text-mayssa-caramel">
                      <span className="text-xl">👆</span>
                      <span className="text-sm">→</span>
                    </div>
                  </motion.div>
                )}

                {step.animation === 'tap' && (
                  <motion.div
                    animate={{ scale: [1, 0.9, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  >
                    <span className="text-xl">👆</span>
                  </motion.div>
                )}

                {step.animation === 'speak' && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                  >
                    <span className="text-xl">🎤</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Title */}
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                {step.title}
              </h2>

              {/* Description */}
              <p className="text-white/70 text-base leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="absolute bottom-8 left-6 right-6 flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex h-12 w-12 items-center justify-center rounded-full cursor-pointer ${
                currentStep === 0 ? 'opacity-30' : 'bg-white/10'
              }`}
            >
              <ChevronLeft size={24} className="text-white" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-mayssa-caramel text-white font-bold shadow-xl cursor-pointer"
            >
              {currentStep === STEPS.length - 1 ? (
                'Commencer'
              ) : (
                <>
                  Suivant
                  <ChevronRight size={18} />
                </>
              )}
            </motion.button>

            <div className="w-12" /> {/* Spacer for alignment */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Reset onboarding (for testing)
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY)
}
