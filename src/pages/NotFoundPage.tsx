import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Home, ShoppingBag, MessageCircle } from 'lucide-react'
import { Footer } from '../components/Footer'
import { PHONE_E164 } from '../constants'
import { hapticFeedback } from '../lib/haptics'

/**
 * Page 404 custom — "Page non trouvée".
 * Design chaleureux avec CTAs pour revenir au site principal.
 * SEO : noindex (pas besoin d'indexer les 404).
 */
export function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Page introuvable — Maison Mayssa</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="description"
          content="Cette page n'existe pas. Retournez à l'accueil de Maison Mayssa, pâtisserie artisanale à Annecy."
        />
      </Helmet>

      <div className="min-h-screen bg-mayssa-soft flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full text-center"
          >
            <div className="mb-8">
              <img
                src="/logo.webp"
                alt="Maison Mayssa"
                width={120}
                height={120}
                className="mx-auto rounded-3xl shadow-lg"
                loading="eager"
              />
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-mayssa-gold mb-3">
              Erreur 404
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-mayssa-brown mb-4">
              Cette page n'existe pas
            </h1>
            <p className="text-base text-mayssa-brown/70 font-light leading-relaxed mb-8">
              L'adresse que tu as tapée n'existe pas ou a été déplacée. Pas de souci : tu peux
              revenir à l'accueil ou découvrir notre carte.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-mayssa-brown text-white font-bold text-sm hover:bg-mayssa-caramel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-gold/50"
              >
                <Home size={18} />
                Retour à l'accueil
              </a>
              <a
                href="/#la-carte"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-mayssa-cream text-mayssa-brown font-bold text-sm hover:bg-mayssa-gold/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-gold/50"
              >
                <ShoppingBag size={18} />
                Voir la carte
              </a>
            </div>

            <div className="mt-8 pt-8 border-t border-mayssa-brown/10">
              <p className="text-sm text-mayssa-brown/60 mb-3">
                Un problème ? Une question ?
              </p>
              <a
                href={`https://wa.me/${PHONE_E164}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => hapticFeedback('light')}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#25D366] hover:text-[#20bd5a] transition-colors"
              >
                <MessageCircle size={16} />
                Écris-moi sur WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    </>
  )
}
