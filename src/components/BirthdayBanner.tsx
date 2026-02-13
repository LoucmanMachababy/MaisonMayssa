import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cake, MessageCircle, Instagram } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { isBirthdayWeek, isBirthdayToday } from '../lib/utils'
import { PHONE_E164 } from '../constants'

export function BirthdayBanner() {
  const { isAuthenticated, profile } = useAuth()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('birthday-banner-dismissed') === 'true'
    } catch {
      return false
    }
  })

  if (!isAuthenticated || !profile?.birthday || dismissed) return null
  if (!isBirthdayWeek(profile.birthday)) return null

  const isToday = isBirthdayToday(profile.birthday)
  const year = new Date().getFullYear().toString()
  const alreadyClaimed = profile.birthdayGiftClaimed?.[year]

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem('birthday-banner-dismissed', 'true')
    } catch {}
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Bonjour Maison Mayssa ! C'est mon anniversaire et j'aimerais profiter de mon cadeau d'anniversaire. Merci !`
    )
    window.open(`https://wa.me/${PHONE_E164}?text=${message}`, '_blank')
  }

  const handleInstagram = () => {
    window.open('https://ig.me/m/maison.mayssa74', '_blank')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-40 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 px-4 py-3 text-white">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>

          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 pr-8">
            <div className="flex items-center gap-2">
              <Cake size={22} />
              <div>
                <p className="font-bold text-sm">
                  {isToday
                    ? `Joyeux anniversaire ${profile.firstName} !`
                    : `Votre anniversaire approche, ${profile.firstName} !`}
                </p>
                <p className="text-xs opacity-90">
                  {alreadyClaimed
                    ? 'Votre cadeau a bien été réclamé cette année !'
                    : 'Un produit offert vous attend ! Contactez-nous pour en profiter.'}
                </p>
              </div>
            </div>

            {!alreadyClaimed && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </button>
                <button
                  onClick={handleInstagram}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                >
                  <Instagram size={14} />
                  Instagram
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
