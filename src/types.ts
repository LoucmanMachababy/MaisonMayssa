export type Channel = 'whatsapp' | 'instagram' | 'snapchat'

export type ProductCategory =
    | 'Mini Gourmandises'
    | 'Brownies'
    | 'Cookies'
    | 'Layer Cups'
    | 'Boxes'

export type Product = {
    id: string
    name: string
    price: number
    category: ProductCategory
    image?: string
}

export type CartItem = {
    product: Product
    quantity: number
}

export type CustomerInfo = {
    firstName: string
    lastName: string
    phone: string
    address: string
    wantsDelivery: boolean
    date: string
    time: string
}
