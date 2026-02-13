import { useState, useEffect } from 'react'
import { Timer, CheckCircle } from 'lucide-react'

interface ReservationTimerProps {
  expiresAt?: number
  confirmed?: boolean
}

/**
 * Affiche un countdown "⏱ 9:42 · Réservé" pour les articles trompe l'oeil
 * dans le panier, ou "✓ Précommande confirmée" si déjà envoyée.
 */
export function ReservationTimer({ expiresAt, confirmed }: ReservationTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    expiresAt ? Math.max(0, expiresAt - Date.now()) : 0,
  )

  useEffect(() => {
    if (!expiresAt || confirmed) return
    const interval = setInterval(() => {
      setRemaining(Math.max(0, expiresAt - Date.now()))
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, confirmed])

  // Pas de réservation
  if (!expiresAt) return null

  // Confirmée
  if (confirmed) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
        <CheckCircle size={10} />
        Précommande confirmée
      </span>
    )
  }

  // Expirée (sera supprimée par le timer dans App.tsx)
  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500">
        <Timer size={10} />
        Expiré
      </span>
    )
  }

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  const isLow = remaining < 2 * 60 * 1000

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold ${
        isLow ? 'text-red-500 animate-pulse' : 'text-orange-500'
      }`}
    >
      <Timer size={10} />
      {minutes}:{seconds.toString().padStart(2, '0')} · En attente de précommande
    </span>
  )
}
