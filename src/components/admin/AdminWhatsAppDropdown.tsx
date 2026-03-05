import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, CheckCheck, Star, Mail, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Order } from '../../lib/firebase'

const GOOGLE_REVIEW_LINK = 'https://share.google/PsKmSr5Vx1VXqaNWx'

function phoneToWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('33') && digits.length >= 11) return digits
  if (digits.startsWith('0') && digits.length >= 10) return '33' + digits.slice(1)
  if (digits.length >= 9) return '33' + digits
  return digits
}

function buildValidatedMessage(order: Order): string {
  const prenom = order.customer?.firstName ?? 'vous'
  return `Bonjour ${prenom},\n\nVotre commande chez Maison Mayssa est bien validée ! 🎂✅\n\nNous vous contacterons dès qu'elle sera prête 😊`
}

function buildReadyMessage(order: Order): string {
  const prenom = order.customer?.firstName ?? 'vous'
  const isDelivery = order.deliveryMode === 'livraison'
  if (isDelivery) {
    return `Bonjour ${prenom},\n\nVotre commande Maison Mayssa est prête et en cours de livraison ! 🛵\n\nMerci de vous assurer d'être disponible pour la réception 😊`
  }
  return `Bonjour ${prenom},\n\nVous avez commandé des trompe-l'œil pour aujourd'hui chez Maison Mayssa. Votre commande sera prête à être récupérée à partir de 18h.\n\nMerci de me préciser l'heure qui vous conviendrait pour le retrait 😊`
}

function buildReviewMessage(order: Order): string {
  const prenom = order.customer?.firstName ?? 'vous'
  return `Bonjour ${prenom},\n\nMerci pour votre commande chez Maison Mayssa ! J'espère que vous vous êtes régalé(e) 😍🎂\n\nSi vous avez un moment, un petit avis Google nous aiderait énormément :\n👉 ${GOOGLE_REVIEW_LINK}\n\nMerci pour votre confiance 🙏`
}

interface AdminWhatsAppDropdownProps {
  order: Order
  onClose?: () => void
  className?: string
  /** Variante compacte (icône seule) ou complète (bouton avec label) */
  variant?: 'compact' | 'full'
  /** Contexte dark mode pour les styles */
  darkMode?: boolean
}

const TEMPLATES = [
  { id: 'valide', label: 'Confirmé', icon: CheckCheck, buildMsg: buildValidatedMessage },
  { id: 'pret', label: 'Prêt', icon: MessageCircle, buildMsg: buildReadyMessage },
  { id: 'avis', label: 'Avis Google', icon: Star, buildMsg: buildReviewMessage },
  { id: 'perso', label: 'Message perso', icon: Mail, buildMsg: null },
] as const

export function AdminWhatsAppDropdown({ order, onClose, className, variant = 'full', darkMode }: AdminWhatsAppDropdownProps) {
  const [open, setOpen] = useState(false)
  const [customMsg, setCustomMsg] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowCustom(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const phone = order.customer?.phone
  if (!phone) return null

  const waNum = phoneToWhatsApp(phone)

  const handleTemplate = (t: (typeof TEMPLATES)[number]) => {
    if (t.id === 'perso') {
      setShowCustom(true)
      return
    }
    const msg = t.buildMsg ? t.buildMsg(order) : ''
    if (msg) {
      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
      setOpen(false)
      onClose?.()
    }
  }

  const handleCustomSend = () => {
    if (customMsg.trim()) {
      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(customMsg.trim())}`, '_blank', 'noopener,noreferrer')
      setOpen(false)
      setShowCustom(false)
      setCustomMsg('')
      onClose?.()
    }
  }

  const isDark = darkMode

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg font-bold transition-colors',
          variant === 'compact'
            ? 'p-2'
            : 'px-3 py-2 text-xs',
          'bg-green-500 text-white hover:bg-green-600'
        )}
        title="Envoyer un message WhatsApp"
      >
        <MessageCircle size={variant === 'compact' ? 14 : 12} />
        {variant === 'full' && <span>WhatsApp</span>}
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute right-0 top-full z-50 mt-1.5 min-w-[200px] rounded-xl shadow-xl border overflow-hidden',
              isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-mayssa-brown/10'
            )}
          >
            {showCustom ? (
              <div className="p-3 space-y-2">
                <textarea
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Votre message..."
                  rows={3}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-green-500',
                    isDark ? 'bg-zinc-700 text-white placeholder:text-zinc-400' : 'bg-mayssa-soft text-mayssa-brown placeholder:text-mayssa-brown/40'
                  )}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowCustom(false); setCustomMsg('') }}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-xs font-bold',
                      isDark ? 'bg-zinc-600 text-zinc-200 hover:bg-zinc-500' : 'bg-mayssa-brown/10 text-mayssa-brown hover:bg-mayssa-brown/20'
                    )}
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleCustomSend}
                    disabled={!customMsg.trim()}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-1">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTemplate(t)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-medium transition-colors',
                      isDark ? 'text-zinc-200 hover:bg-zinc-700' : 'text-mayssa-brown hover:bg-mayssa-soft'
                    )}
                  >
                    <t.icon size={14} className="text-green-500 flex-shrink-0" />
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

