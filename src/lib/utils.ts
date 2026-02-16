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

/** Date et heure actuelles à Paris (pour la limite de commande). */
function getParisDateParts(): { hour: number; minute: number; year: string; month: string; day: string } {
  const rtf = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = rtf.formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  return {
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
    year: get('year'),
    month: get('month'),
    day: get('day'),
  }
}

/** Commandes pâtisseries/cookies possibles jusqu'à 23h (heure de Paris, jour J uniquement). Après 23h → false. */
export function isBeforeOrderCutoff(): boolean {
  const { hour } = getParisDateParts()
  return hour < 23
}

/** Coupure à 23h Paris. Retourne le nombre de minutes restantes jusqu'à 23h00 (0 si après coupure). */
export function getMinutesUntilOrderCutoff(): number {
  const { hour, minute } = getParisDateParts()
  const nowMinutes = hour * 60 + minute
  const cutoffMinutes = 23 * 60
  if (nowMinutes >= cutoffMinutes) return 0
  return cutoffMinutes - nowMinutes
}

/**
 * Compte à rebours pour la commande : heures restantes jusqu'à 23h et prochaine date de retrait.
 * Retourne null après 23h (pas de message à afficher).
 */
export function getOrderCountdown(firstPickupDateYyyyMmDd: string): { hoursLeft: number; minutesLeft: number; nextPickupLabel: string } | null {
  const minutesUntil = getMinutesUntilOrderCutoff()
  if (minutesUntil <= 0) return null
  const nextPickupLabel = getNextPickupDateLabel(firstPickupDateYyyyMmDd)
  const hoursLeft = Math.floor(minutesUntil / 60)
  const minutesLeft = minutesUntil % 60
  return { hoursLeft, minutesLeft, nextPickupLabel }
}

/** Vérifie si la date+heure choisie est dans le passé (basé sur l'heure actuelle Paris). */
export function isSelectedDateTimeInPast(dateYyyyMmDd: string, timeHhMm: string): boolean {
  if (!dateYyyyMmDd || !timeHhMm) return false
  const [h, m] = timeHhMm.split(':').map((x) => parseInt(x || '0', 10))
  const paris = getParisDateParts()
  const todayParis = `${paris.year}-${paris.month}-${paris.day}`
  if (dateYyyyMmDd < todayParis) return true
  if (dateYyyyMmDd > todayParis) return false
  const nowMinutes = paris.hour * 60 + paris.minute
  const selectedMinutes = h * 60 + m
  return selectedMinutes <= nowMinutes
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

/** Retourne la date du jour au format YYYY-MM-DD (Europe/Paris). */
export function getTodayYyyyMmDd(): string {
  const rtf = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })
  const parts = rtf.formatToParts(new Date())
  const y = parts.find(p => p.type === 'year')?.value ?? ''
  const m = parts.find(p => p.type === 'month')?.value ?? ''
  const d = parts.find(p => p.type === 'day')?.value ?? ''
  return `${y}-${m}-${d}`
}

/**
 * Prochaine date de retrait : prochain mercredi ou samedi (rythme trompe l'œil), en Europe/Paris.
 * Si cette date est avant firstPickupDateYyyyMmDd, on retourne firstPickupDateYyyyMmDd.
 * Format court : "mercredi 19 fév."
 */
export function getNextPickupDateLabel(firstPickupDateYyyyMmDd: string): string {
  const today = getTodayYyyyMmDd()
  const base = parseDateYyyyMmDd(today)
  const day = base.getDay() // 0 = dim, 3 = mer, 6 = sam

  let daysToAdd: number
  if (day === 6) daysToAdd = 4 // samedi → mercredi
  else if (day === 3) daysToAdd = 3 // mercredi → samedi
  else if (day < 3) daysToAdd = 3 - day // dim, lun, mar → prochain mercredi
  else daysToAdd = 6 - day // jeu (2→sam), ven (1→sam)

  const next = new Date(base)
  next.setDate(next.getDate() + daysToAdd)
  const rtf = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })
  const parts = rtf.formatToParts(next)
  const y = parts.find(p => p.type === 'year')?.value ?? ''
  const m = parts.find(p => p.type === 'month')?.value ?? ''
  const d = parts.find(p => p.type === 'day')?.value ?? ''
  const nextYyyyMmDd = `${y}-${m}-${d}`

  const dateToShow = nextYyyyMmDd < firstPickupDateYyyyMmDd ? firstPickupDateYyyyMmDd : nextYyyyMmDd
  const parsed = parseDateYyyyMmDd(dateToShow)
  return parsed.toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
}

// --- Anniversaire (pure functions, pas de dépendance Firebase) ---

/** Parse YYYY-MM-DD sans décalage UTC (T12:00 évite minuit UTC = jour -1 selon fuseau). */
export function parseDateYyyyMmDd(dateYyyyMmDd: string): Date {
  if (!dateYyyyMmDd) return new Date(NaN)
  return new Date(dateYyyyMmDd + 'T12:00:00')
}

/** Formate YYYY-MM-DD en français (ex: "mercredi 19 février"). Utilise Europe/Paris pour cohérence. */
export function formatDateYyyyMmDdToFrench(dateYyyyMmDd: string, options?: { weekday?: 'long' | 'short'; timeZone?: string }): string {
  if (!dateYyyyMmDd) return ''
  const d = parseDateYyyyMmDd(dateYyyyMmDd)
  return d.toLocaleDateString('fr-FR', {
    timeZone: options?.timeZone ?? 'Europe/Paris',
    weekday: options?.weekday ?? 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** Vérifier si on est dans la semaine d'anniversaire (3 jours avant à 4 jours après) */
export function isBirthdayWeek(birthday: string): boolean {
  const now = new Date()
  const parts = birthday.split('-').map(Number)
  const month = parts[1]
  const day = parts[2]
  if (!month || !day) return false
  const birthdayThisYear = new Date(now.getFullYear(), month - 1, day)
  const diffMs = now.getTime() - birthdayThisYear.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= -3 && diffDays <= 4
}

/** Vérifier si c'est exactement l'anniversaire aujourd'hui */
export function isBirthdayToday(birthday: string): boolean {
  const now = new Date()
  const parts = birthday.split('-').map(Number)
  return now.getMonth() + 1 === parts[1] && now.getDate() === parts[2]
}
