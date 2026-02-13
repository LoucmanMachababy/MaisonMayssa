import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ouvert 18h30–2h (tous les jours). */
export function isOpen(): boolean {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  // Ouvert à partir de 18h30 ou avant 3h
  return (h > 18 || (h === 18 && m >= 30)) || h < 3
}

/** Précommande pas encore disponible (date availableFrom dans le futur). */
export function isPreorderNotYetAvailable(product: { preorder?: { availableFrom: string } }): boolean {
  if (!product.preorder?.availableFrom) return false
  const from = new Date(product.preorder.availableFrom)
  from.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return from > today
}
