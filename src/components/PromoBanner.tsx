import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { hapticFeedback } from '../lib/haptics'
import { isBeforeFirstPickupDate } from '../lib/utils'
import { FIRST_PICKUP_DATE_CLASSIC, FIRST_PICKUP_DATE_CLASSIC_LABEL } from '../constants'

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
  // Show by default; hide only if user previously dismissed (localStorage)

  const handleDismiss = () => {
    hapticFeedback('light')
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
  }

  if (dismissed) return null

  const isPreorderPhase = isBeforeFirstPickupDate(FIRST_PICKUP_DATE_CLASSIC)

  return (
    <div className="relative bg-mayssa-caramel/90 text-mayssa-brown py-2.5 px-4 sm:px-6 text-center">
      <p className="text-xs sm:text-sm font-semibold">
        {isPreorderPhase
          ? `Précommandes — récupération à partir du ${FIRST_PICKUP_DATE_CLASSIC_LABEL} · Livraison offerte dès 45 €`
          : 'Livraison offerte dès 45 € d\'achat · Annecy & alentours'}
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Fermer"
      >
        <X size={16} />
      </button>
    </div>
  )
}
