import { cn } from '../../lib/utils'

/** Classes contextuelles selon le thème admin */
export function adminSurface(isDark: boolean) {
  return isDark
    ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
    : 'bg-white border-mayssa-brown/8 text-mayssa-brown'
}

export function adminMuted(isDark: boolean) {
  return isDark ? 'text-zinc-400' : 'text-mayssa-brown/60'
}

/** Carte premium admin — angles nets, bordure fine */
export const adminCard = cn(
  'admin-card border',
  'shadow-[0_8px_40px_rgba(30,18,13,0.04)]',
)

export const adminCardPad = 'admin-card-pad p-5 sm:p-6'
export const adminCardPadLg = 'admin-card-pad-lg p-6 sm:p-8'

export const adminCardInteractive = cn(
  adminCard,
  'hover:border-mayssa-gold/35 transition-all duration-300',
)

export const adminKpiCard = cn(
  adminCard,
  adminCardPadLg,
  'admin-kpi text-left group cursor-pointer hover:border-mayssa-gold/40',
)

export const adminSectionLabel =
  'text-[10px] tracking-[0.3em] uppercase text-mayssa-brown/40 font-medium'

export const adminPanelTitle = 'font-display text-xl sm:text-2xl text-mayssa-brown tracking-tight'

export const adminInput = cn(
  'admin-input w-full border px-4 py-3 text-sm',
  'placeholder:text-mayssa-brown/30 focus:outline-none focus:border-mayssa-gold transition-colors',
)

export const adminBtnPrimary = cn(
  'admin-btn-primary inline-flex items-center justify-center px-5 py-3',
  'text-xs tracking-widest uppercase transition-colors disabled:opacity-50',
)

export const adminBtnGhost = cn(
  'admin-btn-ghost inline-flex items-center justify-center px-4 py-2.5',
  'border text-xs tracking-widest uppercase transition-colors',
)

export const adminStatusBanner = (tone: 'open' | 'closed' | 'warning', isDark = false) =>
  cn(
    'admin-status-banner border p-4 text-center text-sm font-semibold',
    tone === 'closed' &&
      (isDark ? 'bg-red-950/40 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-800'),
    tone === 'open' &&
      (isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'),
    tone === 'warning' &&
      (isDark ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'),
  )

/** Panneau de section avec en-tête */
export const adminSection = cn(adminCard, adminCardPad, 'space-y-4')

/** Réexport labels — source unique dans adminNavigation */
export { ADMIN_TAB_LABELS } from './adminNavigation'
