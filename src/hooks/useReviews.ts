import { useState, useEffect } from 'react'
import { listenReviews, type Review } from '../lib/firebase'

export function useReviews() {
  const [reviews, setReviews] = useState<Record<string, Review>>({})

  useEffect(() => {
    return listenReviews(setReviews)
  }, [])

  const list = Object.entries(reviews).map(([id, r]) => ({ id, ...r })).sort((a, b) => b.createdAt - a.createdAt)

  function getAverageRatingForProduct(productId: string): number | null {
    let sum = 0
    let count = 0
    Object.values(reviews).forEach((r) => {
      const rating = r.productRatings?.[productId]
      if (rating != null && rating >= 1 && rating <= 5) {
        sum += rating
        count += 1
      }
    })
    if (count === 0) return null
    return Math.round((sum / count) * 10) / 10
  }

  function getReviewCountForProduct(productId: string): number {
    return Object.values(reviews).filter((r) => r.productRatings?.[productId] != null).length
  }

  const globalAverage =
    list.length > 0
      ? Math.round((list.reduce((acc, r) => acc + r.rating, 0) / list.length) * 10) / 10
      : null

  return {
    reviews: list,
    globalAverage,
    getAverageRatingForProduct,
    getReviewCountForProduct,
  }
}
