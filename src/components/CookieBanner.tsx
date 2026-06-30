import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie } from 'lucide-react'
import { COOKIE_CONSENT_KEY } from '../lib/siteAnalytics'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      // On n'affiche le bandeau que si aucun choix (accepter/refuser) n'a encore été fait.
      const choice = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (choice !== 'true' && choice !== 'false') setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const persistChoice = (value: 'true' | 'false') => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, value)
    } catch {
      // localStorage indisponible (mode privé) : on masque quand même le bandeau.
    }
    setVisible(false)
  }

  const accept = () => {
    persistChoice('true')
    // Démarrer la mesure d'audience immédiatement après consentement (sinon au prochain chargement).
    import('../lib/analytics').then(({ initAnalytics }) => initAnalytics()).catch(() => {})
  }

  const refuse = () => persistChoice('false')

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
                Nous utilisons le stockage local (panier, préférences) et, avec votre accord, une mesure d&apos;audience anonymisée (Firebase). Aucun cookie publicitaire.
                <Link to="/legal#confidentialite" className="text-mayssa-caramel font-medium hover:underline ml-1">
                  En savoir plus
                </Link>
              </p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <button
                type="button"
                onClick={refuse}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-mayssa-brown/20 text-mayssa-brown text-sm font-medium hover:bg-mayssa-brown/5 transition-colors cursor-pointer"
              >
                Refuser
              </button>
              <button
                type="button"
                onClick={accept}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-mayssa-brown text-white text-sm font-bold hover:bg-mayssa-caramel transition-colors cursor-pointer"
              >
                J&apos;accepte
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
