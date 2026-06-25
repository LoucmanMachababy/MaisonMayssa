import { useState, useRef } from 'react'
import { Instagram, Phone, MapPin, Clock } from 'lucide-react'
import { hapticFeedback } from '../lib/haptics'
import { PHONE_E164 } from '../constants'

export function Footer() {
  const [clickCount, setClickCount] = useState(0)
  const clickTimeoutRef = useRef<number | null>(null)

  const handleLogoClick = () => {
    hapticFeedback('light')
    setClickCount((prev) => prev + 1)

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
    clickTimeoutRef.current = window.setTimeout(() => setClickCount(0), 2000)

    if (clickCount + 1 >= 5) {
      window.location.hash = 'admin'
      setClickCount(0)
    }
  }
  return (
    <footer className="relative mt-24 bg-mayssa-brown py-16 text-mayssa-soft shadow-[0_-10px_40px_rgba(51,33,21,0.15)] flex flex-col items-center border-t border-mayssa-gold/10">
      <div className="absolute inset-0 bg-mayssa-brown/95 pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center">
        {/* Brand Centerpiece */}
        <div className="flex flex-col items-center text-center space-y-6">
          <img
            src="/logo.webp"
            alt="Maison Mayssa - Haute Pâtisserie Annecy"
            width={64}
            height={64}
            loading="lazy"
            decoding="async"
            className="h-16 w-16 rounded-[1rem] shadow-xl cursor-pointer ring-1 ring-mayssa-gold/40 hover:scale-105 transition-all duration-500"
            onClick={handleLogoClick}
            title={clickCount > 0 ? `${clickCount}/5 clics` : ''}
          />
          <div>
            <h2 className="font-display text-3xl font-medium tracking-wide text-mayssa-gold">
              Maison Mayssa
            </h2>
            <p className="text-[10px] uppercase tracking-[0.4em] text-mayssa-soft/50 mt-1">
              Haute Pâtisserie • Annecy
            </p>
          </div>
          <p className="text-sm font-light text-mayssa-soft/60 max-w-lg leading-relaxed mt-2">
            L'excellence artisanale dédiée aux moments d'exception. Nos créations
            sont préparées sur commande pour garantir une fraîcheur absolue.
          </p>
        </div>

        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-mayssa-gold/20 to-transparent my-10" />

        {/* Minimal Info Links */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8 text-center md:text-left">
          {/* Contact */}
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-mayssa-gold font-bold">Contact</h3>
            <ul className="space-y-3 font-light text-sm text-mayssa-soft/70">
              <li className="flex items-center gap-3">
                <MapPin size={16} className="text-mayssa-gold/50" />
                Annecy et ses alentours
              </li>
              <li className="flex items-center gap-3">
                <Clock size={16} className="text-mayssa-gold/50" />
                Service: 18h30 — 02h (7j/7)
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-mayssa-gold font-bold">Réseaux</h3>
            <div className="flex items-center gap-4">
              <SocialIcon
                href="https://www.instagram.com/maison_mayssa74/"
                icon={<Instagram size={20} />}
                label="Instagram Maison Mayssa"
              />
              <SocialIcon
                href={`https://wa.me/${PHONE_E164}`}
                icon={<Phone size={20} />}
                label="WhatsApp Maison Mayssa"
              />
            </div>
          </div>

          {/* Useful */}
          <div className="space-y-4 flex flex-col items-center md:items-end">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-mayssa-gold font-bold">Explorez</h3>
            <ul className="space-y-3 font-light text-sm text-mayssa-soft/70 text-center md:text-right">
              <li>
                <FooterLink href="#la-carte">La Collection</FooterLink>
              </li>
              <li>
                <FooterLink href="#faq">Questions Fréquentes</FooterLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 w-full flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-mayssa-soft/40 gap-4">
          <p>© {new Date().getFullYear()} Maison Mayssa. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                hapticFeedback('light')
                window.location.hash = '#legal'
              }}
              className="hover:text-mayssa-gold transition-colors"
            >
              Mentions Légales
            </button>
            <button
              type="button"
              onClick={() => {
                hapticFeedback('light')
                window.location.hash = 'admin'
              }}
              className="hover:text-mayssa-gold transition-colors"
            >
              Portail
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
      rel="noreferrer"
      onClick={() => hapticFeedback('light')}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-mayssa-gold/10 text-mayssa-gold transition-all duration-300 hover:scale-110 hover:bg-mayssa-gold hover:text-mayssa-brown hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]"
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
          behavior: 'smooth',
        })
      }
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="relative text-mayssa-soft/70 hover:text-mayssa-gold transition-colors duration-300 group inline-block"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-mayssa-gold transition-all duration-500 group-hover:w-full" />
    </a>
  )
}
