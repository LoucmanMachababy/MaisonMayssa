import type { CartItem, CustomerInfo } from '../types'
import {
  ANNECY_GARE,
  DELIVERY_RADIUS_KM,
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  calculateDistance,
} from './delivery'
import { formatDateYyyyMmDdToFrench, isBeforeFirstPickupDate } from './utils'
import { FIRST_PICKUP_DATE_CLASSIC, FIRST_PICKUP_DATE_CLASSIC_LABEL } from '../constants'
import { REWARD_LABELS } from './rewards'

export type BuildOrderMessageParams = {
  cart: CartItem[]
  customer: CustomerInfo
  total: number
  note: string
  selectedReward: { type: keyof typeof REWARD_LABELS; id: string } | null
  isAuthenticated: boolean
  /** Réduction code promo en € */
  discountAmount?: number
  /** Don au projet en € */
  donationAmount?: number
}

function getTrompeLOeilPickupLabel(): string {
  const now = new Date()
  const day = now.getDay()
  const daysUntil = day === 6 ? 4 : day === 3 ? 3 : 3
  const pickup = new Date(now)
  pickup.setDate(pickup.getDate() + daysUntil)
  return pickup.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const stripEmoji = (s: string) =>
  s.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim()

function getOrderLineLabel(item: CartItem): string {
  const p = item.product
  const name = stripEmoji(p.name)
  const cat = p.category
  if (cat === "Trompe l'oeil") return `🎨 ${name} (PRÉCOMMANDE – récupération ${getTrompeLOeilPickupLabel()})`
  if (cat === 'Tiramisus') {
    const base = p.description ?? ''
    return `Tiramisu – ${name}${base ? ` – ${base}` : ''}`
  }
  if (cat === 'Brownies') return `Brownie – ${name}`
  if (cat === 'Cookies') return `Cookie – ${name}`
  if (cat === 'Layer Cups') return `Layer cup – ${name}`
  if (cat === 'Boxes') return p.description ? `${name} – ${p.description}` : name
  if (cat === 'Mini Gourmandises') return p.description ? `${name} – ${p.description}` : name
  return p.description ? `${name} – ${p.description}` : name
}

export function buildOrderMessage(params: BuildOrderMessageParams): string {
  const { cart, customer, total, note, selectedReward, isAuthenticated, discountAmount = 0, donationAmount = 0 } = params
  if (cart.length === 0) return ''

  const totalAfterDiscount = Math.max(0, total - discountAmount)
  const distanceFromAnnecy = calculateDistance(customer.addressCoordinates, ANNECY_GARE)
  const isWithinDeliveryZone = distanceFromAnnecy !== null && distanceFromAnnecy <= DELIVERY_RADIUS_KM

  let deliveryFee = 0
  let deliveryStatus: 'free' | 'paid' | 'to_define' = 'free'

  if (customer.wantsDelivery) {
    if (!customer.addressCoordinates || !isWithinDeliveryZone) {
      deliveryStatus = 'to_define'
    } else if (totalAfterDiscount < FREE_DELIVERY_THRESHOLD) {
      deliveryFee = DELIVERY_FEE
      deliveryStatus = 'paid'
    }
  }

  const finalTotal = totalAfterDiscount + deliveryFee + donationAmount
  const modeTexte = customer.wantsDelivery ? 'Livraison' : 'Retrait sur place'

  const lines: string[] = []

  lines.push('Bonjour Maison Mayssa', '', "Je souhaiterais passer une commande, voici les détails :", '')
  lines.push('*INFORMATIONS CLIENT*', '')
  lines.push(`Nom : ${customer.lastName || '[à compléter]'}`)
  lines.push(`Prénom : ${customer.firstName || '[à compléter]'}`)
  lines.push(`Téléphone : ${customer.phone || '[à compléter]'}`)
  lines.push(`Mode : ${modeTexte}`)

  if (customer.wantsDelivery && customer.address.trim()) {
    lines.push(`Adresse : ${customer.address.trim()}`)
    if (distanceFromAnnecy !== null) {
      lines.push(`Distance : ${distanceFromAnnecy.toFixed(1)} km depuis la gare d'Annecy`)
    }
  }

  const hasTrompeLoeil = cart.some((i) => i.product.category === "Trompe l'oeil")
  if (hasTrompeLoeil) {
    lines.push(`Date de récupération : ${getTrompeLOeilPickupLabel()}`)
    if (customer.time) lines.push(`Heure souhaitée : ${customer.time}`)
  } else if (customer.date && customer.time) {
    lines.push(`Date souhaitée : ${formatDateYyyyMmDdToFrench(customer.date)}`)
    lines.push(`Heure souhaitée : ${customer.time}`)
  } else if (customer.date) {
    lines.push(`Date souhaitée : ${formatDateYyyyMmDdToFrench(customer.date)}`)
    if (customer.time) lines.push(`Heure souhaitée : ${customer.time}`)
  }

  lines.push('', '')
  lines.push('*COMMANDE*', '')
  cart.forEach((item, index) => {
    const label = getOrderLineLabel(item)
    const totalPrice = (item.product.price * item.quantity).toFixed(2).replace('.', ',')
    const qty = item.quantity > 1 ? `${item.quantity}× ` : ''
    lines.push(`${index + 1}. ${qty}${label} → ${totalPrice} €`)
    lines.push('')
  })

  if (selectedReward && isAuthenticated) {
    lines.push(`${cart.length + 1}. 🎁 ${REWARD_LABELS[selectedReward.type]} (récompense fidélité) → 0,00 €`)
    lines.push('')
  }

  lines.push('*RÉCAPITULATIF*', '')
  lines.push(`Sous-total : ${total.toFixed(2)} €`)
  if (discountAmount > 0) {
    lines.push(`Code promo : -${discountAmount.toFixed(2)} €`)
  }
  if (customer.wantsDelivery) {
    if (deliveryStatus === 'to_define') {
      lines.push('')
      lines.push(`⚠️ LIVRAISON HORS ZONE (> ${DELIVERY_RADIUS_KM} km)`)
      lines.push('Tarif à définir ensemble.')
      lines.push(`Total produits : ${totalAfterDiscount.toFixed(2)} €`)
    } else if (deliveryStatus === 'paid') {
      lines.push(`Livraison : +${DELIVERY_FEE} €`)
      if (donationAmount > 0) lines.push(`Don au projet : +${donationAmount.toFixed(2)} €`)
      lines.push(`*Total : ${finalTotal.toFixed(2)} €*`)
    } else {
      lines.push(`Livraison : offerte (≥ ${FREE_DELIVERY_THRESHOLD} €)`)
      if (donationAmount > 0) lines.push(`Don au projet : +${donationAmount.toFixed(2)} €`)
      lines.push(`*Total : ${finalTotal.toFixed(2)} €*`)
    }
  } else {
    if (donationAmount > 0) lines.push(`Don au projet : +${donationAmount.toFixed(2)} €`)
    lines.push(`*Total : ${finalTotal.toFixed(2)} €*`)
  }

  lines.push('', '')

  if (note.trim() && note.trim() !== 'Pour le … (date, créneau, adresse)') {
    lines.push('*INFOS COMPLÉMENTAIRES*', '')
    lines.push(note.trim(), '', '')
  }

  if (hasTrompeLoeil) {
    lines.push("⚠️ *PRÉCOMMANDE TROMPE L'ŒIL*")
    lines.push(`Récupération des trompe-l'œil : ${getTrompeLOeilPickupLabel()}.`)
    lines.push('', '')
  }

  const hasClassic = cart.some((i) => i.product.category !== "Trompe l'oeil")
  if (hasClassic && isBeforeFirstPickupDate(FIRST_PICKUP_DATE_CLASSIC)) {
    lines.push('📅 *PRÉCOMMANDE*')
    lines.push(`Récupération des pâtisseries, cookies, boxes… à partir du ${FIRST_PICKUP_DATE_CLASSIC_LABEL}.`)
    lines.push('', '')
  }

  lines.push('Merci beaucoup, à très vite !')
  lines.push('— Site de précommande Maison Mayssa (WhatsApp uniquement)')

  return lines.join('\n')
}
