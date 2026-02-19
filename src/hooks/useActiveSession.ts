import { useEffect, useRef } from 'react'
import type { CartItem, CustomerInfo } from '../types'

const SESSION_KEY = 'maison-mayssa-session-id'
const DEBOUNCE_MS = 3000

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function extractCity(address: string): string | null {
  if (!address) return null
  // L'adresse française est généralement : "12 rue X, 74000 Annecy"
  const match = address.match(/\d{5}\s+(.+)$/)
  return match ? match[1].trim() : null
}

export function useActiveSession(
  cart: CartItem[],
  customer: CustomerInfo,
  total: number
) {
  const sessionId = useRef(getOrCreateSessionId())
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (cart.length === 0) {
      // Panier vide → supprimer la session immédiatement
      import('../lib/firebase').then(({ removeActiveSession }) => {
        removeActiveSession(sessionId.current)
      })
      return
    }

    debounceTimer.current = setTimeout(() => {
      const data = {
        updatedAt: Date.now(),
        cartItemCount: cart.reduce((sum, i) => sum + i.quantity, 0),
        cartTotal: total,
        deliveryMode: (customer.wantsDelivery ? 'livraison' : 'retrait') as 'livraison' | 'retrait',
        city: extractCity(customer.address),
        hasPhone: !!customer.phone,
        hasDate: !!customer.date,
        source: 'web' as const,
      }
      import('../lib/firebase').then(({ upsertActiveSession }) => {
        upsertActiveSession(sessionId.current, data)
      })
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [cart, customer, total])

  // Nettoyage au démontage de l'app (fermeture de page sans déconnexion réseau)
  useEffect(() => {
    return () => {
      import('../lib/firebase').then(({ removeActiveSession }) => {
        removeActiveSession(sessionId.current)
      })
    }
  }, [])

  return { sessionId: sessionId.current }
}
