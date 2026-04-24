import { useState, useRef } from 'react'
import { Instagram, Phone, MapPin, Clock, MessageCircle } from 'lucide-react'
import { hapticFeedback } from '../lib/haptics'
import { PHONE_E164 } from '../constants'

export function Footer() {
    const [clickCount, setClickCount] = useState(0)
    const clickTimeoutRef = useRef<number | null>(null)

    const handleLogoClick = () => {
        hapticFeedback('light')
        setClickCount(prev => prev + 1)
        
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
        clickTimeoutRef.current = window.setTimeout(() => setClickCount(0), 2000)
        
        if (clickCount + 1 >= 5) {
            window.location.hash = 'admin'
            setClickCount(0)
        }
    }
    return (
        <footer className="relative mt-16 sm:mt-24 bg-mayssa-brown pt-16 sm:pt-20 pb-8 sm:pb-10 overflow-hidden text-mayssa-soft shadow-[0_-10px_40px_rgba(51,33,21,0.15)]">
            <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(197,160,89,0.15) 0%, transparent 50%)" }} />
            <div className="absolute top-0 right-1/4 -mt-32 w-96 h-96 bg-mayssa-gold/10 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12">
                <div className="grid grid-cols-1 gap-12 sm:gap-14 md:gap-16 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <img
                                src="/logo.webp"
                                alt="Maison Mayssa - Pâtisserie Annecy"
                                width={56}
                                height={56}
                                loading="lazy"
                                decoding="async"
                                className="h-14 w-14 rounded-[1.2rem] shadow-lg cursor-pointer hover:scale-105 transition-transform ring-1 ring-mayssa-gold/30"
                                onClick={handleLogoClick}
                                title={clickCount > 0 ? `${clickCount}/5 clics` : ''}
                            />
                            <div className="flex flex-col">
                                <span className="font-display text-2xl font-medium tracking-tight text-mayssa-gold">Maison Mayssa</span>
                                <span className="text-[9px] uppercase tracking-[0.3em] text-mayssa-soft/60">Annecy</span>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-mayssa-soft/70 font-light">
                            Pâtisseries artisanales d'exception. Des créations faites maison avec passion pour sublimer vos instants gourmands.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <SocialIcon href="https://www.instagram.com/maison_mayssa74/" icon={<Instagram strokeWidth={1.5} size={18} />} label="Instagram" />
                            <SocialIcon href={`https://wa.me/${PHONE_E164}`} icon={<Phone strokeWidth={1.5} size={18} />} label="WhatsApp" />
                        </div>
                    </div>

                    {/* Useful Links */}
                    <div>
                        <h3 className="mb-6 font-display text-lg font-medium text-mayssa-gold tracking-wide">Liens Utiles</h3>
                        <ul className="space-y-4 font-light">
                            <li><FooterLink href="#la-carte">La Carte</FooterLink></li>
                            <li>
                                <a
                                    href={`https://wa.me/${PHONE_E164}?text=${encodeURIComponent('Bonjour, je souhaite commander.')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => hapticFeedback('light')}
                                    className="text-sm text-mayssa-soft/70 hover:text-mayssa-gold transition-all hover:translate-x-1 cursor-pointer inline-flex items-center gap-2 group"
                                >
                                    <MessageCircle size={15} className="group-hover:scale-110 transition-transform text-mayssa-gold/70 group-hover:text-mayssa-gold" />
                                    Commander sur WhatsApp
                                </a>
                            </li>
                            <li><FooterLink href="#avis">Témoignages</FooterLink></li>
                            <li><FooterLink href="#faq">Questions Fréquentes</FooterLink></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div id="contact">
                        <h3 className="mb-6 font-display text-lg font-medium text-mayssa-gold tracking-wide">Contact</h3>
                        <ul className="space-y-5 font-light">
                            <li className="flex items-start gap-3 text-sm text-mayssa-soft/70">
                                <MapPin size={18} strokeWidth={1.5} className="shrink-0 text-mayssa-gold mt-0.5" />
                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=Maison+Mayssa+Annecy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-mayssa-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-gold/50 rounded-sm"
                                >
                                    Annecy et alentours (74)<br/>Maison Mayssa France
                                </a>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-mayssa-soft/70">
                                <Clock size={18} strokeWidth={1.5} className="shrink-0 text-mayssa-gold mt-0.5" />
                                <div>
                                    <p className="text-mayssa-soft mb-1">Horaires d'ouverture</p>
                                    <p className="opacity-80">18h30 — 02h • 7j/7</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-mayssa-soft/70">
                                <Phone size={18} strokeWidth={1.5} className="shrink-0 text-mayssa-gold mt-0.5" />
                                <a href={`https://wa.me/${PHONE_E164}`} target="_blank" rel="noopener noreferrer" onClick={() => hapticFeedback('light')} className="hover:text-mayssa-gold transition-colors cursor-pointer">06 19 87 10 05</a>
                            </li>
                        </ul>
                    </div>

                    {/* Information */}
                    <div id="livraison">
                        <h3 className="mb-6 font-display text-lg font-medium text-mayssa-gold tracking-wide">Livraison</h3>
                        <p className="text-sm text-mayssa-soft/80 font-light">Livraison offerte dès 50 € d&apos;achat sur Annecy et alentours.</p>
                        <p className="text-xs text-mayssa-soft/50 font-light leading-relaxed mt-2">Forfait de 5 € pour les commandes inférieures à 50 €.</p>
                    </div>
                </div>

                <div className="mt-16 sm:mt-20 border-t border-white/10 pt-8 flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="flex items-center gap-3 text-xs text-mayssa-soft/50 font-light text-center md:text-left tracking-wide">
                        <span>© {new Date().getFullYear()} Maison Mayssa • Excellence & Savoir-faire</span>
                        <button
                            type="button"
                            onClick={() => {
                                hapticFeedback('light')
                                window.location.hash = 'admin'
                            }}
                            className="text-mayssa-soft/20 hover:text-mayssa-gold transition-all cursor-pointer hover:rotate-90 duration-300"
                            title="Administration"
                            aria-label="Accès administration"
                        >
                            ⚙️
                        </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 text-xs text-mayssa-soft/50 font-light">
                        <button
                            type="button"
                            onClick={() => {
                                hapticFeedback('light')
                                window.location.hash = '#legal'
                            }}
                            className="text-mayssa-soft/70 hover:text-mayssa-gold transition-all cursor-pointer inline-block group"
                        >
                            <span>Mentions légales</span>
                            <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-[1px] bg-mayssa-gold mt-1"></span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                hapticFeedback('light')
                                window.location.hash = '#legal'
                            }}
                            className="text-mayssa-soft/70 hover:text-mayssa-gold transition-all cursor-pointer inline-block group"
                        >
                            <span>Politique de confidentialité</span>
                            <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-[1px] bg-mayssa-gold mt-1"></span>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    )
}

function SocialIcon({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => hapticFeedback('light')}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-mayssa-gold transition-all hover:-translate-y-1 hover:bg-mayssa-gold hover:text-mayssa-brown active:scale-95 cursor-pointer backdrop-blur-sm"
            aria-label={label}
        >
            {icon}
        </a>
    )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        hapticFeedback('light')
        if (href.startsWith('#')) {
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
    }

    return (
        <a
            href={href}
            onClick={handleClick}
            className="text-sm text-mayssa-soft/70 hover:text-mayssa-gold transition-all hover:translate-x-1 cursor-pointer inline-block group"
        >
            {children}
            <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-[1px] bg-mayssa-gold mt-1"></span>
        </a>
    )
}
