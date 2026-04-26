/**
 * FAQ items Maison Mayssa, groupés par catégories.
 * Partagés entre :
 *  - La section FAQ en bas de la home (rendue via LegalPages.FAQSection, 5 Q&A courtes)
 *  - La page dédiée /faq (rendue via FAQPage, 15 Q&A complètes)
 *  - Le schema.org FAQPage dans index.html (rich results Google)
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
 * Même contenu que dans l'index.html schema.org FAQPage.
 */
export const FAQ_ITEMS_HOME: FAQItem[] = [
  {
    q: 'Comment passer commande ?',
    a: 'Remplis ton panier sur le site, choisis retrait ou livraison, puis clique sur « Envoyer sur WhatsApp ». Le message est pré-rempli : il te suffit de l\'envoyer pour confirmer. Commande par WhatsApp uniquement.',
  },
  {
    q: 'Quels sont les horaires de retrait et livraison ?',
    a: 'Service de 18h30 à 2h du matin, 7 jours sur 7. Livraison sur Annecy et alentours (rayon ~5-10 km). Retrait possible sur place.',
  },
  {
    q: 'Comment se passe le paiement ?',
    a: 'Tu peux régler par PayPal (lien proposé après la commande) ou à la livraison / au retrait. Aucun paiement en ligne obligatoire.',
  },
  {
    q: "C'est quoi la précommande ?",
    a: "Trompe-l'œil : tu passes ta commande et tu récupères ton gâteau environ 3 jours après (délai de préparation). La date exacte est indiquée dans le formulaire selon les disponibilités. Pâtisseries, cookies, boxes et le reste sont disponibles en permanence (pas de délai fixe).",
  },
  {
    q: 'Livraison offerte ?',
    a: "Oui, dès 50 € d'achat sur la zone habituelle (rayon d'environ 5 km depuis Annecy). Sinon forfait 5 €. Pour les secteurs plus éloignés, nous contacter par WhatsApp.",
  },
]

/**
 * FAQ complète (15 Q&A) regroupées par catégories pour la page /faq.
 */
export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'commande-paiement',
    title: 'Commande & Paiement',
    items: [
      FAQ_ITEMS_HOME[0], // Comment passer commande
      {
        q: 'Puis-je commander via Instagram ou Snapchat ?',
        a: 'Oui ! Remplis ton panier comme d\'habitude, puis clique sur les options Instagram ou Snapchat dans le récap. Le message sera pré-rempli à copier-coller dans ton DM.',
      },
      FAQ_ITEMS_HOME[2], // Paiement
      {
        q: 'Comment annuler une commande ?',
        a: 'Contacte-nous directement par WhatsApp (+33 6 19 87 10 05) dès que possible. Si la préparation n\'a pas commencé (surtout pour les trompe-l\'œil en précommande), nous pouvons annuler sans frais.',
      },
      {
        q: 'Ai-je besoin d\'un acompte pour commander ?',
        a: 'Non, aucun acompte n\'est demandé pour les commandes classiques. Pour les grosses commandes événementielles (mariage, corporate), nous pouvons convenir d\'un acompte par WhatsApp.',
      },
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
        a: 'Notre gamme évolue régulièrement. Actuellement : mangue, citron, pistache, passion, framboise, fraise, myrtille, café, vanille, cacahuète, noix de pécan, popcorn, grappe de banane, amande, cabosse de cacao. Consulte la carte à jour sur le site.',
      },
    ],
  },
  {
    id: 'livraison-retrait',
    title: 'Livraison & Retrait',
    items: [
      FAQ_ITEMS_HOME[4], // Livraison offerte
      FAQ_ITEMS_HOME[1], // Horaires
      {
        q: 'Quelles zones sont couvertes par la livraison ?',
        a: 'Nous livrons sur Annecy et ses alentours immédiats (Seynod, Annecy-le-Vieux, Meythet, Pringy, Cran-Gevrier, Épagny) dans un rayon d\'environ 5 km. Pour des secteurs plus éloignés, contacte-nous par WhatsApp pour un devis.',
      },
      {
        q: 'Combien de temps à l\'avance commander ?',
        a: 'Pour les trompe-l\'œil (précommande) : 3 jours minimum. Pour les pâtisseries classiques (brownies, cookies, layer cups, tiramisus, boxes) : disponibles le jour même selon stock, idéalement 24h à l\'avance.',
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
        a: 'WhatsApp : +33 6 19 87 10 05 (le plus rapide, 18h30-2h 7j/7). Instagram : @maison_mayssa74. Pour toute question, n\'hésite pas !',
      },
    ],
  },
]
