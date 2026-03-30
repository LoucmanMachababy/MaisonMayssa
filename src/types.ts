// Types réexportés depuis firebase.ts (source de vérité unique)
export type { LoyaltyTier, RewardType } from './lib/firebase'
import type { LoyaltyTier } from './lib/firebase'

export type Channel = 'whatsapp' | 'instagram' | 'snap'

export type ProductCategory =
    | "Trompe l'œil"
    | 'Mini Gourmandises'
    | 'Brownies'
    | 'Cookies'
    | 'Layer Cups'
    | 'Boxes'
    | 'Tiramisus'

/** Précommande : disponible à partir de cette date (YYYY-MM-DD), à récupérer sous X jours après préco. */
export type ProductPreorder = {
    availableFrom: string
    daysToPickup: number
}

export type ProductSize = {
    label: string
    ml: number
    price: number
}

export type ProductBadge = 'best-seller' | 'nouveau' | 'nouveaute' | 'coup-de-coeur' | 'populaire'

export type Product = {
    id: string
    name: string
    description?: string
    price: number
    /** Prix original avant promotion (affiché barré si défini) */
    originalPrice?: number
    category: ProductCategory
    image?: string
    /** Galerie d'images pour la modal (ex. trompe-l'œil : fermé/ouvert) */
    images?: string[]
    sizes?: ProductSize[]
    /** Badges affichés sur la carte (Best seller, Nouveau, etc.) */
    badges?: ProductBadge[]
    /** true = affiché en premier dans la catégorie (sauf si l’admin définit autrement dans Firebase) */
    pinned?: boolean
    /** Cadre doré / dégradé « mise en avant nouveauté » sur la carte produit */
    highlightAsNew?: boolean
    /** Si défini, produit en précommande (disponible à partir de availableFrom, à récupérer sous daysToPickup j après préco.) */
    preorder?: ProductPreorder
    /** IDs des produits individuels contenus dans ce bundle. Si défini, décrémenter le stock de chaque composant à l'achat. */
    bundleProductIds?: string[]
}

export type CartItem = {
    product: Product
    quantity: number
    /** Timestamp (ms) d'expiration de la réservation (trompe l'oeil) */
    reservationExpiresAt?: number
    /** True une fois la commande envoyée (le timer ne libère plus le stock) */
    reservationConfirmed?: boolean
    /** Box découverte + boxes bundle trompes : les productId choisis (décrément stock à la commande) */
    trompeDiscoverySelection?: string[]
}

export type Coordinates = {
    lat: number
    lng: number
} | null

export type CustomerInfo = {
    firstName: string
    lastName: string
    phone: string
    /** Email pour recevoir le récap et les notifications (optionnel) */
    email?: string
    address: string
    addressCoordinates: Coordinates
    wantsDelivery: boolean
    date: string
    time: string
    /** Instructions pour le livreur (code, étage, sonner 2 fois…) */
    deliveryInstructions?: string
}

// --- Product Overrides (admin) ---
export type ProductOverride = {
    name?: string
    description?: string
    price?: number
    originalPrice?: number
    image?: string
    /** Galerie d'images (ne pas écraser si absent — on garde celles du produit de base) */
    images?: string[]
    /** null = supprimer l’override Firebase (revenir aux badges du catalogue) */
    badges?: ProductBadge[] | null
    sizes?: ProductSize[]
    /** false = rupture de stock */
    available?: boolean
    /** Requis pour les produits créés par l'admin */
    category?: ProductCategory
    /** true = produit créé par l'admin (pas dans constants.ts) */
    isCustom?: boolean
    /** true = produit épinglé en haut de la liste */
    pinned?: boolean
    /** Cadre doré « nouveauté » (boutique) — pilotable depuis l’admin avec le badge Nouveauté */
    highlightAsNew?: boolean
}

export type ProductOverrideMap = Record<string, ProductOverride>

export type AuthUser = {
    uid: string
    email: string | null
    displayName: string | null
}

// --- Session active (client en train de commander) ---
export type ActiveSession = {
    sessionId: string
    updatedAt: number
    cartItemCount: number
    cartTotal: number
    deliveryMode: 'livraison' | 'retrait' | null
    city: string | null
    hasPhone: boolean
    hasDate: boolean
    source: 'web'
}

// Simplifié pour l'interface (les types complets sont dans firebase.ts)
export type UserProfileSummary = {
    email: string
    firstName: string
    lastName: string
    phone?: string
    birthday?: string
    loyaltyPoints: number
    lifetimePoints: number
    tier: LoyaltyTier
    canClaimInstagram: boolean
    canClaimTikTok: boolean
}
