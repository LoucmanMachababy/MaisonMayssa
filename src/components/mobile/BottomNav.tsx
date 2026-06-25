import { motion } from 'framer-motion'
import { Home, UtensilsCrossed, ShoppingBag } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'
import { useState } from 'react'
import { cn } from '../../lib/utils'

interface BottomNavProps {
  cartCount: number
  onCartClick: () => void
}

export function BottomNav({ cartCount, onCartClick }: BottomNavProps) {
  const [activeItem, setActiveItem] = useState<string>('home')

  const handleClick = (id: string, href: string) => {
    hapticFeedback('medium')
    setActiveItem(id)

    if (id === 'cart') {
      onCartClick()
      return
    }

    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const element = document.querySelector(href)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
    }
  }

  const navItems = [
    { id: 'home', icon: Home, label: 'Accueil', href: '#' },
    { id: 'menu', icon: UtensilsCrossed, label: 'Collection', href: '#la-carte' },
    { id: 'cart', icon: ShoppingBag, label: 'Panier', href: '#commande' },
  ]

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      {/* Luxury Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-3xl shadow-[0_-10px_40px_rgba(42,27,18,0.05)] border-t border-mayssa-brown/5" />

      {/* Navigation Items */}
      <div className="relative flex items-center justify-around px-2 py-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon
          const isCart = item.id === 'cart'
          const isActive = activeItem === item.id

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id, item.href)}
              className="relative flex flex-col items-center justify-center gap-1.5 min-w-[72px] h-14 cursor-pointer outline-none focus:outline-none group"
              style={{ touchAction: 'manipulation' }}
            >
              <div className="relative">
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    "flex items-center justify-center rounded-2xl transition-all duration-300",
                    isCart 
                      ? "bg-mayssa-brown text-mayssa-gold w-12 h-12 shadow-lg" 
                      : "w-10 h-10",
                    !isCart && isActive ? "text-mayssa-gold" : "",
                    !isCart && !isActive ? "text-mayssa-brown/40 group-hover:text-mayssa-brown/60" : ""
                  )}
                >
                  <Icon size={isCart ? 22 : 24} strokeWidth={isActive || isCart ? 2.5 : 2} />
                  
                  {isCart && cartCount > 0 && (
                    <motion.div
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15, stiffness: 400 }}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-mayssa-gold text-white text-[10px] font-bold shadow-md ring-2 ring-white"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </motion.div>
                  )}
                </motion.div>
                
                {/* Active Indicator Line */}
                {!isCart && isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-mayssa-gold rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
              
              {!isCart && (
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                  isActive ? "text-mayssa-gold" : "text-mayssa-brown/40 group-hover:text-mayssa-brown/60"
                )}>
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </motion.nav>
  )
}
