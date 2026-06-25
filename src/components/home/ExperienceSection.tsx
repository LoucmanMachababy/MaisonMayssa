import { motion } from 'framer-motion'
import { Instagram } from 'lucide-react'
import { Button } from '../ui/Button'

const SOCIAL_PLACEHOLDERS = [
  '/Trompe-loeil-header.webp',
  '/mangue-ouverte.webp',
  '/pistache-fermer.webp',
  '/Fraise.webp',
  '/passion-ouverte.webp',
  '/citron-ouvert.jpeg',
]

export function ExperienceSection() {
  return (
    <section id="experience" className="w-full scroll-mt-28 section-shell overflow-hidden">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-mayssa-brown/45">
            L&apos;expérience
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-mayssa-brown leading-snug">
            Maison Mayssa
          </h2>
          <p className="text-sm sm:text-base text-mayssa-brown/75 leading-relaxed">
            Chaque création Maison Mayssa est imaginée pour surprendre le regard avant de révéler son goût.
            Derrière chaque trompe-l&apos;œil se cache une recette artisanale, équilibrée et pensée pour offrir
            un moment de découverte.
          </p>
          <p className="text-sm text-mayssa-brown/60 leading-relaxed">
            Des douceurs pensées pour surprendre l&apos;œil et séduire le palais.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-3 sm:gap-4"
        >
          <div className="col-span-2 aspect-[16/10] rounded-2xl overflow-hidden">
            <img src="/Trompe-loeil-header.webp" alt="Création trompe-l'œil Maison Mayssa" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden">
            <img src="/mangue-ouverte.webp" alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden">
            <img src="/pistache-fermer.webp" alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export function SocialGridSection() {
  return (
    <section id="reseaux" className="w-full scroll-mt-28">
      <div className="mb-10 text-center space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-mayssa-brown/45">
          Réseaux sociaux
        </p>
        <h2 className="font-display text-2xl sm:text-3xl text-mayssa-brown">
          Des créations faites pour être partagées
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-10">
        {SOCIAL_PLACEHOLDERS.map((src, i) => (
          <motion.div
            key={src}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-mayssa-cream"
          >
            <img src={src} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button asChild size="md">
          <a href="https://www.instagram.com/maison_mayssa74/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
            <Instagram size={16} />
            Suivre sur Instagram
          </a>
        </Button>
        <Button asChild variant="outline" size="md">
          <a href="https://www.tiktok.com/@maison_mayssa74" target="_blank" rel="noopener noreferrer">
            Découvrir sur TikTok
          </a>
        </Button>
      </div>
    </section>
  )
}
