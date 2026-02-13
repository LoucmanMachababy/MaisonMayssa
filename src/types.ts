export type Channel = 'whatsapp' | 'instagram' | 'copier'

export type ProductCategory =
    | "Trompe l'oeil"
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

export type ProductBadge = 'best-seller' | 'nouveau' | 'coup-de-coeur' | 'populaire'

export type Product = {
    id: string
    name: string
    description?: string
    price: number
    category: ProductCategory
    image?: string
    sizes?: ProductSize[]
    /** Badges affichés sur la carte (Best seller, Nouveau, etc.) */
    badges?: ProductBadge[]
    /** Si défini, produit en précommande (disponible à partir de availableFrom, à récupérer sous daysToPickup j après préco.) */
    preorder?: ProductPreorder
}

export type CartItem = {
    product: Product
    quantity: number
    /** Timestamp (ms) d'expiration de la réservation (trompe l'oeil) */
    reservationExpiresAt?: number
    /** True une fois la commande envoyée (le timer ne libère plus le stock) */
    reservationConfirmed?: boolean
}

export type Coordinates = {
    lat: number
    lng: number
} | null

export type CustomerInfo = {
    firstName: string
    lastName: string
    phone: string
    address: string
    addressCoordinates: Coordinates
    wantsDelivery: boolean
    date: string
    time: string
}

// --- Types Fidélité ---
export type LoyaltyTier = 'Douceur' | 'Gourmand' | 'Prestige'

export type RewardType = 'surprise_maison_mayssa' | 'remise_5e' | 'mini_box' | 'box_fidelite'

export type AuthUser = {
    uid: string
    email: string | null
    displayName: string | null
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
