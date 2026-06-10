import type { Product } from './types'
import { CATALOG_PRODUCTS } from './constants/catalog'

export const PHONE_E164 = '33619871005'

/** PayPal.Me : paiement optionnel après commande */
export const PAYPAL_ME_USER = 'RoumayssaGhazi'

/** Parrainage : réduction 1ère commande du filleul (€) et points offerts au parrain */
export const REFERRAL_DISCOUNT_EUR = 5
export const REFERRAL_POINTS_TO_REFERRER = 15

/** Nombre max de commandes par créneau de livraison (affiche "Plus que X places") */
export const DELIVERY_SLOT_MAX_CAPACITY = 5

/** ID du trompe-l'œil mystère (Fraise) — le premier qui trouve a 10 % dessus */
export const MYSTERY_TROMPE_LOEIL_ID = 'trompe-loeil-fraise'

/** Box « découverte » : 5 trompe-l'œil au choix (exclusions gérées dans l’admin + Firebase). */
export const BOX_DECOUVERTE_TROMPE_PRODUCT_ID = 'box-decouverte-trompe-5'
export const DISCOVERY_BOX_TROMPE_SLOT_COUNT = 5

/** Mini box trompe-l'œil par 5 : les saveurs sont choisies par l'admin (côté Firebase, miniBoxTrompeIncludedIds). */
export const MINI_BOX_TROMPE_PRODUCT_ID = 'mini-box-trompe-loeil-5'
export const MINI_BOX_TROMPE_SLOT_COUNT = 5

/** Box fruitée : 6 trompe-l'œil distincts au choix parmi 7 saveurs fruitées. */
export const FRUITEE_BOX_TROMPE_SLOT_COUNT = 6

/** Autres boxes trompe-l'œil : le client choisit une fois chaque saveur parmi la liste du bundle (stock comme la box découverte). */
export const CUSTOMIZABLE_TROMPE_BUNDLE_BOX_IDS = [
  'box-trompe-loeil',
  'box-fruitee',
  'box-de-tout',
] as const

export function isCustomizableTrompeBundleBoxId(id: string): boolean {
  return (CUSTOMIZABLE_TROMPE_BUNDLE_BOX_IDS as readonly string[]).includes(id)
}

/** Box avec liste de trompes enregistrée sur la ligne de commande (`trompeDiscoverySelection`). */
export function isTrompeBoxWithStoredSelection(baseId: string): boolean {
  return baseId === BOX_DECOUVERTE_TROMPE_PRODUCT_ID || isCustomizableTrompeBundleBoxId(baseId)
}

/** Première date de récupération pour les produits classiques — les ventes commencent officiellement à partir de ce jour. */
export const FIRST_PICKUP_DATE_CLASSIC = '2026-02-18'
export const FIRST_PICKUP_DATE_CLASSIC_LABEL = 'mercredi 18 février 2026'

/** Catalogue produits (source statique — overrides Firebase via useProducts). */
export const PRODUCTS: Product[] = CATALOG_PRODUCTS

/** Nombre de saveurs distinctes à choisir pour une box « trompe au choix » (découverte, fruitée, etc.). */
export function getTrompeBundleSelectionSlotCount(baseId: string): number {
  if (baseId === BOX_DECOUVERTE_TROMPE_PRODUCT_ID) return DISCOVERY_BOX_TROMPE_SLOT_COUNT
  if (baseId === 'box-fruitee') return FRUITEE_BOX_TROMPE_SLOT_COUNT
  if (isCustomizableTrompeBundleBoxId(baseId)) {
    const p = PRODUCTS.find((x) => x.id === baseId)
    return p?.bundleProductIds?.length ?? 0
  }
  return 0
}
