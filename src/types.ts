export type Channel = 'whatsapp' | 'instagram'

export type ProductCategory =
    | 'Mini Gourmandises'
    | 'Brownies'
    | 'Cookies'
    | 'Layer Cups'
    | 'Boxes'
    | 'Tiramisus'

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
}

export type CartItem = {
    product: Product
    quantity: number
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
