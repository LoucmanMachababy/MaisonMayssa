/**
 * Informations boutique — source unique de vérité.
 *
 * Maison Mayssa ouvre en click & collect dans la galerie marchande du
 * Carrefour d'Annecy (avenue de Genève) le 4 juillet 2026.
 */

export const STORE_NAME = 'Maison Mayssa'

/** Adresse du point de retrait click & collect (galerie marchande Carrefour Annecy). */
export const STORE_ADDRESS = {
  line1: 'Galerie marchande — Centre commercial Carrefour',
  street: '134 avenue de Genève',
  postalCode: '74000',
  city: 'Annecy',
  region: 'Haute-Savoie',
  country: 'FR',
  /** Coordonnées approximatives (avenue de Genève, Annecy). */
  geo: { lat: 45.9092, lng: 6.1247 },
} as const

/** Adresse formatée sur une ligne, pour affichage. */
export const STORE_ADDRESS_LINE = `${STORE_ADDRESS.street}, ${STORE_ADDRESS.postalCode} ${STORE_ADDRESS.city}`

/** Adresse complète multi-lignes, pour affichage (galerie + rue + ville). */
export const STORE_ADDRESS_FULL = `${STORE_ADDRESS.line1}, ${STORE_ADDRESS_LINE}`

/** Date d'ouverture du point de vente (YYYY-MM-DD). */
export const STORE_OPENING_DATE = '2026-07-04'
export const STORE_OPENING_DATE_LABEL = 'samedi 4 juillet 2026'

/** Lien Google Maps vers le point de retrait. */
export const STORE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Carrefour+134+avenue+de+Geneve+74000+Annecy'
