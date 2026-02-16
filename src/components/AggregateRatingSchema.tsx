import { useEffect } from 'react'
import { useReviews } from '../hooks/useReviews'

const SCRIPT_ID = 'schema-aggregate-rating'

/**
 * Injecte le JSON-LD AggregateRating (note moyenne + nombre d'avis) pour les rich results Google.
 * S'affiche uniquement quand il y a au moins un avis.
 */
export function AggregateRatingSchema() {
  const { reviews, globalAverage } = useReviews()

  useEffect(() => {
    const count = reviews.length
    const rating = globalAverage != null && count > 0 ? globalAverage : null

    const existing = document.getElementById(SCRIPT_ID)
    if (existing) existing.remove()

    if (rating == null || count === 0) return

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Bakery',
      name: 'Maison Mayssa',
      url: 'https://maison-mayssa.fr',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(Math.round(rating * 10) / 10),
        reviewCount: String(count),
        bestRating: '5',
        worstRating: '1',
      },
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)

    return () => {
      document.getElementById(SCRIPT_ID)?.remove()
    }
  }, [reviews.length, globalAverage])

  return null
}
