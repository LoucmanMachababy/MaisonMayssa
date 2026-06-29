import type { CartItem } from './store'
import type { OrderItem } from './firebase'
import {
  CANDY_FRUIT_BOX_FLAVORS,
  CANDY_FRUIT_CANETTE_FLAVORS,
  CANDY_FRUIT_BOX_PRODUCT_ID,
  CANDY_FRUIT_CANETTE_PRODUCT_ID,
} from '../constants/candyFruit'
import { PRODUCTS } from '../constants'
import { normalizeOrderProductBaseId } from './utils'

/** ID catalogue sans suffixe panier `-timestamp`. */
export function cartProductIdToOrderProductId(cartProductId: string): string {
  return normalizeOrderProductBaseId(cartProductId)
}

function parseSizeLabelFromCartName(name: string): string | undefined {
  const m = name.match(/\(([^)]+)\)\s*$/)
  return m?.[1]?.trim() || undefined
}

function resolveCandyFruitDisplayName(cartProductId: string, cartName: string): string {
  const baseId = normalizeOrderProductBaseId(cartProductId)
  if (baseId === CANDY_FRUIT_BOX_PRODUCT_ID || baseId === CANDY_FRUIT_CANETTE_PRODUCT_ID) {
    const prefix = `${baseId}-`
    if (cartProductId.startsWith(prefix)) {
      const flavorId = cartProductId.slice(prefix.length).replace(/-\d{10,}$/, '')
      const flavors =
        baseId === CANDY_FRUIT_BOX_PRODUCT_ID ? CANDY_FRUIT_BOX_FLAVORS : CANDY_FRUIT_CANETTE_FLAVORS
      const flavor = flavors.find((f) => f.id === flavorId)
      if (flavor) {
        const format = baseId === CANDY_FRUIT_CANETTE_PRODUCT_ID ? 'Canette' : 'Box'
        return `Candy Fruit Chez Mima ${format} — ${flavor.label}`
      }
    }
  }
  return cartName
}

/** Construit une ligne OrderItem fidèle au panier (goûts, taille, perso). */
export function buildOrderItemFromCart(item: CartItem): OrderItem {
  const productId = cartProductIdToOrderProductId(item.product.id)
  const baseId = normalizeOrderProductBaseId(productId)

  let name = item.product.name.trim()

  if (item.product.category === 'Tiramisus' && item.product.description) {
    const desc = item.product.description.trim()
    name = name.includes('Base:') ? name : `${name} — ${desc}`
  } else if (item.product.category === 'Candy Fruit' || baseId.startsWith('candy-fruit-')) {
    name = resolveCandyFruitDisplayName(item.product.id, name)
  } else if (baseId.startsWith('canette-cake-')) {
    const catalog = PRODUCTS.find((p) => p.id === baseId)
    if (catalog) name = catalog.name
  } else if (item.product.description?.includes('Choix :')) {
    name = item.product.description
  } else if (item.product.description?.includes('Base:') || item.product.description?.includes('Toppings:')) {
    name = `${name} — ${item.product.description}`
  }

  const sizeLabel = parseSizeLabelFromCartName(item.product.name)

  return {
    productId,
    name,
    quantity: item.quantity,
    price: item.product.price,
    ...(sizeLabel ? { sizeLabel } : {}),
    ...(item.trompeDiscoverySelection?.length
      ? { trompeDiscoverySelection: item.trompeDiscoverySelection }
      : {}),
  }
}
