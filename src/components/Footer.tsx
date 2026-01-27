import { Instagram, Ghost as Snapchat, Phone, MapPin, Clock } from 'lucide-react'

export function Footer() {
    return (
        <footer className="relative mt-24 border-t border-mayssa-brown/5 bg-white/40 pt-16 pb-8 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <img src="/logo.PNG" alt="Logo" className="h-12 w-12 rounded-2xl shadow-md" />
                            <span className="font-display text-2xl font-bold text-mayssa-brown">Maison Mayssa</span>
                        </div>
                        <p className="text-sm leading-relaxed text-mayssa-brown/60">
                            Pâtisseries artisanales d'exception à Annecy. Des créations faites maison avec passion pour sublimer vos moments gourmands.
                        </p>
                        <div className="flex gap-4">
                            <SocialIcon href="https://www.instagram.com/maison.mayssa74/" icon={<Instagram size={18} />} />
                            <SocialIcon href="https://www.snapchat.com/add/mayssasucree74" icon={<Snapchat size={18} />} />
                            <SocialIcon href="tel:+33619871005" icon={<Phone size={18} />} />
                        </div>
                    </div>

                    {/* Useful Links */}
                    <div>
                        <h3 className="mb-6 font-display text-lg font-bold text-mayssa-brown">Liens Utiles</h3>
                        <ul className="space-y-3">
                            <li><FooterLink href="#la-carte">La Carte</FooterLink></li>
                            <li><FooterLink href="#commande">Commander</FooterLink></li>
                            <li><FooterLink href="#livraison">Zone de Livraison</FooterLink></li>
                            <li><FooterLink href="#contact">Contact</FooterLink></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div id="contact">
                        <h3 className="mb-6 font-display text-lg font-bold text-mayssa-brown">Contact</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-mayssa-brown/60">
                                <MapPin size={18} className="shrink-0 text-mayssa-caramel" />
                                <span>Annecy et alentours (74) • France</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-mayssa-brown/60">
                                <Clock size={18} className="shrink-0 text-mayssa-caramel" />
                                <div>
                                    <p className="font-bold text-mayssa-brown">Horaires de service</p>
                                    <p>17h — 02h • Tous les jours</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-mayssa-brown/60">
                                <Phone size={18} className="shrink-0 text-mayssa-caramel" />
                                <a href="tel:+33619871005" className="hover:text-mayssa-caramel transition-colors">06 19 87 10 05</a>
                            </li>
                        </ul>
                    </div>

                    {/* Information */}
                    <div id="livraison">
                        <h3 className="mb-6 font-display text-lg font-bold text-mayssa-brown">Livraison</h3>
                        <div className="rounded-2xl bg-mayssa-soft/50 p-4 border border-mayssa-brown/5">
                            <p className="text-xs font-bold uppercase tracking-widest text-mayssa-caramel mb-2">Conditions</p>
                            <p className="text-sm text-mayssa-brown/60 mb-3">Livraison offerte dès 30 € d'achat.</p>
                            <p className="text-sm text-mayssa-brown/60">Forfait de 5 € pour les commandes inférieures à 30 € (Zone Annecy).</p>
                        </div>
                    </div>
                </div>

                <div className="mt-16 border-t border-mayssa-brown/5 pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="text-xs text-mayssa-brown/40">
                            © {new Date().getFullYear()} Maison Mayssa • Tous droits réservés.
                        </p>
                        <div className="flex gap-6 text-xs text-mayssa-brown/40">
                            <a href="#" className="hover:text-mayssa-brown transition-colors">Mentions Légales</a>
                            <a href="#" className="hover:text-mayssa-brown transition-colors">CGV</a>
                            <a href="#" className="hover:text-mayssa-brown transition-colors">Politique de confidentialité</a>
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
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-mayssa-brown text-mayssa-cream shadow-sm transition-all hover:-translate-y-1 hover:bg-mayssa-caramel"
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
            className="text-sm text-mayssa-brown/60 hover:text-mayssa-caramel transition-all hover:scale-105 active:scale-95 cursor-pointer inline-block"
        >
            {children}
        </a>
    )
}
