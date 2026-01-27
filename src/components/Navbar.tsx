import { motion, useScroll, useTransform } from 'framer-motion'
import { ShoppingBag, Phone, Instagram } from 'lucide-react'
import { cn } from '../lib/utils'
import { useEffect, useState } from 'react'
import { PHONE_E164 } from '../constants'

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const { scrollY } = useScroll()

    const backgroundColor = useTransform(
        scrollY,
        [0, 50],
        ['rgba(255, 249, 243, 0)', 'rgba(255, 249, 243, 0.8)']
    )

    useEffect(() => {
        return scrollY.onChange((latest) => {
            setIsScrolled(latest > 50)
        })
    }, [scrollY])

    return (
        <motion.nav
            style={{ backgroundColor }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                isScrolled ? "py-3 backdrop-blur-xl border-mayssa-brown/5 shadow-sm" : "py-6 border-transparent"
            )}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.PNG" alt="Logo" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-contain shadow-lg ring-2 ring-white" />
                        <div className="flex flex-col">
                            <span className="font-display text-lg sm:text-xl font-bold text-mayssa-brown leading-tight">Maison Mayssa</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-mayssa-caramel">Annecy</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <NavLink href="#la-carte">La Carte</NavLink>
                        <NavLink href="#notre-histoire">Notre Histoire</NavLink>
                        <NavLink href="#contact">Contact</NavLink>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <a
                            href="https://www.instagram.com/maison.mayssa74/"
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-mayssa-brown hover:text-mayssa-caramel transition-colors"
                        >
                            <Instagram size={20} />
                        </a>
                        <a
                            href={`https://wa.me/${PHONE_E164}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hidden sm:flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-mayssa-brown shadow-sm ring-1 ring-mayssa-brown/5 hover:bg-white hover:text-mayssa-caramel transition-all"
                        >
                            <Phone size={16} />
                            <span>Commander</span>
                        </a>
                        <button className="relative p-2 text-mayssa-brown hover:text-mayssa-caramel transition-colors xl:hidden">
                            <ShoppingBag size={22} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.nav>
    )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
