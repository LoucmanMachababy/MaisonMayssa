import { motion } from 'framer-motion'
import { Phone, Instagram, Clock, Truck, MapPin } from 'lucide-react'
import { cn, isOpen } from '../lib/utils'
import { PHONE_E164 } from '../constants'

export function Header() {
    return (
        <header className="relative w-full overflow-hidden section-shell bg-mesh">
            <div className="relative z-10 flex flex-col items-center justify-between gap-8 sm:gap-10 lg:flex-row">
                <div className="flex flex-col items-center gap-4 sm:gap-6 text-center lg:items-start lg:text-left w-full lg:w-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        <div className="absolute -inset-3 sm:-inset-4 rounded-full bg-mayssa-caramel/20 blur-2xl animate-pulse-slow" />
                        <img
                            src="/logo.webp"
                            alt="Maison Mayssa"
                            className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 rounded-3xl object-contain shadow-2xl ring-4 ring-white/50"
                        />
                    </motion.div>

                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[10px] sm:text-xs font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase text-mayssa-brown/60 mb-2"
                            >
                                Douceurs artisanales • Annecy
                            </motion.p>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-mayssa-brown leading-tight"
                            >
                                Maison <span className="text-mayssa-caramel italic">Mayssa</span>
                            </motion.h1>
                        </div>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="max-w-xl text-sm sm:text-base md:text-lg text-mayssa-brown/80 leading-relaxed font-medium px-2 sm:px-0"
                        >
L'excellence de la pâtisserie artisanale à Annecy.
                            Des créations gourmandes pour sublimer vos moments d'exception.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:justify-start"
                        >
                            <Badge
                                icon={<Clock size={12} className="sm:w-3.5 sm:h-3.5" />}
                                text={isOpen() ? 'Ouvert · 18h30 — 02h' : 'Fermé · Réouverture 18h30'}
                                variant={isOpen() ? 'open' : 'closed'}
                            />
                            <Badge icon={<Truck size={12} className="sm:w-3.5 sm:h-3.5" />} text="Livraison Annecy" />
                            <Badge icon={<MapPin size={12} className="sm:w-3.5 sm:h-3.5" />} text="Retrait possible" />
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col items-center gap-3 sm:gap-4 w-full lg:w-auto lg:items-end lg:min-w-[280px]"
                >
                    <div className="flex flex-col w-full max-w-sm lg:max-w-none gap-3">
                        <a
                            href={`https://wa.me/${PHONE_E164}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center justify-center gap-3 rounded-2xl bg-mayssa-brown px-5 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-mayssa-cream shadow-xl transition-all hover:-translate-y-1 hover:bg-mayssa-caramel active:scale-[0.98] cursor-pointer"
                        >
                            <Phone size={18} className="sm:w-5 sm:h-5 transition-transform group-hover:rotate-12" />
                            <span className="font-bold">Appeler maintenant</span>
                        </a>

                        <SocialLink
                            href="https://www.instagram.com/maison.mayssa74/"
                            icon={<Instagram size={16} className="sm:w-[18px] sm:h-[18px]" />}
                            label="Instagram"
                            className="bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white w-full"
                        />
                    </div>

                    <p className="text-center text-[10px] sm:text-xs font-semibold text-mayssa-brown/60 lg:text-right">
                        Livraison offerte dès 30 € d'achat
                    </p>
                </motion.div>
            </div>
        </header>
    )
}

function Badge({ icon, text, variant = 'default' }: { icon: React.ReactNode; text: string; variant?: 'default' | 'open' | 'closed' }) {
    const variantClass = variant === 'open'
        ? 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40'
        : variant === 'closed'
            ? 'bg-mayssa-brown/10 text-mayssa-brown/70 border-mayssa-brown/20'
            : 'bg-white/60 text-mayssa-brown border-white/40'
    const iconClass = variant === 'open' ? 'text-emerald-600' : variant === 'closed' ? 'text-mayssa-brown/50' : 'text-mayssa-caramel'
    return (
        <span className={cn('inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold border shadow-sm transition-colors hover:opacity-90', variantClass)}>
            <span className={cn('flex-shrink-0', iconClass)}>{icon}</span>
            <span className="whitespace-nowrap">{text}</span>
        </span>
    )
}

function SocialLink({ href, icon, label, className }: { href: string; icon: React.ReactNode; label: string; className?: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={cn(
                "flex items-center justify-center gap-1.5 sm:gap-2 rounded-2xl p-2.5 sm:p-3 shadow-lg transition-transform hover:-translate-y-1 active:scale-95 cursor-pointer",
                className
            )}
        >
            {icon}
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{label}</span>
        </a>
    )
}
