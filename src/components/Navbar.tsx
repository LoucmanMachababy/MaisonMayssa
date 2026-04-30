import React, { useEffect, useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Menu, X, User, Star, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { hapticFeedback } from '../lib/haptics'
import { Button } from './ui/Button'

interface NavbarProps {
  onAccountClick: () => void
}

export function Navbar({ onAccountClick }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { scrollY } = useScroll()
  const { isAuthenticated, profile } = useAuth()

  const navBlur = useTransform(scrollY, [0, 50], ['blur(0px)', 'blur(20px)'])

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setIsScrolled(latest > 50)
    })
  }, [scrollY])

  useEffect(() => {
    const handleScroll = () => {
      if (isMobileMenuOpen) setIsMobileMenuOpen(false)
      if (isUserMenuOpen) setIsUserMenuOpen(false)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobileMenuOpen, isUserMenuOpen])

  useEffect(() => {
    if (isMobileMenuOpen) {
      const scrollYVal = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollYVal}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
    } else {
      const top = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      if (top) {
        window.scrollTo(0, Math.abs(parseInt(top) || 0))
      }
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
    }
  }, [isMobileMenuOpen])

  const handleLogout = async () => {
    try {
      const { clientLogout } = await import('../lib/firebase')
      await clientLogout()
      setIsUserMenuOpen(false)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <>
      <motion.nav
        style={{ backdropFilter: navBlur }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-[600ms] ease-lux',
          isScrolled
            ? 'py-4 bg-white/70 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-white/50'
            : 'py-8 bg-transparent'
        )}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12 flex items-center justify-between">
          
          {/* Logo Section */}
          <div
            className="flex items-center gap-4 cursor-pointer group shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative overflow-hidden rounded-xl bg-white/80 p-0.5 shadow-sm ring-1 ring-black/5 group-hover:shadow-md transition-all duration-500">
              <img
                src="/logo.webp"
                alt="Maison Mayssa Logo"
                width={40}
                height={40}
                className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-[10px] object-cover group-hover:scale-105 transition-transform duration-[600ms] ease-lux"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg sm:text-xl tracking-wide text-mayssa-brown group-hover:text-mayssa-gold transition-colors duration-500">
                Maison <span className="italic font-light">Mayssa</span>
              </span>
              <span className="text-[8px] uppercase tracking-[0.4em] font-bold text-mayssa-brown/40">
                Annecy
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10">
            <NavLink href="#la-carte">La Collection</NavLink>
            <NavLink href="#commande">Réserver</NavLink>
            <NavLink href="#notre-histoire">L'Atelier</NavLink>

            {isAuthenticated ? (
              <div className="relative ml-4">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold text-mayssa-brown bg-white/60 hover:bg-white rounded-full border border-mayssa-brown/5 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <User size={14} />
                  Privilèges
                  <ChevronDown
                    size={12}
                    className={cn('transition-transform duration-500', isUserMenuOpen ? 'rotate-180' : '')}
                  />
                  {profile && (
                    <span className="flex items-center gap-1 ml-1 px-2 py-0.5 bg-mayssa-gold text-white rounded-full text-[9px] font-black">
                      <Star size={8} className="fill-current" />
                      {profile.loyalty?.points || 0}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="absolute top-full right-0 mt-4 w-56 bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/50 p-2 z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          onAccountClick()
                          setIsUserMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-mayssa-brown hover:bg-mayssa-brown/5 rounded-[1rem] transition-colors"
                      >
                        <User size={16} /> Espace Privé
                      </button>
                      <div className="h-[1px] bg-mayssa-brown/5 my-1 mx-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-red-500 hover:bg-red-50 rounded-[1rem] transition-colors"
                      >
                        <LogOut size={16} /> Déconnexion
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onAccountClick}
                className="ml-4 gap-2 border-mayssa-brown/10 hover:border-mayssa-gold text-mayssa-brown bg-white/50"
              >
                <User size={14} />
                Mon Compte
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 text-mayssa-brown rounded-xl bg-white/60 shadow-sm border border-black/5 active:scale-95 transition-transform"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[min(340px,85vw)] bg-mayssa-soft z-[60] shadow-2xl lg:hidden flex flex-col rounded-l-[2rem] border-l border-white"
            >
              <div className="flex items-center justify-between p-6 border-b border-mayssa-brown/5">
                <span className="font-display text-xl font-medium tracking-wide text-mayssa-gold">
                  Menu
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-mayssa-brown/50 hover:text-mayssa-brown bg-white rounded-xl shadow-sm border border-black/5 active:scale-95 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-2">
                <MobileNavLink href="#la-carte" onClick={() => setIsMobileMenuOpen(false)}>
                  La Collection
                </MobileNavLink>
                <MobileNavLink href="#commande" onClick={() => setIsMobileMenuOpen(false)}>
                  Réserver
                </MobileNavLink>
                <MobileNavLink href="#notre-histoire" onClick={() => setIsMobileMenuOpen(false)}>
                  L'Atelier
                </MobileNavLink>

                <div className="my-8 w-full h-[1px] bg-gradient-to-r from-transparent via-mayssa-gold/20 to-transparent" />

                {isAuthenticated ? (
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      className="w-full justify-between"
                      onClick={() => {
                        onAccountClick()
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <User size={16} /> Espace Privé
                      </span>
                      {profile && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 text-white rounded-full text-[10px]">
                          <Star size={10} className="fill-current" /> {profile.loyalty?.points || 0}
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full gap-3 text-red-500 hover:bg-red-50"
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <LogOut size={16} /> Déconnexion
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-3 border-mayssa-gold/30 text-mayssa-gold bg-mayssa-gold/5"
                    onClick={() => {
                      onAccountClick()
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <User size={16} /> Mon Compte
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        hapticFeedback('light')
        e.preventDefault()
        const targetId = href.replace('#', '')
        const element = document.getElementById(targetId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }}
      className="text-[10px] uppercase tracking-[0.25em] font-bold text-mayssa-brown/60 hover:text-mayssa-brown transition-colors duration-300 relative group"
    >
      {children}
      <span className="absolute -bottom-2 left-1/2 w-0 h-[1.5px] bg-mayssa-gold transition-all duration-500 group-hover:w-full group-hover:left-0" />
    </a>
  )
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        hapticFeedback('light')
        e.preventDefault()
        const targetId = href.replace('#', '')
        onClick()
        setTimeout(() => {
          const element = document.getElementById(targetId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 300)
      }}
      className="block p-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.25em] text-mayssa-brown/70 hover:bg-mayssa-brown/5 hover:text-mayssa-gold transition-all"
    >
      {children}
    </a>
  )
}
