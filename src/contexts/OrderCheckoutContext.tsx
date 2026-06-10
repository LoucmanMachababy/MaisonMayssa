import { createContext, useContext, type ReactNode } from 'react'
import { useOrderCheckout } from '../hooks/useOrderCheckout'

type OrderCheckoutValue = ReturnType<typeof useOrderCheckout>

const OrderCheckoutContext = createContext<OrderCheckoutValue | null>(null)

export function OrderCheckoutProvider({ children }: { children: ReactNode }) {
  const checkout = useOrderCheckout()
  return (
    <OrderCheckoutContext.Provider value={checkout}>
      {children}
    </OrderCheckoutContext.Provider>
  )
}

export function useOrderCheckoutContext(): OrderCheckoutValue {
  const ctx = useContext(OrderCheckoutContext)
  if (!ctx) {
    throw new Error('useOrderCheckoutContext doit être utilisé dans OrderCheckoutProvider')
  }
  return ctx
}
