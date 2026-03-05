import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { hapticFeedback } from '../lib/haptics'
import { FREE_DELIVERY_THRESHOLD } from '../lib/delivery'

const STORAGE_KEY = 'maison-mayssa-promo-dismissed'

export function PromoBanner() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  const handleDismiss = () => {
    hapticFeedback('light')
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
  }

  if (dismissed) return null

  return (
    <div className="relative bg-mayssa-brown text-mayssa-gold py-2.5 sm:py-3 px-4 sm:px-6 pr-10 text-center border-b border-mayssa-gold/20">
      <p className="text-xs sm:text-sm font-bold uppercase tracking-widest">
        Livraison offerte dès {FREE_DELIVERY_THRESHOLD} € d&apos;achat sur Annecy et alentours
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-mayssa-gold/10 text-mayssa-gold/70 hover:text-mayssa-gold transition-colors cursor-pointer touch-manipulation"
        aria-label="Fermer"
      >
        <X size={14} />
      </button>
    </div>
  )
}
