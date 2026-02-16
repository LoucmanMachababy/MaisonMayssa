import { useState } from 'react'
import { Bell } from 'lucide-react'
import { addNotifyWhenAvailable } from '../lib/firebase'
import { hapticFeedback } from '../lib/haptics'
import type { Product } from '../types'

interface NotifyWhenAvailableProps {
  product: Product
  onSuccess?: () => void
  onError?: (message: string) => void
  className?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function NotifyWhenAvailable({ product, onSuccess, onError, className = '' }: NotifyWhenAvailableProps) {
  const [email, setEmail] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const trimmed = email.trim()
    if (!trimmed) {
      onError?.('Indique ton email')
      return
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      onError?.('Email invalide')
      return
    }
    setLoading(true)
    try {
      await addNotifyWhenAvailable(product.id, product.name, trimmed)
      hapticFeedback('success')
      setSubmitted(true)
      setEmail('')
      setExpanded(false)
      onSuccess?.()
    } catch (err) {
      hapticFeedback('warning')
      onError?.('Erreur, réessaie plus tard')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <p className="text-[10px] sm:text-xs text-emerald-600 font-medium flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <span className="inline-block w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">✓</span>
        C&apos;est noté ! On te prévient dès que c&apos;est dispo.
      </p>
    )
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          hapticFeedback('light')
          setExpanded(true)
        }}
        className={`text-[10px] sm:text-xs text-mayssa-caramel hover:text-mayssa-brown font-medium flex items-center gap-1 cursor-pointer ${className}`}
        aria-label="Être notifié quand ce produit est disponible"
      >
        <Bell size={12} aria-hidden="true" />
        Préviens-moi quand dispo
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      onClick={e => e.stopPropagation()}
      className={`flex flex-col gap-1.5 ${className}`}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ton@email.fr"
        disabled={loading}
        className="w-full rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs border border-mayssa-brown/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel/50"
        aria-label="Email pour être notifié"
        autoFocus
      />
      <div className="flex gap-1.5">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-1.5 rounded-lg bg-mayssa-caramel text-white text-[10px] sm:text-xs font-bold disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Envoi…' : 'OK'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(false)
            setEmail('')
          }}
          className="py-1.5 px-2 rounded-lg text-[10px] sm:text-xs text-mayssa-brown/70 hover:bg-mayssa-brown/10 cursor-pointer"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
