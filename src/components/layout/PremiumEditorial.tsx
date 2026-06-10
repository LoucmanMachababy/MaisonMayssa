import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PremiumBackLink({ to = '/' }: { to?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-mayssa-brown/50 hover:text-mayssa-brown transition-colors mb-12"
    >
      <ArrowLeft size={14} />
      Retour
    </Link>
  )
}

export function PremiumPageIntro({
  eyebrow,
  title,
  subtitle,
  centered = true,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  centered?: boolean
}) {
  return (
    <header className={`mb-12 sm:mb-16 ${centered ? 'text-center' : ''}`}>
      <span className="text-mayssa-gold text-xs tracking-[0.3em] uppercase mb-4 block">{eyebrow}</span>
      <h1 className="font-display text-4xl md:text-5xl text-mayssa-brown mb-4 leading-tight">{title}</h1>
      {subtitle && (
        <p className={`text-mayssa-brown/60 font-light leading-relaxed max-w-2xl ${centered ? 'mx-auto' : ''}`}>
          {subtitle}
        </p>
      )}
    </header>
  )
}

export function PremiumCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-mayssa-brown/5 p-8 sm:p-10 ${className}`}>
      {children}
    </div>
  )
}

export function PremiumSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-2xl text-mayssa-brown mb-4 pb-3 border-b border-mayssa-brown/10">
      {children}
    </h2>
  )
}

export function PremiumProse({ children }: { children: ReactNode }) {
  return <div className="text-mayssa-brown/75 leading-relaxed font-light space-y-4">{children}</div>
}

export function PremiumCtaBlock({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="bg-mayssa-brown/5 border border-mayssa-brown/10 p-8 sm:p-10 text-center">
      <h2 className="font-display text-2xl text-mayssa-brown mb-3">{title}</h2>
      {description && <p className="text-mayssa-brown/60 font-light mb-6 max-w-lg mx-auto">{description}</p>}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">{children}</div>
    </div>
  )
}

export function PremiumButton({
  to,
  href,
  onClick,
  variant = 'primary',
  children,
  external,
}: {
  to?: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'whatsapp'
  children: ReactNode
  external?: boolean
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-8 py-4 text-sm tracking-widest uppercase transition-colors duration-300'
  const styles = {
    primary: 'bg-mayssa-brown text-white hover:bg-mayssa-espresso',
    outline: 'border border-mayssa-brown text-mayssa-brown hover:bg-mayssa-brown hover:text-white',
    whatsapp: 'bg-[#25D366] text-white hover:bg-[#20bd5a]',
  }[variant]

  const className = `${base} ${styles}`

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        className={className}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        onClick={onClick}
      >
        {children}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  )
}
