import type { ProductCategory } from '../types'

/** Note légale atelier (traces croisées). */
export const ALLERGEN_TRACE_NOTE =
  'Préparé dans un atelier artisanal où sont manipulés gluten, lait, œufs, fruits à coque, arachides et soja. En cas d\'allergie sévère, contactez-nous avant de commander.'

const TROMPE_FRUIT = ['Gluten', 'Lait', 'Œufs', 'Soja', 'Fruits à coque (traces)']
const TROMPE_NUTS = ['Gluten', 'Lait', 'Œufs', 'Soja', 'Fruits à coque']
const TROMPE_PEANUT = ['Gluten', 'Lait', 'Œufs', 'Soja', 'Arachides', 'Fruits à coque']
const TROMPE_CHOCO = ['Gluten', 'Lait', 'Œufs', 'Soja']
const BOX_ALL = ['Gluten', 'Lait', 'Œufs', 'Soja', 'Fruits à coque', 'Arachides']
const PATISSERIE = ['Gluten', 'Lait', 'Œufs', 'Soja', 'Fruits à coque (traces)']
const CHOCOLAT = ['Lait', 'Soja', 'Fruits à coque', 'Gluten (traces)']
const SALE = ['Gluten', 'Lait', 'Œufs', 'Moutarde', 'Soja']
const FRUITS_FRAIS = ['Fruits à coque (traces)', 'Gluten (traces)', 'Lait (traces)']
const JUS = ['Lait', 'Fruits à coque (traces)']
const MOJITO = ['Fruits à coque (traces)']

/** Allergènes par produit (prioritaire sur la catégorie). */
export const PRODUCT_ALLERGENS: Record<string, string[]> = {
  // Trompe-l'œil fruités
  'trompe-loeil-mangue': TROMPE_FRUIT,
  'trompe-loeil-citron': TROMPE_FRUIT,
  'trompe-loeil-passion': TROMPE_FRUIT,
  'trompe-loeil-framboise': TROMPE_FRUIT,
  'trompe-loeil-fraise': TROMPE_FRUIT,
  'trompe-loeil-myrtille': TROMPE_FRUIT,
  'trompe-loeil-vanille': TROMPE_CHOCO,
  'trompe-loeil-pistache': TROMPE_NUTS,
  'trompe-loeil-amande': TROMPE_NUTS,
  'trompe-loeil-pecan': TROMPE_NUTS,
  'trompe-loeil-cacahuete': TROMPE_PEANUT,
  'trompe-loeil-cabosse': TROMPE_CHOCO,
  'trompe-loeil-cafe': TROMPE_CHOCO,
  'trompe-loeil-popcorn': PATISSERIE,
  // Boxes
  'box-trompe-loeil': BOX_ALL,
  'box-fruitee': BOX_ALL,
  'box-decouverte-trompe-5': BOX_ALL,
  'mini-box-trompe-loeil-5': BOX_ALL,
  'box-de-tout': BOX_ALL,
  'box-surprise': BOX_ALL,
  // Canette cakes
  'canette-cake-fraise': PATISSERIE,
  'canette-cake-nutella-oreo': [...PATISSERIE, 'Fruits à coque (noisettes)'],
  'canette-cake-speculoos-framboise': PATISSERIE,
  'canette-cake-mangue-passion': TROMPE_FRUIT,
  // Jus
  'limonade-bresilienne-classique': JUS,
  'limonade-bresilienne-mangue': JUS,
  'limonade-bresilienne-fraise': JUS,
  'limonade-bresilienne-framboise': JUS,
  'limonade-bresilienne-peche': JUS,
  'limonade-bresilienne-pasteque': JUS,
  'mojito-classique': MOJITO,
  'mojito-passion': MOJITO,
  'mojito-melon': MOJITO,
  'mojito-mangue': MOJITO,
  'mojito-framboise': MOJITO,
  'mojito-fraise': MOJITO,
  // Salé
  'new-york-roll-poulet-curry': SALE,
  'new-york-roll-steak': SALE,
  'panuozzo-maison-mayssa': SALE,
  // Fruits frais
  'cup-fruits-fraise': FRUITS_FRAIS,
  'cup-fruits-mangue': FRUITS_FRAIS,
  'cup-fruits-ananas': FRUITS_FRAIS,
  'cup-fruits-pasteque': FRUITS_FRAIS,
  'cup-fruits-mix-maison': FRUITS_FRAIS,
  // Chocolaterie
  'cup-dubai-pistache-chocolat-fraise': [...CHOCOLAT, 'Fruits à coque (pistache)', 'Gluten'],
  'cup-dubai-pistache-chocolatblanc-fraise': [...CHOCOLAT, 'Fruits à coque (pistache)', 'Gluten'],
  'cup-dubai-bueno': [...CHOCOLAT, 'Fruits à coque (noisette)', 'Gluten'],
  'tablette-dubai-pistache': [...CHOCOLAT, 'Fruits à coque (pistache)'],
  'tablette-dubai-speculoos': CHOCOLAT,
  'tablette-dubai-framboise': CHOCOLAT,
  'mini-tablette-dubai-pistache': [...CHOCOLAT, 'Fruits à coque (pistache)'],
  'mini-tablette-dubai-speculoos': CHOCOLAT,
  'mini-tablette-dubai-framboise': CHOCOLAT,
  // Candy Fruit
  'candy-fruit-box': PATISSERIE,
  'candy-fruit-canette': PATISSERIE,
  'candy-fruit-sauce': PATISSERIE,
}

const CATEGORY_ALLERGENS: Partial<Record<ProductCategory, string[]>> = {
  'Nos trompe-l\'œil': TROMPE_FRUIT,
  Boxes: BOX_ALL,
  'Canette Cake': PATISSERIE,
  'Nos jus frais': JUS,
  'Le salé': SALE,
  'Fruits frais': FRUITS_FRAIS,
  Chocolaterie: CHOCOLAT,
  'Candy Fruit': PATISSERIE,
  'Cookies gourmands': PATISSERIE,
  Brownies: PATISSERIE,
  Cookies: PATISSERIE,
  'Layer Cups': PATISSERIE,
  Tiramisus: ['Gluten', 'Lait', 'Œufs', 'Soja'],
}

export function getProductAllergens(productId: string, category: ProductCategory): string[] {
  if (PRODUCT_ALLERGENS[productId]) {
    return [...new Set(PRODUCT_ALLERGENS[productId])]
  }
  return [...new Set(CATEGORY_ALLERGENS[category] ?? PATISSERIE)]
}
