import { motion } from 'framer-motion'
import { Home, UtensilsCrossed, ShoppingBag, Heart } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'

interface BottomNavProps {
  cartCount: number
  favoritesCount: number
  onCartClick: () => void
  onFavoritesClick: () => void
}

export function BottomNav({ cartCount, favoritesCount, onCartClick, onFavoritesClick }: BottomNavProps) {
  const handleClick = (id: string, href: string) => {
    hapticFeedback('light')

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
      element.scrollIntoView({ behavior: 'smooth' })
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
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      {/* Blur background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-mayssa-brown/10" />

      {/* Safe area padding for iOS */}
      <div className="relative flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon
          const isCart = item.id === 'cart'
          const isFavorites = item.id === 'favorites'
          const isHighlighted = isCart || isFavorites

          return (
            <motion.button
              key={item.id}
              onClick={() => handleClick(item.id, item.href)}
              className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                className={`relative p-2 rounded-xl ${
                  isCart
                    ? 'bg-mayssa-brown text-mayssa-cream'
                    : isFavorites && favoritesCount > 0
                    ? 'bg-red-50 text-red-500'
                    : 'text-mayssa-brown/70'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon
                  size={22}
                  className={isFavorites && favoritesCount > 0 ? 'fill-red-500' : ''}
                />

                {/* Badge */}
                {item.count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-lg ${
                      isFavorites ? 'bg-red-500' : 'bg-mayssa-caramel'
                    }`}
                  >
                    {item.count > 9 ? '9+' : item.count}
                  </motion.span>
                )}
              </motion.div>

              <span className={`text-[10px] font-semibold ${
                isHighlighted ? 'text-mayssa-brown' : 'text-mayssa-brown/60'
              }`}>
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}
