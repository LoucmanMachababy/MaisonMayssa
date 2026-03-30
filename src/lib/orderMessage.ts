import type { CartItem, CustomerInfo } from '../types'
import {
  ANNECY_GARE,
  DELIVERY_RADIUS_KM,
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  calculateDistance,
  normalizeInstagramHandle,
} from './delivery'
import { formatDateYyyyMmDdToFrench, isBeforeFirstPickupDate } from './utils'
import {
  FIRST_PICKUP_DATE_CLASSIC,
  FIRST_PICKUP_DATE_CLASSIC_LABEL,
  BOX_DECOUVERTE_TROMPE_PRODUCT_ID,
  PRODUCTS,
  isTrompeBoxWithStoredSelection,
} from '../constants'
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
  /** Réduction parrain en € */
  referralDiscountAmount?: number
  /** Don au projet en € */
  donationAmount?: number
  /** Allergies / préférences alimentaires (profil) */
  dietaryPreferences?: string
  /** Libellés identité : WhatsApp = nom/prénom, Insta/Snap = pseudo */
  contactIdentity?: 'whatsapp' | 'instagram' | 'snap'
  /** Après enregistrement Firebase — affiché dans le message client */
  orderNumber?: number
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

function baseProductIdFromCart(cartProductId: string): string {
  return cartProductId.replace(/-\d{10,}$/, '')
}

function trompeFlavorShortName(productId: string): string {
  const n = PRODUCTS.find((p) => p.id === productId)?.name ?? productId
  return stripEmoji(n.replace(/^Trompe l'œil\s+/i, '').trim())
}

function getOrderLineLabel(item: CartItem, pickupDateLabel?: string): string {
  const p = item.product
  const name = stripEmoji(p.name)
  const cat = p.category
  const trompeLabel = pickupDateLabel ?? getTrompeLOeilPickupLabel()
  if (baseProductIdFromCart(p.id) === BOX_DECOUVERTE_TROMPE_PRODUCT_ID) {
    return `🎨 ${name} (PRÉCOMMANDE – récupération ${trompeLabel})`
  }
  if (cat === "Trompe l'œil") return `🎨 ${name} (PRÉCOMMANDE – récupération ${trompeLabel})`
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
  const {
    cart,
    customer,
    total,
    note,
    selectedReward,
    isAuthenticated,
    discountAmount = 0,
    referralDiscountAmount = 0,
    donationAmount = 0,
    dietaryPreferences,
    contactIdentity = 'whatsapp',
    orderNumber,
  } = params
  if (cart.length === 0) return ''

  const totalAfterDiscount = Math.max(0, total - discountAmount - referralDiscountAmount)
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
  if (orderNumber != null) {
    lines.push(`Référence commande (site) : *n°${orderNumber}*`, '')
  }
  lines.push('*INFORMATIONS CLIENT*', '')
  if (contactIdentity === 'instagram') {
    const ig = normalizeInstagramHandle(customer.firstName || '')
    lines.push(`Instagram : @${ig || '[à compléter]'}`)
  } else if (contactIdentity === 'snap') {
    lines.push(`Nom d'utilisateur Snapchat : ${customer.firstName || '[à compléter]'}`)
  } else {
    lines.push(`Nom : ${customer.lastName || '[à compléter]'}`)
    lines.push(`Prénom : ${customer.firstName || '[à compléter]'}`)
  }
  lines.push(`Téléphone : ${customer.phone || '[à compléter]'}`)
  lines.push(`Mode : ${modeTexte}`)

  if (customer.wantsDelivery && customer.address.trim()) {
    lines.push(`Adresse : ${customer.address.trim()}`)
    if (distanceFromAnnecy !== null) {
      lines.push(`Distance : ${distanceFromAnnecy.toFixed(1)} km depuis la gare d'Annecy`)
    }
    if (customer.deliveryInstructions?.trim()) {
      lines.push(`Instructions livreur : ${customer.deliveryInstructions.trim()}`)
    }
  }

  const hasTrompeLoeil = cart.some((i) => i.product.category === "Trompe l'œil")
  const pickupDateLabel = customer.date ? formatDateYyyyMmDdToFrench(customer.date) : getTrompeLOeilPickupLabel()
  if (hasTrompeLoeil) {
    lines.push(`Date de récupération : ${pickupDateLabel}`)
    if (customer.time) lines.push(`Heure souhaitée : ${customer.time}`)
  } else if (customer.date && customer.time) {
    lines.push(`Date souhaitée : ${formatDateYyyyMmDdToFrench(customer.date)}`)
    lines.push(`Heure souhaitée : ${customer.time}`)
  } else if (customer.date) {
    lines.push(`Date souhaitée : ${formatDateYyyyMmDdToFrench(customer.date)}`)
    if (customer.time) lines.push(`Heure souhaitée : ${customer.time}`)
  }

  if (dietaryPreferences?.trim()) {
    lines.push(`Allergies / préférences : ${dietaryPreferences.trim()}`)
    lines.push('')
  }
  lines.push('', '')
  lines.push('*COMMANDE*', '')
  cart.forEach((item, index) => {
    const label = getOrderLineLabel(item, pickupDateLabel)
    const totalPrice = (item.product.price * item.quantity).toFixed(2).replace('.', ',')
    const qty = item.quantity > 1 ? `${item.quantity}× ` : ''
    lines.push(`${index + 1}. ${qty}${label} → ${totalPrice} €`)
    const sel = item.trompeDiscoverySelection
    if (isTrompeBoxWithStoredSelection(baseProductIdFromCart(item.product.id)) && sel?.length) {
      sel.forEach((tid, i) => {
        lines.push(`   ${i + 1}. ${trompeFlavorShortName(tid)}`)
      })
    }
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
  if (referralDiscountAmount > 0) {
    lines.push(`Parrain : -${referralDiscountAmount.toFixed(2)} €`)
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
    lines.push(`Récupération des trompe-l'œil : ${pickupDateLabel}.`)
    lines.push('', '')
  }

  const hasClassic = cart.some((i) => i.product.category !== "Trompe l'œil")
  if (hasClassic && isBeforeFirstPickupDate(FIRST_PICKUP_DATE_CLASSIC)) {
    lines.push('📅 *PRÉCOMMANDE*')
    lines.push(`Récupération des pâtisseries, cookies, boxes… à partir du ${FIRST_PICKUP_DATE_CLASSIC_LABEL}.`)
    lines.push('', '')
  }

  // Mini récap rapide en une ligne (mode, date, heure) pour lecture instantanée
  const recapDate = customer.date
    ? formatDateYyyyMmDdToFrench(customer.date, { weekday: 'short' })
    : 'date à définir'
  const recapTime = customer.time || 'heure à définir'
  lines.push('')
  lines.push(`Récap rapide : ${modeTexte} — ${recapDate} à ${recapTime}`)

  lines.push('Merci beaucoup, à très vite !')
  lines.push('— Site de précommande Maison Mayssa (WhatsApp uniquement)')

  return lines.join('\n')
}

export type ShortSocialPasteParams = BuildOrderMessageParams & {
  orderNumber: number
}

/** Message court à coller sur Snap / Instagram (détail complet déjà enregistré côté boutique). */
export function buildShortSocialPasteMessage(
  params: ShortSocialPasteParams,
  maxLength = 560,
): string {
  const {
    cart,
    customer,
    total,
    orderNumber,
    discountAmount = 0,
    referralDiscountAmount = 0,
    donationAmount = 0,
    contactIdentity = 'whatsapp',
  } = params
  if (cart.length === 0) return ''

  const totalAfterDiscount = Math.max(0, total - discountAmount - referralDiscountAmount)
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
  const modeTexte = customer.wantsDelivery ? 'Livraison' : 'Retrait'
  const datePart = customer.date ? formatDateYyyyMmDdToFrench(customer.date) : 'date à confirmer'
  const timePart = customer.time || 'heure à confirmer'
  const livraisonNote =
    customer.wantsDelivery && deliveryStatus === 'to_define'
      ? ' (livraison hors zone, tarif à confirmer)'
      : ''

  const itemBits = cart.flatMap((i) => {
    const baseId = i.product.id.replace(/-\d{10,}$/, '')
    if (isTrompeBoxWithStoredSelection(baseId) && i.trompeDiscoverySelection?.length) {
      const flavors = i.trompeDiscoverySelection.map((tid) => trompeFlavorShortName(tid)).join(', ')
      return [`${i.quantity}× ${stripEmoji(i.product.name)} (${flavors})`]
    }
    return [`${i.quantity}× ${stripEmoji(i.product.name)}`]
  })

  if (contactIdentity === 'instagram') {
    const handle = normalizeInstagramHandle(customer.firstName)
    const promo =
      discountAmount > 0 ? ` (code promo -${discountAmount.toFixed(2).replace('.', ',')} €)` : ''
    const buildIg = (itemsLines: string) =>
      `Bonjour Mayssa,\n\n` +
      `Je suis la commande n°${orderNumber}. Mon compte Instagram : @${handle}.\n\n` +
      `J'ai pris :\n${itemsLines}\n\n` +
      `Total : ${finalTotal.toFixed(2).replace('.', ',')} €${promo}\n` +
      `Tél. : ${customer.phone || '—'}\n` +
      `${modeTexte}${livraisonNote} — ${datePart} à ${timePart}\n\n` +
      `Merci !`
    for (let show = itemBits.length; show >= 0; show -= 1) {
      let lines: string
      if (show <= 0) {
        lines = `${itemBits.length} article(s) (détail enregistré côté boutique)`
      } else {
        const shown = itemBits.slice(0, show)
        const hidden = itemBits.length - show
        lines =
          shown.map((l) => `• ${l}`).join('\n') +
          (hidden > 0 ? `\n• … (+${hidden} autre(s))` : '')
      }
      const text = buildIg(lines)
      if (text.length <= maxLength) return text
    }
    const oneLine =
      `Bonjour Mayssa — cmd n°${orderNumber} (@${handle}) · ${itemBits[0] ?? 'commande'}` +
      (itemBits.length > 1 ? ` (+${itemBits.length - 1})` : '') +
      ` · ${finalTotal.toFixed(2).replace('.', ',')} € · ${customer.phone || ''} · ${datePart} ${timePart}`
    return oneLine.slice(0, maxLength)
  }

  const pseudo =
    contactIdentity === 'snap'
      ? `Snap : ${customer.firstName || ''}`
      : `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
  const header =
    `Commande n°${orderNumber} — Maison Mayssa\n` +
    `${pseudo} · ${customer.phone || '—'}\n` +
    `${modeTexte}${livraisonNote} · ${datePart} · ${timePart}\n`

  const footer =
    `\nTotal : ${finalTotal.toFixed(2).replace('.', ',')} €` +
    (discountAmount > 0 ? ` (promo -${discountAmount.toFixed(2).replace('.', ',')} €)` : '') +
    `\nMerci — tout est enregistré de mon côté.`

  const buildItemsLine = (showCount: number): string => {
    if (showCount <= 0) {
      return `Articles : ${itemBits.length} article(s) (détail enregistré côté boutique)`
    }
    const n = Math.min(showCount, itemBits.length)
    const shown = itemBits.slice(0, n)
    const hidden = itemBits.length - n
    if (hidden > 0) return `Articles : ${shown.join(', ')} (+${hidden} autre(s))`
    return `Articles : ${shown.join(', ')}`
  }

  for (let show = itemBits.length; show >= 0; show -= 1) {
    const text = `${header}${buildItemsLine(show)}${footer}`
    if (text.length <= maxLength) return text
  }

  const compactHeader =
    `Cmd n°${orderNumber} — ${pseudo} · ${customer.phone || ''}\n` +
    `${modeTexte} · ${datePart} · ${timePart}\n`
  const first = itemBits[0] ?? 'commande'
  const extra = itemBits.length > 1 ? ` (+${itemBits.length - 1})` : ''
  const room = maxLength - compactHeader.length - footer.length - 12 - extra.length
  const trimmed =
    first.length > Math.max(room, 12) ? `${first.slice(0, Math.max(room - 1, 12))}…` : first
  return `${compactHeader}Articles : ${trimmed}${extra}${footer}`.slice(0, maxLength)
}
