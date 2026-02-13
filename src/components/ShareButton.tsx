import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, X, Copy, Check } from 'lucide-react'
import { hapticFeedback } from '../lib/haptics'
import type { Product } from '../types'

// Social media icons as simple SVGs
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

interface ShareButtonProps {
  product: Product
  variant?: 'icon' | 'full'
  className?: string
}

export function ShareButton({ product, variant = 'icon', className = '' }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // URL avec hash (#produit=id) pour que le lien survive aux redirections (http→https, www, etc.)
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : ''
  const shareUrl = `${baseUrl}#produit=${encodeURIComponent(product.id)}`
  const shareText = `Découvre ${product.name} chez Maison Mayssa - ${product.price.toFixed(2).replace('.', ',')}€`

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: WhatsAppIcon,
      color: 'bg-[#25D366] hover:bg-[#128C7E]',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    },
    {
      name: 'Facebook',
      icon: FacebookIcon,
      color: 'bg-[#1877F2] hover:bg-[#0d65d9]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Twitter',
      icon: TwitterIcon,
      color: 'bg-black hover:bg-gray-800',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
  ]

  const handleShare = async () => {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        })
        hapticFeedback('success')
        return
      } catch {
        // User cancelled or error, fall back to modal
      }
    }

    setIsOpen(true)
    hapticFeedback('light')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      hapticFeedback('success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      hapticFeedback('error')
    }
  }

  const handleSocialClick = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400')
    hapticFeedback('medium')
    setIsOpen(false)
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleShare}
        className={`flex items-center justify-center cursor-pointer ${className}`}
        aria-label="Partager ce produit"
      >
        {variant === 'full' ? (
          <>
            <Share2 size={16} />
            <span className="ml-2 text-sm font-semibold">Partager</span>
          </>
        ) : (
          <Share2 size={18} />
        )}
      </motion.button>

      {/* Share Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-mayssa-brown">Partager</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-mayssa-brown/60 hover:text-mayssa-brown rounded-xl hover:bg-mayssa-soft transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Product preview */}
              <div className="flex items-center gap-3 p-3 mb-4 rounded-2xl bg-mayssa-soft/50">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-mayssa-brown truncate">{product.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-mayssa-caramel font-semibold">
                      {product.price.toFixed(2).replace('.', ',')} €
                    </p>
                    {product.originalPrice && (
                      <p className="text-xs text-mayssa-brown/50 font-semibold line-through">
                        {product.originalPrice.toFixed(2).replace('.', ',')} €
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Social buttons */}
              <div className="flex justify-center gap-3 mb-4">
                {shareLinks.map((link) => (
                  <motion.button
                    key={link.name}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSocialClick(link.url)}
                    className={`flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-lg transition-colors cursor-pointer ${link.color}`}
                    aria-label={`Partager sur ${link.name}`}
                  >
                    <link.icon />
                  </motion.button>
                ))}
              </div>

              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-mayssa-soft text-mayssa-brown font-semibold hover:bg-mayssa-cream transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={18} className="text-green-500" />
                    <span>Lien copié !</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>Copier le lien</span>
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
