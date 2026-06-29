import type { Product } from '../types'
import {
  BOX_DECOUVERTE_TROMPE_PRODUCT_ID,
  DISCOVERY_BOX_TROMPE_SLOT_COUNT,
  PRODUCTS,
  isDiscoveryTrompeBoxId,
  isCustomizableTrompeBundleBoxId,
  getTrompeBundleSelectionSlotCount,
} from '../constants'
import { getBundleEffectiveStock } from './bundleStock'

export { BOX_DECOUVERTE_TROMPE_PRODUCT_ID, DISCOVERY_BOX_TROMPE_SLOT_COUNT }

/** Gousse de vanille : supplément en box découverte (5 ou 8). */
export const DISCOVERY_BOX_VANILLE_TROMPE_ID = 'trompe-loeil-vanille'
export const DISCOVERY_BOX_VANILLE_SUPPLEMENT_EUR = 0.5

export function discoveryBoxHasVanilleSupplement(selectionIds: string[] | undefined): boolean {
  return !!selectionIds?.includes(DISCOVERY_BOX_VANILLE_TROMPE_ID)
}

/** Prix ligne panier / commande pour une box découverte (base + éventuel supplément vanille). */
export function getDiscoveryBoxLinePrice(
  basePrice: number,
  selectionIds: string[] | undefined,
  boxProductId?: string,
): number {
  const supplement =
    boxProductId &&
    isDiscoveryTrompeBoxId(boxProductId) &&
    discoveryBoxHasVanilleSupplement(selectionIds)
      ? DISCOVERY_BOX_VANILLE_SUPPLEMENT_EUR
      : 0
  return Math.round((basePrice + supplement) * 100) / 100
}

/** Trompe-l'œil unitaires (pas les boxes bundle). */
export function listIndividualTrompeLoeilProducts(catalog: Product[] = PRODUCTS): Product[] {
  return catalog.filter(
    (p) =>
      p.id.startsWith('trompe-loeil-') &&
      !p.bundleProductIds?.length,
  )
}

/** Saveurs éligibles = trompes unitaires du catalogue hors `excludedIds`. */
export function getEligibleTrompeIdsForDiscoveryBox(
  catalog: Product[],
  excludedIds: string[] | undefined,
): string[] {
  const ex = new Set(excludedIds ?? [])
  return listIndividualTrompeLoeilProducts(catalog)
    .map((p) => p.id)
    .filter((id) => !ex.has(id))
}

/**
 * Nombre de boxes commandables : chaque box = 5 saveurs **distinctes** ; simulation gloutonne
 * (à chaque tour on retire 1 sur les 5 saveurs encore en stock les plus fournies).
 * null = pas de plafond chiffré (au moins une saveur non suivie en stock).
 */
export function getDiscoveryBoxEffectiveStock(
  eligibleIds: string[],
  getStockFn: (id: string) => number | null,
  slots: number = DISCOVERY_BOX_TROMPE_SLOT_COUNT,
): number | null {
  if (eligibleIds.length === 0) return 0
  if (eligibleIds.length < slots) return 0

  let anyTracked = false
  let anyUnlimited = false
  const qty = new Map<string, number>()
  for (const id of eligibleIds) {
    const s = getStockFn(id)
    if (s === null) {
      anyUnlimited = true
      continue
    }
    anyTracked = true
    qty.set(id, Math.max(0, s))
  }
  if (!anyTracked) return null
  if (anyUnlimited) return null

  const positive = [...qty.values()].filter((q) => q > 0).length
  if (positive < slots) return 0

  const mutable = new Map(qty)
  let boxes = 0
  while (true) {
    const ranked = [...mutable.entries()].filter(([, q]) => q > 0).sort((a, b) => b[1] - a[1])
    if (ranked.length < slots) break
    for (let i = 0; i < slots; i++) {
      const id = ranked[i][0]
      const v = ranked[i][1]
      mutable.set(id, v - 1)
    }
    boxes++
  }
  return boxes
}

export function getEffectiveStockForProductCard(
  product: Product,
  getStockFn: (id: string) => number | null,
  opts?: { boxDecouverteExcludedIds?: string[]; catalog?: Product[] },
): number | null {
  const catalog = opts?.catalog ?? PRODUCTS
  if (isDiscoveryTrompeBoxId(product.id)) {
    const eligible = getEligibleTrompeIdsForDiscoveryBox(catalog, opts?.boxDecouverteExcludedIds)
    return getDiscoveryBoxEffectiveStock(
      eligible,
      getStockFn,
      getTrompeBundleSelectionSlotCount(product.id),
    )
  }
  if (isCustomizableTrompeBundleBoxId(product.id) && product.bundleProductIds?.length) {
    const slots = getTrompeBundleSelectionSlotCount(product.id)
    return getDiscoveryBoxEffectiveStock(product.bundleProductIds, getStockFn, slots)
  }
  return getBundleEffectiveStock(product, getStockFn)
}

export function isTrompeSelectableForDiscovery(
  productId: string,
  getStockFn: (id: string) => number | null,
): boolean {
  const s = getStockFn(productId)
  if (s === null) return true
  return s > 0
}
