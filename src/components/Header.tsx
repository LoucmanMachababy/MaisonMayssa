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
}

export function Header({ nextRestockDate }: HeaderProps) {
  const restockLabel = formatRestockDate(nextRestockDate)

  return (
    <header className="group relative w-full overflow-hidden min-h-[70vh] sm:min-h-[75vh] flex flex-col justify-end cursor-default transition-all duration-700">
      {/* Image de fond fixe */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: "url('/Trompe-loeil-header.webp')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-mayssa-brown/90 via-mayssa-brown/50 to-mayssa-brown/30" />

      {/* Contenu overlay — infos Maison Mayssa */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-12 sm:pb-16 lg:pb-20 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="space-y-4 text-white max-w-2xl min-w-0"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight uppercase font-display">
            Maison Mayssa
          </h1>
          <p className="text-base sm:text-lg text-white/90 font-display">
            Trompe l&apos;œil pâtissier — En livraison ou en click & collect
          </p>
          <p className="text-sm sm:text-base text-white/80 font-display pt-2">
            Annecy
          </p>
          <div className="pt-4 sm:pt-6">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold uppercase tracking-[0.2em] text-white/90 font-display mb-2">
              Prochain restock
            </p>
            <p className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight font-display text-white drop-shadow-lg">
              {restockLabel || 'Tous les jours'}
            </p>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
