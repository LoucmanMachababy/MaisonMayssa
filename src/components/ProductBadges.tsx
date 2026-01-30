import { Award, Heart, Flame } from 'lucide-react'
import type { ProductBadge } from '../types'

const LOGO_BADGE_URL = '/logo.PNG'

const BADGE_CONFIG: Record<
  ProductBadge,
  { label: string; icon?: typeof Award; useLogo?: boolean; className: string }
> = {
  'best-seller': {
    label: 'Best seller',
    icon: Award,
    className: 'bg-amber-500/95 text-white shadow-lg shadow-amber-600/30',
  },
  nouveau: {
    label: 'Nouveau',
    useLogo: true,
    className: 'bg-mayssa-caramel/95 text-white shadow-lg shadow-mayssa-caramel/30',
  },
  'coup-de-coeur': {
    label: 'Coup de cœur',
    icon: Heart,
    className: 'bg-rose-500/95 text-white shadow-lg shadow-rose-600/30',
  },
  populaire: {
    label: 'Populaire',
    icon: Flame,
    className: 'bg-orange-500/95 text-white shadow-lg shadow-orange-600/30',
  },
}

interface ProductBadgesProps {
  badges: ProductBadge[]
  /** 'card' = sur l'image, 'compact' = petit sur mobile, 'inline' = dans le flux (modal) */
  variant?: 'card' | 'compact' | 'inline'
}

export function ProductBadges({ badges, variant = 'card' }: ProductBadgesProps) {
  if (!badges?.length) return null

  const isCompact = variant === 'compact'
  const isInline = variant === 'inline'

  return (
    <div
      className={
        isInline
          ? 'flex flex-wrap gap-1.5'
          : `absolute top-2 left-2 z-10 flex flex-wrap gap-1 ${isCompact ? 'top-1 left-1 gap-0.5' : 'gap-1.5'}`
      }
    >
      {badges.map((key) => {
        const config = BADGE_CONFIG[key]
        if (!config) return null
        const sizePx = isCompact ? 10 : 12
        const logoSizePx = config.useLogo ? (isCompact ? 12 : 16) : sizePx
        const Icon = config.icon
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1 rounded-full font-bold shadow-md ${config.className} ${
              isCompact
                ? 'px-1.5 py-0.5 text-[9px]'
                : isInline
                ? 'px-2 py-1 text-[10px]'
                : 'px-2.5 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-xs'
            }`}
            title={config.label}
          >
            {config.useLogo ? (
              <img
                src={LOGO_BADGE_URL}
                alt="Maison Mayssa"
                className="flex-shrink-0 rounded-full object-contain"
                style={{ width: logoSizePx, height: logoSizePx }}
              />
            ) : Icon ? (
              <Icon size={sizePx} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            ) : null}
            {!isCompact && <span>{config.label}</span>}
          </span>
        )
      })}
    </div>
  )
}
