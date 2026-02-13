import { motion } from 'framer-motion'
import { Home, UtensilsCrossed, ShoppingBag, Heart } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'
import { useState } from 'react'

interface BottomNavProps {
  cartCount: number
  favoritesCount: number
  onCartClick: () => void
  onFavoritesClick: () => void
}

export function BottomNav({ cartCount, favoritesCount, onCartClick, onFavoritesClick }: BottomNavProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null)

  const handleClick = (id: string, href: string) => {
    hapticFeedback('medium') // Feedback tactile plus prononcé
    setActiveItem(id)
    
    // Reset l'état actif après un délai
    setTimeout(() => setActiveItem(null), 200)

    if (id === 'cart') {
      onCartClick()
      return
    }

    if (id === 'favorites') {
      onFavoritesClick()
      return
    }

    const element = document.querySelector(href)
    if (element) {
      const offset = 80 // Offset pour éviter que le contenu soit caché par la navbar
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
    }
  }

  const navItems = [
    { id: 'home', icon: Home, label: 'Accueil', href: '#', count: 0 },
    { id: 'menu', icon: UtensilsCrossed, label: 'Carte', href: '#la-carte', count: 0 },
    { id: 'favorites', icon: Heart, label: 'Favoris', href: '#', count: favoritesCount },
    { id: 'cart', icon: ShoppingBag, label: 'Panier', href: '#commande', count: cartCount },
  ]

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      {/* Enhanced blur background with better iOS compatibility */}
      <div className="absolute inset-0 bg-white/85 backdrop-blur-2xl border-t border-mayssa-brown/20 shadow-2xl" />
      
      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mayssa-caramel/30 to-transparent" />

      {/* Safe area padding for iOS with better touch targets */}
      <div className="relative flex items-center justify-around px-1 py-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon
          const isCart = item.id === 'cart'
          const isFavorites = item.id === 'favorites'
          const isActive = activeItem === item.id
          const hasContent = item.count > 0

          return (
            <motion.button
              key={item.id}
              onClick={() => handleClick(item.id, item.href)}
              className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-3xl transition-all duration-200 cursor-pointer min-w-[60px] min-h-[56px]" // Zones de touch plus grandes
              whileTap={{ scale: 0.85 }}
              style={{ touchAction: 'manipulation' }} // Améliore la réactivité sur mobile
            >
              {/* Ripple effect background */}
              {isActive && (
                <motion.div
                  layoutId="activeBackground"
                  className="absolute inset-0 bg-mayssa-soft rounded-3xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                />
              )}

              <motion.div
                className={`relative p-3 rounded-2xl transition-all duration-200 ${
                  isCart
                    ? 'bg-mayssa-brown text-mayssa-cream shadow-lg'
                    : isFavorites && hasContent
                    ? 'bg-red-50 text-red-500 shadow-md'
                    : isActive
                    ? 'bg-mayssa-soft/80 text-mayssa-brown shadow-sm'
                    : 'text-mayssa-brown/60'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                animate={isActive ? { rotate: [0, -3, 3, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon
                  size={24} // Icônes légèrement plus grandes pour une meilleure lisibilité
                  strokeWidth={hasContent ? 2.5 : 2}
                  className={isFavorites && hasContent ? 'fill-red-500' : ''}
                />

                {/* Enhanced badge with bounce animation */}
                {item.count > 0 && (
                  <motion.span
                    key={item.count} // Re-trigger animation when count changes
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 400, delay: 0.1 }}
                    className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-lg ${
                      isFavorites ? 'bg-red-500' : 'bg-mayssa-caramel'
                    } ring-2 ring-white`}
                  >
                    {item.count > 99 ? '99+' : item.count}
                  </motion.span>
                )}
              </motion.div>

              {/* Enhanced label with better contrast */}
              <motion.span 
                className={`text-[10px] font-semibold transition-colors duration-200 ${
                  isCart || (isFavorites && hasContent) 
                    ? 'text-mayssa-brown' 
                    : isActive 
                    ? 'text-mayssa-brown'
                    : 'text-mayssa-brown/50'
                }`}
                animate={isActive ? { y: [0, -1, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                {item.label}
              </motion.span>
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}
