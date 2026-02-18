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
 * Liste des dates sélectionnables entre minDate et maxDate, limitées aux jours de la semaine définis par l'admin.
 * Si availableWeekdays est vide/undefined, retourne [] (le client utilisera alors un input date libre avec min/max).
 */
export function getSelectableDates(
  minDate: string,
  maxDate: string | undefined,
  availableWeekdays: number[] | undefined,
): string[] {
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

export function validateCustomer(customer: CustomerInfo): Partial<Record<keyof CustomerInfo, string>> {
  const errors: Partial<Record<keyof CustomerInfo, string>> = {}

  if (!customer.firstName.trim()) errors.firstName = 'Le prénom est requis'
  if (!customer.lastName.trim()) errors.lastName = 'Le nom est requis'
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
