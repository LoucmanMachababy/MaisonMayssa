import { useMemo, useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { getOrderCountdown } from '../lib/utils'

interface OrderCountdownProps {
  firstPickupDateYyyyMmDd: string
  className?: string
}

/**
 * Affiche « Plus que X h pour commander pour [mercredi/samedi] » selon l’heure de coupure (23h Paris).
 * Ne s’affiche pas après 23h. Se met à jour chaque minute.
 */
export function OrderCountdown({ firstPickupDateYyyyMmDd, className = '' }: OrderCountdownProps) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])
  const countdown = useMemo(
    () => getOrderCountdown(firstPickupDateYyyyMmDd),
    [firstPickupDateYyyyMmDd, tick]
  )

  if (!countdown) return null

  const { hoursLeft, minutesLeft, nextPickupLabel } = countdown
  const timeText =
    hoursLeft > 0
      ? minutesLeft > 0
        ? `${hoursLeft} h ${minutesLeft} min`
        : `${hoursLeft} h`
      : `${minutesLeft} min`

  return (
    <span
      className={className}
      role="status"
      aria-live="polite"
      aria-label={`Plus que ${timeText} pour commander pour ${nextPickupLabel}`}
    >
      <Clock className="inline-block w-3.5 h-3.5 sm:w-4 sm:h-4 text-mayssa-caramel mr-1.5 align-middle" />
      Plus que <strong>{timeText}</strong> pour commander pour {nextPickupLabel}
    </span>
  )
}
