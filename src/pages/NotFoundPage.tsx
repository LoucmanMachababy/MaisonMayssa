import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { PHONE_E164 } from '../constants'
import { LIFESTYLE } from '../lib/decorativeAssets'
import { TrompeLoeilMarquee } from '../components/decorative/TrompeLoeilMarquee'

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

      <div className="min-h-screen bg-mayssa-ivory pt-[104px]">
        <div className="grid lg:grid-cols-2 min-h-[calc(100vh-104px)]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative hidden lg:block overflow-hidden"
          >
            <img
              src={LIFESTYLE.mangueCluster}
              alt="Trompe-l'œil mangue Maison Mayssa"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-mayssa-ivory/30" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center px-8 py-20 lg:py-0 text-center lg:text-left lg:items-start lg:px-16 xl:px-24"
          >
            <span className="text-mayssa-gold text-xs tracking-[0.3em] uppercase mb-4 block">Erreur 404</span>
            <h1 className="font-display text-4xl md:text-5xl text-mayssa-brown mb-4 leading-tight">
              Cette page<br className="hidden lg:block" /> n&apos;existe pas
            </h1>
            <div className="w-12 h-px bg-mayssa-gold/50 mb-6" />
            <p className="text-mayssa-brown/60 font-light leading-relaxed mb-10 max-w-md">
              L&apos;adresse que vous avez tapée n&apos;existe pas ou a été déplacée.
              Retrouvez nos créations sur la carte ou l&apos;accueil.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-8 py-4 bg-mayssa-brown text-white text-xs tracking-widest uppercase hover:bg-mayssa-espresso transition-colors"
              >
                Retour à l&apos;accueil
              </Link>
              <Link
                to="/carte"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-mayssa-brown/20 text-mayssa-brown text-xs tracking-widest uppercase hover:border-mayssa-gold hover:text-mayssa-gold transition-colors"
              >
                Voir la carte <ArrowRight size={14} />
              </Link>
            </div>

            <a
              href={`https://wa.me/${PHONE_E164}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-mayssa-brown/60 hover:text-mayssa-gold transition-colors"
            >
              <MessageCircle size={16} />
              Une question ? WhatsApp
            </a>
          </motion.div>
        </div>

        <TrompeLoeilMarquee variant="light" />
      </div>
    </>
  )
}
