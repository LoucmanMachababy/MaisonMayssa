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
  'box-decouverte-trompe-8': {
    tagline: 'Composez votre sélection — 8 saveurs au choix',
    paragraphs: [
      'La box découverte 8 saveurs vous laisse choisir 8 trompe-l\'œil différents parmi notre gamme disponible — vanille incluse si proposée par la maison.',
      'Format généreux pour les grandes occasions, les cadeaux d\'exception ou goûter une large partie de la collection en une commande.',
      'Même principe que la box de 5 : vous composez librement, nous préparons avec le même soin artisanal.',
    ],
    composition: ['8 trompe-l\'œil au choix', 'Coffret premium'],
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
  'cup-dubai-pistache-chocolat-fraise': {
    tagline: 'Le Dubai chocolate viral — en cup gourmande',
    paragraphs: [
      'Inspirée du célèbre chocolat de Dubaï, cette cup réunit tout ce qui fait sa renommée : chocolat onctueux, crème pistache intense et le croquant irrésistible du kataïfi doré au beurre.',
      'Dans un verre transparent, les couches s\'alternent : sauce chocolat, crème pistache parsemée d\'éclats, morceaux de fraises fraîches collés sur les parois, puis un généreux topping de kataïfi croustillant nappé de chocolat et de pistache.',
      'Croquant, crémeux, fruité et chocolaté — une bouchée complète pour les amateurs de tendance Dubai sans compromis sur le fait maison.',
    ],
    composition: [
      'Chocolat au lait / noir',
      'Crème pistache',
      'Fraises fraîches',
      'Kataïfi doré au beurre',
      'Éclats de pistache',
    ],
    conservation: 'À conserver au réfrigérateur et déguster dans les 48 h suivant le retrait.',
  },
  'cup-dubai-pistache-chocolatblanc-fraise': {
    tagline: 'Le Dubai chocolate en version douce et fruitée',
    paragraphs: [
      'Une déclinaison plus lumineuse du Dubai chocolate : crème onctueuse au chocolat blanc, pistache intense et le croquant signature du kataïfi doré au beurre.',
      'Les fraises fraîches s\'invitent sur les parois et entre chaque couche, apportant fraîcheur et acidité pour équilibrer la douceur du chocolat blanc et la richesse de la pistache.',
      'Le topping final mêle éclats de pistache, copeaux de chocolat blanc et kataïfi croustillant — une cup généreuse, visuelle et irrésistiblement gourmande.',
    ],
    composition: [
      'Chocolat blanc',
      'Crème pistache',
      'Fraises fraîches',
      'Kataïfi doré au beurre',
      'Éclats de pistache',
    ],
    conservation: 'À conserver au réfrigérateur et déguster dans les 48 h suivant le retrait.',
  },
  'cup-dubai-bueno': {
    tagline: 'L\'esprit Bueno dans une cup Dubai généreuse',
    paragraphs: [
      'Pour les amateurs de noisette et de chocolat : cette cup s\'inspire du célèbre Bueno avec une crème onctueuse façon praliné noisette, enrobée de nappage chocolat et de kataïfi doré croustillant.',
      'Les fraises fraîches s\'intercalent entre les couches pour une touche fruitée qui allège l\'ensemble, tandis que le topping réunit kataïfi, copeaux de chocolat et un carré de kunafa pour le croquant final.',
      'Crémeux, croquant et gourmand — la tendance Dubai chocolate revisitée avec l\'indulgence irrésistible du Bueno.',
    ],
    composition: [
      'Crème praliné noisette',
      'Chocolat au lait',
      'Fraises fraîches',
      'Kataïfi doré au beurre',
      'Copeaux de chocolat',
    ],
    conservation: 'À conserver au réfrigérateur et déguster dans les 48 h suivant le retrait.',
  },
  'limonade-bresilienne-classique': {
    tagline: 'La limonada suíça brésilienne, dans sa version originale',
    paragraphs: [
      'La limonade brésilienne — la limonada suíça — n\'a rien à voir avec une simple citronnade : on utilise des citrons verts entiers, lavés et coupés en quartiers avec leur peau, mixés brièvement avec de l\'eau très froide puis filtrés pour retirer pulpe et pépins.',
      'Le jus filtré retourne au blender avec du lait concentré sucré, un peu de sucre et une généreuse portion de glaçons : c\'est ce mélange qui donne la texture crémeuse et légèrement mousseuse si caractéristique, sans fruit ajouté.',
      'Préparée à la commande et servie immédiatement bien fraîche — comme au Brésil, où cette boisson se déguste sur-le-champ pour garder toute sa fraîcheur.',
    ],
    composition: [
      'Citrons verts entiers (avec peau)',
      'Eau très froide',
      'Lait concentré sucré',
      'Sucre',
      'Glaçons',
    ],
    conservation: 'À déguster aussitôt, bien frais — la limonade brésilienne ne se conserve pas (le citron devient amer en reposant).',
  },
  'limonade-bresilienne-mangue': {
    tagline: 'La limonada suíça brésilienne, revisitée à la mangue',
    paragraphs: [
      'La limonade brésilienne — la limonada suíça — n\'a rien à voir avec une simple citronnade : on utilise des citrons verts entiers, lavés et coupés en quartiers avec leur peau, mixés brièvement avec de l\'eau très froide puis filtrés pour retirer pulpe et pépins.',
      'Le jus filtré retourne au blender avec du lait concentré sucré, un peu de sucre et une généreuse portion de glaçons : c\'est ce mélange qui donne la texture crémeuse et légèrement mousseuse si caractéristique. Notre version mangue y ajoute de la mangue fraîche pour une douceur tropicale qui équilibre l\'acidité du citron vert.',
      'Préparée à la commande et servie immédiatement bien fraîche — comme au Brésil, où cette boisson se déguste sur-le-champ pour garder toute sa fraîcheur.',
    ],
    composition: [
      'Citrons verts entiers (avec peau)',
      'Eau très froide',
      'Lait concentré sucré',
      'Mangue fraîche',
      'Sucre',
      'Glaçons',
    ],
    conservation: 'À déguster aussitôt, bien frais — la limonade brésilienne ne se conserve pas (le citron devient amer en reposant).',
  },
  'limonade-bresilienne-fraise': {
    tagline: 'La limonada suíça brésilienne, revisitée à la fraise',
    paragraphs: [
      'La limonade brésilienne — la limonada suíça — n\'a rien à voir avec une simple citronnade : on utilise des citrons verts entiers, lavés et coupés en quartiers avec leur peau, mixés brièvement avec de l\'eau très froide puis filtrés pour retirer pulpe et pépins.',
      'Le jus filtré retourne au blender avec du lait concentré sucré, un peu de sucre et une généreuse portion de glaçons : c\'est ce mélange qui donne la texture crémeuse et légèrement mousseuse si caractéristique. Notre version fraise y ajoute des fraises fraîches pour une note fruitée et acidulée.',
      'Préparée à la commande et servie immédiatement bien fraîche — comme au Brésil, où cette boisson se déguste sur-le-champ pour garder toute sa fraîcheur.',
    ],
    composition: [
      'Citrons verts entiers (avec peau)',
      'Eau très froide',
      'Lait concentré sucré',
      'Fraises fraîches',
      'Sucre',
      'Glaçons',
    ],
    conservation: 'À déguster aussitôt, bien frais — la limonade brésilienne ne se conserve pas (le citron devient amer en reposant).',
  },
  'limonade-bresilienne-framboise': {
    tagline: 'La limonada suíça brésilienne, revisitée à la framboise',
    paragraphs: [
      'La limonade brésilienne — la limonada suíça — n\'a rien à voir avec une simple citronnade : on utilise des citrons verts entiers, lavés et coupés en quartiers avec leur peau, mixés brièvement avec de l\'eau très froide puis filtrés pour retirer pulpe et pépins.',
      'Le jus filtré retourne au blender avec du lait concentré sucré, un peu de sucre et une généreuse portion de glaçons : c\'est ce mélange qui donne la texture crémeuse et légèrement mousseuse si caractéristique. Notre version framboise y ajoute des framboises fraîches pour une note acidulée et fruitée.',
      'Préparée à la commande et servie immédiatement bien fraîche — comme au Brésil, où cette boisson se déguste sur-le-champ pour garder toute sa fraîcheur.',
    ],
    composition: [
      'Citrons verts entiers (avec peau)',
      'Eau très froide',
      'Lait concentré sucré',
      'Framboises fraîches',
      'Sucre',
      'Glaçons',
    ],
    conservation: 'À déguster aussitôt, bien frais — la limonade brésilienne ne se conserve pas (le citron devient amer en reposant).',
  },
  'limonade-bresilienne-peche': {
    tagline: 'La limonada suíça brésilienne, revisitée à la pêche',
    paragraphs: [
      'La limonade brésilienne — la limonada suíça — n\'a rien à voir avec une simple citronnade : on utilise des citrons verts entiers, lavés et coupés en quartiers avec leur peau, mixés brièvement avec de l\'eau très froide puis filtrés pour retirer pulpe et pépins.',
      'Le jus filtré retourne au blender avec du lait concentré sucré, un peu de sucre et une généreuse portion de glaçons : c\'est ce mélange qui donne la texture crémeuse et légèrement mousseuse si caractéristique. Notre version pêche y ajoute de la pêche fraîche pour une douceur estivale et parfumée.',
      'Préparée à la commande et servie immédiatement bien fraîche — comme au Brésil, où cette boisson se déguste sur-le-champ pour garder toute sa fraîcheur.',
    ],
    composition: [
      'Citrons verts entiers (avec peau)',
      'Eau très froide',
      'Lait concentré sucré',
      'Pêche fraîche',
      'Sucre',
      'Glaçons',
    ],
    conservation: 'À déguster aussitôt, bien frais — la limonade brésilienne ne se conserve pas (le citron devient amer en reposant).',
  },
  'limonade-bresilienne-pasteque': {
    tagline: 'La limonada suíça brésilienne, revisitée à la pastèque',
    paragraphs: [
      'La limonade brésilienne — la limonada suíça — n\'a rien à voir avec une simple citronnade : on utilise des citrons verts entiers, lavés et coupés en quartiers avec leur peau, mixés brièvement avec de l\'eau très froide puis filtrés pour retirer pulpe et pépins.',
      'Le jus filtré retourne au blender avec du lait concentré sucré, un peu de sucre et une généreuse portion de glaçons : c\'est ce mélange qui donne la texture crémeuse et légèrement mousseuse si caractéristique. Notre version pastèque y ajoute de la pastèque fraîche pour une fraîcheur juteuse et légère.',
      'Préparée à la commande et servie immédiatement bien fraîche — comme au Brésil, où cette boisson se déguste sur-le-champ pour garder toute sa fraîcheur.',
    ],
    composition: [
      'Citrons verts entiers (avec peau)',
      'Eau très froide',
      'Lait concentré sucré',
      'Pastèque fraîche',
      'Sucre',
      'Glaçons',
    ],
    conservation: 'À déguster aussitôt, bien frais — la limonade brésilienne ne se conserve pas (le citron devient amer en reposant).',
  },
  'mojito-classique': {
    tagline: 'Le grand classique — 100 % sans alcool',
    paragraphs: [
      'Notre mojito classique reprend l\'esprit du cocktail cubain sans alcool : feuilles de menthe fraîche, jus de citron vert, un filet de sirop de sucre et de l\'eau pétillante, le tout sur une base de glaçons.',
      'La menthe est légèrement froissée pour libérer son parfum sans l\'amertumer, le citron vert apporte l\'acidité, et les bulles de l\'eau gazeuse finissent l\'ensemble en légèreté.',
      'Servi en cup transparente, prêt à boire — rafraîchissant à tout moment de la journée.',
    ],
    composition: ['Menthe fraîche', 'Citron vert', 'Sirop de sucre', 'Eau pétillante', 'Glaçons'],
    conservation: 'À déguster aussitôt, bien frais.',
  },
  'mojito-passion': {
    tagline: 'Tropical et acidulé — sans alcool',
    paragraphs: [
      'Version fruitée de notre mojito : pulpe de fruit de la passion, menthe fraîche, citron vert et glaçons, complétés par de l\'eau pétillante pour une boisson légère et parfumée.',
      'Les graines de passion apportent une texture et une acidité caractéristiques, équilibrées par la fraîcheur de la menthe.',
      'Une escapade tropicale en cup, sans alcool.',
    ],
    composition: ['Fruit de la passion', 'Menthe fraîche', 'Citron vert', 'Eau pétillante', 'Glaçons'],
    conservation: 'À déguster aussitôt, bien frais.',
  },
  'mojito-melon': {
    tagline: 'Douceur estivale — sans alcool',
    paragraphs: [
      'Morceaux de melon frais, menthe, citron vert et glaçons, allongés à l\'eau pétillante : un mojito gourmand et ultra rafraîchissant pour les beaux jours.',
      'Le melon apporte sa douceur juteuse, la menthe et le citron vert structurent l\'ensemble sans le alourdir.',
      'Préparé à la commande, servi bien frais en cup.',
    ],
    composition: ['Melon frais', 'Menthe fraîche', 'Citron vert', 'Eau pétillante', 'Glaçons'],
    conservation: 'À déguster aussitôt, bien frais.',
  },
  'mojito-mangue': {
    tagline: 'Mangue fraîche et menthe — sans alcool',
    paragraphs: [
      'Cubes de mangue mûre, menthe fraîche, citron vert et glaçons, complétés par de l\'eau pétillante : un mojito tropical généreux en fruit.',
      'La mangue apporte douceur et exotisme, la menthe et le citron vert gardent l\'équilibre frais du cocktail original.',
      'Servi en cup transparente, prêt à déguster sur-le-champ.',
    ],
    composition: ['Mangue fraîche', 'Menthe fraîche', 'Citron vert', 'Eau pétillante', 'Glaçons'],
    conservation: 'À déguster aussitôt, bien frais.',
  },
  'mojito-framboise': {
    tagline: 'Fruité et acidulé — sans alcool',
    paragraphs: [
      'Framboises fraîches, menthe, citron vert et glaçons, allongés à l\'eau pétillante : un mojito rouge vif, léger et parfumé.',
      'Les framboises apportent leur acidité délicate, la menthe et le citron vert complètent le profil sans alcool.',
      'Préparé à la commande pour une fraîcheur maximale.',
    ],
    composition: ['Framboises fraîches', 'Menthe fraîche', 'Citron vert', 'Eau pétillante', 'Glaçons'],
    conservation: 'À déguster aussitôt, bien frais.',
  },
  'mojito-fraise': {
    tagline: 'Gourmand et rafraîchissant — sans alcool',
    paragraphs: [
      'Fraises fraîches, menthe, citron vert et glaçons, complétés par de l\'eau pétillante : un mojito gourmand aux notes rouges et fruitées.',
      'Les fraises apportent douceur et parfum, la menthe et le citron vert gardent l\'équilibre typique du mojito.',
      'Servi en cup, sans alcool, à déguster bien frais.',
    ],
    composition: ['Fraises fraîches', 'Menthe fraîche', 'Citron vert', 'Eau pétillante', 'Glaçons'],
    conservation: 'À déguster aussitôt, bien frais.',
  },
}

const DEFAULT_TROMPE_RECS = ['trompe-loeil-passion', 'trompe-loeil-citron', 'box-decouverte-trompe-5'] as const

/** Produits souvent commandés ensemble */
export const PRODUCT_RECOMMENDATIONS: Record<string, string[]> = {
  'trompe-loeil-mangue': ['trompe-loeil-passion', 'trompe-loeil-citron', 'box-decouverte-trompe-5'],
  'trompe-loeil-passion': ['trompe-loeil-mangue', 'trompe-loeil-framboise', 'box-decouverte-trompe-5'],
  'trompe-loeil-citron': ['trompe-loeil-fraise', 'trompe-loeil-myrtille', 'box-decouverte-trompe-5'],
  'trompe-loeil-framboise': ['trompe-loeil-fraise', 'trompe-loeil-passion', 'box-decouverte-trompe-5'],
  'trompe-loeil-fraise': ['trompe-loeil-framboise', 'trompe-loeil-mangue', 'box-decouverte-trompe-5'],
  'trompe-loeil-pistache': ['trompe-loeil-vanille', 'trompe-loeil-cacahuete', 'box-decouverte-trompe-5'],
  'trompe-loeil-cacahuete': ['trompe-loeil-pecan', 'trompe-loeil-cabosse', 'box-decouverte-trompe-5'],
  'trompe-loeil-pecan': ['trompe-loeil-cacahuete', 'trompe-loeil-amande', 'trompe-loeil-cabosse'],
  'trompe-loeil-amande': ['trompe-loeil-vanille', 'trompe-loeil-pecan', 'box-decouverte-trompe-5'],
  'trompe-loeil-cabosse': ['trompe-loeil-cacahuete', 'trompe-loeil-cafe', 'box-decouverte-trompe-5'],
  'trompe-loeil-vanille': ['trompe-loeil-amande', 'trompe-loeil-pistache', 'trompe-loeil-cafe'],
  'trompe-loeil-myrtille': ['trompe-loeil-framboise', 'trompe-loeil-citron', 'box-decouverte-trompe-5'],
  'trompe-loeil-cafe': ['trompe-loeil-cabosse', 'trompe-loeil-vanille', 'trompe-loeil-cacahuete'],
  'trompe-loeil-popcorn': ['trompe-loeil-cacahuete', 'trompe-loeil-pecan', 'box-decouverte-trompe-5'],
  'box-decouverte-trompe-5': ['trompe-loeil-mangue', 'trompe-loeil-framboise', 'trompe-loeil-cabosse'],
  'cup-dubai-pistache-chocolat-fraise': ['cup-dubai-bueno', 'tablette-dubai-pistache', 'trompe-loeil-cabosse'],
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
