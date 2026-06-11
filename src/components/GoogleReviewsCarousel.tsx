import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { GOOGLE_REVIEWS_FILTERED } from '../data/googleReviews'
import { GOOGLE_REVIEWS_URL } from '../constants/checkout'

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= count ? 'text-mayssa-gold' : 'text-mayssa-brown/15'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function GoogleReviewsCarousel() {
  const reviews = GOOGLE_REVIEWS_FILTERED

  return (
    <section className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="w-6 h-6 text-mayssa-gold" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <h2 className="font-display text-3xl md:text-5xl text-mayssa-brown mb-4">L&apos;avis de nos clients</h2>
          <p className="text-mayssa-brown/50 font-light tracking-[0.2em] uppercase text-xs mb-6">Avis Google · 4 & 5 étoiles</p>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-mayssa-gold hover:text-mayssa-brown transition-colors"
          >
            Voir tous les avis Google
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="relative overflow-hidden -mx-6 px-6">
          <div className="absolute top-0 bottom-0 left-0 w-12 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-12 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex w-max"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: Math.max(40, reviews.length * 8), ease: 'linear', repeat: Infinity }}
          >
            {[1, 2].map((setIndex) => (
              <div key={setIndex} className="flex gap-6 px-3">
                {reviews.map((review, i) => (
                  <article
                    key={`${setIndex}-${i}`}
                    className="shrink-0 w-[85vw] md:w-[400px] bg-mayssa-soft p-8 md:p-10 rounded-2xl border border-mayssa-brown/5"
                  >
                    <StarRow count={review.rating} />
                    <p className="text-mayssa-brown/80 font-light leading-relaxed my-6 italic">&ldquo;{review.text}&rdquo;</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display text-lg text-mayssa-brown">{review.name}</p>
                      {review.date && (
                        <p className="text-[10px] text-mayssa-brown/40 uppercase tracking-wide">{review.date}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
