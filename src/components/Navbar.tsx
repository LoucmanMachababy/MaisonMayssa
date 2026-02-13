import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Phone, Instagram, Menu, X, Heart, User, Star, LogOut, ChevronDown, Gift, MessageCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { useEffect, useState } from 'react'
import { PHONE_E164 } from '../constants'
import { useAuth } from '../hooks/useAuth'
import { clientLogout } from '../lib/firebase'
import { hapticFeedback } from '../lib/haptics'

interface NavbarProps {
    favoritesCount?: number
    onAccountClick: () => void
}

export function Navbar({ favoritesCount = 0, onAccountClick }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const { scrollY } = useScroll()
    const { isAuthenticated, profile } = useAuth()

    const backgroundColor = useTransform(
        scrollY,
        [0, 50],
        ['rgba(255, 249, 243, 0)', 'rgba(255, 249, 243, 0.8)']
    )

    useEffect(() => {
        return scrollY.on('change', (latest) => {
            setIsScrolled(latest > 50)
        })
    }, [scrollY])

    // Fermer les menus quand on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (isMobileMenuOpen) {
                setIsMobileMenuOpen(false)
            }
            if (isUserMenuOpen) {
                setIsUserMenuOpen(false)
            }
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isMobileMenuOpen, isUserMenuOpen])

    // Gérer la déconnexion
    const handleLogout = async () => {
        try {
            await clientLogout()
            setIsUserMenuOpen(false)
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    return (
        <>
            <motion.nav
                style={{ backgroundColor }}
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                    isScrolled ? "py-2 sm:py-3 backdrop-blur-xl border-mayssa-brown/5 shadow-sm" : "py-3 sm:py-6 border-transparent"
                )}
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <img src="/logo.webp" alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-xl object-contain shadow-lg ring-2 ring-white" />
                            <div className="flex flex-col">
                                <span className="font-display text-base sm:text-lg md:text-xl font-bold text-mayssa-brown leading-tight">Maison Mayssa</span>
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-mayssa-caramel">Annecy</span>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-8">
                            <NavLink href="#la-carte">La Carte</NavLink>
                            <NavLinkWithBadge href="#favoris" count={favoritesCount} icon={<Heart size={14} className={favoritesCount > 0 ? 'fill-red-500 text-red-500' : ''} />}>
                                Favoris
                            </NavLinkWithBadge>
                            <NavLink href="#commande">Voir la commande</NavLink>
                            
                            {/* User Menu */}
                            {isAuthenticated ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="relative flex items-center gap-2 text-sm font-bold text-mayssa-brown/70 hover:text-mayssa-brown transition-all uppercase tracking-widest hover:scale-105 active:scale-95 cursor-pointer"
                                    >
                                        <User size={14} />
                                        Mon Compte
                                        <ChevronDown size={12} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                        {profile && (
                                            <span className="flex items-center gap-1 ml-1 px-2 py-0.5 bg-mayssa-caramel/20 text-mayssa-caramel rounded-full text-[10px] font-bold normal-case">
                                                <Star size={8} />
                                                {profile.loyalty?.points || 0}
                                            </span>
                                        )}
                                    </button>
                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-mayssa-brown/10 py-2 z-50"
                                            >
                                                <button
                                                    onClick={() => {
                                                        onAccountClick()
                                                        setIsUserMenuOpen(false)
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-mayssa-brown hover:bg-mayssa-soft/50 transition-colors cursor-pointer"
                                                >
                                                    <User size={14} />
                                                    Voir mon compte
                                                </button>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                >
                                                    <LogOut size={14} />
                                                    Se déconnecter
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <button
                                    onClick={onAccountClick}
                                    className="relative flex items-center gap-2 text-sm font-bold text-mayssa-caramel hover:text-mayssa-brown transition-all uppercase tracking-widest hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                    <Gift size={14} />
                                    S&apos;inscrire / Se connecter
                                    <span className="px-1.5 py-0.5 bg-mayssa-caramel/20 text-mayssa-caramel rounded-full text-[9px] font-bold normal-case animate-pulse">
                                      +15 pts
                                    </span>
                                </button>
                            )}
                            
                            <NavLink href="#temoignages">Témoignages</NavLink>
                            <NavLink href="#notre-histoire">Notre Histoire</NavLink>
                            <NavLink href="#contact">Contact</NavLink>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                            <a
                                href="https://www.instagram.com/maison_mayssa74/"
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => hapticFeedback('light')}
                                className="p-1.5 sm:p-2 text-mayssa-brown hover:text-mayssa-caramel transition-colors rounded-lg hover:bg-mayssa-soft/50 active:scale-95 cursor-pointer"
                            >
                                <Instagram size={18} className="sm:w-5 sm:h-5" />
                            </a>
                            <a
                                href={`https://wa.me/${PHONE_E164}?text=${encodeURIComponent('Bonjour, je souhaite commander.')}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => hapticFeedback('light')}
                                className="hidden sm:flex items-center gap-2 rounded-full bg-[#25D366] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-sm ring-1 ring-[#25D366]/80 hover:bg-[#20bd5a] transition-all active:scale-95 cursor-pointer"
                            >
                                <MessageCircle size={14} className="sm:w-4 sm:h-4" />
                                <span className="hidden md:inline">Commander sur WhatsApp</span>
                            </a>
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2 text-mayssa-brown hover:text-mayssa-caramel transition-colors rounded-lg hover:bg-mayssa-soft/50 active:scale-95 cursor-pointer"
                                aria-label="Menu"
                            >
                                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden cursor-pointer"
                        />
                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white/95 backdrop-blur-xl z-50 shadow-2xl lg:hidden overflow-y-auto"
                        >
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between border-b border-mayssa-brown/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <img src="/logo.webp" alt="Logo" className="h-12 w-12 rounded-xl object-contain shadow-lg ring-2 ring-white" />
                                        <div className="flex flex-col">
                                            <span className="font-display text-xl font-bold text-mayssa-brown leading-tight">Maison Mayssa</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-mayssa-caramel">Annecy</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="p-2 text-mayssa-brown hover:text-mayssa-caramel transition-colors rounded-xl hover:bg-mayssa-soft/50 active:scale-95 cursor-pointer"
                                        aria-label="Fermer"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <nav className="space-y-2">
                                    <MobileNavLink href="#la-carte" onClick={() => setIsMobileMenuOpen(false)}>La Carte</MobileNavLink>
                                    <MobileNavLinkWithBadge href="#favoris" count={favoritesCount} onClick={() => setIsMobileMenuOpen(false)}>
                                        Favoris
                                    </MobileNavLinkWithBadge>
                                    <MobileNavLink href="#commande" onClick={() => setIsMobileMenuOpen(false)}>Voir la commande</MobileNavLink>
                                    
                                    {isAuthenticated ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    onAccountClick()
                                                    setIsMobileMenuOpen(false)
                                                }}
                                                className="flex items-center justify-between w-full rounded-2xl px-4 py-3 text-base font-bold text-mayssa-brown/80 hover:text-mayssa-brown hover:bg-mayssa-soft/50 active:bg-mayssa-soft active:scale-[0.99] transition-all uppercase tracking-widest cursor-pointer"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <User size={18} />
                                                    Mon Compte
                                                </span>
                                                {profile && (
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-mayssa-caramel/20 text-mayssa-caramel rounded-full text-xs font-bold normal-case">
                                                        <Star size={10} />
                                                        {profile.loyalty?.points || 0} pts
                                                    </span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleLogout()
                                                    setIsMobileMenuOpen(false)
                                                }}
                                                className="flex items-center w-full rounded-2xl px-4 py-3 text-base font-bold text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 active:scale-[0.99] transition-all cursor-pointer"
                                            >
                                                <LogOut size={18} />
                                                <span className="ml-2">Se Déconnecter</span>
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                onAccountClick()
                                                setIsMobileMenuOpen(false)
                                            }}
                                            className="flex items-center w-full rounded-2xl px-4 py-3 text-base font-bold text-mayssa-caramel hover:text-mayssa-brown hover:bg-mayssa-soft/50 active:bg-mayssa-soft active:scale-[0.99] transition-all uppercase tracking-widest cursor-pointer"
                                        >
                                            <Gift size={18} />
                                            <span className="ml-2">S&apos;inscrire / Se connecter</span>
                                            <span className="ml-auto px-2 py-0.5 bg-mayssa-caramel/20 text-mayssa-caramel rounded-full text-[10px] font-bold normal-case animate-pulse">
                                              +15 pts
                                            </span>
                                        </button>
                                    )}
                                    
                                    <MobileNavLink href="#temoignages" onClick={() => setIsMobileMenuOpen(false)}>Témoignages</MobileNavLink>
                                    <MobileNavLink href="#notre-histoire" onClick={() => setIsMobileMenuOpen(false)}>Notre Histoire</MobileNavLink>
                                    <MobileNavLink href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</MobileNavLink>
                                </nav>

                                <div className="pt-4 border-t border-mayssa-brown/10 space-y-2">
                                    <a
                                        href={`https://wa.me/${PHONE_E164}?text=${encodeURIComponent('Bonjour, je souhaite commander.')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={() => hapticFeedback('medium')}
                                        className="flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-white shadow-lg transition-all hover:bg-[#20bd5a] hover:-translate-y-0.5 active:scale-[0.98] w-full cursor-pointer"
                                    >
                                        <MessageCircle size={22} />
                                        <span className="font-bold">Commander sur WhatsApp</span>
                                    </a>
                                    <a
                                        href="tel:+33619871005"
                                        onClick={() => hapticFeedback('light')}
                                        className="flex items-center justify-center gap-2 text-sm text-mayssa-brown/70 hover:text-mayssa-caramel cursor-pointer"
                                    >
                                        <Phone size={16} />
                                        Appeler
                                    </a>
                                </div>

                                <div className="flex gap-4 justify-center pt-4 border-t border-mayssa-brown/10">
                                    <a
                                        href="https://www.instagram.com/maison_mayssa74/"
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={() => hapticFeedback('light')}
                                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
                                    >
                                        <Instagram size={20} />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        hapticFeedback('light')
        e.preventDefault()
        const targetId = href.replace('#', '')
        const element = document.getElementById(targetId)

        if (element) {
            const navHeight = 80 // Hauteur approximative de la navbar
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
            const offsetPosition = elementPosition - navHeight

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
        }
    }

    return (
        <a
            href={href}
            onClick={handleClick}
            className="text-sm font-bold text-mayssa-brown/70 hover:text-mayssa-brown transition-all uppercase tracking-widest hover:scale-105 active:scale-95 cursor-pointer"
        >
            {children}
        </a>
    )
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        hapticFeedback('light')
        e.preventDefault()
        const targetId = href.replace('#', '')
        const element = document.getElementById(targetId)

        if (element) {
            const navHeight = 80
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
            const offsetPosition = elementPosition - navHeight

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
        }
        onClick()
    }

    return (
        <a
            href={href}
            onClick={handleClick}
            className="block rounded-2xl px-4 py-3 text-base font-bold text-mayssa-brown/80 hover:text-mayssa-brown hover:bg-mayssa-soft/50 active:bg-mayssa-soft active:scale-[0.99] transition-all uppercase tracking-widest cursor-pointer"
        >
            {children}
        </a>
    )
}

function NavLinkWithBadge({ href, children, count, icon }: { href: string; children: React.ReactNode; count: number; icon?: React.ReactNode }) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        hapticFeedback('light')
        e.preventDefault()
        const targetId = href.replace('#', '')
        const element = document.getElementById(targetId)

        if (element) {
            const navHeight = 80
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
            const offsetPosition = elementPosition - navHeight

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
        }
    }

    return (
        <a
            href={href}
            onClick={handleClick}
            className="relative flex items-center gap-1.5 text-sm font-bold text-mayssa-brown/70 hover:text-mayssa-brown transition-all uppercase tracking-widest hover:scale-105 active:scale-95 cursor-pointer"
        >
            {icon}
            {children}
            {count > 0 && (
                <span className="absolute -top-2 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </a>
    )
}

function MobileNavLinkWithBadge({ href, children, count, onClick }: { href: string; children: React.ReactNode; count: number; onClick: () => void }) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        hapticFeedback('light')
        e.preventDefault()
        const targetId = href.replace('#', '')
        const element = document.getElementById(targetId)

        if (element) {
            const navHeight = 80
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
            const offsetPosition = elementPosition - navHeight

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
        }
        onClick()
    }

    return (
        <a
            href={href}
            onClick={handleClick}
            className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-mayssa-brown/80 hover:text-mayssa-brown hover:bg-mayssa-soft/50 active:bg-mayssa-soft active:scale-[0.99] transition-all uppercase tracking-widest cursor-pointer"
        >
            <span className="flex items-center gap-2">
                <Heart size={18} className={count > 0 ? 'fill-red-500 text-red-500' : ''} />
                {children}
            </span>
            {count > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </a>
    )
}
