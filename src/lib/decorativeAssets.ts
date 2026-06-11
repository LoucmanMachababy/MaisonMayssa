/** Images lifestyle & vitrine — mix trompe-l'œil, salé, boissons, chocolaterie, boxes… */

export const LIFESTYLE = {
  /** Planche multi trompe-l'œil — hero accueil */
  heroSpread: '/nouvelle-img/Plusieurs-trompeloeil.png',
  catalogSpread: '/nouvelle-img/Plusieurs-trompeloeil.png',
  /** Box ouverte avec trompe-l'œil */
  boxOpen: '/nouvelle-img/photo-trompe-loeil-site.png',
  boxSeven: '/nouvelle-img/boxe-7-trompe-loeil.png',
  boxAll: '/nouvelle-img/boxe-de-tout.png',
  boxFruits: '/nouvelle-img/boxe-fruiter.png',
  boxFive: '/nouvelle-img/boite-5-trompe-loeil.png',
  /** Trompe-l'œil — gros plan */
  mangueCluster: '/nouvelle-img/mangue-beaucoup.png',
  /** Événements — assortiment complet */
  events: '/nouvelle-img/boxe-de-tout.png',
  /** Bandeaux éditoriaux */
  bandeauLuxe: '/nouvelle-img/boxe-7-trompe-loeil.png',
  community: '/nouvelle-img/mangue-beaucoup.png',
  /** Catégories — photos produits */
  jusFrais: '/nouvelle-img/limonade-bresilienne.png',
  canetteCake: '/nouvelle-img/canette-cake-speculos-framboise.png',
  chocolaterie: '/nouvelle-img/tablette-chocolat-dubai-pistache.png',
  sale: '/nouvelle-img/Panuozzo-Italien.png',
  fruits: '/nouvelle-img/Cup-de-fruit-mixte.png',
  cupDubai: '/nouvelle-img/cup-dubai-bueno.PNG',
  boxes: '/nouvelle-img/boxe-de-tout.png',
} as const

/** Mosaïque header carte — un aperçu de chaque univers */
export const CATALOG_MOSAIC_PANELS: { src: string; hover?: string }[] = [
  { src: '/nouvelle-img/mangue-face.png', hover: '/nouvelle-img/mangue-hover-3-face.png' },
  { src: '/nouvelle-img/Canette-cake-nutella-oreo.png' },
  { src: '/nouvelle-img/limonade-bresilienne-mangue.png' },
  { src: '/nouvelle-img/Panuozzo-Italien.png' },
  { src: '/nouvelle-img/Cup-de-fruit-mixte.png' },
  { src: '/nouvelle-img/cup-dubai-bueno.PNG' },
  { src: '/nouvelle-img/cup-dubai-pistache-chocolatblanc-fraise.PNG' },
]

/** Images par catégorie — header carte */
export const CATEGORY_HEADER_IMAGES: Record<string, string> = {
  tout: LIFESTYLE.catalogSpread,
  patisseries: '/nouvelle-img/Plusieurs-trompeloeil.png',
  jus: LIFESTYLE.jusFrais,
  sale: LIFESTYLE.sale,
  'canette-cake': LIFESTYLE.canetteCake,
  fruits: LIFESTYLE.fruits,
  'cup-dubai': LIFESTYLE.cupDubai,
  chocolaterie: LIFESTYLE.chocolaterie,
  boxes: LIFESTYLE.boxes,
}

/** Bandeau défilant — mix de toutes les gammes */
export const PRODUCT_SHOWCASE_MARQUEE: { src: string; alt: string }[] = [
  { src: '/nouvelle-img/mangue-face.png', alt: "Trompe-l'œil mangue" },
  { src: '/nouvelle-img/canette-cake-speculos-framboise.png', alt: 'Canette cake' },
  { src: '/nouvelle-img/cocktail-mojito-passion.PNG', alt: 'Mojito passion' },
  { src: '/nouvelle-img/Panuozzo-Italien.png', alt: 'Panuozzo' },
  { src: '/nouvelle-img/Cup-de-fruit-mixte.png', alt: 'Cup de fruits' },
  { src: '/nouvelle-img/cup-dubai-bueno.PNG', alt: 'Cup Dubaï Bueno' },
  { src: '/nouvelle-img/cup-dubai-pistache-chocolatblanc-fraise.PNG', alt: 'Cup Dubaï pistache chocolat blanc' },
  { src: '/nouvelle-img/Citron-face.png', alt: "Trompe-l'œil citron" },
  { src: '/nouvelle-img/tablette-chocolat-speculos.png', alt: 'Chocolat spéculoos' },
  { src: '/nouvelle-img/limonade-bresilienne-classique.PNG', alt: 'Limonade brésilienne' },
  { src: '/nouvelle-img/NyRolls-Steak.png', alt: 'New York Roll' },
]

/** @deprecated Utiliser PRODUCT_SHOWCASE_MARQUEE */
export const TROMPE_FACE_MARQUEE = PRODUCT_SHOWCASE_MARQUEE
