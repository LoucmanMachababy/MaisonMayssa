import type { Product } from './types'

export const PHONE_E164 = '33619871005'

/** PayPal.Me : paiement optionnel après commande */
export const PAYPAL_ME_USER = 'RoumayssaGhazi'

/** Parrainage : réduction 1ère commande du filleul (€) et points offerts au parrain */
export const REFERRAL_DISCOUNT_EUR = 5
export const REFERRAL_POINTS_TO_REFERRER = 15

/** Nombre max de commandes par créneau de livraison (affiche "Plus que X places") */
export const DELIVERY_SLOT_MAX_CAPACITY = 5

/** ID du trompe-l'œil mystère (Fraise) — le premier qui trouve a 10 % dessus */
export const MYSTERY_TROMPE_LOEIL_ID = 'trompe-loeil-fraise'

/** Box « découverte » : 5 trompe-l'œil au choix (exclusions gérées dans l’admin + Firebase). */
export const BOX_DECOUVERTE_TROMPE_PRODUCT_ID = 'box-decouverte-trompe-5'
export const DISCOVERY_BOX_TROMPE_SLOT_COUNT = 5

/** Box fruitée : 6 trompe-l'œil distincts au choix parmi 7 saveurs fruitées. */
export const FRUITEE_BOX_TROMPE_SLOT_COUNT = 6

/** Autres boxes trompe-l'œil : le client choisit une fois chaque saveur parmi la liste du bundle (stock comme la box découverte). */
export const CUSTOMIZABLE_TROMPE_BUNDLE_BOX_IDS = [
  'box-trompe-loeil',
  'box-fruitee',
  'box-de-tout',
] as const

export function isCustomizableTrompeBundleBoxId(id: string): boolean {
  return (CUSTOMIZABLE_TROMPE_BUNDLE_BOX_IDS as readonly string[]).includes(id)
}

/** Box avec liste de trompes enregistrée sur la ligne de commande (`trompeDiscoverySelection`). */
export function isTrompeBoxWithStoredSelection(baseId: string): boolean {
  return baseId === BOX_DECOUVERTE_TROMPE_PRODUCT_ID || isCustomizableTrompeBundleBoxId(baseId)
}

/** Précommande trompe-l'œil : à récupérer sous 3 j après préco. Dispo gérée par Firebase (jours + stock). */
const TROMPE_LOEIL_PREORDER = { availableFrom: '2026-02-13', daysToPickup: 3 }

/** Première date de récupération pour les produits classiques (cookies, brownies, minibox, etc.) — les ventes commencent officiellement à partir de ce jour. Avant cette date, les clients ne peuvent que précommander pour ce jour et après. */
export const FIRST_PICKUP_DATE_CLASSIC = '2026-02-18'
export const FIRST_PICKUP_DATE_CLASSIC_LABEL = 'mercredi 18 février 2026'

export const PRODUCTS: Product[] = [
    // Trompe-l'œil — Best sellers, bientôt disponibles, précommande à partir du 14/02/2026
    {
        id: 'box-trompe-loeil',
        name: "Box Trompe l'œil — Les 7 saveurs",
        description: "L'intégrale des 7 trompe-l'œil dans une seule box : Mangue, Citron, Pistache, Passion, Framboise, Cacahuète, Fraise.",
        price: 50,
        originalPrice: 55.5,
        category: "Trompe l'œil",
        image: '/Boxe-trompeloeil.webp',
        badges: ['best-seller'],
        preorder: TROMPE_LOEIL_PREORDER,
        bundleProductIds: [
            'trompe-loeil-mangue',
            'trompe-loeil-citron',
            'trompe-loeil-pistache',
            'trompe-loeil-passion',
            'trompe-loeil-framboise',
            'trompe-loeil-cacahuete',
            'trompe-loeil-fraise',
        ],
    },
    {
        id: 'trompe-loeil-mangue',
        name: "Trompe l'œil Mangue",
        description: 'Morceaux de mangue, coulis, ganache mangue, coque chocolat blanc.',
        price: 6,
        originalPrice: 7.5,
        category: "Trompe l'œil",
        image: '/mangue-fermer.webp',
        images: ['/mangue-fermer.webp', '/mangue-ouverte.webp'],
        badges: ['best-seller'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-citron',
        name: "Trompe l'œil Citron",
        description: 'Zestes et jus, crème citron, ganache citron, pâte à sucre.',
        price: 6,
        originalPrice: 7.5,
        category: "Trompe l'œil",
        image: '/citron-fermer.webp',
        // La deuxième vue existe en JPEG dans public/citron-ouvert.jpeg
        images: ['/citron-fermer.webp', '/citron-ouvert.jpeg'],
        badges: ['best-seller'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-pistache',
        name: "Trompe l'œil Pistache",
        description: 'Pâte, crème, ganache, éclats de pistache, pâte à sucre.',
        price: 7,
        originalPrice: 8.5,
        category: "Trompe l'œil",
        image: '/pistache-fermer.webp',
        images: ['/pistache-fermer.webp', '/pistache-couper.webp'],
        badges: ['best-seller'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-passion',
        name: "Trompe l'œil Passion",
        description: 'Fruit de la passion, coulis, crème, ganache, pâte à sucre.',
        price: 6,
        originalPrice: 7.5,
        category: "Trompe l'œil",
        image: '/passion-fermer.webp',
        images: ['/passion-fermer.webp', '/passion-ouverte.webp'],
        badges: ['best-seller'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-framboise',
        name: "Trompe l'œil Framboise",
        description: 'Framboises fraîches, coulis, crème, ganache framboise, pâte à sucre.',
        price: 6,
        originalPrice: 7.5,
        category: "Trompe l'œil",
        image: '/framboise-fermer.webp',
        images: ['/framboise-fermer.webp', '/framboise-ouverte.webp'],
        badges: ['best-seller'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-cacahuete',
        name: "Trompe l'œil Cacahuète",
        description: 'Cacahuètes caramélisées, praliné, ganache, crème beurre de cacahuète, pâte à sucre.',
        price: 7,
        originalPrice: 8.5,
        category: "Trompe l'œil",
        image: '/cacahuete-fermer.webp',
        images: ['/cacahuete-fermer.webp', '/cacahuete-ouverte.webp'],
        badges: ['best-seller'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-fraise',
        name: "Trompe l'œil Fraise",
        description: 'Fraises fraîches, coulis, crème, ganache fraise, pâte à sucre.',
        price: 7,
        originalPrice: 8.5,
        category: "Trompe l'œil",
        image: '/Fraise.webp',
        images: ['/Fraise.webp', '/fraise-ouverte.webp'],
        badges: ['nouveau'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-myrtille',
        name: "Trompe l'œil Myrtille",
        description: 'Ganache vanille, coulis et morceaux de myrtilles, biscuit moelleux.',
        price: 6,
        originalPrice: 7.5,
        category: "Trompe l'œil",
        image: '/myrtille-fermer.webp',
        images: ['/myrtille-fermer.webp', '/myrtille-ouvert.webp'],
        badges: ['nouveau'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-cafe',
        name: "Trompe l'œil Café",
        description: 'Mousse mascarpone café, cœur fondant café, biscuit imbibé café, cacao.',
        price: 6,
        originalPrice: 7.5,
        category: "Trompe l'œil",
        image: '/cafe-fermer.webp',
        images: ['/cafe-fermer.webp', '/cafe-ouvert.webp'],
        badges: ['nouveau'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-vanille',
        name: "Trompe l'œil Gousse de Vanille",
        description: 'Ganache vanille, coulis fondant, biscuit moelleux.',
        price: 6,
        originalPrice: 7.5,
        category: "Trompe l'œil",
        image: '/gousse-de-vanille-fermer.webp',
        images: ['/gousse-de-vanille-fermer.webp', '/gousse-de-vanille-ouvert.webp'],
        badges: ['nouveau'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-popcorn',
        name: "Trompe l'œil Popcorn",
        description: 'Mousse légère, cœur caramel, éclats croustillants, biscuit moelleux.',
        price: 6,
        originalPrice: 7.5,
        category: "Trompe l'œil",
        image: '/trompe-loeil-popcorn.webp',
        badges: ['nouveau'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-pecan',
        name: "Trompe l'œil Noix de pécan",
        description: 'Praliné noix de pécan, caramel beurre salé, ganache onctueuse, biscuit moelleux, coque chocolat.',
        price: 7,
        originalPrice: 8.5,
        category: "Trompe l'œil",
        image: '/noix-de-pecan.webp',
        badges: ['nouveau'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-amande',
        name: "Trompe l'œil Amande",
        description: "Crème d'amande, amandes effilées, ganache vanille, biscuit moelleux.",
        price: 8.5,
        originalPrice: 10,
        category: "Trompe l'œil",
        image: '/trompe-loeil-amande.webp',
        badges: ['nouveau'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-cabosse',
        name: "Trompe l'œil Cabosse de Cacao",
        description: 'Ganache chocolat intense, mousse cacao, praliné, biscuit chocolat.',
        price: 7.5,
        originalPrice: 9,
        category: "Trompe l'œil",
        image: '/trompe-loeil-cabosse.webp',
        badges: ['nouveau'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'trompe-loeil-grappe-banane',
        name: "Trompe l'œil Grappe de Banane",
        description: 'Coulis banane, morceaux de banane, crème vanille, coque chocolat blanc.',
        price: 6,
        originalPrice: 7.5,
        category: "Trompe l'œil",
        image: '/trompe-loeil-grappe-de-banane.webp',
        badges: ['nouveaute'],
        preorder: TROMPE_LOEIL_PREORDER,
        pinned: true,
        highlightAsNew: true,
    },
    {
        id: 'box-fruitee',
        name: '🍓 Box Fruitée',
        description:
            'Compose ta box : 6 trompe-l\'œil fruités au choix parmi Mangue, Passion, Fraise, Framboise, Myrtille, Citron, Banane (7 saveurs — 6 à choisir).',
        price: 35,
        category: "Trompe l'œil",
        image: '/Boxe-trompeloeil.webp',
        badges: ['nouveau'],
        preorder: TROMPE_LOEIL_PREORDER,
        bundleProductIds: [
            'trompe-loeil-mangue',
            'trompe-loeil-passion',
            'trompe-loeil-fraise',
            'trompe-loeil-framboise',
            'trompe-loeil-myrtille',
            'trompe-loeil-citron',
            'trompe-loeil-grappe-banane',
        ],
    },
    {
        id: BOX_DECOUVERTE_TROMPE_PRODUCT_ID,
        name: "Box découverte — 5 trompe-l'œil au choix",
        description:
            'Composez votre box : 5 trompe-l’œil différents parmi les saveurs proposées (selon disponibilité et carte du moment).',
        price: 40,
        originalPrice: 42.5,
        category: "Trompe l'œil",
        image: '/Boxe-trompeloeil.webp',
        badges: ['nouveau'],
        preorder: TROMPE_LOEIL_PREORDER,
    },
    {
        id: 'box-de-tout',
        name: "La box de tout",
        description: "La totalité des trompe-l'œil (12), dont la noix de pécan, pour 90 euros.",
        price: 90,
        category: "Trompe l'œil",
        image: '/Boxe2.webp',
        badges: ['best-seller'],
        preorder: TROMPE_LOEIL_PREORDER,
        bundleProductIds: [
            'trompe-loeil-mangue',
            'trompe-loeil-citron',
            'trompe-loeil-pistache',
            'trompe-loeil-passion',
            'trompe-loeil-framboise',
            'trompe-loeil-cacahuete',
            'trompe-loeil-fraise',
            'trompe-loeil-myrtille',
            'trompe-loeil-cafe',
            'trompe-loeil-vanille',
            'trompe-loeil-popcorn',
            'trompe-loeil-pecan',
            'trompe-loeil-amande',
            'trompe-loeil-cabosse',
        ],
    },

    // Mini gourmandises (avec coulis au choix : Nutella, Crème Bueno, Spéculoos, Pistache)
    {
        id: 'mini-box-brownies',
        name: 'Box Mini Brownies',
        description: 'Mini brownies fondants avec coulis au choix (Nutella, Bueno, Spéculoos, Pistache).',
        price: 4.5,
        category: 'Mini Gourmandises',
        image: '/box-brownies.webp',
        sizes: [
            { label: 'Petite (≈200g)', ml: 200, price: 4.5 },
            { label: 'Grande (≈400g)', ml: 400, price: 8.5 },
        ],
    },
    {
        id: 'mini-box-cookies',
        name: 'Box Mini Cookies',
        description: 'Mini cookies croustillants avec coulis au choix (Nutella, Bueno, Spéculoos, Pistache).',
        price: 4,
        category: 'Mini Gourmandises',
        image: '/box-cookie.webp',
        sizes: [
            { label: 'Petite (≈180g)', ml: 180, price: 4 },
            { label: 'Grande (≈350g)', ml: 350, price: 7 },
        ],
    },
    {
        id: 'mini-box-pancakes',
        name: 'Box Mini Pancakes',
        description: 'Mini pancakes moelleux avec coulis au choix (Nutella, Bueno, Spéculoos, Pistache).',
        price: 4.5,
        category: 'Mini Gourmandises',
        image: '/box-pancakes.webp',
        sizes: [
            { label: 'Petite (≈200g)', ml: 200, price: 4.5 },
            { label: 'Grande (≈400g)', ml: 400, price: 8 },
        ],
    },
    {
        id: 'mini-box-mixte',
        name: 'LA MINI BOX MIXTE',
        description: 'Mini brownies + mini cookies + mini pancakes, coulis au choix.',
        price: 13,
        category: 'Boxes',
        image: '/La-mini-box-mixte.webp',
        badges: ['best-seller'],
        sizes: [
            { label: 'Box mixte S (~300g)', ml: 300, price: 13 },
            { label: 'Box mixte L (~600g)', ml: 600, price: 24 },
        ],
    },

    // Brownies
    {
        id: 'brownie-pistache-framboise',
        name: 'Pistache Framboise',
        description: 'Brownie fondant à la pistache, relevé par la fraîcheur de la framboise.',
        price: 3.5,
        category: 'Brownies',
        image: '/brownie-pistache-framboise.webp',
        badges: ['coup-de-coeur'],
    },
    {
        id: 'brownie-speculoos-framboise',
        name: 'Spéculoos Framboise',
        description: 'Fondant chocolaté, douceur épicée du spéculoos et touche fruitée.',
        price: 3.5,
        category: 'Brownies',
        image: '/brownie-speculoos-framboise.webp',
    },
    {
        id: 'brownie-fraise-vanille',
        name: 'Fraise Vanille',
        description: 'Brownie moelleux aux notes douces de vanille et de fraise.',
        price: 3.5,
        category: 'Brownies',
        image: '/brownie-fraise-vanille.webp',
    },
    {
        id: 'brownie-caramel-cacahuete',
        name: 'Caramel Cacahuète',
        description: 'Caramel fondant et cacahuète croquante sur une base chocolatée.',
        price: 3.5,
        category: 'Brownies',
        image: '/brownie-caramel-cacahuete.webp',
    },
    {
        id: 'brownie-el-mordjene',
        name: 'El Mordjene',
        description: 'La pâte à tartiner El Mordjene coulante au cœur d\'un brownie ultra fondant.',
        price: 3.5,
        category: 'Brownies',
        image: '/brownie-elmordjene-kinder.webp',
        badges: ['populaire'],
    },
    {
        id: 'brownie-el-mordjen-kinder',
        name: 'El Mordjene Kinder',
        description: 'Ultra gourmand, cœur fondant El Mordjene et éclats de Kinder Bueno.',
        price: 3.5,
        category: 'Brownies',
        image: '/brownie-elmordjene-kinder.webp',
        badges: ['populaire'],
    },
    {
        id: 'brownie-nutella-oreo',
        name: 'Nutella Oreo',
        description: 'Chocolat intense, Nutella fondant et croquant d\'Oreo.',
        price: 3.5,
        category: 'Brownies',
        image: '/brownie-nutella-oreo.webp',
        badges: ['best-seller'],
    },
    {
        id: 'brownie-patissiere-pecan',
        name: 'Pâtissière Pécan',
        description: 'Brownie crémeux à la crème pâtissière et pécan croquante.',
        price: 4,
        category: 'Brownies',
        image: '/brownie-patissiere-pecan.webp',
    },
    {
        id: 'brownie-tiramisu-cafe',
        name: 'Tiramisu Café',
        description: 'Inspiré du tiramisu, aux délicates notes de café.',
        price: 4,
        category: 'Brownies',
        image: '/brownie-tiramisu-cafe.webp',
    },
    {
        id: 'brownie-creme-brule-vanille',
        name: 'Crème Brûlée Vanille',
        description: 'Crémeux vanille avec une légère touche caramélisée.',
        price: 4,
        category: 'Brownies',
        image: '/brownie-creme-bruler.webp',
    },

    // Cookies
    {
        id: 'cookie-nutella-kinder-bueno',
        name: 'Nutella Kinder Bueno',
        description: 'Cœur fondant au Nutella sublimé par le croquant du Kinder Bueno.',
        price: 3,
        category: 'Cookies',
        image: '/cookie-kinder-bueno.webp',
        badges: ['best-seller'],
    },
    {
        id: 'cookie-nutella-oreo',
        name: 'Nutella Oreo',
        description: 'Intensément gourmand, entre chocolat fondant et éclats d\'Oreo.',
        price: 3,
        category: 'Cookies',
        image: '/Cookie-nutella-oreo.webp',
        badges: ['populaire'],
    },
    {
        id: 'cookie-speculoos-framboise',
        name: 'Spéculoos Framboise',
        description: 'Douceur épicée du spéculoos relevée par une framboise acidulée.',
        price: 3,
        category: 'Cookies',
        image: '/cookie-speculos-framboise.webp',
    },
    {
        id: 'cookie-nutella-fraise',
        name: 'Nutella Fraise',
        description: 'L\'alliance parfaite du chocolat fondant et de la fraîcheur de la fraise.',
        price: 3,
        category: 'Cookies',
        image: '/cookie-nutella-fraise.webp',
    },
    {
        id: 'cookie-fruits-rouges-bois',
        name: 'Fruits Rouges des Bois',
        description: 'Fondant et fruité, relevé par un coulis de fruits rouges.',
        price: 3,
        category: 'Cookies',
        image: '/cookie--fruit-rouges-des-bois.webp',
        badges: ['nouveau'],
    },
    {
        id: 'cookie-chocolat-blanc-framboise',
        name: 'Chocolat Blanc & Framboise',
        description: 'Douceur fondante du chocolat blanc réveillée par la framboise.',
        price: 3,
        category: 'Cookies',
        image: '/cookie-chocolat-blanc-framboise.webp',
    },
    {
        id: 'cookie-caramel-daim',
        name: 'Caramel Daim',
        description: 'Crème pâtissière onctueuse, éclats de Daim et caramel fondant.',
        price: 3,
        category: 'Cookies',
        image: '/cookie-caramel-daim.webp',
    },
    {
        id: 'cookie-caramel-cacahuete',
        name: 'Caramel Cacahuète',
        description: 'Crème pâtissière douce, caramel beurre salé et cacahuète croquante.',
        price: 3,
        category: 'Cookies',
        image: '/cookie-caramel-cacahuete.webp',
    },
    {
        id: 'cookie-pistache-framboise',
        name: 'Pistache Framboise',
        description: 'Subtil contraste entre pistache douce et framboise fruitée.',
        price: 3,
        category: 'Cookies',
        image: '/cookie-pistache-framboise.webp',
    },
    {
        id: 'cookie-praline-noix-pecan',
        name: 'Praliné Noix de Pécan',
        description: 'Crème pâtissière onctueuse et praliné aux éclats de noix de pécan.',
        price: 4,
        category: 'Cookies',
        image: '/cookie-praliné-noix-de-pecan.webp',
    },
    {
        id: 'cookie-tiramisu-cafe',
        name: 'Tiramisu Café',
        description: 'Inspiré du tiramisu, doux et délicatement café.',
        price: 4,
        category: 'Cookies',
        image: '/cookie-tiramisu-cafe.webp',
    },
    {
        id: 'cookie-creme-brulee-vanille',
        name: 'Crème Brûlée Vanille',
        description: 'Crémeux vanillé avec une touche caramélisée.',
        price: 4,
        category: 'Cookies',
        image: '/cookie-creme-bruler-vanille.webp',
    },

    // Layer cups
    {
        id: 'layer-fraise-vanille',
        name: 'Fraise Vanille',
        description: 'Douceur crémeuse aux saveurs de fraise et vanille.',
        price: 4,
        category: 'Layer Cups',
        image: '/layer-cup-fraise-vanille.webp',
        badges: ['coup-de-coeur'],
        sizes: [
            { label: '250 ml', ml: 250, price: 4 },
            { label: '360 ml', ml: 360, price: 6 },
            { label: '500 ml', ml: 500, price: 8 },
        ],
    },
    {
        id: 'layer-pistache-fraise',
        name: 'Pistache Fraise',
        description: 'Onctueux à la pistache relevé par la fraîcheur de la fraise.',
        price: 4,
        category: 'Layer Cups',
        image: '/layer-cup-pistache-fraise.webp',
        badges: ['coup-de-coeur'],
        sizes: [
            { label: '250 ml', ml: 250, price: 4 },
            { label: '360 ml', ml: 360, price: 6 },
            { label: '500 ml', ml: 500, price: 8 },
        ],
    },
    {
        id: 'layer-mangue-passion',
        name: 'Mangue Passion',
        description: 'Explosion tropicale de mangue et fruit de la passion.',
        price: 4,
        category: 'Layer Cups',
        image: '/layer-cup-mangue-passion.webp',
        badges: ['nouveau'],
        sizes: [
            { label: '250 ml', ml: 250, price: 4 },
            { label: '360 ml', ml: 360, price: 6 },
            { label: '500 ml', ml: 500, price: 8 },
        ],
    },
    {
        id: 'layer-lotus-speculoos',
        name: 'Lotus Spéculoos',
        description: 'Crème onctueuse aux notes épicées du spéculoos Lotus.',
        price: 4,
        category: 'Layer Cups',
        image: '/layer-cup-speculoos.webp',
        badges: ['populaire'],
        sizes: [
            { label: '250 ml', ml: 250, price: 4 },
            { label: '360 ml', ml: 360, price: 6 },
            { label: '500 ml', ml: 500, price: 8 },
        ],
    },
    {
        id: 'layer-framboise-speculoos',
        name: 'Framboise Spéculoos',
        description: 'Douceur du spéculoos relevée par l\'acidulé de la framboise.',
        price: 4,
        category: 'Layer Cups',
        image: '/layer-cup-framboise-speculoos.webp',
        sizes: [
            { label: '250 ml', ml: 250, price: 4 },
            { label: '360 ml', ml: 360, price: 6 },
            { label: '500 ml', ml: 500, price: 8 },
        ],
    },
    {
        id: 'layer-nutella-oreo',
        name: 'Nutella Oreo',
        description: 'Gourmandise chocolatée au Nutella et éclats d\'Oreo.',
        price: 4,
        category: 'Layer Cups',
        image: '/layer-cup-nutella-oreo.webp',
        badges: ['best-seller'],
        sizes: [
            { label: '250 ml', ml: 250, price: 4 },
            { label: '360 ml', ml: 360, price: 6 },
            { label: '500 ml', ml: 500, price: 8 },
        ],
    },

    // Boxes gourmandes
    {
        id: 'box-surprise',
        name: '🎁 Box surprise',
        description: 'Choisissez votre budget et l\'occasion (anniversaire, Ramadan, apéro, cadeau…). On compose une sélection surprise pour vous.',
        price: 25,
        category: 'Boxes',
        image: '/box-mixte.webp',
        badges: ['coup-de-coeur'],
        sizes: [
            { label: 'Budget 20 €', ml: 20, price: 20 },
            { label: 'Budget 25 €', ml: 25, price: 25 },
            { label: 'Budget 30 €', ml: 30, price: 30 },
            { label: 'Budget 35 €', ml: 35, price: 35 },
            { label: 'Budget 50 €', ml: 50, price: 50 },
        ],
    },
    {
        id: 'abonnement-box-mois',
        name: '📦 Abonnement Box du mois',
        description: '1 box surprise par mois. On te recontacte pour le paiement et la composition. Idéal pour se faire plaisir sans choisir.',
        price: 25,
        category: 'Boxes',
        image: '/box-mixte.webp',
        badges: ['coup-de-coeur'],
    },
    {
        id: 'box-cookies',
        name: '🍪 Boxes Cookies',
        description: 'Assortiment de cookies au choix.',
        price: 15,
        category: 'Boxes',
        image: '/box-cookies.webp',
        sizes: [
            { label: 'Box de 6 cookies', ml: 6, price: 15 },
            { label: 'Box de 12 cookies', ml: 12, price: 35 },
        ],
    },
    {
        id: 'box-brownies',
        name: '🍫 Boxes Brownies',
        description: 'Assortiment de brownies au choix.',
        price: 18,
        category: 'Boxes',
        image: '/boxe-brownies.webp',
        sizes: [
            { label: 'Box de 6 brownies', ml: 6, price: 18 },
            { label: 'Box de 12 brownies', ml: 12, price: 38 },
        ],
    },
    {
        id: 'box-mixte',
        name: '🍪🍫 Boxes Mixtes',
        description: 'Un équilibre parfait entre cookies et brownies, parfums au choix.',
        price: 25,
        category: 'Boxes',
        image: '/box-mixte.webp',
        badges: ['coup-de-coeur', 'best-seller'],
        sizes: [
            { label: 'Box mixte 6 pièces (3 cookies + 3 brownies)', ml: 6, price: 25 },
            { label: 'Box mixte 12 pièces (6 cookies + 6 brownies)', ml: 12, price: 40 },
        ],
    },
    // Tiramisus personnalisés
    {
        id: 'tiramisu-personnalise',
        name: '🍰 TIRAMISUS PERSONNALISÉS',
        description: 'Crée ton tiramisu selon tes envies ✨',
        price: 3.5,
        category: 'Tiramisus',
        image: '/Tiramisu.webp',
        badges: ['best-seller', 'populaire'],
        sizes: [
            { label: 'Petit format', ml: 1, price: 3.5 },
            { label: 'Grand format', ml: 2, price: 6 },
        ],
    },
]

/** Nombre de saveurs distinctes à choisir pour une box « trompe au choix » (découverte, fruitée, etc.). */
export function getTrompeBundleSelectionSlotCount(baseId: string): number {
  if (baseId === BOX_DECOUVERTE_TROMPE_PRODUCT_ID) return DISCOVERY_BOX_TROMPE_SLOT_COUNT
  if (baseId === 'box-fruitee') return FRUITEE_BOX_TROMPE_SLOT_COUNT
  if (isCustomizableTrompeBundleBoxId(baseId)) {
    const p = PRODUCTS.find((x) => x.id === baseId)
    return p?.bundleProductIds?.length ?? 0
  }
  return 0
}
