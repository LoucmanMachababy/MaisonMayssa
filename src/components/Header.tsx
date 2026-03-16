import { motion } from 'framer-motion'

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

export function Header({ nextRestockDate, ordersOpen = true, eventModeEnabled = false }: HeaderProps) {
  const restockLabel = formatRestockDate(nextRestockDate)

  return (
    <header className="relative w-full overflow-hidden min-h-[80vh] sm:min-h-[85vh] flex flex-col justify-end cursor-default transition-all duration-700">
      {/* Image de fond (plus léger qu'une vidéo) */}
      <img
        src="/Trompe-loeil-header.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      {/* Overlay dégradé plus doux en haut, plus dense en bas */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-mayssa-brown/95 via-mayssa-brown/70 to-mayssa-brown/20" />

      {/* Contenu overlay — infos Maison Mayssa */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-16 sm:pb-20 lg:pb-24 pt-28 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="space-y-5 sm:space-y-6 text-white max-w-2xl min-w-0"
        >
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.38em] text-white/70 font-display">
            Trompe l&apos;œil pâtissier · Annecy
          </p>
          <h1
            className="text-4xl sm:text-[2.9rem] lg:text-[3.5rem] xl:text-[4rem] leading-tight font-display font-semibold tracking-[0.14em] uppercase drop-shadow-[0_18px_40px_rgba(0,0,0,0.6)]"
          >
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/15 border border-white/15 backdrop-blur-sm">
              MAISON MAYSSA
            </span>
          </h1>
          <p className="text-[0.95rem] sm:text-base text-white/85 font-display max-w-xl">
            Trompe l&apos;œil pâtissier en série limitée, préparé de nuit pour vos fins de soirée.
          </p>
          <div className="pt-3 sm:pt-5 space-y-2 sm:space-y-3">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.32em] text-white/75 font-display">
              Prochain restock
            </p>
            <p className="text-3xl sm:text-[2.3rem] lg:text-[2.6rem] xl:text-[3rem] font-display font-semibold tracking-[0.06em] uppercase text-white drop-shadow-[0_15px_45px_rgba(0,0,0,0.7)]">
              {restockLabel || 'Tous les jours'}
            </p>
          </div>
          <div className="pt-4 sm:pt-6 flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              href="#la-carte"
              className="inline-flex items-center justify-center rounded-full bg-white/95 text-mayssa-brown px-7 sm:px-9 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em] shadow-[0_18px_45px_rgba(0,0,0,0.45)] hover:bg-white active:scale-[0.97] transition-all cursor-pointer"
            >
              Découvrir la carte
            </a>
            <a
              href={ordersOpen ? '#commande' : '#'}
              aria-disabled={!ordersOpen}
              onClick={(e) => {
                if (!ordersOpen) e.preventDefault()
              }}
              className={`inline-flex items-center justify-center rounded-full border border-white/60 px-6 sm:px-7 py-2.5 sm:py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.26em] backdrop-blur-md transition-all ${
                ordersOpen
                  ? 'bg-white/10 text-white hover:bg-white/20 active:scale-[0.97] cursor-pointer'
                  : 'bg-white/5 text-white/70 opacity-70 cursor-not-allowed'
              }`}
              title={!ordersOpen && eventModeEnabled ? 'Précommandes fermées cette semaine' : undefined}
            >
              {ordersOpen ? 'Commander maintenant' : 'Précommandes fermées'}
            </a>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
