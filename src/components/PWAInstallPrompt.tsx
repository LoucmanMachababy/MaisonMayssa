import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

const DISMISS_KEY = 'maison-mayssa-pwa-dismiss'

export function PWAInstallPrompt() {
  const { canInstall, install } = usePWAInstall()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!canInstall) return

    // Don't show if user dismissed recently (7 days)
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    // Show after a delay so it's not intrusive
    const timer = setTimeout(() => setShow(true), 10000)
    return () => clearTimeout(timer)
  }, [canInstall])

  const handleInstall = async () => {
    await install()
    setShow(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 md:bottom-6 left-4 z-50 max-w-xs rounded-2xl bg-white shadow-2xl border border-mayssa-brown/10 p-4"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-mayssa-soft transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X size={14} className="text-mayssa-brown/40" />
          </button>
          <div className="flex items-start gap-3 pr-4">
            <div className="p-2 rounded-xl bg-mayssa-caramel/10 flex-shrink-0">
              <Download size={20} className="text-mayssa-caramel" />
            </div>
            <div>
              <p className="text-sm font-bold text-mayssa-brown">Installer Maison Mayssa</p>
              <p className="text-[11px] text-mayssa-brown/60 mt-0.5">
                Accède au site directement depuis ton écran d'accueil, même hors ligne.
              </p>
              <button
                onClick={handleInstall}
                className="mt-2 px-4 py-1.5 rounded-full bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-caramel transition-colors cursor-pointer"
              >
                Installer
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
