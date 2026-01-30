import { Instagram, Ghost as Snapchat, Phone, MapPin, Clock } from 'lucide-react'

export function Footer() {
    return (
        <footer className="relative mt-12 sm:mt-16 md:mt-24 border-t border-mayssa-brown/5 bg-white/40 pt-12 sm:pt-16 pb-6 sm:pb-8 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 sm:gap-10 md:gap-12 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand Column */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <img src="/logo.PNG" alt="Logo" className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl shadow-md" />
                            <span className="font-display text-xl sm:text-2xl font-bold text-mayssa-brown">Maison Mayssa</span>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/60">
                            Pâtisseries artisanales d'exception à Annecy. Des créations faites maison avec passion pour sublimer vos moments gourmands.
                        </p>
                        <div className="flex gap-3 sm:gap-4">
                            <SocialIcon href="https://www.instagram.com/maison.mayssa74/" icon={<Instagram size={16} className="sm:w-[18px] sm:h-[18px]" />} />
                            <SocialIcon href="https://www.snapchat.com/add/mayssasucree74" icon={<Snapchat size={16} className="sm:w-[18px] sm:h-[18px]" />} />
                            <SocialIcon href="tel:+33619871005" icon={<Phone size={16} className="sm:w-[18px] sm:h-[18px]" />} />
                        </div>
                    </div>

                    {/* Useful Links */}
                    <div>
                        <h3 className="mb-4 sm:mb-6 font-display text-base sm:text-lg font-bold text-mayssa-brown">Liens Utiles</h3>
                        <ul className="space-y-2 sm:space-y-3">
                            <li><FooterLink href="#la-carte">La Carte</FooterLink></li>
                            <li><FooterLink href="#commande">Commander</FooterLink></li>
                            <li><FooterLink href="#temoignages">Témoignages</FooterLink></li>
                            <li><FooterLink href="#livraison">Zone de Livraison</FooterLink></li>
                            <li><FooterLink href="#contact">Contact</FooterLink></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div id="contact">
                        <h3 className="mb-4 sm:mb-6 font-display text-base sm:text-lg font-bold text-mayssa-brown">Contact</h3>
                        <ul className="space-y-3 sm:space-y-4">
                            <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-mayssa-brown/60">
                                <MapPin size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 text-mayssa-caramel mt-0.5" />
                                <span>Annecy et alentours (74) • France</span>
                            </li>
                            <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-mayssa-brown/60">
                                <Clock size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 text-mayssa-caramel mt-0.5" />
                                <div>
                                    <p className="font-bold text-mayssa-brown">Horaires de service</p>
                                    <p>18h30 — 02h • Tous les jours</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-mayssa-brown/60">
                                <Phone size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 text-mayssa-caramel mt-0.5" />
                                <a href="tel:+33619871005" className="hover:text-mayssa-caramel transition-colors active:opacity-80 cursor-pointer">06 19 87 10 05</a>
                            </li>
                        </ul>
                    </div>

                    {/* Information */}
                    <div id="livraison">
                        <h3 className="mb-4 sm:mb-6 font-display text-base sm:text-lg font-bold text-mayssa-brown">Livraison</h3>
                        <div className="rounded-xl sm:rounded-2xl bg-mayssa-soft/50 p-3 sm:p-4 border border-mayssa-brown/5">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-caramel mb-2">Conditions</p>
                            <p className="text-xs sm:text-sm text-mayssa-brown/60 mb-2 sm:mb-3">Livraison offerte dès 30 € d'achat.</p>
                            <p className="text-xs sm:text-sm text-mayssa-brown/60">Forfait de 5 € pour les commandes inférieures à 30 € (Zone Annecy).</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 sm:mt-16 border-t border-mayssa-brown/5 pt-6 sm:pt-8">
                    <div className="flex flex-col items-center justify-between gap-3 sm:gap-4 sm:flex-row">
                        <p className="text-[10px] sm:text-xs text-mayssa-brown/40 text-center sm:text-left">
                            © {new Date().getFullYear()} Maison Mayssa • Tous droits réservés.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-mayssa-brown/40">
                            <FooterLink href="#mentions-legales">Mentions légales</FooterLink>
                            <FooterLink href="#confidentialite">Politique de confidentialité</FooterLink>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

function SocialIcon({ href, icon }: { href: string; icon: React.ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-mayssa-brown text-mayssa-cream shadow-sm transition-all hover:-translate-y-1 hover:bg-mayssa-caramel active:scale-95 cursor-pointer"
        >
            {icon}
        </a>
    )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
            className="text-xs sm:text-sm text-mayssa-brown/60 hover:text-mayssa-caramel transition-all hover:scale-105 active:scale-95 cursor-pointer inline-block"
        >
            {children}
        </a>
    )
}
