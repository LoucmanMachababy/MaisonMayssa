/**
 * FAQ items Maison Mayssa, groupés par catégories.
 * Partagés entre :
 *  - La section FAQ en bas de la home (rendue via LegalPages.FAQSection, 5 Q&A courtes)
 *  - La page dédiée /faq (rendue via FAQPage, 15 Q&A complètes)
 *  - Le schema.org FAQPage (rich results Google)
 */

export type FAQItem = {
  q: string
  a: string
}

export type FAQCategory = {
  id: string
  title: string
  items: FAQItem[]
}

/**
 * 5 Q&A essentielles affichées dans la home (section FAQ en bas).
 * Même contenu que dans le schema.org FAQPage.
 */
export const FAQ_ITEMS_HOME: FAQItem[] = [
  {
    q: 'Comment passer commande ?',
    a: 'Remplis ton panier sur le site, choisis ton créneau de retrait, puis règle en ligne par carte bancaire ou Apple Pay. Ta commande est confirmée immédiatement : tu reçois un numéro de commande à présenter au retrait. C\'est du click & collect, 100 % en ligne.',
  },
  {
    q: 'Où et quand récupérer ma commande ?',
    a: 'Retrait en click & collect à la boutique Maison Mayssa, dans la galerie marchande du Carrefour, 134 avenue de Genève, 74000 Annecy. Service de 18h30 à 2h du matin, 7 jours sur 7. Tu choisis ton créneau au moment de la commande.',
  },
  {
    q: 'Comment se passe le paiement ?',
    a: 'Le paiement se fait en ligne, au moment de la commande, par carte bancaire (Visa, Mastercard, CB) ou Apple Pay. Paiement 100 % sécurisé. Une fois réglée, ta commande est confirmée et préparée pour ton créneau de retrait.',
  },
  {
    q: "C'est quoi la précommande ?",
    a: "Trompe-l'œil : tu passes ta commande et tu récupères ton gâteau environ 3 jours après (délai de préparation). La date exacte est indiquée dans le formulaire selon les disponibilités. Pâtisseries, cookies, boxes et le reste sont disponibles en permanence (pas de délai fixe).",
  },
  {
    q: 'Faut-il créer un compte pour commander ?',
    a: "Non, tu peux commander en tant qu'invité. Mais créer un compte te fait gagner des points de fidélité (1 € = 1 point) échangeables contre des cadeaux, et garde l'historique de tes commandes.",
  },
]

/**
 * FAQ complète regroupée par catégories pour la page /faq.
 */
export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'commande-paiement',
    title: 'Commande & Paiement',
    items: [
      FAQ_ITEMS_HOME[0], // Comment passer commande
      FAQ_ITEMS_HOME[2], // Paiement
      {
        q: 'Quels moyens de paiement acceptez-vous ?',
        a: 'Carte bancaire (Visa, Mastercard, CB) et Apple Pay, directement en ligne via notre paiement sécurisé. La commande est confirmée dès le règlement.',
      },
      {
        q: 'Comment annuler ou modifier une commande ?',
        a: 'Contacte-nous par WhatsApp (+33 6 19 87 10 05) dès que possible avec ton numéro de commande. Tant que la préparation n\'a pas commencé (surtout pour les trompe-l\'œil en précommande), nous pouvons modifier ou rembourser sans frais.',
      },
      FAQ_ITEMS_HOME[4], // Compte / fidélité
    ],
  },
  {
    id: 'produits',
    title: 'Produits & Saveurs',
    items: [
      {
        q: "Qu'est-ce qu'un trompe-l'œil pâtissier ?",
        a: "Un trompe-l'œil pâtissier est une création artisanale qui reproduit visuellement un vrai fruit ou objet, mais dont l'intérieur est une pâtisserie gourmande. Chez Maison Mayssa, nos trompe-l'œil (mangue, citron, pistache, passion, framboise, cacahuète, amande, cabosse de cacao...) sont réalisés à la main avec ganache, coulis et coque en chocolat ou pâte à sucre.",
      },
      {
        q: 'Comment conserver mes pâtisseries ?',
        a: 'Les pâtisseries se conservent au réfrigérateur entre 2 et 4 °C, dans leur emballage d\'origine. Consomme-les idéalement dans les 48h pour profiter de toute la fraîcheur. Sortez-les 10-15 minutes avant dégustation.',
      },
      {
        q: 'Avez-vous des options sans gluten ou sans lactose ?',
        a: 'Nous n\'avons pas de gamme spécifique sans gluten ou sans lactose dans le catalogue standard. Pour des demandes spéciales, contacte-nous par WhatsApp et nous étudierons ce qui est possible.',
      },
      {
        q: 'Quelles sont les saveurs de trompe-l\'œil disponibles ?',
        a: 'Notre gamme évolue régulièrement. Actuellement : mangue, citron, pistache, passion, framboise, fraise, myrtille, café, vanille, cacahuète, noix de pécan, popcorn, amande, cabosse de cacao. Consulte la carte à jour sur le site.',
      },
    ],
  },
  {
    id: 'retrait-click-collect',
    title: 'Retrait — Click & collect',
    items: [
      FAQ_ITEMS_HOME[1], // Où et quand récupérer
      {
        q: 'Comment fonctionne le click & collect ?',
        a: 'Tu commandes et tu payes en ligne, tu choisis un créneau de retrait, puis tu viens récupérer ta commande déjà prête à la boutique. Présente simplement ton numéro de commande au comptoir — pas d\'attente, pas de paiement sur place.',
      },
      {
        q: 'Quelle est l\'adresse de retrait ?',
        a: 'Maison Mayssa, galerie marchande du centre commercial Carrefour, 134 avenue de Genève, 74000 Annecy. Ouverture le 4 juillet 2026.',
      },
      {
        q: 'Combien de temps à l\'avance commander ?',
        a: 'Pour les trompe-l\'œil (précommande) : 3 jours minimum. Pour les pâtisseries classiques (brownies, cookies, layer cups, tiramisus, boxes) : disponibles selon le stock, idéalement 24h à l\'avance.',
      },
    ],
  },
  {
    id: 'precommandes',
    title: 'Précommandes Trompe-l\'œil',
    items: [
      FAQ_ITEMS_HOME[3], // Précommande
      {
        q: 'Puis-je modifier une précommande après validation ?',
        a: 'Tant que la préparation n\'a pas commencé, oui. Contacte-nous rapidement par WhatsApp (+33 6 19 87 10 05) avec ton numéro de commande.',
      },
    ],
  },
  {
    id: 'contact',
    title: 'Nous contacter',
    items: [
      {
        q: 'Comment vous joindre ?',
        a: 'WhatsApp : +33 6 19 87 10 05 (le plus rapide pour le service client, 18h30-2h 7j/7). Instagram : @maison_mayssa74. Pour toute question sur ta commande, n\'hésite pas !',
      },
    ],
  },
]
