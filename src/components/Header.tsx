import { motion } from 'framer-motion'
import { Button } from './ui/Button'

function formatRestockDate(raw?: string): string {
  if (!raw) return ''
  const match = raw.match(/^\d{4}-\d{2}-\d{2}$/)
  if (match) {
    const d = new Date(raw + 'T12:00:00')
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  return raw
}

interface HeaderProps {
  nextRestockDate?: string
  ordersOpen?: boolean
  eventModeEnabled?: boolean
}

export function Header({ nextRestockDate, ordersOpen = true }: HeaderProps) {
  const restockLabel = formatRestockDate(nextRestockDate)

  return (
    <header className="relative w-full h-[100dvh] flex flex-col items-center justify-center cursor-default overflow-hidden">
      {/* Background Image */}
      <img
        src="/Trompe-loeil-header.webp"
        alt="Maison Mayssa Trompe l'œil"
        className="absolute inset-0 w-full h-full object-cover scale-105"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      {/* Luxury Gradient Overlay - Darker for contrast */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-mayssa-brown/40 via-mayssa-brown/60 to-mayssa-brown/95" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center flex flex-col items-center mt-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="space-y-8 text-mayssa-soft flex flex-col items-center"
        >
          <div className="space-y-2">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.4em] text-mayssa-gold">
              Maison de Haute Pâtisserie
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.1] font-display font-medium tracking-tight text-white drop-shadow-2xl">
              L'Art du Trompe-l'œil
            </h1>
          </div>

          <p className="text-sm sm:text-base md:text-lg text-mayssa-soft/80 font-light max-w-2xl mx-auto leading-relaxed">
            Une collection signature de pâtisseries artisanales, façonnées avec passion à Annecy.
            L'illusion visuelle au service de l'émotion gustative.
          </p>

          <div className="pt-8 flex flex-col items-center gap-6">
            {restockLabel && (
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-[0.3em] text-mayssa-soft/50 font-bold">
                  Prochaine Collection
                </span>
                <span className="text-xl sm:text-2xl font-display text-mayssa-gold">
                  {restockLabel}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-4">
              <Button asChild size="lg">
                <a href="#la-carte">Découvrir la collection</a>
              </Button>
              
              <Button 
                asChild
                variant="glass" 
                size="lg"
                className={!ordersOpen ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
              >
                <a href={ordersOpen ? '#commande' : '#'}>
                  {ordersOpen ? 'Commander' : 'Précommandes fermées'}
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-[9px] uppercase tracking-[0.3em] text-mayssa-soft/50">Défiler</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-mayssa-gold/80 to-transparent" />
      </motion.div>
    </header>
  )
}
