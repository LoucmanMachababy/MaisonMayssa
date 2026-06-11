import type { Product } from '../types'

export const SITE_PAGES = [
  { label: 'La carte', path: '/carte', keywords: ['carte', 'menu', 'catalogue', 'produits'] },
  { label: 'Événements', path: '/evenements', keywords: ['événement', 'event', 'stand', 'salon'] },
  { label: 'La Maison', path: '/a-propos', keywords: ['maison', 'about', 'histoire', 'mayssa'] },
  { label: 'Contact', path: '/contact', keywords: ['contact', 'email', 'message', 'écrire'] },
  { label: 'FAQ', path: '/faq', keywords: ['faq', 'question', 'aide', 'livraison'] },
  { label: 'Mon compte', path: '/compte', keywords: ['compte', 'profil', 'fidélité', 'points'] },
  { label: 'Panier', path: '/panier', keywords: ['panier', 'commande', 'précommande'] },
]

export function normalizeSearchText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function scoreProduct(product: Product, q: string): number {
  const name = normalizeSearchText(product.name)
  const category = normalizeSearchText(product.category)
  const description = normalizeSearchText(product.description ?? '')
  const id = normalizeSearchText(product.id)

  if (name === q) return 100
  if (name.startsWith(q)) return 90
  if (name.includes(q)) return 75
  if (category.includes(q)) return 60
  if (description.includes(q)) return 45
  if (id.includes(q)) return 35
  return 0
}

export function searchProducts(products: Product[], query: string, limit = 6) {
  const q = normalizeSearchText(query.trim())
  if (!q) return []
  return products
    .map((product) => ({ product, score: scoreProduct(product, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, 'fr'))
    .slice(0, limit)
    .map(({ product }) => product)
}

export function searchPages(query: string, limit = 4) {
  const q = normalizeSearchText(query.trim())
  if (!q) return []
  return SITE_PAGES.filter(
    (page) =>
      normalizeSearchText(page.label).includes(q) ||
      page.keywords.some((kw) => normalizeSearchText(kw).includes(q) || q.includes(normalizeSearchText(kw))),
  ).slice(0, limit)
}
