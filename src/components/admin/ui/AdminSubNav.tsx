import type { LucideIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'

export type AdminSubNavItem<T extends string = string> = {
  id: T
  icon?: LucideIcon
  label: string
  badge?: number
}

interface AdminSubNavProps<T extends string> {
  items: readonly AdminSubNavItem<T>[]
  active: T
  onChange: (id: T) => void
  isDark?: boolean
  className?: string
}

export function AdminSubNav<T extends string>({
  items,
  active,
  onChange,
  className,
}: AdminSubNavProps<T>) {
  return (
    <nav className={cn('admin-subnav flex flex-wrap', className)} aria-label="Sous-navigation">
      {items.map((item) => {
        const isActive = active === item.id
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 sm:px-5 py-3.5 min-h-[48px]',
              'text-[10px] font-bold tracking-[0.16em] uppercase transition-colors',
              isActive
                ? 'text-mayssa-brown bg-mayssa-gold/10'
                : 'text-mayssa-brown/45 hover:text-mayssa-brown hover:bg-mayssa-soft/40',
            )}
          >
            {Icon && <Icon size={14} strokeWidth={2} />}
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className={cn('admin-v2-nav-badge', !isActive && 'bg-red-500 text-white')}>
                {item.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-mayssa-gold" aria-hidden />
            )}
          </button>
        )
      })}
    </nav>
  )
}
