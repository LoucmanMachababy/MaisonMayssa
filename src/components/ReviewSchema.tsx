import { useEffect } from 'react'
import { useReviews } from '../hooks/useReviews'

const SCRIPT_ID = 'schema-reviews'
const MAX_REVIEWS = 20

/**
 * Injecte un JSON-LD Review par avis client pour enrichir les rich results Google
 * et faciliter la citation par les moteurs génératifs (GEO).
 * Complémentaire d'AggregateRatingSchema (note moyenne globale).
 */
export function ReviewSchema() {
  const { reviews } = useReviews()

  useEffect(() => {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) existing.remove()

    if (reviews.length === 0) return

    const schemas = reviews.slice(0, MAX_REVIEWS).map((review) => ({
      '@context': 'https://schema.org',
      '@type': 'Review',
      itemReviewed: {
        '@type': 'Bakery',
        name: 'Maison Mayssa',
        url: 'https://maison-mayssa.fr',
      },
      author: {
        '@type': 'Person',
        name: review.authorName?.trim() || 'Client Maison Mayssa',
      },
      datePublished: new Date(review.createdAt).toISOString(),
      reviewRating: {
        '@type': 'Rating',
        ratingValue: String(review.rating),
        bestRating: '5',
        worstRating: '1',
      },
      ...(review.comment?.trim() ? { reviewBody: review.comment.trim() } : {}),
    }))

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(schemas)
    document.head.appendChild(script)

    return () => {
      document.getElementById(SCRIPT_ID)?.remove()
    }
  }, [reviews])

  return null
}
