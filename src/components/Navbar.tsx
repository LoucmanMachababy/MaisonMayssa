import React, { useEffect, useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Instagram, Menu, X, User, Star, LogOut, ChevronDown, Gift, MessageCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { PHONE_E164 } from '../constants'
import { useAuth } from '../hooks/useAuth'
import { hapticFeedback } from '../lib/haptics'

interface NavbarProps {
    onAccountClick: () => void
}

export function Navbar({ onAccountClick }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const { scrollY } = useScroll()
    const { isAuthenticated, profile } = useAuth()

    const navBlur = useTransform(scrollY, [0, 50], ["blur(0px)", "blur(24px)"])

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
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-700",
                    isScrolled 
                        ? "py-3 bg-white/70 shadow-premium-shadow border-b border-white/80 backdrop-blur-3xl" 
                        : "py-6 sm:py-8 bg-transparent"
                )}
            >
                <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
                    <div className="flex items-center justify-between">
                        {/* Logo + Maison Mayssa Annecy — tout à gauche */}
                        <div className="flex items-center gap-3 group cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="relative">
                                <div className="absolute inset-0 gold-gradient blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
                                <img src="/logo.webp" alt="Maison Mayssa" width={48} height={48} className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-cover shadow-premium-shadow ring-1 ring-white transition-all duration-700 group-hover:scale-110 bg-white/50 p-1 backdrop-blur-md" />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-mayssa-brown group-hover:text-mayssa-gold transition-colors duration-700">Maison <span className="italic font-light">Mayssa</span></span>
                                <span className="text-[9px] uppercase tracking-[0.4em] font-black text-mayssa-gold opacity-80">Annecy</span>
                            </div>
                        </div>

                        {/* Tout à droite : liens + compte + WhatsApp */}
                        <div className="hidden lg:flex items-center gap-8">
                            <NavLink href="#la-carte">La Carte</NavLink>
                            <NavLink href="#commande">Commandes</NavLink>
                            <NavLink href="#notre-maison">Notre maison</NavLink>
                            {isAuthenticated ? (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="relative flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] font-black text-mayssa-brown hover:text-mayssa-gold transition-all duration-500 group glass-card px-5 py-2.5 rounded-full border-white/80 shadow-premium-shadow hover:shadow-lg"
                                    >
                                        <User size={16} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                                        Privilèges
                                        <ChevronDown size={14} className={`transition-transform duration-700 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                        {profile && (
                                            <span className="flex items-center gap-1.5 ml-2 px-3 py-1 bg-mayssa-brown text-mayssa-gold rounded-full text-[10px] font-black shadow-inner">
                                                <Star size={10} className="fill-current" />
                                                {profile.loyalty?.points || 0}
                                            </span>
                                        )}
                                    </button>
                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                                className="absolute top-full right-0 mt-5 w-60 bg-white/90 backdrop-blur-3xl rounded-[2rem] shadow-premium-shadow border border-white p-3 z-50"
                                            >
                                                <button
                                                    onClick={() => { onAccountClick(); setIsUserMenuOpen(false) }}
                                                    className="w-full flex items-center gap-4 px-5 py-4 text-sm font-bold text-mayssa-brown hover:bg-mayssa-brown hover:text-white rounded-2xl transition-all duration-500 group"
                                                >
                                                    <User size={18} className="group-hover:scale-110 transition-transform" />
                                                    Mon Espace Privé
                                                </button>
                                                <div className="h-[1px] gold-gradient opacity-10 my-2 mx-4" />
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-4 px-5 py-4 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-500"
                                                >
                                                    <LogOut size={18} />
                                                    Déconnexion
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onAccountClick}
                                    className="relative flex items-center gap-3 text-[11px] font-black text-mayssa-brown hover:text-mayssa-gold transition-all duration-500 uppercase tracking-[0.25em] group glass-card px-6 py-2.5 rounded-full"
                                >
                                    <Gift size={18} className="group-hover:scale-110 transition-transform text-mayssa-gold" />
                                    <span>Adhésion</span>
                                    <motion.span 
                                        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                                        transition={{ repeat: Infinity, duration: 3 }}
                                        className="px-2.5 py-1 gold-gradient text-white rounded-full text-[9px] font-black tracking-widest shadow-premium-shadow border border-white/20"
                                    >
                                      REJOINDRE
                                    </motion.span>
                                </button>
                            )}

                            <div className="w-[1px] h-8 gold-gradient opacity-20" />
                            
                            <a
                                href={`https://wa.me/${PHONE_E164}?text=${encodeURIComponent('Bonjour, je souhaite commander.')}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => hapticFeedback('light')}
                                className="relative overflow-hidden flex items-center gap-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] px-7 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-premium-shadow transition-all duration-500 hover:-translate-y-1 active:scale-95 group/wa"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover/wa:translate-y-[100%] transition-transform duration-700 rounded-full" />
                                <MessageCircle size={18} strokeWidth={2.5} className="group-hover/wa:scale-110 transition-transform duration-500 relative z-10" />
                                <span className="relative z-10">WhatsApp</span>
                            </a>
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex lg:hidden items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-3 text-mayssa-brown rounded-2xl bg-white/50 backdrop-blur-md shadow-sm border border-white/80 transition-all active:scale-90"
                            >
                                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-mayssa-brown/60 backdrop-blur-md z-[55] lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                            className="fixed top-0 right-0 bottom-0 w-[min(380px,90vw)] bg-mesh backdrop-blur-3xl z-[60] shadow-premium-shadow lg:hidden flex flex-col rounded-l-[3rem] border-l border-white/80"
                        >
                            <div className="flex items-center justify-between p-8 border-b border-mayssa-brown/5">
                                <span className="font-display text-2xl font-bold text-mayssa-brown">Maison <span className="italic font-light">Mayssa</span></span>
                                <button
                                    type="button"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-3 text-mayssa-brown/50 hover:text-mayssa-brown rounded-2xl bg-mayssa-brown/5 transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-3">
                                <MobileNavLink href="#la-carte" onClick={() => setIsMobileMenuOpen(false)}>La Carte</MobileNavLink>
                                <MobileNavLink href="#commande" onClick={() => setIsMobileMenuOpen(false)}>Commandes</MobileNavLink>
                                <MobileNavLink href="#notre-maison" onClick={() => setIsMobileMenuOpen(false)}>Notre maison</MobileNavLink>

                                <div className="my-8 h-[1px] gold-gradient opacity-10" />

                                {isAuthenticated ? (
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => { onAccountClick(); setIsMobileMenuOpen(false) }}
                                            className="w-full flex items-center justify-between p-5 rounded-[1.8rem] bg-mayssa-brown text-white shadow-premium-shadow transition-all"
                                        >
                                            <span className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest"><User size={20} /> Espace Privé</span>
                                            {profile && (
                                                <span className="flex items-center gap-2 px-3 py-1 bg-white/10 text-mayssa-gold rounded-full text-xs font-black">
                                                    <Star size={12} className="fill-current" /> {profile.loyalty?.points || 0}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => { handleLogout(); setIsMobileMenuOpen(false) }}
                                            className="w-full flex items-center gap-4 p-5 rounded-[1.8rem] text-red-500 hover:bg-red-50 transition-colors text-sm font-bold uppercase tracking-widest"
                                        >
                                            <LogOut size={20} /> Déconnexion
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { onAccountClick(); setIsMobileMenuOpen(false) }}
                                        className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-mayssa-gold/10 text-mayssa-gold border border-mayssa-gold/30 shadow-premium-shadow transition-all"
                                    >
                                        <span className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest"><Gift size={22} /> Adhésion</span>
                                        <span className="px-3 py-1.5 gold-gradient text-white rounded-full text-[10px] font-black tracking-tighter shadow-sm animate-pulse">POINTS OFFERTS</span>
                                    </button>
                                )}
                            </div>

                            <div className="p-8 pb-safe bg-mayssa-soft/50 border-t border-mayssa-brown/5 space-y-5">
                                <a
                                    href={`https://wa.me/${PHONE_E164}?text=${encodeURIComponent('Bonjour, je souhaite commander.')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center w-full gap-4 p-5 rounded-[1.8rem] bg-[#25D366] text-white hover:bg-[#20bd5a] transition-all font-black uppercase tracking-widest shadow-xl"
                                >
                                    <MessageCircle size={22} strokeWidth={2.5} />
                                    WhatsApp
                                </a>
                                <div className="flex justify-center gap-6">
                                    <a
                                        href="https://www.instagram.com/maison_mayssa74/"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-mayssa-brown shadow-premium-shadow border border-mayssa-brown/5 hover:border-mayssa-gold transition-all"
                                    >
                                        <Instagram size={24} />
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
    return (
        <a
            href={href}
            onClick={(e) => {
                hapticFeedback('light')
                e.preventDefault()
                const targetId = href.replace('#', '')
                const element = document.getElementById(targetId)
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="text-[11px] uppercase tracking-[0.3em] font-black text-mayssa-brown/70 hover:text-mayssa-gold transition-all duration-500 relative group"
        >
            {children}
            <span className="absolute -bottom-1.5 left-1/2 w-0 h-[1.5px] gold-gradient transition-all duration-500 group-hover:w-full group-hover:left-0" />
        </a>
    )
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
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
                    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 350)
            }}
            className="block p-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] text-mayssa-brown/80 hover:bg-mayssa-brown/5 hover:text-mayssa-gold transition-all"
        >
            {children}
        </a>
    )
}

