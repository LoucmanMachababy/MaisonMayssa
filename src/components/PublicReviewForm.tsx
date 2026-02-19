import { useState } from 'react'
import { Star, Send, X } from 'lucide-react'
import { submitReview, type Review } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { PRODUCTS } from '../constants'
import { cn } from '../lib/utils'

const STARS = [1, 2, 3, 4, 5] as const

export function PublicReviewForm() {
  const { user } = useAuth()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [productRatings, setProductRatings] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addProduct = (productId: string) => {
    if (productId && !selectedIds.includes(productId)) {
      setSelectedIds((prev) => [...prev, productId])
    }
  }

  const removeProduct = (productId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== productId))
    setProductRatings((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  const setProductRating = (productId: string, value: number) => {
    setProductRatings((prev) => ({ ...prev, [productId]: value }))
  }

  const ratedCount = Object.keys(productRatings).filter((id) => productRatings[id] >= 1 && productRatings[id] <= 5).length
  const canSubmit = ratedCount >= 1
  const averageRating =
    ratedCount > 0
      ? Math.round(
          (Object.values(productRatings).filter((r) => r >= 1 && r <= 5).reduce((a, b) => a + b, 0) / ratedCount) * 10
        ) / 10
      : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      setError('Choisis au moins un produit et donne-lui une note (1 à 5 étoiles).')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const ratings: Record<string, number> = {}
      Object.entries(productRatings).forEach(([id, r]) => {
        if (r >= 1 && r <= 5) ratings[id] = r
      })
      const payload: Omit<Review, 'createdAt'> = {
        rating: averageRating,
        comment: comment.trim() || undefined,
        authorName: authorName.trim() || undefined,
        productRatings: Object.keys(ratings).length > 0 ? ratings : undefined,
      }
      await submitReview(payload, user?.uid)
      setSent(true)
      setSelectedIds([])
      setProductRatings({})
      setComment('')
      setAuthorName('')
    } catch (err) {
      console.error(err)
      setError('Impossible d\'envoyer l\'avis. Réessaie plus tard.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center">
        <p className="text-sm font-semibold text-emerald-800">Merci pour ton avis !</p>
        <p className="text-xs text-emerald-600 mt-1">Il apparaîtra bientôt ici.</p>
        {user && (
          <p className="text-xs font-medium text-emerald-700 mt-1">+10 points de fidélité ajoutés à ton compte.</p>
        )}
      </div>
    )
  }

  const availableToAdd = PRODUCTS.filter((p) => !selectedIds.includes(p.id))

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-mayssa-soft/60 border border-mayssa-brown/10 p-5 sm:p-6 space-y-4">
      <p className="text-sm font-bold text-mayssa-brown">Donne ton avis</p>
      <p className="text-xs text-mayssa-brown/60">Choisis le(s) produit(s) que tu as goûtés et note-les.</p>

      <div>
        <label htmlFor="public-review-product" className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">
          Choisir un produit à noter
        </label>
        <select
          id="public-review-product"
          value=""
          onChange={(e) => {
            addProduct(e.target.value)
            e.target.value = ''
          }}
          className="mt-1 w-full rounded-xl border border-mayssa-brown/10 bg-white px-3 py-2 text-sm text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
        >
          <option value="">— Choisis un produit —</option>
          {availableToAdd.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {selectedIds.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Note tes produits</p>
          {selectedIds.map((productId) => {
            const product = PRODUCTS.find((p) => p.id === productId)
            if (!product) return null
            const rating = productRatings[productId] ?? 0
            return (
              <div
                key={productId}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-white/80 border border-mayssa-brown/10 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-mayssa-brown truncate">{product.name}</p>
                  <div className="flex gap-0.5 mt-1">
                    {STARS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setProductRating(productId, value)}
                        className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-caramel"
                        aria-label={`${value} étoiles pour ${product.name}`}
                      >
                        <Star
                          size={20}
                          className={cn(
                            value <= rating ? 'fill-mayssa-caramel text-mayssa-caramel' : 'text-mayssa-brown/20'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeProduct(productId)}
                  className="p-1.5 rounded-lg hover:bg-mayssa-brown/10 text-mayssa-brown/60 hover:text-mayssa-brown"
                  aria-label="Retirer ce produit"
                >
                  <X size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div>
        <label htmlFor="public-review-comment" className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">
          Ton message (optionnel)
        </label>
        <textarea
          id="public-review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ce que tu as aimé, tes préférés..."
          rows={3}
          className="mt-1 w-full rounded-xl border border-mayssa-brown/10 bg-white px-3 py-2 text-sm text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
        />
      </div>

      <div>
        <label htmlFor="public-review-name" className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">
          Ton prénom (optionnel)
        </label>
        <input
          id="public-review-name"
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

      <button
        type="submit"
        disabled={submitting || !canSubmit}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-mayssa-caramel text-white font-bold text-sm hover:bg-mayssa-brown disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={16} />
        {submitting ? 'Envoi…' : 'Publier mon avis'}
      </button>
    </form>
  )
}
