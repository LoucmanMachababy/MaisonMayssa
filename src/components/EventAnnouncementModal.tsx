import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Calendar } from 'lucide-react'
import { hapticFeedback } from '../lib/haptics'

const STORAGE_KEY = 'maison-mayssa-event-announcement-seen'

const STAND_1 = {
  date: 'Mercredi 18 mars 2026',
  place: 'Salle Boxing Spirit',
  address: '97 impasse des Marais, Argonay',
}
const STAND_2 = {
  date: 'Jeudi 19 mars 2026',
  place: 'Boutique Syana',
  address: '11 allée des Salomons, 74000 Annecy',
}

export function EventAnnouncementModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(STORAGE_KEY)
      if (!seen) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const close = () => {
    hapticFeedback('light')
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {}
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={close}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-announcement-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-8 md:inset-12 lg:max-w-4xl lg:max-h-[90vh] lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:inset-auto z-[201] flex flex-col bg-white rounded-3xl shadow-2xl border border-mayssa-brown/10 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-mayssa-brown/10 bg-mayssa-brown text-white">
              <h2 id="event-announcement-title" className="text-sm font-bold uppercase tracking-wider">
                🎉 Maison Mayssa vous attend en boutique
              </h2>
              <button
                type="button"
                onClick={close}
                className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <img
                src="/affiche.PNG"
                alt="Affiche Les Créatives - Maison Mayssa stand trompe-l'œil"
                className="w-full rounded-2xl border border-mayssa-brown/10 shadow-md object-cover max-h-[50vh]"
              />

              <p className="text-sm font-semibold text-mayssa-brown">
                Deux stands où nous retrouver :
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-mayssa-soft/60 border border-mayssa-gold/20 p-4">
                  <div className="flex items-center gap-2 text-mayssa-gold font-bold text-sm mb-2">
                    <Calendar size={16} />
                    {STAND_1.date}
                  </div>
                  <p className="font-semibold text-mayssa-brown">{STAND_1.place}</p>
                  <p className="flex items-start gap-2 text-sm text-mayssa-brown/80 mt-1">
                    <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                    {STAND_1.address}
                  </p>
                </div>
                <div className="rounded-2xl bg-mayssa-soft/60 border border-mayssa-gold/20 p-4">
                  <div className="flex items-center gap-2 text-mayssa-gold font-bold text-sm mb-2">
                    <Calendar size={16} />
                    {STAND_2.date}
                  </div>
                  <p className="font-semibold text-mayssa-brown">{STAND_2.place}</p>
                  <p className="flex items-start gap-2 text-sm text-mayssa-brown/80 mt-1">
                    <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                    {STAND_2.address}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-4 text-sm text-amber-900">
                <p className="font-semibold mb-1">Commande sur place</p>
                <p>
                  Vous pourrez passer commande directement sur place à ces deux événements.
                  Les trompes l'œil sont en rupture pour préparer ces stands, mais vous pouvez
                  commander tous nos autres produits : cookies, brownies, boxes, layer cups, tiramisus, etc.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-mayssa-brown/10">
              <button
                type="button"
                onClick={close}
                className="w-full py-3 rounded-xl bg-mayssa-brown text-white font-bold hover:bg-mayssa-brown/90 transition-colors cursor-pointer"
              >
                J'ai compris
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
