import { Helmet } from 'react-helmet-async'

/**
 * Helmet dédié à la home.
 *
 * Force les meta tags via react-helmet-async pour que toutes les pages
 * (home + routes SPA /a-propos /faq /trompe-loeil-annecy ...) aient un
 * <title> unique et cohérent, géré dynamiquement.
 *
 * index.html garde un <title> fallback minimal pour les crawlers sans JS
 * (rare — Google exécute JS pour les SPAs depuis 2019).
 */
export function HomeHelmet() {
  return (
    <Helmet>
      <title>Maison Mayssa — Trompe l'œil Annecy | Pâtisseries artisanales livrées</title>
      <meta
        name="description"
        content="Trompe l'œil Annecy ✦ Maison Mayssa : pâtisseries artisanales trompe l'œil (mangue, pistache, passion, framboise). Brownies, cookies, layer cups. Livraison offerte dès 50€. Commande WhatsApp 7j/7."
      />
      <link rel="canonical" href="https://maison-mayssa.fr/" />
      <meta property="og:url" content="https://maison-mayssa.fr/" />
      <meta
        property="og:title"
        content="Maison Mayssa — Trompe l'œil & Pâtisseries artisanales à Annecy"
      />
      <meta
        property="og:description"
        content="Pâtisseries artisanales qui trompent l'œil et régalent les papilles. Brownies, cookies, layer cups, tiramisus. Livraison offerte dès 50€ sur Annecy."
      />
    </Helmet>
  )
}
