import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie } from 'lucide-react'

const STORAGE_KEY = 'maison-mayssa-cookies-accepted'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY)
      if (!accepted) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-white/95 backdrop-blur-sm border-t border-mayssa-brown/10 shadow-lg"
        >
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie size={24} className="text-mayssa-caramel flex-shrink-0 mt-0.5" />
              <p className="text-sm text-mayssa-brown/90">
                En continuant, tu acceptes l'utilisation du stockage local (panier, préférences). Aucun cookie publicitaire.
                <a href="#confidentialite" className="text-mayssa-caramel font-medium hover:underline ml-1">
                  En savoir plus
                </a>
              </p>
            </div>
            <button
              type="button"
              onClick={accept}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-mayssa-brown text-white text-sm font-bold hover:bg-mayssa-caramel transition-colors cursor-pointer"
            >
              J'accepte
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
