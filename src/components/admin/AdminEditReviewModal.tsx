import { useState } from 'react'
import { X, Star } from 'lucide-react'
import { updateReview, type Review } from '../../lib/firebase'
import { hapticFeedback } from '../../lib/haptics'

interface AdminEditReviewModalProps {
  reviewId: string
  review: Review
  onClose: () => void
  onSaved: () => void
}

export function AdminEditReviewModal({ reviewId, review, onClose, onSaved }: AdminEditReviewModalProps) {
  const [rating, setRating] = useState(review.rating)
  const [comment, setComment] = useState(review.comment ?? '')
  const [authorName, setAuthorName] = useState(review.authorName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    hapticFeedback('light')
    setError('')
    setSaving(true)
    try {
      await updateReview(reviewId, {
        rating: Math.max(1, Math.min(5, rating)),
        comment: comment.trim() || undefined,
        authorName: authorName.trim() || undefined,
      })
      onSaved()
      onClose()
    } catch (err) {
      console.error('Erreur modification avis:', err)
      setError('Impossible de modifier l\'avis.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-mayssa-brown text-lg">Modifier l&apos;avis</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-mayssa-brown/60 hover:bg-mayssa-soft hover:text-mayssa-brown transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-mayssa-brown mb-2">Note (1-5 étoiles)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-2 rounded-lg hover:bg-mayssa-soft transition-colors"
                >
                  <Star
                    size={28}
                    className={n <= rating ? 'fill-mayssa-caramel text-mayssa-caramel' : 'text-mayssa-brown/20'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-mayssa-brown mb-2">Commentaire</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-mayssa-brown/20 text-mayssa-brown placeholder-mayssa-brown/40 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel focus:border-transparent"
              placeholder="Commentaire du client..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-mayssa-brown mb-2">Auteur</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-mayssa-brown/20 text-mayssa-brown placeholder-mayssa-brown/40 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel focus:border-transparent"
              placeholder="Nom du client"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-mayssa-brown/20 text-mayssa-brown font-bold hover:bg-mayssa-soft transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-mayssa-caramel text-white font-bold hover:bg-mayssa-caramel/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
