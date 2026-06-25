import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { hapticFeedback } from '../lib/haptics'

const STORAGE_KEY = 'maison-mayssa-event-mode-seen'

type Props = {
  enabled: boolean
  message: string
  posterUrl?: string
}

function getFingerprint(message: string, posterUrl?: string): string {
  const raw = `${message.trim()}|${(posterUrl ?? '').trim()}`
  // fingerprint simple (stable) — pas besoin de crypto
  let hash = 0
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0
  return String(hash)
}

export function EventModeModal({ enabled, message, posterUrl }: Props) {
  const fingerprint = useMemo(() => getFingerprint(message, posterUrl), [message, posterUrl])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setVisible(false)
      return
    }
    try {
      const seen = sessionStorage.getItem(STORAGE_KEY)
      if (seen !== fingerprint) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [enabled, fingerprint])

  const close = () => {
    hapticFeedback('light')
    try {
      sessionStorage.setItem(STORAGE_KEY, fingerprint)
    } catch {}
    setVisible(false)
  }

  const hasMessage = message.trim().length > 0
  const hasPoster = (posterUrl ?? '').trim().length > 0

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
            aria-labelledby="event-mode-title"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="fixed inset-4 sm:inset-8 md:inset-12 lg:max-w-4xl lg:max-h-[90vh] lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:inset-auto z-[201] flex flex-col bg-white rounded-3xl shadow-2xl border border-mayssa-brown/10 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-mayssa-brown/10 bg-mayssa-brown text-white">
              <h2 id="event-mode-title" className="text-sm font-bold uppercase tracking-wider">
                📍 Précommandes fermées cette semaine
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
              {hasPoster && (
                <img
                  src={posterUrl}
                  alt="Affiche de l'événement Maison Mayssa"
                  className="w-full rounded-2xl border border-mayssa-brown/10 shadow-md object-cover max-h-[55vh]"
                  loading="lazy"
                  decoding="async"
                />
              )}

              {hasMessage && (
                <div className="rounded-2xl bg-mayssa-soft/60 border border-mayssa-brown/10 p-4">
                  <p className="text-sm text-mayssa-brown/80 whitespace-pre-line leading-relaxed">
                    {message}
                  </p>
                </div>
              )}

              {!hasPoster && !hasMessage && (
                <p className="text-sm text-mayssa-brown/70">
                  Maison Mayssa est en événement cette semaine.
                </p>
              )}
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

