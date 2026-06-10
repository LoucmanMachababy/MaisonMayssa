import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '../types'

export interface CartItem {
  product: Product
  quantity: number
  reservationExpiresAt?: number
  reservationConfirmed?: boolean
  trompeDiscoverySelection?: string[]
}

export type AddItemOptions = {
  trompeDiscoverySelection?: string[]
  reservationExpiresAt?: number
  reservationConfirmed?: boolean
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, options?: AddItemOptions) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setItems: (items: CartItem[]) => void
  updateItem: (productId: string, patch: Partial<CartItem>) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1, options) =>
        set((state) => {
          const extra = {
            ...(options?.trompeDiscoverySelection && {
              trompeDiscoverySelection: options.trompeDiscoverySelection,
            }),
            ...(options?.reservationExpiresAt != null && {
              reservationExpiresAt: options.reservationExpiresAt,
            }),
            ...(options?.reservationConfirmed != null && {
              reservationConfirmed: options.reservationConfirmed,
            }),
          }
          const existingItem = state.items.find((item) => item.product.id === product.id)
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity, ...extra }
                  : item
              ),
            }
          }
          return { items: [...state.items, { product, quantity, ...extra }] }
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        })),
      setItems: (items) => set({ items }),
      updateItem: (productId, patch) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, ...patch } : item
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'maison-mayssa-cart',
    }
  )
)
