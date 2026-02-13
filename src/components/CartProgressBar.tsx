import { motion } from 'framer-motion'
import { ShoppingCart, User, MessageCircle, Check, Gift } from 'lucide-react'

interface CartProgressBarProps {
  currentStep: number // 0: Empty, 1: Items added, 2: Info filled, 3: Ready to send, 4: Sent
  totalAmount: number
  freeDeliveryThreshold?: number
}

const steps = [
  { id: 1, label: 'Produits', icon: ShoppingCart },
  { id: 2, label: 'Infos', icon: User },
  { id: 3, label: 'Envoi', icon: MessageCircle },
  { id: 4, label: 'Confirmé', icon: Check },
]

export function CartProgressBar({ 
  currentStep, 
  totalAmount, 
  freeDeliveryThreshold = 30 
}: CartProgressBarProps) {
  if (currentStep === 0) return null

  const progressPercentage = (currentStep / 4) * 100
  const deliveryProgress = Math.min((totalAmount / freeDeliveryThreshold) * 100, 100)
  const needsMoreForDelivery = totalAmount < freeDeliveryThreshold
  const amountNeeded = freeDeliveryThreshold - totalAmount

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-mayssa-brown/10 space-y-4">
      {/* Main progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-mayssa-brown">Progression de votre commande</span>
          <span className="text-mayssa-caramel font-bold">{Math.round(progressPercentage)}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-2 bg-mayssa-soft rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-mayssa-caramel to-mayssa-brown rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Steps */}
        <div className="flex justify-between">
          {steps.map((step) => {
            const isActive = currentStep >= step.id
            const isCurrent = currentStep === step.id
            const Icon = step.icon

            return (
              <motion.div
                key={step.id}
                className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
                  isActive ? 'text-mayssa-brown' : 'text-mayssa-brown/40'
                }`}
                animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? 'bg-mayssa-brown text-white shadow-md' 
                    : 'bg-mayssa-soft text-mayssa-brown/40'
                } ${isCurrent ? 'ring-2 ring-mayssa-caramel ring-opacity-50' : ''}`}>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-semibold">{step.label}</span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Delivery progress */}
      {needsMoreForDelivery && currentStep >= 1 && (
        <motion.div 
          className="space-y-2 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <Gift size={14} />
              Livraison gratuite
            </span>
            <span className="text-emerald-600 font-bold">
              +{amountNeeded.toFixed(2).replace('.', ',')} €
            </span>
          </div>
          
          <div className="relative h-1.5 bg-emerald-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${deliveryProgress}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            />
          </div>
          
          <p className="text-[10px] text-emerald-600 font-medium">
            Ajoutez encore {amountNeeded.toFixed(2).replace('.', ',')} € pour la livraison gratuite !
          </p>
        </motion.div>
      )}

      {/* Success message for free delivery */}
      {!needsMoreForDelivery && totalAmount > 0 && (
        <motion.div 
          className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <Check size={14} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-sm font-semibold text-emerald-700">
            🎉 Livraison gratuite !
          </span>
        </motion.div>
      )}

      {/* Next step hint */}
      {currentStep < 4 && (
        <motion.div 
          className="text-center text-xs text-mayssa-brown/60"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {currentStep === 1 && "👆 Remplissez vos informations pour continuer"}
          {currentStep === 2 && "👆 Vérifiez votre commande et envoyez"}
          {currentStep === 3 && "🎉 Commande prête à être envoyée !"}
        </motion.div>
      )}
    </div>
  )
}

// Hook pour gérer l'état du progress
export function useCartProgress(cartItems: any[], customer: any, hasValidInfo: boolean) {
  let currentStep = 0
  
  if (cartItems.length > 0) {
    currentStep = 1
    
    if (hasValidInfo) {
      currentStep = 2
      
      // Si toutes les infos sont remplies et valides
      if (customer.firstName && customer.lastName && customer.phone) {
        currentStep = 3
      }
    }
  }
  
  return currentStep
}