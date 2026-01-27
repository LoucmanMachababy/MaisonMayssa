import { motion } from 'framer-motion'
import { Phone, Instagram, Ghost as Snapchat, Clock, Truck, MapPin } from 'lucide-react'
import { cn } from '../lib/utils'
import { PHONE_E164 } from '../constants'

export function Header() {
    return (
        <header className="relative w-full overflow-hidden section-shell bg-mesh">
            <div className="relative z-10 flex flex-col items-center justify-between gap-10 md:flex-row">
                <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        <div className="absolute -inset-4 rounded-full bg-mayssa-caramel/20 blur-2xl animate-pulse-slow" />
                        <img
                            src="/logo.PNG"
                            alt="Maison Mayssa"
                            className="relative h-24 w-24 rounded-3xl object-contain shadow-2xl sm:h-32 sm:w-32 ring-4 ring-white/50"
                        />
                    </motion.div>

                    <div className="space-y-4">
                        <div>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs font-bold tracking-[0.4em] uppercase text-mayssa-brown/60 mb-2"
                            >
                                Douceurs artisanales • Annecy
                            </motion.p>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl sm:text-5xl md:text-6xl text-mayssa-brown leading-tight"
                            >
                                Maison <span className="text-mayssa-caramel italic">Mayssa</span>
                            </motion.h1>
                        </div>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="max-w-xl text-lg text-mayssa-brown/80 leading-relaxed font-medium"
                        >
                            L'excellence de la pâtisserie artisanale à Annecy.
                            Des créations gourmandes pour sublimer vos moments d'exception.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap items-center justify-center gap-3 md:justify-start"
                        >
                            <Badge icon={<Clock size={14} />} text="Service 17h — 02h" />
                            <Badge icon={<Truck size={14} />} text="Livraison Annecy & alentours" />
                            <Badge icon={<MapPin size={14} />} text="Retrait possible" />
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col items-center gap-4 min-w-[280px] md:items-end"
                >
                    <div className="flex flex-col w-full gap-3">
                        <a
                            href={`https://wa.me/${PHONE_E164}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center justify-center gap-3 rounded-2xl bg-mayssa-brown px-6 py-4 text-mayssa-cream shadow-xl transition-all hover:-translate-y-1 hover:bg-mayssa-caramel"
                        >
                            <Phone size={20} className="transition-transform group-hover:rotate-12" />
                            <span className="font-bold">Appeler maintenant</span>
                        </a>

                        <div className="grid grid-cols-2 gap-3">
                            <SocialLink
                                href="https://www.instagram.com/maison.mayssa74/"
                                icon={<Instagram size={18} />}
                                label="Instagram"
                                className="bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white"
                            />
                            <SocialLink
                                href="https://www.snapchat.com/add/mayssasucree74"
                                icon={<Snapchat size={18} />}
                                label="Snapchat"
                                className="bg-[#fffc00] text-black"
                            />
                        </div>
                    </div>

                    <p className="text-center text-xs font-semibold text-mayssa-brown/60 md:text-right">
                        Livraison offerte dès 30 € d'achat
                    </p>
                </motion.div>
            </div>
        </header>
    )
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-semibold text-mayssa-brown border border-white/40 shadow-sm transition-colors hover:bg-white/80">
            <span className="text-mayssa-caramel">{icon}</span>
            {text}
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
                "flex items-center justify-center gap-2 rounded-2xl p-3 shadow-lg transition-transform hover:-translate-y-1",
                className
            )}
        >
            {icon}
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </a>
    )
}
