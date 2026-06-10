import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface AuthPageLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  image?: string
  imagePosition?: string
}

export function AuthPageLayout({
  children,
  title,
  subtitle,
  image = '/nouvelle-img/Plusieurs-trompeloeil.png',
  imagePosition = 'center 35%',
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-[calc(100dvh-88px)] lg:min-h-[calc(100dvh-104px)] grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* Panneau visuel */}
      <div className="hidden lg:block relative overflow-hidden bg-mayssa-espresso">
        <motion.img
          src={image}
          alt="Trompe-l'œil artisanaux Maison Mayssa"
          initial={{ scale: 1.02 }}
          animate={{ scale: 1.06 }}
          transition={{ duration: 18, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: imagePosition }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-mayssa-brown/70 via-mayssa-brown/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-mayssa-brown/60 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col justify-end h-full p-12 xl:p-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-12 h-px bg-mayssa-gold mb-8" />
            <span className="text-mayssa-gold text-xs tracking-[0.35em] uppercase mb-5 block">
              Espace client
            </span>
            <h2 className="font-display text-4xl xl:text-[2.75rem] text-white leading-[1.15] max-w-lg">
              {title}
            </h2>
            {subtitle && (
              <p className="text-white/70 mt-5 font-light leading-relaxed max-w-md text-base">
                {subtitle}
              </p>
            )}
          </motion.div>
          <p className="text-white/30 text-[10px] tracking-[0.28em] uppercase mt-16">
            Trompe-l&apos;œil artisanal — Annecy
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="relative flex flex-col justify-center px-5 sm:px-8 py-14 lg:py-16 bg-mayssa-ivory">
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 0%, rgba(197,160,89,0.08), transparent 45%), radial-gradient(circle at 80% 100%, rgba(30,18,13,0.04), transparent 40%)',
          }}
        />

        <div className="lg:hidden text-center mb-8 relative">
          <span className="text-mayssa-gold text-xs tracking-[0.3em] uppercase mb-3 block">Espace client</span>
          <h2 className="font-display text-2xl text-mayssa-brown leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-mayssa-brown/55 mt-2 font-light">{subtitle}</p>}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative max-w-[420px] mx-auto w-full bg-white border border-mayssa-brown/8 p-8 sm:p-10 shadow-[0_24px_80px_rgba(30,18,13,0.06)]"
        >
          {children}
        </motion.div>

        <p className="relative text-center mt-8">
          <Link
            to="/"
            className="text-xs tracking-widest uppercase text-mayssa-brown/40 hover:text-mayssa-brown transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  )
}
