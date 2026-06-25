import { motion } from 'framer-motion'
import { Button } from './ui/Button'

interface PremiumHeroProps {
  ordersOpen?: boolean
  nextRestockDate?: string
}

function formatRestockDate(raw?: string): string {
  if (!raw) return ''
  const match = raw.match(/^\d{4}-\d{2}-\d{2}$/)
  if (match) {
    const d = new Date(raw + 'T12:00:00')
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  return raw
}

export function PremiumHero({ ordersOpen = true, nextRestockDate }: PremiumHeroProps) {
  const restockLabel = formatRestockDate(nextRestockDate)

  return (
    <header className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/Trompe-loeil-header.webp"
          alt=""
          className="h-full w-full object-cover scale-105"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-mayssa-espresso/30 via-mayssa-espresso/50 to-mayssa-espresso/90" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-28 pb-20 text-center text-mayssa-ivory">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.45em] text-mayssa-gold-light">
            Maison Mayssa · Annecy
          </p>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.08] tracking-tight text-white">
            L&apos;art du trompe-l&apos;œil pâtissier
          </h1>

          <p className="mx-auto max-w-xl text-sm sm:text-base md:text-lg font-light leading-relaxed text-white/80">
            Précommandez vos créations Maison Mayssa et récupérez-les en toute simplicité.
          </p>

          <p className="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-white/50">
            Fabrication artisanale — Quantités limitées — Retrait sur créneau
          </p>

          {restockLabel && (
            <p className="text-xs text-mayssa-gold-light/90">
              Prochaine ouverture · {restockLabel}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="min-w-[200px]">
              <a href={ordersOpen ? '#commande' : '#la-carte'}>
                {ordersOpen ? 'Précommander' : 'Découvrir la carte'}
              </a>
            </Button>
            <Button asChild variant="glass" size="lg" className="min-w-[200px] border-white/30">
              <a href="#la-carte">Découvrir la carte</a>
            </Button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[9px] uppercase tracking-[0.35em] text-white/40">Défiler</span>
        <div className="h-10 w-px bg-gradient-to-b from-mayssa-gold/70 to-transparent" />
      </motion.div>
    </header>
  )
}
