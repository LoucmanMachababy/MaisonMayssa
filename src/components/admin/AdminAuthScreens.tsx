import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, LayoutDashboard, Lock, Mail } from 'lucide-react'
import { adminLogin, adminLogout } from '../../lib/firebase'
import { AdminBtn } from './ui/AdminUi'

interface AdminAuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  badge?: string
  image?: string
  imagePosition?: string
}

function AdminAuthLayout({
  children,
  title,
  subtitle,
  badge = 'Console admin',
  image = '/nouvelle-img/Plusieurs-trompeloeil.png',
  imagePosition = 'center 35%',
}: AdminAuthLayoutProps) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-[#f4f1ec]">
      <div className="hidden lg:block relative overflow-hidden bg-mayssa-espresso">
        <motion.img
          src={image}
          alt=""
          initial={{ scale: 1.02 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover opacity-70"
          style={{ objectPosition: imagePosition }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-mayssa-espresso/95 via-mayssa-brown/75 to-mayssa-brown/40" />

        <div className="relative z-10 flex flex-col justify-between h-full min-h-dvh p-12 xl:p-16 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border border-mayssa-gold/40 bg-mayssa-gold/10 font-display text-mayssa-gold">M</span>
            <span className="font-display text-xs tracking-[0.28em] uppercase">Maison Mayssa</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-mayssa-gold text-[10px] tracking-[0.35em] uppercase mb-4 block">{badge}</span>
            <h1 className="font-display text-4xl xl:text-5xl leading-tight max-w-md">{title}</h1>
            {subtitle && <p className="text-white/60 mt-4 font-light max-w-sm leading-relaxed">{subtitle}</p>}
          </motion.div>

          <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase">Accès réservé administrateur</p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 sm:px-12 py-16">
        <div className="lg:hidden mb-8 text-center">
          <span className="font-display text-xs tracking-[0.25em] uppercase text-mayssa-brown">Maison Mayssa</span>
          <p className="text-mayssa-gold text-[10px] tracking-[0.3em] uppercase mt-4">{badge}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto w-full admin-panel admin-panel-pad"
        >
          {children}
        </motion.div>

        <p className="text-center mt-8">
          <Link to="/" className="text-[10px] tracking-[0.25em] uppercase text-mayssa-brown/40 hover:text-mayssa-brown">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  )
}

export function AdminLoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminLogin(email, password)
    } catch {
      setError('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminAuthLayout title="Console de gestion" subtitle="Commandes, stock, clients et paramètres.">
      <div className="mb-6">
        <div className="inline-flex h-10 w-10 items-center justify-center bg-mayssa-gold/15 text-mayssa-gold mb-4">
          <LayoutDashboard size={20} />
        </div>
        <h2 className="font-display text-2xl text-mayssa-brown">Connexion</h2>
        <p className="text-sm text-mayssa-brown/55 mt-1 font-light">Identifiants administrateur uniquement.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] tracking-widest uppercase text-mayssa-brown/45 mb-1.5">Email</label>
          <div className="flex items-center gap-2 border border-mayssa-brown/12 px-3 py-2.5 focus-within:border-mayssa-gold">
            <Mail size={15} className="text-mayssa-gold shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] tracking-widest uppercase text-mayssa-brown/45 mb-1.5">Mot de passe</label>
          <div className="flex items-center gap-2 border border-mayssa-brown/12 px-3 py-2.5 focus-within:border-mayssa-gold">
            <Lock size={15} className="text-mayssa-gold shrink-0" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 p-3">{error}</p>}
        <AdminBtn type="submit" variant="primary" disabled={loading} className="w-full mt-2">
          {loading ? 'Connexion…' : 'Accéder à la console'}
        </AdminBtn>
      </form>
    </AdminAuthLayout>
  )
}

export function AdminUnauthorizedScreen() {
  return (
    <AdminAuthLayout title="Accès restreint" subtitle="Ce compte n'a pas les droits d'administration." badge="Sécurité">
      <div className="text-center py-4">
        <AlertTriangle size={36} className="mx-auto text-mayssa-gold mb-5" />
        <h2 className="font-display text-xl text-mayssa-brown mb-2">Non autorisé</h2>
        <p className="text-sm text-mayssa-brown/55 font-light mb-6">
          Connectez-vous avec le compte administrateur principal.
        </p>
        <AdminBtn variant="primary" onClick={() => adminLogout()} className="w-full mb-3">
          Se déconnecter
        </AdminBtn>
        <Link to="/" className="text-[10px] tracking-widest uppercase text-mayssa-brown/40 hover:text-mayssa-brown">
          Retour au site
        </Link>
      </div>
    </AdminAuthLayout>
  )
}
