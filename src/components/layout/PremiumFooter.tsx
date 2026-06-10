import { Link } from 'react-router-dom'
import { Instagram } from 'lucide-react'

export function PremiumFooter() {
  return (
    <footer className="bg-mayssa-brown text-mayssa-soft py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          {/* Brand */}
          <div className="md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="font-display text-2xl tracking-widest uppercase mb-6">
              Maison Mayssa
            </Link>
            <p className="text-mayssa-soft/60 text-sm leading-relaxed max-w-xs">
              L'art du trompe-l'œil pâtissier. Des créations artisanales pensées pour surprendre l'œil et séduire le palais.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-display tracking-widest uppercase text-sm mb-6 text-mayssa-gold">Découvrir</h4>
            <ul className="space-y-4 text-sm text-mayssa-soft/80 text-center md:text-left">
              <li><Link to="/carte" className="hover:text-mayssa-gold transition-colors">La Carte</Link></li>
              <li><Link to="/evenements" className="hover:text-mayssa-gold transition-colors">Événements</Link></li>
              <li><Link to="/a-propos" className="hover:text-mayssa-gold transition-colors">La Maison</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-display tracking-widest uppercase text-sm mb-6 text-mayssa-gold">Contact</h4>
            <ul className="space-y-4 text-sm text-mayssa-soft/80 text-center md:text-left">
              <li><a href="mailto:contact@maison-mayssa.fr" className="hover:text-mayssa-gold transition-colors">contact@maison-mayssa.fr</a></li>
              <li><Link to="/contact" className="hover:text-mayssa-gold transition-colors">Nous écrire</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-display tracking-widest uppercase text-sm mb-6 text-mayssa-gold">Suivez-nous</h4>
            <div className="flex space-x-4">
              <a 
                href="https://instagram.com/maison_mayssa74" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-mayssa-soft/20 flex items-center justify-center hover:bg-mayssa-gold hover:border-mayssa-gold transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://tiktok.com/@maison_mayssa74" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-mayssa-soft/20 flex items-center justify-center hover:bg-mayssa-gold hover:border-mayssa-gold transition-all duration-300"
                aria-label="TikTok"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.89 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="https://snapchat.com/add/mayssasucree74" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-mayssa-soft/20 flex items-center justify-center hover:bg-mayssa-gold hover:border-mayssa-gold transition-all duration-300"
                aria-label="Snapchat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.08 1.832c2.25 0 4.414.94 5.952 2.607 1.492 1.616 2.247 3.75 2.115 5.987-.04.68-.168 1.343-.382 1.97-.247.79-.58 1.54-.99 2.232-.38.64-.82 1.24-1.31 1.79-.19.2-.39.39-.59.58-.26.24-.53.47-.82.68-.31.23-.64.44-.98.63-.36.21-.73.4-1.12.57-.42.18-.85.34-1.29.47-.46.13-.93.24-1.41.32-.48.08-.97.13-1.46.15-.49.02-.98.02-1.47 0-.49-.02-.98-.07-1.46-.15-.48-.08-.95-.19-1.41-.32-.44-.13-.87-.29-1.29-.47-.39-.17-.76-.36-1.12-.57-.34-.19-.67-.4-.98-.63-.29-.21-.56-.44-.82-.68-.2-.19-.4-.38-.59-.58-.49-.55-.93-1.15-1.31-1.79-.41-.69-.74-1.44-.99-2.232-.214-.627-.342-1.29-.382-1.97-.132-2.237.623-4.37 2.115-5.987C7.666 2.772 9.83 1.832 12.08 1.832zm.01 1.666c-1.79 0-3.51.75-4.73 2.07-1.19 1.29-1.79 3-1.68 4.79.03.54.13 1.07.3 1.57.2.63.46 1.23.79 1.78.3.51.65.99 1.04 1.43.15.16.31.31.47.46.21.19.42.37.65.54.25.18.51.35.78.5.29.17.58.32.89.45.33.14.68.27 1.03.37.37.1.74.19 1.13.25.39.06.78.1 1.17.11.39.01.78.01 1.17 0 .39-.01.78-.05 1.17-.11.39-.06.76-.15 1.13-.25.35-.1.7-.23 1.03-.37.31-.13.6-.28.89-.45.27-.15.53-.32.78-.5.23-.17.44-.35.65-.54.16-.15.32-.3.47-.46.39-.44.74-.92 1.04-1.43.33-.55.59-1.15.79-1.78.17-.5.27-1.03.3-1.57.11-1.79-.49-3.5-1.68-4.79-1.22-1.32-2.94-2.07-4.73-2.07z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-mayssa-soft/10 flex flex-col md:flex-row items-center justify-between text-xs text-mayssa-soft/40">
          <p>© {new Date().getFullYear()} GHAZI ROUMAYSSA (Maison Mayssa) · SIRET 989 703 715 00015</p>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 mt-4 md:mt-0">
            <Link to="/legal#cgv" className="hover:text-mayssa-soft transition-colors">CGV</Link>
            <Link to="/legal#mentions-legales" className="hover:text-mayssa-soft transition-colors">Mentions légales</Link>
            <Link to="/legal#confidentialite" className="hover:text-mayssa-soft transition-colors">Confidentialité</Link>
            <Link to="/legal#accessibilite" className="hover:text-mayssa-soft transition-colors">Accessibilité</Link>
            <Link to="/faq" className="hover:text-mayssa-soft transition-colors">FAQ</Link>
            <Link to="/contact" className="hover:text-mayssa-soft transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
