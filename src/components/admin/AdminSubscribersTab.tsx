import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Package } from 'lucide-react'
import type { Order } from '../../lib/firebase'

const SUBSCRIPTION_PRODUCT_ID = 'abonnement-box-mois'

interface AdminSubscribersTabProps {
  orders: Record<string, Order>
}

export function AdminSubscribersTab({ orders }: AdminSubscribersTabProps) {
  const subscribers = useMemo(() => {
    const list: { orderId: string; order: Order }[] = []
    for (const [orderId, order] of Object.entries(orders)) {
      const hasSub = order.items?.some((item) => item.productId === SUBSCRIPTION_PRODUCT_ID)
      if (hasSub) list.push({ orderId, order })
    }
    list.sort((a, b) => b.order.createdAt - a.order.createdAt)
    return list
  }, [orders])

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-mayssa-brown/5">
        <h3 className="font-bold text-mayssa-brown mb-3 flex items-center gap-2">
          <Package size={18} />
          Abonnés Box du mois ({subscribers.length})
        </h3>
        <p className="text-xs text-mayssa-brown/60 mb-3">
          Commandes contenant l&apos;abonnement. Recontacter pour paiement et composition.
        </p>
        {subscribers.length === 0 ? (
          <p className="text-sm text-mayssa-brown/50">Aucune commande avec abonnement.</p>
        ) : (
          <ul className="space-y-2">
            {subscribers.map(({ orderId, order }) => (
              <li
                key={orderId}
                className="rounded-xl p-3 border border-mayssa-brown/10 bg-mayssa-soft/30 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <p className="font-medium text-sm text-mayssa-brown">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                  <p className="text-xs text-mayssa-brown/60">
                    {order.customer?.phone}
                    {order.customer?.address && ` · ${order.customer.address}`}
                  </p>
                </div>
                <div className="text-right text-xs text-mayssa-brown/50">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  )
}
