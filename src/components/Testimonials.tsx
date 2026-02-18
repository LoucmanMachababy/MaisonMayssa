import { useState } from 'react'
import { motion } from 'framer-motion'
import { Quote, Star, Link2 } from 'lucide-react'
import { useReviews } from '../hooks/useReviews'
import { PublicReviewForm } from './PublicReviewForm'
import { hapticFeedback } from '../lib/haptics'

const FALLBACK_TESTIMONIALS = [
  { text: 'Trop bons les brownies ! On en reprend à chaque fois.', author: 'Léa' },
  { text: 'Service au top et livraison rapide. Les layer cups sont une tuerie.', author: 'Thomas' },
  { text: 'Enfin des vrais goûts, faits maison. Merci Maison Mayssa !', author: 'Sarah' },
]

export function Testimonials() {
  const { reviews, globalAverage } = useReviews()
  const displayItems = reviews.length > 0
    ? reviews.slice(0, 6).map((r) => ({
        text: r.comment || 'Super expérience !',
        author: r.authorName || 'Client',
        rating: r.rating,
      }))
    : FALLBACK_TESTIMONIALS.map((t) => ({ ...t, rating: null as number | null }))

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
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mt-12 sm:mt-16 md:mt-24 scroll-mt-24"
    >
      <div className="section-shell bg-white/80 border border-mayssa-brown/5">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-caramel">
            Ils en parlent
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-mayssa-brown mt-2">
            Avis
          </h2>
          {globalAverage != null && reviews.length > 0 && (
            <p className="mt-2 text-sm text-mayssa-brown/70 flex items-center justify-center gap-1">
              <Star size={16} className="fill-mayssa-caramel text-mayssa-caramel" />
              <span className="font-semibold">{globalAverage}</span>
              <span>— {reviews.length} avis</span>
            </p>
          )}
          <button
            type="button"
            onClick={copyAvisLink}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-mayssa-brown/10 px-4 py-2 text-xs font-medium text-mayssa-brown hover:bg-mayssa-brown/20 transition-colors"
          >
            <Link2 size={14} />
            {linkCopied ? 'Lien copié !' : 'Copier le lien vers les avis'}
          </button>
        </div>
        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {displayItems.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative rounded-2xl bg-mayssa-soft/60 p-5 sm:p-6 border border-mayssa-brown/5"
            >
              <Quote className="absolute top-3 right-3 w-8 h-8 text-mayssa-caramel/30" />
              {t.rating != null && (
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <Star
                      key={v}
                      size={14}
                      className={v <= (t.rating ?? 0) ? 'fill-mayssa-caramel text-mayssa-caramel' : 'text-mayssa-brown/20'}
                    />
                  ))}
                </div>
              )}
              <p className="text-sm sm:text-base text-mayssa-brown/80 italic leading-relaxed pr-8">
                « {t.text} »
              </p>
              <footer className="mt-4 text-xs sm:text-sm font-semibold text-mayssa-caramel">
                — {t.author}
              </footer>
            </motion.blockquote>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 max-w-md mx-auto">
          <PublicReviewForm />
        </div>
      </div>
    </motion.section>
  )
}
