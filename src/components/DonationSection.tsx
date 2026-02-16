import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { PAYPAL_ME_USER } from '../constants'
import { hapticFeedback } from '../lib/haptics'

const PAYPAL_DONATION_URL = `https://www.paypal.me/${PAYPAL_ME_USER}`

export function DonationSection() {
  return (
    <motion.section
      id="soutien"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      className="mt-12 sm:mt-16 section-shell bg-gradient-to-br from-mayssa-caramel/10 to-mayssa-brown/5 border border-mayssa-caramel/20 rounded-2xl"
    >
      <div className="rounded-2xl overflow-hidden border border-mayssa-brown/10 shadow-lg mb-6 sm:mb-8">
        <picture>
          <source srcSet="/boutique-fictif.webp" type="image/webp" />
          <img
            src="/boutique-fictif.png"
            alt="Maison Mayssa – Sucrée & Salée, future boutique à Annecy"
            className="w-full h-auto object-cover"
            width={800}
            height={534}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-mayssa-caramel/20 text-mayssa-caramel">
          <Heart size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-caramel/80 mb-1">
            Soutenez le projet
          </p>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-3">
            Une boutique trompe l&apos;œil à Annecy
          </h2>
          <p className="text-sm sm:text-base text-mayssa-brown/80 leading-relaxed">
            Ce projet a pour but d&apos;ouvrir ma boutique de pâtisserie trompe l&apos;œil à Annecy.
            Chaque don compte et m&apos;aide à concrétiser ce rêve. Merci de tout cœur pour votre soutien.
          </p>
        </div>
        <a
          href={PAYPAL_DONATION_URL}
          target="_blank"
          rel="noreferrer noopener"
          onClick={() => hapticFeedback('medium')}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0070ba] hover:bg-[#005ea6] text-white px-6 py-4 font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Heart size={20} className="text-white/90" />
          Faire un don (PayPal)
        </a>
      </div>
    </motion.section>
  )
}
