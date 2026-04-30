import { useState } from 'react'
import { motion } from 'framer-motion'
import { Quote, Star, Link2 } from 'lucide-react'
import { useReviews } from '../hooks/useReviews'
import { PublicReviewForm } from './PublicReviewForm'
import { hapticFeedback } from '../lib/haptics'

const FALLBACK_TESTIMONIALS = [
  { text: 'Trop bons les trompe-l\'œil ! Une vraie pâtisserie haut de gamme sur Annecy, on en reprend à chaque fois.', author: 'Léa M.' },
  { text: 'Service au top et livraison rapide autour d\'Annecy. Les créations de la Maison Mayssa sont une merveille.', author: 'Thomas D.' },
  { text: 'Enfin des vrais goûts, faits maison et artisanaux. Le meilleur dessert pour nos soirées.', author: 'Sarah K.' },
]

export function Testimonials() {
  const { reviews, globalAverage } = useReviews()
  const displayItems = reviews.length > 0
    ? reviews.slice(0, 6).map((r) => ({
        text: r.comment || 'Une excellente expérience de pâtisserie !',
        author: r.authorName || 'Client Maison Mayssa',
        rating: r.rating,
      }))
    : FALLBACK_TESTIMONIALS.map((t) => ({ ...t, rating: 5 as number | null }))

  const [linkCopied, setLinkCopied] = useState(false)

  const copyAvisLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#avis`
      await navigator.clipboard.writeText(url)
      hapticFeedback('light')
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <motion.section
      id="avis"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mt-16 sm:mt-24 md:mt-32 scroll-mt-24"
    >
      <div className="section-shell bg-white/60 backdrop-blur-3xl border border-mayssa-gold/10 shadow-[0_10px_40px_rgba(212,175,55,0.05)] rounded-[2.5rem] p-8 sm:p-12">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-gold">
            Pâtisserie Artisanale Annecy
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-mayssa-brown mt-3 tracking-tight">
            Témoignages de nos clients
          </h2>
          <p className="mt-4 text-sm font-light text-mayssa-brown/60 max-w-xl mx-auto leading-relaxed">
            Découvrez l'expérience Maison Mayssa à travers les mots de ceux qui ont goûté à nos pâtisseries en trompe-l'œil et créations gourmandes sur le bassin annécien.
          </p>
          
          {globalAverage != null && reviews.length > 0 && (
            <div className="mt-6 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-2xl text-mayssa-brown font-display">
                <span className="font-semibold text-3xl">{globalAverage.toFixed(1).replace('.', ',')}</span>
                <span className="text-mayssa-gold flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <Star key={v} size={20} className={v <= Math.round(globalAverage) ? "fill-current" : "text-mayssa-brown/10"} />
                  ))}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-mayssa-brown/50 mt-2 font-bold">Basé sur {reviews.length} avis certifiés</span>
            </div>
          )}
          
          <button
            type="button"
            onClick={copyAvisLink}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white border border-mayssa-gold/20 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-mayssa-brown hover:bg-mayssa-gold/5 transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <Link2 size={14} className="text-mayssa-gold" />
            {linkCopied ? 'Lien copié !' : 'Partager nos avis'}
          </button>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
              className="relative rounded-2xl bg-white/80 backdrop-blur-md p-6 sm:p-8 border border-white shadow-sm hover:shadow-md transition-all group"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-mayssa-gold/10 group-hover:text-mayssa-gold/20 transition-colors" />
              {t.rating != null && (
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <Star
                      key={v}
                      size={12}
                      className={v <= (t.rating ?? 0) ? 'fill-mayssa-gold text-mayssa-gold' : 'text-mayssa-brown/10'}
                    />
                  ))}
                </div>
              )}
              <p className="text-sm text-mayssa-brown/80 font-light leading-relaxed relative z-10">
                « {t.text} »
              </p>
              <footer className="mt-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mayssa-gold/20 to-mayssa-brown/10 flex items-center justify-center text-[10px] font-bold text-mayssa-brown">
                  {t.author.charAt(0)}
                </div>
                <span className="text-xs font-bold tracking-wide text-mayssa-brown uppercase">
                  {t.author}
                </span>
              </footer>
            </motion.blockquote>
          ))}
        </div>

        <div className="mt-16 pt-16 border-t border-mayssa-gold/10 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-display font-medium text-mayssa-brown">Vous avez goûté nos créations ?</h3>
            <p className="text-sm font-light text-mayssa-brown/60 mt-2">Partagez votre expérience avec la communauté.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white">
            <PublicReviewForm />
          </div>
        </div>
      </div>
    </motion.section>
  )
}
