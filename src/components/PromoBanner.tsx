import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

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
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
  }

  if (dismissed) return null

  return (
    <div className="relative bg-mayssa-caramel/90 text-mayssa-brown py-2.5 px-4 sm:px-6 text-center">
      <p className="text-xs sm:text-sm font-semibold">
        Livraison offerte dès 30 € d&apos;achat · Annecy & alentours
      </p>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Fermer"
      >
        <X size={16} />
      </button>
    </div>
  )
}
