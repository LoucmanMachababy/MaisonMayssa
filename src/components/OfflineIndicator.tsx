import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
      // Hide the reconnected message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {/* Offline indicator */}
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg"
        >
          <WifiOff size={16} />
          <span>Mode hors-ligne - Certaines fonctions peuvent ne pas fonctionner</span>
        </motion.div>
      )}

      {/* Reconnected indicator */}
      {showReconnected && isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-green-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg"
        >
          <Wifi size={16} />
          <span>Connexion rétablie</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
