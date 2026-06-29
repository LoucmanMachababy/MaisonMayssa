/** Partenaire Candy Fruit */
export const CANDY_FRUIT_BRAND = 'Chez Mima'
export const CANDY_FRUIT_SNAPCHAT = 'chezmima-74'
export const CANDY_FRUIT_SNAPCHAT_MENTION = `Snapchat : @${CANDY_FRUIT_SNAPCHAT}`
export const CANDY_FRUIT_COMPOSITION =
  'Raisins confits enrobés de colorant alimentaire et sucre (Chez Mima).'

/** IDs catalogue Candy Fruit */
export const CANDY_FRUIT_BOX_PRODUCT_ID = 'candy-fruit-box'
export const CANDY_FRUIT_CANETTE_PRODUCT_ID = 'candy-fruit-canette'
export const CANDY_FRUIT_SAUCE_PRODUCT_ID = 'candy-fruit-sauce'

/** @deprecated — utiliser les IDs par format */
export const CANDY_FRUIT_PRODUCT_ID = CANDY_FRUIT_BOX_PRODUCT_ID

export type CandyFruitFormat = 'box' | 'canette'

export type CandyFruitFlavor = {
  id: string
  label: string
  shortLabel: string
  image: string
}

const img = (file: string) => `/nouvelle-img/${encodeURI(file)}`

export const CANDY_FRUIT_BOX_IMAGE = img('candy-fruits-box.png')
export const CANDY_FRUIT_CANETTE_IMAGE = img('candy-fruit-canette-bubble-gum.jpeg')
export const CANDY_FRUIT_SAUCE_IMAGE = img('sauce-aciduler.PNG')

/** Box 15 € */
export const CANDY_FRUIT_BOX_FLAVORS: CandyFruitFlavor[] = [
  {
    id: 'melon-pasteque',
    label: 'Melon, pastèque',
    shortLabel: 'Melon, pastèque',
    image: img('candy-fruit-melon-pasteque.jpeg'),
  },
  {
    id: 'peche-framboise',
    label: 'Pêche framboise',
    shortLabel: 'Pêche framboise',
    image: CANDY_FRUIT_BOX_IMAGE,
  },
  {
    id: 'coca-cherry',
    label: 'Coca cherry',
    shortLabel: 'Coca cherry',
    image: img('candy-fruit-coca-cherry.JPG'),
  },
  {
    id: 'fraise-litchi',
    label: 'Fraise, litchi',
    shortLabel: 'Fraise, litchi',
    image: img('candy-fruit-peche framboise2.jpeg'),
  },
  {
    id: 'fraise-passion',
    label: 'Fraise, passion',
    shortLabel: 'Fraise, passion',
    image: img('candy-fruit-melon-pasteque.jpeg'),
  },
  {
    id: 'barbe-a-papa-bubble-gum',
    label: 'Barbe à papa, bubble gum',
    shortLabel: 'Barbe à papa',
    image: img('candyfruit-bubblegum-barbeapapa.JPG'),
  },
  {
    id: 'melon-bubble-gum',
    label: 'Melon, bubble gum',
    shortLabel: 'Melon bubble gum',
    image: img('candy-fruit-melon-bubblegum.JPG'),
  },
]

/** Canette 10 € */
export const CANDY_FRUIT_CANETTE_FLAVORS: CandyFruitFlavor[] = [
  {
    id: 'barbe-a-papa',
    label: 'Barbe à papa',
    shortLabel: 'Barbe à papa',
    image: img('candyfruit-bubblegum-barbeapapa.JPG'),
  },
  {
    id: 'bubble-gum',
    label: 'Bubble gum',
    shortLabel: 'Bubble gum',
    image: CANDY_FRUIT_CANETTE_IMAGE,
  },
  {
    id: 'melon',
    label: 'Melon',
    shortLabel: 'Melon',
    image: img('candy-fruit-melon-pasteque.jpeg'),
  },
  {
    id: 'fraise',
    label: 'Fraise',
    shortLabel: 'Fraise',
    image: img('candy-fruit-peche framboise.jpeg'),
  },
  {
    id: 'coca-cherry',
    label: 'Coca cherry',
    shortLabel: 'Coca cherry',
    image: img('candy-fruit-coca-cherry.JPG'),
  },
]

export function isCandyFruitFlavorProductId(productId: string): boolean {
  return productId === CANDY_FRUIT_BOX_PRODUCT_ID || productId === CANDY_FRUIT_CANETTE_PRODUCT_ID
}

export function getCandyFruitFormat(productId: string): CandyFruitFormat | null {
  if (productId === CANDY_FRUIT_BOX_PRODUCT_ID) return 'box'
  if (productId === CANDY_FRUIT_CANETTE_PRODUCT_ID) return 'canette'
  return null
}

export function getCandyFruitFlavors(productId: string): CandyFruitFlavor[] {
  const format = getCandyFruitFormat(productId)
  if (format === 'box') return CANDY_FRUIT_BOX_FLAVORS
  if (format === 'canette') return CANDY_FRUIT_CANETTE_FLAVORS
  return []
}

export const CANDY_FRUIT_BOX_FLAVOR_IDS = CANDY_FRUIT_BOX_FLAVORS.map((f) => f.id)
export const CANDY_FRUIT_CANETTE_FLAVOR_IDS = CANDY_FRUIT_CANETTE_FLAVORS.map((f) => f.id)

/** Goûts visibles côté client (exclusions admin Firebase). */
export function getAvailableCandyFruitFlavors(
  productId: string,
  excludedFlavorIds?: string[],
): CandyFruitFlavor[] {
  const flavors = getCandyFruitFlavors(productId)
  if (!excludedFlavorIds?.length) return flavors
  const excluded = new Set(excludedFlavorIds)
  return flavors.filter((f) => !excluded.has(f.id))
}

export function getCandyFruitExcludedFlavorIds(
  productId: string,
  settings: {
    candyFruitBoxExcludedFlavorIds?: string[]
    candyFruitCanetteExcludedFlavorIds?: string[]
  },
): string[] {
  const format = getCandyFruitFormat(productId)
  if (format === 'box') return settings.candyFruitBoxExcludedFlavorIds ?? []
  if (format === 'canette') return settings.candyFruitCanetteExcludedFlavorIds ?? []
  return []
}

export function getCandyFruitFormatLabel(format: CandyFruitFormat): string {
  return format === 'box' ? 'Box' : 'Canette'
}

/** @deprecated */
export const CANDY_FRUIT_FLAVORS = CANDY_FRUIT_BOX_FLAVORS
