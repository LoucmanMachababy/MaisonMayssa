import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useIsAdmin } from '../../hooks/useIsAdmin'
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react'
import { useCartStore } from '../../lib/store'
import { AnimatePresence, motion } from 'framer-motion'

interface PremiumHeaderProps {
  hasGlobalBanner?: boolean
  ordersOpen?: boolean
}

export function PremiumHeader({ hasGlobalBanner, ordersOpen = true }: PremiumHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { isAdmin } = useIsAdmin()
  const cartItems = useCartStore((state) => state.items)
  const accountPath = isAuthenticated ? '/compte' : '/connexion'
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const navLinks = useMemo(() => {
    const links = [
      { name: 'Accueil', path: '/' },
      { name: 'La carte', path: '/carte' },
      { name: 'Événements', path: '/evenements' },
      { name: 'Maison Mayssa', path: '/a-propos' },
      { name: 'Contact', path: '/contact' },
    ]
    if (isAdmin) {
      links.push({ name: 'Administration', path: '/admin' })
    }
    return links
  }, [isAdmin])

  const isHomePage = location.pathname === '/'
  const isSolid = !isHomePage || isScrolled

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-500 border-b ${
          hasGlobalBanner ? 'top-10' : 'top-0'
        } ${
          isSolid 
            ? 'bg-white border-mayssa-brown/5 py-4 shadow-sm' 
            : 'bg-transparent border-transparent py-6'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden p-2 -ml-2 transition-colors ${isSolid ? 'text-mayssa-brown' : 'text-white'}`}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Menu"
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>

          {/* Logo */}
          <Link
            to="/"
            className={`absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 font-display text-xl md:text-2xl tracking-[0.2em] uppercase transition-colors ${
              isSolid ? 'text-mayssa-brown hover:text-mayssa-gold' : 'text-white hover:text-white/80'
            }`}
          >
            Maison Mayssa
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm tracking-wide uppercase transition-colors hover:text-mayssa-gold ${
                  location.pathname === link.path
                    ? (isSolid ? 'text-mayssa-gold font-medium' : 'text-white font-medium')
                    : (isSolid ? 'text-mayssa-brown/80' : 'text-white/80')
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            <button className={`hidden sm:block transition-colors hover:text-mayssa-gold ${isSolid ? 'text-mayssa-brown/80' : 'text-white/80'}`}>
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link
              to={accountPath}
              className={`transition-colors hover:text-mayssa-gold ${isSolid ? 'text-mayssa-brown/80' : 'text-white/80'}`}
              aria-label="Mon compte"
            >
              <User size={20} strokeWidth={1.5} />
            </Link>
            <Link
              to="/panier"
              aria-label="Panier"
              className={`relative transition-colors hover:text-mayssa-gold ${isSolid ? 'text-mayssa-brown/80' : 'text-white/80'}`}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className={`absolute -top-2 -right-2 text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ${
                  isSolid ? 'bg-mayssa-gold text-white' : 'bg-white text-mayssa-brown'
                }`}>
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              to="/carte"
              className={`hidden lg:inline-flex items-center justify-center px-6 py-2.5 text-xs tracking-widest uppercase transition-colors duration-300 ${
                isSolid 
                  ? 'bg-mayssa-brown text-white hover:bg-mayssa-espresso' 
                  : 'bg-white text-mayssa-brown hover:bg-white/90'
              }`}
            >
              {ordersOpen ? 'Précommander' : 'La carte'}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-mayssa-brown/20 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-mayssa-soft z-50 lg:hidden flex flex-col border-r border-mayssa-brown/10"
            >
              <div className="p-6 flex items-center justify-between border-b border-mayssa-brown/5">
                <span className="font-display text-xl tracking-widest uppercase text-mayssa-brown">
                  Menu
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-mayssa-brown/60 hover:text-mayssa-brown"
                >
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-8 px-6 flex flex-col space-y-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`text-lg tracking-wide uppercase transition-colors ${
                      location.pathname === link.path
                        ? 'text-mayssa-gold'
                        : 'text-mayssa-brown'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
              <div className="p-6 border-t border-mayssa-brown/5 space-y-4">
                <Link
                  to={accountPath}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 border border-mayssa-brown/20 text-mayssa-brown text-sm tracking-widest uppercase hover:bg-mayssa-brown/5 transition-colors duration-300"
                >
                  <User size={18} strokeWidth={1.5} />
                  {isAuthenticated ? 'Mon compte' : 'Connexion'}
                </Link>
                <Link
                  to="/carte"
                  className="w-full inline-flex items-center justify-center px-6 py-4 bg-mayssa-brown text-white text-sm tracking-widest uppercase hover:bg-mayssa-espresso transition-colors duration-300"
                >
                  {ordersOpen ? 'Précommander' : 'La carte'}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
