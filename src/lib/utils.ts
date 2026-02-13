import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ouvert 18h30–2h (tous les jours). */
export function isOpen(): boolean {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  // Ouvert à partir de 18h30 ou avant 3h
  return (h > 18 || (h === 18 && m >= 30)) || h < 3
}

/** Heure à Paris (pour la limite de commande). */
function getParisHour(): number {
  const now = new Date()
  const rtf = new Intl.DateTimeFormat('fr', { timeZone: 'Europe/Paris', hour: 'numeric', hour12: false })
  return parseInt(rtf.format(now), 10)
}

/** Commandes pâtisseries/cookies possibles jusqu'à 23h (pas les trompe-l'œil). Après 23h → false. */
export function isBeforeOrderCutoff(): boolean {
  return getParisHour() < 23
}

/** Précommande pas encore disponible (date availableFrom dans le futur). */
export function isPreorderNotYetAvailable(product: { preorder?: { availableFrom: string } }): boolean {
  if (!product.preorder?.availableFrom) return false
  const from = new Date(product.preorder.availableFrom)
  from.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return from > today
}

/** True si on est avant la date de première récupération (YYYY-MM-DD) — pour afficher "précommande, récupération à partir du…". Utilise la date du jour en Europe/Paris. */
export function isBeforeFirstPickupDate(firstPickupDateYyyyMmDd: string): boolean {
  const rtf = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })
  const parts = rtf.formatToParts(new Date())
  const y = parts.find(p => p.type === 'year')?.value ?? ''
  const m = parts.find(p => p.type === 'month')?.value ?? ''
  const d = parts.find(p => p.type === 'day')?.value ?? ''
  const today = `${y}-${m}-${d}`
  return today < firstPickupDateYyyyMmDd
}
