import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Send } from 'lucide-react'
import { submitReview, getReviewByOrderId, isTrompeLoeilProductId, type Review } from '../lib/firebase'
import { cn } from '../lib/utils'

export type OrderItemForReview = { name: string; quantity: number; price: number; productId?: string }

interface ReviewFormProps {
  orderId: string
  items: OrderItemForReview[]
  customerName?: string
  onSubmitted: () => void
  onSkip: () => void
  alreadySubmitted?: boolean
}

const STARS = [1, 2, 3, 4, 5] as const

export function ReviewForm({
  orderId,
  items,
  customerName,
  onSubmitted,
  onSkip,
  alreadySubmitted = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [authorName, setAuthorName] = useState(customerName ?? '')
  const [productRatings, setProductRatings] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trompeLoeilItems = items.filter((i) => i.productId && isTrompeLoeilProductId(i.productId))
  const displayRating = hoverRating || rating

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError('Choisis une note entre 1 et 5 étoiles.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const payload: Omit<Review, 'createdAt'> = {
        orderId,
        rating,
        authorName: authorName.trim() || undefined,
        comment: comment.trim() || undefined,
      }
      if (Object.keys(productRatings).length > 0) {
        payload.productRatings = { ...productRatings }
      }
      await submitReview(payload)
      onSubmitted()
    } catch (err) {
      console.error(err)
      setError('Impossible d\'envoyer l\'avis. Réessaie plus tard.')
    } finally {
      setSubmitting(false)
    }
  }

  if (alreadySubmitted) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
        <p className="text-sm font-medium text-emerald-800">Merci pour ton avis !</p>
      </div>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2">
          Comment s'est passée ta commande ?
        </p>
        <div className="flex gap-1">
          {STARS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 rounded transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-caramel"
              aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
            >
              <Star
                size={28}
                className={cn(
                  value <= displayRating ? 'fill-mayssa-caramel text-mayssa-caramel' : 'text-mayssa-brown/20'
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {trompeLoeilItems.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2">
            Note tes trompes l'œil (optionnel)
          </p>
          <div className="space-y-2">
            {trompeLoeilItems.map((item) => (
              item.productId && (
                <div key={item.productId} className="flex items-center justify-between gap-2 rounded-lg bg-mayssa-soft/50 px-3 py-2">
                  <span className="text-xs font-medium text-mayssa-brown truncate">{item.name}</span>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {STARS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setProductRatings((prev) => ({
                            ...prev,
                            [item.productId!]: value,
                          }))
                        }
                        className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-caramel rounded"
                        aria-label={`${value} étoiles pour ${item.name}`}
                      >
                        <Star
                          size={18}
                          className={cn(
                            value <= (productRatings[item.productId!] ?? 0)
                              ? 'fill-mayssa-caramel text-mayssa-caramel'
                              : 'text-mayssa-brown/20'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="review-comment" className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/60">
          Ton avis (optionnel)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Qu'as-tu pensé de tes douceurs ?"
          rows={2}
          className="mt-1 w-full rounded-xl border border-mayssa-brown/10 bg-white px-3 py-2 text-sm text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
        />
      </div>

      <div>
        <label htmlFor="review-name" className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/60">
          Ton prénom (optionnel, pour afficher avec l'avis)
        </label>
        <input
          id="review-name"
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Ex. Léa"
          className="mt-1 w-full rounded-xl border border-mayssa-brown/10 bg-white px-3 py-2 text-sm text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || rating < 1}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-mayssa-caramel text-white font-bold text-sm hover:bg-mayssa-brown disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={16} />
          {submitting ? 'Envoi…' : 'Envoyer mon avis'}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-2.5 rounded-xl border border-mayssa-brown/20 text-mayssa-brown/70 text-sm font-medium hover:bg-mayssa-soft/50 transition-colors"
        >
          Plus tard
        </button>
      </div>
    </motion.form>
  )
}
