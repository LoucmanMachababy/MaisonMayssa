import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ouvert 17h–2h (tous les jours). */
export function isOpen(): boolean {
  const h = new Date().getHours()
  return h >= 17 || h < 3
}
