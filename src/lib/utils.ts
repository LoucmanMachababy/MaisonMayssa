import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PRODUCTS, isCustomizableTrompeBundleBoxId, isTrompeBoxWithStoredSelection } from '../constants'

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

/** Heure limite de commande (heure de Paris, jour J uniquement). */
const ORDER_CUTOFF_HOUR = 17

/** Commandes pâtisseries/cookies possibles jusqu'à 17h (heure de Paris, jour J uniquement). Après 17h → false. */
export function isBeforeOrderCutoff(): boolean {
  const { hour } = getParisDateParts()
  return hour < ORDER_CUTOFF_HOUR
}

/** Coupure à 17h Paris. Retourne le nombre de minutes restantes jusqu'à 17h00 (0 si après coupure). */
export function getMinutesUntilOrderCutoff(): number {
  const { hour, minute } = getParisDateParts()
  const nowMinutes = hour * 60 + minute
  const cutoffMinutes = ORDER_CUTOFF_HOUR * 60
  if (nowMinutes >= cutoffMinutes) return 0
  return cutoffMinutes - nowMinutes
}

/**
 * Compte à rebours pour la commande : heures restantes jusqu'à 17h.
 * Retourne null après 17h (pas de message à afficher).
 */
export function getOrderCountdown(firstPickupDateYyyyMmDd: string): { hoursLeft: number; minutesLeft: number; nextPickupLabel: string } | null {
  const minutesUntil = getMinutesUntilOrderCutoff()
  if (minutesUntil <= 0) return null
  const hoursLeft = Math.floor(minutesUntil / 60)
  const minutesLeft = minutesUntil % 60
  const today = getTodayYyyyMmDd()
  const nextPickupLabel = firstPickupDateYyyyMmDd > today
    ? parseDateYyyyMmDd(firstPickupDateYyyyMmDd).toLocaleDateString('fr-FR', {
        timeZone: 'Europe/Paris',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      })
    : 'prochainement'
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

/** Champs minimaux pour repérer la prochaine commande « en préparation ». */
type OrderPrepPick = {
  status?: string
  requestedDate?: string
  requestedTime?: string
  deliveryMode?: string
}

/**
 * Date de retrait/livraison (YYYY-MM-DD) de la commande en préparation la plus proche pour le mode donné.
 * Si aucune : date du jour (Paris).
 */
export function getNearestPreparationDateForDeliveryMode(
  orders: Record<string, OrderPrepPick>,
  mode: 'livraison' | 'retrait',
): string {
  const prep = Object.values(orders).filter(
    (o) =>
      o.status === 'en_preparation' &&
      o.requestedDate &&
      o.deliveryMode === mode,
  )
  if (prep.length === 0) return getTodayYyyyMmDd()
  prep.sort((a, b) => {
    const ta = `${a.requestedDate} ${a.requestedTime ?? '00:00'}`
    const tb = `${b.requestedDate} ${b.requestedTime ?? '00:00'}`
    return ta.localeCompare(tb)
  })
  return prep[0].requestedDate!
}

/**
 * Même logique sans filtre livraison/retrait (planning global).
 */
export function getNearestPreparationPickupDate(orders: Record<string, OrderPrepPick>): string {
  const prep = Object.values(orders).filter(
    (o) => o.status === 'en_preparation' && o.requestedDate,
  )
  if (prep.length === 0) return getTodayYyyyMmDd()
  prep.sort((a, b) => {
    const ta = `${a.requestedDate} ${a.requestedTime ?? '00:00'}`
    const tb = `${b.requestedDate} ${b.requestedTime ?? '00:00'}`
    return ta.localeCompare(tb)
  })
  return prep[0].requestedDate!
}

/** Écart en jours (calendrier) entre aujourd’hui (Paris) et une date YYYY-MM-DD ; peut être négatif. */
export function dayOffsetFromTodayToDate(targetYyyyMmDd: string): number {
  const today = getTodayYyyyMmDd()
  const t0 = parseDateYyyyMmDd(today).getTime()
  const t1 = parseDateYyyyMmDd(targetYyyyMmDd).getTime()
  return Math.round((t1 - t0) / 86400000)
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

/**
 * Retire la description catalogue après le premier séparateur (em dash, en dash, ou " - ").
 * Conserve le libellé complet si le suffixe est court (ex. « Les 7 saveurs », perso client).
 */
export function shortenOrderItemDisplayName(raw: string): string {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return raw ?? ''

  const m = trimmed.match(/^(.*?)\s*(?:[—–]| - )\s*(.+)$/)
  if (!m) return trimmed

  const head = m[1].trim()
  const tail = m[2].trim()
  if (!head) return trimmed

  if (tail.length <= 64) return trimmed

  return head
}

/** ID produit catalogue sans suffixe panier (`-timestamp`, 10 chiffres ou plus). */
export function normalizeOrderProductBaseId(productId?: string): string {
  return (productId ?? '').replace(/-\d{10,}$/, '')
}

export type OrderItemLikeForDisplay = {
  name: string
  productId?: string
  trompeDiscoverySelection?: string[]
  sizeLabel?: string
}

/**
 * Formate le nom d'un article de commande sous la forme "Catégorie - Nom" pour les brownies,
 * cookies et layer cups. Ex: "Brownie - Spéculoos Framboise", "Cookie - El Mordjene".
 * Sans les longues descriptions catalogue (admin, PDF, exports).
 * Box découverte : ajoute la liste des saveurs si `trompeDiscoverySelection` est présent.
 */
export function formatOrderItemName(item: OrderItemLikeForDisplay): string {
  const short = shortenOrderItemDisplayName(item.name)
  const id = item.productId ?? ''
  const baseId = normalizeOrderProductBaseId(id)
  let line: string
  if (id.startsWith('brownie-')) line = `Brownie - ${short}`
  else if (id.startsWith('cookie-')) line = `Cookie - ${short}`
  else if (id.startsWith('layer-')) line = `Layer Cup - ${short}`
  else line = short

  const trompeIds = item.trompeDiscoverySelection ?? []
  const looksLikeTrompePick =
    trompeIds.length > 0 && trompeIds.every((id) => typeof id === 'string' && id.startsWith('trompe-loeil-'))
  if (trompeIds.length && (isTrompeBoxWithStoredSelection(baseId) || looksLikeTrompePick)) {
    const labels = trompeIds.map(
      (tid) => PRODUCTS.find((p) => p.id === tid)?.name.replace(/^Trompe l'œil\s+/i, '').trim() ?? tid,
    )
    return `${line} — Saveurs : ${labels.join(', ')}`
  }
  return line
}

/** Libellés courts des trompe-l'œil (pour panier / récap). */
export function trompeSelectionDisplayLabels(ids: string[]): string[] {
  return ids.map(
    (tid) => PRODUCTS.find((p) => p.id === tid)?.name.replace(/^Trompe l'œil\s+/i, '').trim() ?? tid,
  )
}

/**
 * Pour agrégations production / stock admin : une ligne « box découverte » devient une entrée par trompe-l'œil choisi.
 */
export function expandOrderItemForProductionAggregate(item: OrderItemLikeForDisplay & { quantity: number }): Array<{
  aggregateKey: string
  label: string
  quantity: number
}> {
  const q = item.quantity
  const base = normalizeOrderProductBaseId(item.productId)
  if (item.trompeDiscoverySelection?.length && isTrompeBoxWithStoredSelection(base)) {
    return item.trompeDiscoverySelection.map((tid) => ({
      aggregateKey: tid,
      label: PRODUCTS.find((p) => p.id === tid)?.name ?? tid,
      quantity: q,
    }))
  }
  if (isCustomizableTrompeBundleBoxId(base)) {
    const bundle = PRODUCTS.find((p) => p.id === base)?.bundleProductIds
    if (bundle?.length) {
      return bundle.map((tid) => ({
        aggregateKey: tid,
        label: PRODUCTS.find((p) => p.id === tid)?.name ?? tid,
        quantity: q,
      }))
    }
  }
  return [
    {
      aggregateKey: item.productId ?? item.name,
      label: formatOrderItemName(item),
      quantity: q,
    },
  ]
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
