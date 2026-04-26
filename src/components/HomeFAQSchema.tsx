import { Helmet } from 'react-helmet-async'
import { FAQ_ITEMS_HOME } from '../lib/faqItems'

/**
 * Injecte le schema FAQPage uniquement sur la home.
 *
 * Anciennement dans index.html (statique), mais ça polluait toutes les
 * routes SPA (pages /a-propos, /faq, pages piliers) qui se retrouvaient
 * avec 2 FAQPage schemas en conflit selon Google Rich Results Test.
 *
 * Maintenant monté uniquement depuis Home → 1 seul FAQPage par URL.
 */
export function HomeFAQSchema() {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ_ITEMS_HOME.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a,
            },
          })),
        })}
      </script>
    </Helmet>
  )
}
