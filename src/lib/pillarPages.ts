/**
 * Registre des pages piliers SEO pour le maillage interne.
 * Utilisé par PillarPageLayout pour afficher les vignettes "À découvrir aussi".
 */

export type RelatedPage = {
  slug: string
  title: string
  description: string
  image: string
}

export const PILLAR_PAGES: Record<string, RelatedPage> = {
  'trompe-loeil-annecy': {
    slug: 'trompe-loeil-annecy',
    title: "Trompe-l'œil Annecy",
    description: "Fruits pâtissiers qui trompent l'œil, faits main à Annecy.",
    image: '/Trompe-loeil-header.webp',
  },
  'brownies-annecy': {
    slug: 'brownies-annecy',
    title: 'Brownies Annecy',
    description: 'Brownies fondants artisanaux, 9 saveurs gourmandes.',
    image: '/brownie-nutella-oreo.webp',
  },
  'cookies-annecy': {
    slug: 'cookies-annecy',
    title: 'Cookies Annecy',
    description: 'Cookies moelleux fait maison, garnis à la demande.',
    image: '/cookie-kinder-bueno.webp',
  },
  'patisserie-anniversaire-annecy': {
    slug: 'patisserie-anniversaire-annecy',
    title: 'Anniversaire Annecy',
    description: "Pâtisseries pour anniversaire, livrées le soir à Annecy.",
    image: '/Boxe-trompeloeil.webp',
  },
  'cadeau-gourmand-annecy': {
    slug: 'cadeau-gourmand-annecy',
    title: 'Cadeau gourmand Annecy',
    description: "Boxes et trompe-l'œil à offrir — un cadeau qui marque.",
    image: '/box-mixte.webp',
  },
}
