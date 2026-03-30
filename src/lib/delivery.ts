import type { Coordinates, CustomerInfo } from '../types'
import { isSelectedDateTimeInPast } from './utils'

// ── Constantes livraison ──────────────────────────────────────────
export const ANNECY_GARE: NonNullable<Coordinates> = { lat: 45.9017, lng: 6.1217 }
export const DELIVERY_RADIUS_KM = 5
export const DELIVERY_FEE = 5
export const FREE_DELIVERY_THRESHOLD = 50

// ── Calcul de distance (Haversine) ────────────────────────────────
export function calculateDistance(coord1: Coordinates, coord2: NonNullable<Coordinates>): number | null {
  if (!coord1 || !coord2) return null

  const R = 6371 // Rayon de la Terre en km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ── Créneaux horaires ─────────────────────────────────────────────
export function generateTimeSlots(wantsDelivery: boolean): string[] {
  const slots: string[] = []
  if (!wantsDelivery) slots.push('18:30')
  for (let hour = wantsDelivery ? 20 : 19; hour < 24; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  for (let hour = 0; hour <= 2; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 2) slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  return slots
}

const HH_MM_RE = /^(\d{1,2}):(\d{2})$/

/** Normalise "9:5" → "09:05" */
export function normalizeTimeSlotHHmm(raw: string): string | null {
  const m = raw.trim().match(HH_MM_RE)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (h > 23 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function toMinutesFromMidnight(hhmm: string): number | null {
  const n = normalizeTimeSlotHHmm(hhmm)
  if (!n) return null
  const [h, mm] = n.split(':').map(Number)
  return (h ?? 0) * 60 + (mm ?? 0)
}

function minutesToHHmm(total: number): string {
  const m = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/**
 * Génère des créneaux HH:mm entre deux heures, avec un pas en minutes.
 * - Même jour : `overnight === false` et début &lt; fin (ex. 10:00 → 15:00, pas 30).
 * - Passer minuit : `overnight === true` (ex. 20:00 → 02:00 pour la livraison).
 */
export function generateTimeSlotsFromWindow(
  from: string,
  to: string,
  everyMinutes: number,
  overnight: boolean,
): string[] {
  const start = toMinutesFromMidnight(from)
  const end = toMinutesFromMidnight(to)
  if (start === null || end === null) return []
  const step = Math.max(5, Math.min(180, Math.round(everyMinutes)))
  const day = 24 * 60
  const seen = new Set<number>()

  if (!overnight) {
    if (start > end) return []
    for (let t = start; t <= end; t += step) seen.add(t)
  } else {
    if (start === end) {
      seen.add(start)
    } else {
      for (let t = start; t < day; t += step) seen.add(t)
      for (let t = 0; t <= end; t += step) seen.add(t)
    }
  }

  const mins = [...seen]
  if (overnight && start !== end) {
    const evening = mins.filter((m) => m >= start).sort((a, b) => a - b)
    const morning = mins.filter((m) => m < start).sort((a, b) => a - b)
    return [...evening, ...morning].map(minutesToHHmm)
  }
  return mins.sort((a, b) => a - b).map(minutesToHHmm)
}

// ── Date minimum (aujourd'hui à Paris) ────────────────────────────
export function getMinDate(): string {
  const rtf = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = rtf.formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '01'
  return `${get('year')}-${get('month')}-${get('day')}`
}

/**
 * Liste des dates sélectionnables entre minDate et maxDate.
 * Si pickupDates est fourni et non vide, et que preorderIsOpen=true, retourne ces dates directement (filtrées >= minDate).
 * Si pickupDates est fourni mais preorderIsOpen=false, retourne [] (précommandes pas encore ouvertes).
 * Si pickupDates est vide/undefined, utilise availableWeekdays pour générer les dates.
 * Si availableWeekdays est aussi vide/undefined, retourne [] (input date libre avec min/max).
 */
export function getSelectableDates(
  minDate: string,
  maxDate: string | undefined,
  availableWeekdays: number[] | undefined,
  pickupDates?: string[],
  preorderIsOpen?: boolean,
): string[] {
  if (pickupDates && pickupDates.length > 0) {
    if (!preorderIsOpen) return []
    return pickupDates
      .filter(date => {
        if (date < minDate) return false
        if (maxDate && date > maxDate) return false
        return true
      })
      .sort()
  }
  if (!availableWeekdays || availableWeekdays.length === 0) return []
  const set = new Set(availableWeekdays)
  const out: string[] = []
  const min = new Date(minDate + 'T12:00:00')
  const max = maxDate ? new Date(maxDate + 'T12:00:00') : (() => {
    const d = new Date(min)
    d.setDate(d.getDate() + 60)
    return d
  })()
  for (const d = new Date(min); d <= max; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const ymd = `${y}-${m}-${day}`
    if (set.has(d.getDay())) out.push(ymd)
  }
  return out
}

/** Formater une date YYYY-MM-DD pour affichage (ex. "Samedi 22 février"). */
export function formatDateLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// ── Validation client ─────────────────────────────────────────────
const PHONE_REGEX = /^(\+33|0)[1-9](\d{2}){4}$/

export function validateCustomer(
  customer: CustomerInfo,
  options?: { identityMode?: 'whatsapp' | 'instagram' | 'snap' },
): Partial<Record<keyof CustomerInfo, string>> {
  const errors: Partial<Record<keyof CustomerInfo, string>> = {}
  const identityMode = options?.identityMode ?? 'whatsapp'

  if (identityMode === 'whatsapp') {
    if (!customer.firstName.trim()) errors.firstName = 'Le prénom est requis'
    if (!customer.lastName.trim()) errors.lastName = 'Le nom est requis'
  } else if (identityMode === 'instagram') {
    if (!customer.firstName.trim()) {
      errors.firstName = "Le nom d'utilisateur Instagram est requis"
    }
  } else if (identityMode === 'snap') {
    if (!customer.firstName.trim()) {
      errors.firstName = "Le nom d'utilisateur Snapchat est requis"
    }
  }
  if (!customer.phone.trim()) {
    errors.phone = 'Le téléphone est requis'
  } else if (!PHONE_REGEX.test(customer.phone.replace(/\s/g, ''))) {
    errors.phone = 'Format de téléphone invalide'
  }
  if (customer.wantsDelivery && !customer.address.trim()) {
    errors.address = "L'adresse est requise pour la livraison"
  }
  if (!customer.date.trim()) errors.date = 'La date est requise'
  if (!customer.time.trim()) errors.time = "L'heure est requise"
  if (customer.date && customer.time && isSelectedDateTimeInPast(customer.date, customer.time)) {
    errors.time = "La date et l'heure choisies sont déjà passées"
  }

  return errors
}

// ── Calcul frais de livraison ─────────────────────────────────────
export function computeDeliveryFee(
  customer: CustomerInfo,
  total: number,
): number | null {
  if (!customer.wantsDelivery) return 0
  if (!customer.addressCoordinates) return null

  const distance = calculateDistance(customer.addressCoordinates, ANNECY_GARE)
  const isInZone = distance !== null && distance <= DELIVERY_RADIUS_KM
  if (!isInZone) return null

  return total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
}
