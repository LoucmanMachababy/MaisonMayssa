import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Truck } from 'lucide-react'
import { cn, isOpen } from '../lib/utils'
import { FREE_DELIVERY_THRESHOLD } from '../lib/delivery'

export function Header() {
    return (
        <header className="relative w-full overflow-hidden mb-8 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-premium-shadow">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-6 sm:p-10 lg:p-14">
                <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-10 text-center md:text-left flex-1">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="relative group shrink-0"
                    >
                        <div className="absolute -inset-8 rounded-full bg-mayssa-gold/20 blur-[60px] opacity-70" aria-hidden="true" />
                        <img
                            src="/logo.webp"
                            alt="Maison Mayssa"
                            className="relative h-24 w-24 sm:h-32 sm:w-32 lg:h-40 lg:w-40 rounded-[2.5rem] object-contain shadow-lg bg-white/30 backdrop-blur-md p-3 transition-transform duration-700 group-hover:scale-105"
                        />
                    </motion.div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <span className="h-[1px] w-8 bg-mayssa-gold/30"></span>
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-mayssa-gold tracking-[0.4em]">
                                Maison Mayssa — Annecy
                            </p>
                            <span className="h-[1px] w-8 bg-mayssa-gold/30 md:hidden"></span>
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium text-mayssa-brown tracking-tight leading-tight">
                            Maison <span className="text-mayssa-gold italic font-light drop-shadow-sm">Mayssa</span>
                        </h1>
                        
                        <p className="text-sm sm:text-base md:text-xl font-display text-mayssa-brown/60 italic">
                            Sucrée & Salée — Trompe-l&apos;œil pâtissier
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                            <Badge
                                icon={<Clock size={16} className="text-mayssa-gold" />}
                                text={isOpen() ? 'Atelier Ouvert' : 'Atelier Fermé'}
                                variant={isOpen() ? 'open' : 'closed'}
                            />
                            <Badge icon={<Truck size={16} className="text-mayssa-gold" />} text="Livraison Privée" />
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex flex-col items-center md:items-end gap-3 shrink-0">
                    <p className="text-[10px] font-medium text-mayssa-brown/60 uppercase tracking-widest">
                        Livraison offerte dès {FREE_DELIVERY_THRESHOLD} € d&apos;achat
                    </p>
                </div>
            </div>
        </header>
    )
}

function Badge({ icon, text, variant = 'default' }: { icon: React.ReactNode; text: string; variant?: 'default' | 'open' | 'closed' }) {
    const variantClass = variant === 'open'
        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-800 border-emerald-400/50 shadow-inner'
        : variant === 'closed'
            ? 'bg-gradient-to-r from-red-500/10 to-red-500/5 text-red-800/80 border-red-200/50'
            : 'bg-white/70 text-mayssa-brown border border-white/80 shadow-sm backdrop-blur-xl'
    
    return (
        <span className={cn('inline-flex items-center gap-2.5 rounded-[1.5rem] px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider border hover:-translate-y-1 transition-all duration-300 cursor-default', variantClass)}>
            <span className="flex-shrink-0 drop-shadow-sm">{icon}</span>
            <span className="whitespace-nowrap">{text}</span>
        </span>
    )
}

