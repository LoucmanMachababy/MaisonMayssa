import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface EditorialImageBandProps {
  image: string
  imageAlt: string
  eyebrow?: string
  title: string
  description: string
  ctaLabel?: string
  ctaTo?: string
  imagePosition?: string
  reversed?: boolean
  dark?: boolean
}

export function EditorialImageBand({
  image,
  imageAlt,
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaTo,
  imagePosition = 'center',
  reversed = false,
  dark = false,
}: EditorialImageBandProps) {
  return (
    <section
      className={`grid lg:grid-cols-2 ${dark ? 'bg-mayssa-espresso text-white' : 'bg-mayssa-ivory'}`}
    >
      <motion.div
        initial={{ opacity: 0, x: reversed ? 24 : -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className={`relative min-h-[280px] sm:min-h-[360px] lg:min-h-[480px] overflow-hidden ${
          reversed ? 'lg:order-2' : ''
        }`}
      >
        <img
          src={image}
          alt={imageAlt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: imagePosition }}
          loading="lazy"
        />
        <div
          className={`absolute inset-0 pointer-events-none ${
            dark
              ? 'bg-gradient-to-r from-mayssa-brown/25 via-transparent to-transparent'
              : 'bg-gradient-to-r from-mayssa-ivory/10 via-transparent to-transparent'
          }`}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: reversed ? -24 : 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col justify-center px-8 md:px-14 lg:px-20 py-14 lg:py-20 ${
          reversed ? 'lg:order-1' : ''
        }`}
      >
        {eyebrow && (
          <span
            className={`text-xs tracking-[0.3em] uppercase mb-5 block ${
              dark ? 'text-mayssa-gold' : 'text-mayssa-gold'
            }`}
          >
            {eyebrow}
          </span>
        )}
        <h2
          className={`font-display text-3xl md:text-4xl leading-tight mb-5 ${
            dark ? 'text-white' : 'text-mayssa-brown'
          }`}
        >
          {title}
        </h2>
        <div className="w-12 h-px bg-mayssa-gold/50 mb-6" />
        <p
          className={`font-light leading-relaxed max-w-md ${
            dark ? 'text-white/70' : 'text-mayssa-brown/70'
          }`}
        >
          {description}
        </p>
        {ctaLabel && ctaTo && (
          <Link
            to={ctaTo}
            className={`inline-flex items-center gap-2 mt-8 text-xs tracking-widest uppercase transition-colors ${
              dark
                ? 'text-mayssa-gold hover:text-white'
                : 'text-mayssa-brown hover:text-mayssa-gold'
            }`}
          >
            {ctaLabel} <ArrowRight size={14} />
          </Link>
        )}
      </motion.div>
    </section>
  )
}
