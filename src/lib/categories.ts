import type { ProductCategory } from '../types'

export type CatalogFilter = 'Tout' | ProductCategory

export const CATALOG_FILTERS: CatalogFilter[] = [
  'Tout',
  'Nos trompe-l\'œil',
  'Nos jus frais',
  'Canette Cake',
  'Cookies gourmands',
  'Le salé',
  'Fruits frais',
  'Candy Fruit',
  'Chocolaterie',
  'Boxes',
]

/** Catégories du catalogue admin — alignées sur la carte client (sans « Tout »). */
export const ADMIN_CATALOG_CATEGORIES: ProductCategory[] = CATALOG_FILTERS.filter(
  (f): f is ProductCategory => f !== 'Tout',
)

export type CategoryShowcase = {
  id: CatalogFilter
  title: string
  subtitle: string
  image: string
  anchor: string
}

/** Grandes tuiles visuelles — style maison de pâtisserie contemporaine. */
export const CATEGORY_SHOWCASE: CategoryShowcase[] = [
  {
    id: 'Nos trompe-l\'œil',
    title: 'Nos trompe-l\'œil',
    subtitle: 'Créations signatures trompe-l\'œil',
    image: '/nouvelle-img/mangue-face.png',
    anchor: '#la-carte',
  },
  {
    id: 'Nos jus frais',
    title: 'Nos jus frais',
    subtitle: 'Limonades & mojitos sans alcool',
    image: '/nouvelle-img/limonade-bresilienne.png',
    anchor: '#la-carte',
  },
  {
    id: 'Le salé',
    title: 'Le salé',
    subtitle: 'Bouchées salées Maison Mayssa',
    image: '/nouvelle-img/Panuozzo-Italien.png',
    anchor: '#la-carte',
  },
  {
    id: 'Chocolaterie',
    title: 'Chocolaterie',
    subtitle: 'Cups Dubaï & tablettes artisanales',
    image: '/nouvelle-img/cup-dubai-bueno.PNG',
    anchor: '#la-carte',
  },
  {
    id: 'Candy Fruit',
    title: 'Candy Fruit Chez Mima',
    subtitle: 'Box, canette & sauce · @chezmima-74',
    image: '/nouvelle-img/candy-bruit-box.jpeg',
    anchor: '#la-carte',
  },
  {
    id: 'Fruits frais',
    title: 'Fruits frais',
    subtitle: 'Cups de fruits de saison',
    image: '/nouvelle-img/mangue-ouverte.png',
    anchor: '#la-carte',
  },
  {
    id: 'Cookies gourmands',
    title: 'Cookies gourmands',
    subtitle: 'Le Cookie Gourmand',
    image: '/nouvelle-img/Canette-cake-nutella-oreo.png',
    anchor: '#la-carte',
  },
]

export const SIGNATURE_PRODUCT_IDS = [
  'trompe-loeil-mangue',
  'trompe-loeil-pistache',
  'trompe-loeil-cacahuete',
  'trompe-loeil-fraise',
  'trompe-loeil-cabosse',
] as const

export const COMING_SOON_FEATURED_IDS = [
  'limonade-bresilienne-classique',
  'limonade-bresilienne-mangue',
  'limonade-bresilienne-fraise',
  'limonade-bresilienne-pasteque',
  'mojito-classique',
  'mojito-mangue',
  'new-york-roll-poulet-curry',
  'new-york-roll-steak',
  'panuozzo-maison-mayssa',
  'cup-dubai-pistache-chocolat-fraise',
  'cup-dubai-pistache-chocolatblanc-fraise',
  'cup-dubai-bueno',
  'tablette-dubai-pistache',
  'tablette-dubai-speculoos',
  'cup-fruits-mix-maison',
  'cup-fruits-pasteque',
  'canette-cake-mangue-passion',
  'trompe-loeil-amande',
] as const
