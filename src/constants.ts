import type { Product } from './types'

export const PHONE_E164 = '33619871005'

export const PRODUCTS: Product[] = [
    // Mini gourmandises
    {
        id: 'mini-box-brownies-6',
        name: 'Mini Brownies (box de 6)',
        price: 4.5,
        category: 'Mini Gourmandises',
        image: '/Box-gourmandise.jpeg',
    },
    {
        id: 'mini-box-cookies-6',
        name: 'Mini Cookies (box de 6)',
        price: 4,
        category: 'Mini Gourmandises',
        image: '/Box-gourmandise.jpeg',
    },
    {
        id: 'mini-box-pancakes-6',
        name: 'Mini Pancakes (box de 6)',
        price: 4.5,
        category: 'Mini Gourmandises',
        image: '/Box-gourmandise.jpeg',
    },
    {
        id: 'mini-box-mix-15',
        name: 'Box Mixte mini (15 pièces)',
        price: 13,
        category: 'Mini Gourmandises',
        image: '/Box-gourmandise.jpeg',
    },

    // Brownies
    {
        id: 'brownie-pistache-framboise',
        name: 'Brownie Pistache Framboise',
        price: 3.5,
        category: 'Brownies',
        image: '/Brownie.jpeg',
    },
    {
        id: 'brownie-caramel-cacahuete',
        name: 'Brownie Caramel Cacahuète',
        price: 3.5,
        category: 'Brownies',
        image: '/Brownie.jpeg',
    },
    {
        id: 'brownie-tiramisu-cafe',
        name: 'Brownie Tiramisu Café',
        price: 4,
        category: 'Brownies',
        image: '/Brownie.jpeg',
    },

    // Cookies
    {
        id: 'cookie-nutella-kinder',
        name: 'Cookie Nutella Kinder',
        price: 3,
        category: 'Cookies',
        image: '/Cookie.jpeg',
    },
    {
        id: 'cookie-fruit-rouge',
        name: 'Cookie Fruits rouges',
        price: 3,
        category: 'Cookies',
        image: '/Cookie.jpeg',
    },
    {
        id: 'cookie-creme-brulee',
        name: 'Cookie Crème brûlée vanille',
        price: 4,
        category: 'Cookies',
        image: '/Cookie.jpeg',
    },

    // Layer cups
    {
        id: 'layer-250',
        name: 'Layer Cup 250 ml (parfum au choix)',
        price: 4,
        category: 'Layer Cups',
        image: '/layer-cup.jpeg',
    },
    {
        id: 'layer-360',
        name: 'Layer Cup 360 ml (parfum au choix)',
        price: 6,
        category: 'Layer Cups',
        image: '/layer-cup.jpeg',
    },
    {
        id: 'layer-500',
        name: 'Layer Cup 500 ml (parfum au choix)',
        price: 8,
        category: 'Layer Cups',
        image: '/layer-cup.jpeg',
    },

    // Boxes gourmandes
    {
        id: 'box-cookie-6',
        name: 'Box Cookies x6 (parfums au choix)',
        price: 18,
        category: 'Boxes',
        image: '/Box-gourmandise.jpeg',
    },
    {
        id: 'box-brownie-6',
        name: 'Box Brownies x6 (parfums au choix)',
        price: 20,
        category: 'Boxes',
        image: '/Box-gourmandise.jpeg',
    },
    {
        id: 'box-mixte-6',
        name: 'Box Mixte x6 (3 cookies + 3 brownies)',
        price: 25,
        category: 'Boxes',
        image: '/Box-gourmandise.jpeg',
    },
]
