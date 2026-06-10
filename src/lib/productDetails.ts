export interface ProductDetailContent {
  tagline: string
  paragraphs: string[]
  composition: string[]
  conservation?: string
}

/** Descriptions longues pour les fiches produit */
export const PRODUCT_DETAILS: Record<string, ProductDetailContent> = {
  'trompe-loeil-mangue': {
    tagline: 'L\'exotisme en trompe-l\'œil — notre best-seller',
    paragraphs: [
      'Notre mangue trompe-l\'œil est sculptée à la main pour reproduire fidèlement un fruit mûr : dégradé orangé, texture veloutée, finition mate soignée. À la première bouchée, l\'illusion cède place à une explosion tropicale.',
      'Le cœur révèle des morceaux de mangue fraîche, un coulis parfumé et une ganache onctueuse à la mangue, le tout enrobé d\'une coque en chocolat blanc qui fond délicatement en bouche.',
      'Une création signature Maison Mayssa, idéale en dessert individuel, en cadeau ou pour impressionner vos invités autour d\'un café.',
    ],
    composition: ['Morceaux de mangue fraîche', 'Coulis de mangue', 'Ganache mangue', 'Coque chocolat blanc', 'Biscuit moelleux'],
    conservation: 'À conserver au réfrigérateur et déguster dans les 48 h suivant le retrait.',
  },
  'trompe-loeil-vanille': {
    tagline: 'La gousse de vanille Bourbon, en pâtisserie d\'exception',
    paragraphs: [
      'Inspirée de la gousse de vanille Bourbon, cette création joue sur les contrastes : enveloppe sombre et satinée, intérieur crémeux aux notes profondément vanillées.',
      'Une ganache vanille parfumée aux grains de vanille, un coulis fondant et un biscuit moelleux composent un équilibre délicat entre douceur et intensité aromatique.',
      'Pour les amateurs de classics raffinés — une alternative fruitée aux trompe-l\'œil les plus colorés.',
    ],
    composition: ['Ganache vanille Bourbon', 'Coulis fondant vanille', 'Biscuit moelleux', 'Finition pâte à sucre / chocolat'],
    conservation: 'À conserver au réfrigérateur, à déguster sous 48 h.',
  },
  'trompe-loeil-cacahuete': {
    tagline: 'Croquant, praliné, irrésistible',
    paragraphs: [
      'La cacahuète trompe-l\'œil est l\'une de nos créations les plus gourmandes : coque texturée imitant parfaitement l\'écorce d\'une cacahuète grillée, avec ce petit relief qui fait sourire avant même la dégustation.',
      'À l\'intérieur : cacahuètes caramélisées, praliné maison, ganache onctueuse et crème au beurre de cacahuète. Un contraste entre le croquant et le fondant qui séduit les amateurs de saveurs intenses.',
      'Parfaite pour les fans de chocolat-noisette et de praliné artisanal.',
    ],
    composition: ['Cacahuètes caramélisées', 'Praliné maison', 'Ganache', 'Crème beurre de cacahuète', 'Coque chocolat / pâte à sucre'],
    conservation: 'À conserver au frais, à déguster sous 48 h.',
  },
  'trompe-loeil-framboise': {
    tagline: 'Fruité, acidulé, lumineux',
    paragraphs: [
      'Une framboise géante au rendu bluffant : texture granuleuse, couleur rubis intense, finition soignée qui trompe l\'œil dès le premier regard.',
      'Le cœur associe framboises fraîches, coulis acidulé, crème légère et ganache framboise pour un équilibre entre fraîcheur et gourmandise.',
      'Un trompe-l\'œil fruité par excellence, apprécié pour sa légèreté en bouche.',
    ],
    composition: ['Framboises fraîches', 'Coulis framboise', 'Crème légère', 'Ganache framboise', 'Coque pâte à sucre'],
    conservation: 'À conserver au réfrigérateur, à déguster sous 48 h.',
  },
  'trompe-loeil-passion': {
    tagline: 'Exotique et acidulé — un voyage en une bouchée',
    paragraphs: [
      'Le fruit de la passion dans toute sa splendeur visuelle : coque lisse aux reflets dorés, forme fidèle au fruit frais.',
      'À l\'intérieur, coulis de fruit de la passion, crème onctueuse et ganache parfumée pour une montée acidulée suivie d\'une douceur tropicale.',
      'Souvent associé à la mangue dans nos boxes — un duo exotique très apprécié.',
    ],
    composition: ['Fruit de la passion', 'Coulis passion', 'Crème légère', 'Ganache passion', 'Pâte à sucre'],
    conservation: 'À conserver au frais, à déguster sous 48 h.',
  },
  'trompe-loeil-pistache': {
    tagline: 'Douceur méditerranéenne et éclats croquants',
    paragraphs: [
      'Notre pistache trompe-l\'œil arbore une teinte verte naturelle et une forme arrondie qui évoque immédiatement le fruit frais.',
      'Pâte de pistache, crème onctueuse, ganache pistache et éclats de pistache torréfiée composent un profil à la fois doux, beurré et légèrement croquant.',
      'Une valeur sûre pour les amateurs de pistache authentique — sans artifice.',
    ],
    composition: ['Pâte de pistache', 'Crème pistache', 'Ganache pistache', 'Éclats de pistache', 'Pâte à sucre'],
    conservation: 'À conserver au réfrigérateur, à déguster sous 48 h.',
  },
  'trompe-loeil-amande': {
    tagline: 'Élégance et amande fraîche — nouveauté 2026',
    paragraphs: [
      'Sculptée pour imiter une amande fraîche, cette création mise sur une finition mate et des nervures verticales d\'un réalisme saisissant.',
      'Crème d\'amande parfumée, amandes effilées croustillantes, ganache onctueuse et biscuit moelleux : un profil doux, floral et gourmand.',
      'Une nouveauté signature qui complète parfaitement nos trompe-l\'œil fruités.',
    ],
    composition: ['Crème d\'amande', 'Amandes effilées', 'Ganache onctueuse', 'Biscuit moelleux', 'Coque chocolat / pâte à sucre'],
    conservation: 'À conserver au frais, à déguster sous 48 h.',
  },
  'trompe-loeil-popcorn': {
    tagline: 'Surprenant, croustillant, gourmand — nouveauté 2026',
    paragraphs: [
      'Un trompe-l\'œil audacieux : la forme iconique du pop-corn, en version pâtissière haut de gamme.',
      'Mousse légère aérienne, cœur caramel fondant et éclats croustillants sur un biscuit moelleux — le contraste textures fait toute la magie.',
      'Pour surprendre les curieux et les amateurs de douceur-salé revisitée.',
    ],
    composition: ['Mousse légère', 'Cœur caramel', 'Éclats croustillants', 'Biscuit moelleux', 'Glaçage miroir'],
    conservation: 'À conserver au réfrigérateur, à déguster sous 48 h.',
  },
  'trompe-loeil-pecan': {
    tagline: 'Praliné noix de pécan et caramel beurre salé',
    paragraphs: [
      'La noix de pécan dans sa forme la plus réaliste : coque brillante aux reflets ambrés, nervures profondes sculptées à la main.',
      'Praliné noix de pécan maison, caramel beurre salé et ganache onctueuse créent un profil gourmand et légèrement salé, très apprécié des amateurs de chocolat.',
      'Une création premium, au même niveau que notre cacahuète et notre cabosse de cacao.',
    ],
    composition: ['Praliné noix de pécan', 'Caramel beurre salé', 'Ganache onctueuse', 'Coque chocolat', 'Biscuit'],
    conservation: 'À conserver au frais, à déguster sous 48 h.',
  },
  'trompe-loeil-myrtille': {
    tagline: 'Bleuet intense et ganache vanille',
    paragraphs: [
      'Une myrtille géante au bleu profond et à la texture poudrée naturelle — l\'une de nos créations les plus photogéniques.',
      'Ganache vanille, coulis et morceaux de myrtilles, biscuit moelleux : un équilibre entre acidité du fruit et douceur de la vanille.',
      'Idéal pour compléter une sélection fruitée ou une box découverte.',
    ],
    composition: ['Ganache vanille', 'Coulis myrtille', 'Morceaux de myrtilles', 'Biscuit moelleux', 'Coque pâte à sucre'],
    conservation: 'À conserver au réfrigérateur, à déguster sous 48 h.',
  },
  'trompe-loeil-cafe': {
    tagline: 'L\'espresso en trompe-l\'œil',
    paragraphs: [
      'Une graine de café stylisée, brune et brillante, qui annonce immédiatement son caractère intense.',
      'Mousse mascarpone au café, cœur fondant café et biscuit imbibé : une création pour les amateurs de caféiné gourmand, entre tiramisu et trompe-l\'œil.',
      'Parfaite en fin de repas ou avec un espresso.',
    ],
    composition: ['Mousse mascarpone café', 'Cœur fondant café', 'Biscuit imbibé café', 'Cacao', 'Coque chocolat'],
    conservation: 'À conserver au frais, à déguster sous 48 h.',
  },
  'trompe-loeil-citron': {
    tagline: 'Fraîcheur acidulée et zeste parfumé',
    paragraphs: [
      'Le citron trompe-l\'œil est un classique de la maison : peau texturée jaune vif, forme ovale parfaite, finition mate réaliste.',
      'Zestes et jus de citron, crème citron, ganache acidulée et pâte à sucre composent une bouchée fraîche et lumineuse — jamais agressive.',
      'Un incontournable de nos boxes fruitées et de la box 7 saveurs.',
    ],
    composition: ['Zestes et jus de citron', 'Crème citron', 'Ganache citron', 'Pâte à sucre', 'Biscuit'],
    conservation: 'À conserver au réfrigérateur, à déguster sous 48 h.',
  },
  'trompe-loeil-cabosse': {
    tagline: 'Chocolat intense — nouveauté 2026',
    paragraphs: [
      'Inspirée de la cabosse de cacao, cette création célèbre le chocolat sous toutes ses formes : forme allongée, dégradé vert à brun, texture nervurée d\'un réalisme saisissant.',
      'Ganache chocolat intense, mousse cacao, praliné maison et biscuit chocolat : une bouchée profonde et gourmande pour les amateurs de cacao.',
      'Notre réponse aux fans de chocolat qui veulent l\'effet wow du trompe-l\'œil.',
    ],
    composition: ['Ganache chocolat intense', 'Mousse cacao', 'Praliné', 'Biscuit chocolat', 'Coque chocolat colorée'],
    conservation: 'À conserver au frais, à déguster sous 48 h.',
  },
  'trompe-loeil-fraise': {
    tagline: 'Fraîcheur rouge et douceur estivale',
    paragraphs: [
      'Une fraise généreuse au rouge éclatant, grain de pâte à sucre finement travaillé pour imiter les akènes du fruit.',
      'Fraises fraîches, coulis, crème légère, ganache fraise et pâte à sucre : une bouchée fruitée et parfumée, très appréciée au printemps et en été.',
      'Souvent commandée avec la framboise et la passion pour une box fruitée.',
    ],
    composition: ['Fraises fraîches', 'Coulis fraise', 'Crème légère', 'Ganache fraise', 'Pâte à sucre'],
    conservation: 'À conserver au réfrigérateur, à déguster sous 48 h.',
  },
  'box-trompe-loeil': {
    tagline: 'Les 7 saveurs iconiques en un seul coffret',
    paragraphs: [
      'La box 7 saveurs réunit l\'essentiel de Maison Mayssa : mangue, citron, pistache, passion, framboise, cacahuète et fraise — les trompe-l\'œil les plus demandés, présentés dans un coffret soigné.',
      'Idéale pour découvrir la maison, offrir un cadeau gourmand ou partager entre amis lors d\'un café ou d\'un apéritif sucré.',
      'Économisez par rapport à l\'achat unitaire et profitez d\'une présentation premium prête à offrir.',
    ],
    composition: ['7 trompe-l\'œil individuels', 'Coffret Maison Mayssa', 'Sélection best-sellers'],
    conservation: 'À conserver au réfrigérateur, à déguster sous 48 h après retrait.',
  },
  'box-fruitee': {
    tagline: '6 trompe-l\'œil fruités à composer',
    paragraphs: [
      'Composez votre box fruitée parmi 6 saveurs fruitées : mangue, passion, fraise, framboise, myrtille et citron.',
      'Parfaite pour les amateurs de fraîcheur et d\'acidité, les brunchs ou les cadeaux estivaux.',
      'Chaque box est préparée à la commande avec des créations fraîches du jour.',
    ],
    composition: ['6 trompe-l\'œil fruités au choix', 'Coffret présentation'],
    conservation: 'À conserver au frais, à déguster sous 48 h.',
  },
  'box-decouverte-trompe-5': {
    tagline: 'Composez votre sélection — 5 saveurs au choix',
    paragraphs: [
      'La box découverte vous laisse choisir 5 trompe-l\'œil différents parmi toute notre gamme disponible. Idéale pour tester ses favoris ou composer un coffret sur mesure.',
      'Cadeau personnalisé, première commande ou envie de variété : vous composez, nous préparons avec le même soin artisanal.',
      'Un excellent rapport qualité-prix pour découvrir plusieurs univers de saveurs en une seule commande.',
    ],
    composition: ['5 trompe-l\'œil au choix', 'Coffret transparent / carton premium'],
    conservation: 'À conserver au réfrigérateur, à déguster sous 48 h.',
  },
  'mini-box-trompe-loeil-5': {
    tagline: '5 mini créations — saveurs de la semaine',
    paragraphs: [
      'La mini box réunit 5 mini trompe-l\'œil dont les saveurs sont choisies par la maison selon la semaine et les disponibilités.',
      'Format idéal pour une petite gourmandise, un cadeau accessible ou goûter plusieurs créations en portion réduite.',
      'Même exigence artisanale, en format mini.',
    ],
    composition: ['5 mini trompe-l\'œil', 'Sélection hebdomadaire Maison Mayssa'],
    conservation: 'À conserver au frais, à déguster rapidement après retrait.',
  },
  'box-de-tout': {
    tagline: 'L\'intégrale — toutes nos signatures',
    paragraphs: [
      'La box de tout rassemble l\'ensemble des trompe-l\'œil signatures Maison Mayssa : la gamme complète pour les vrais passionnés ou les grandes occasions.',
      'Anniversaire, événement, cadeau d\'exception ou simple plaisir de tout goûter : c\'est le coffret ultime de la maison.',
      'Présentation soignée, quantités limitées selon les créneaux de production.',
    ],
    composition: ['Tous les trompe-l\'œil signatures disponibles', 'Coffret premium'],
    conservation: 'À conserver au réfrigérateur, à déguster sous 48 h.',
  },
  'box-surprise': {
    tagline: 'On compose pour vous selon votre budget',
    paragraphs: [
      'Indiquez votre budget (20 € à 50 €) et l\'occasion : nous composons une sélection sur mesure parmi nos créations disponibles.',
      'Mariage, anniversaire, remerciement ou simple surprise : la box surprise s\'adapte à votre envie et à nos stocks du moment.',
      'Chaque box est unique — confiance totale à la maison ou précisez vos préférences lors de la commande.',
    ],
    composition: ['Sélection sur mesure', 'Budget au choix', 'Créations du jour'],
    conservation: 'À conserver au frais selon les produits inclus.',
  },
}

const DEFAULT_TROMPE_RECS = ['trompe-loeil-passion', 'trompe-loeil-citron', 'box-decouverte-trompe-5'] as const

/** Produits souvent commandés ensemble */
export const PRODUCT_RECOMMENDATIONS: Record<string, string[]> = {
  'trompe-loeil-mangue': ['trompe-loeil-passion', 'trompe-loeil-citron', 'box-decouverte-trompe-5'],
  'trompe-loeil-passion': ['trompe-loeil-mangue', 'trompe-loeil-framboise', 'box-fruitee'],
  'trompe-loeil-citron': ['trompe-loeil-fraise', 'trompe-loeil-myrtille', 'box-fruitee'],
  'trompe-loeil-framboise': ['trompe-loeil-fraise', 'trompe-loeil-passion', 'box-decouverte-trompe-5'],
  'trompe-loeil-fraise': ['trompe-loeil-framboise', 'trompe-loeil-mangue', 'box-fruitee'],
  'trompe-loeil-pistache': ['trompe-loeil-vanille', 'trompe-loeil-cacahuete', 'box-trompe-loeil'],
  'trompe-loeil-cacahuete': ['trompe-loeil-pecan', 'trompe-loeil-cabosse', 'box-trompe-loeil'],
  'trompe-loeil-pecan': ['trompe-loeil-cacahuete', 'trompe-loeil-amande', 'trompe-loeil-cabosse'],
  'trompe-loeil-amande': ['trompe-loeil-vanille', 'trompe-loeil-pecan', 'box-decouverte-trompe-5'],
  'trompe-loeil-cabosse': ['trompe-loeil-cacahuete', 'trompe-loeil-cafe', 'box-de-tout'],
  'trompe-loeil-vanille': ['trompe-loeil-amande', 'trompe-loeil-pistache', 'trompe-loeil-cafe'],
  'trompe-loeil-myrtille': ['trompe-loeil-framboise', 'trompe-loeil-citron', 'box-fruitee'],
  'trompe-loeil-cafe': ['trompe-loeil-cabosse', 'trompe-loeil-vanille', 'trompe-loeil-cacahuete'],
  'trompe-loeil-popcorn': ['trompe-loeil-cacahuete', 'trompe-loeil-pecan', 'box-decouverte-trompe-5'],
  'box-trompe-loeil': ['trompe-loeil-mangue', 'trompe-loeil-cacahuete', 'trompe-loeil-cabosse'],
  'box-fruitee': ['trompe-loeil-mangue', 'trompe-loeil-passion', 'trompe-loeil-citron'],
  'box-decouverte-trompe-5': ['trompe-loeil-mangue', 'trompe-loeil-framboise', 'box-trompe-loeil'],
  'mini-box-trompe-loeil-5': ['trompe-loeil-mangue', 'trompe-loeil-citron', 'box-decouverte-trompe-5'],
  'box-de-tout': ['trompe-loeil-mangue', 'trompe-loeil-cabosse', 'trompe-loeil-cacahuete'],
  'box-surprise': ['trompe-loeil-mangue', 'box-trompe-loeil', 'box-decouverte-trompe-5'],
}

export function getProductDetail(productId: string, shortDescription?: string): ProductDetailContent {
  if (PRODUCT_DETAILS[productId]) return PRODUCT_DETAILS[productId]

  return {
    tagline: 'Création artisanale Maison Mayssa',
    paragraphs: [
      shortDescription ?? 'Une création faite main avec des ingrédients sélectionnés.',
      'Chaque produit est préparé à la commande dans notre atelier d\'Annecy, avec le même soin apporté à nos trompe-l\'œil signatures.',
      'Disponible en précommande selon les créneaux ouverts — quantités limitées.',
    ],
    composition: shortDescription ? [shortDescription] : [],
    conservation: 'À conserver selon les indications remises lors du retrait.',
  }
}

export function getProductRecommendations(productId: string, catalogIds: Set<string>): string[] {
  const ids = PRODUCT_RECOMMENDATIONS[productId] ?? [...DEFAULT_TROMPE_RECS]
  return ids.filter((id) => id !== productId && catalogIds.has(id)).slice(0, 3)
}
