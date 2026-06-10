import type { Product } from '../types'
import type { ProductWithAvailability } from '../hooks/useProducts'

/** Trompe-l'œil unitaire ou box — détection par id (indépendante de la catégorie affichée). */
export function isTrompeLoeilProduct(product: Pick<Product, 'id'>): boolean {
  return product.id.startsWith('trompe-loeil-') || product.id.includes('trompe-loeil') || product.id.includes('trompe')
}

export function isTrompeLoeilUnitProduct(product: Pick<Product, 'id'>): boolean {
  return product.id.startsWith('trompe-loeil-')
}

export function isProductVisible(product: ProductWithAvailability): boolean {
  return product.visible !== false
}

export function isProductOrderable(product: ProductWithAvailability): boolean {
  return isProductVisible(product) && product.available !== false
}

export function isProductComingSoon(product: { available?: boolean; visible?: boolean }): boolean {
  return product.visible !== false && product.available === false
}

export type ProductAvailabilityState = 'available' | 'coming_soon' | 'hidden'

export function getProductAvailabilityState(product: ProductWithAvailability): ProductAvailabilityState {
  if (product.visible === false) return 'hidden'
  if (product.available === false) return 'coming_soon'
  return 'available'
}
