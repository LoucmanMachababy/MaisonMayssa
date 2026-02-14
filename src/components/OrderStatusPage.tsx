import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, ChefHat, CheckCircle2, Truck, XCircle } from 'lucide-react'
import { getOrder, type Order, type OrderStatus } from '../lib/firebase'

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: typeof Package; color: string }> = {
  en_attente: { label: 'Reçue', icon: Package, color: 'text-amber-700 bg-amber-50' },
  en_preparation: { label: 'En préparation', icon: ChefHat, color: 'text-blue-700 bg-blue-50' },
  pret: { label: 'Prête', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
  livree: { label: 'Livrée', icon: Truck, color: 'text-emerald-700 bg-emerald-50' },
  validee: { label: 'Validée', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
  refusee: { label: 'Refusée', icon: XCircle, color: 'text-red-700 bg-red-50' },
}

interface OrderStatusPageProps {
  orderId: string
  onBack: () => void
}

export function OrderStatusPage({ orderId, onBack }: OrderStatusPageProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const o = await getOrder(orderId)
        if (!cancelled) {
          setOrder(o)
          setError(o ? null : 'Commande introuvable')
        }
      } catch {
        if (!cancelled) setError('Erreur de chargement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-mayssa-caramel border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16 px-4"
      >
        <XCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-mayssa-brown mb-2">Commande introuvable</h2>
        <p className="text-mayssa-brown/60 mb-6">{error ?? 'Vérifiez le numéro de commande.'}</p>
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-mayssa-brown text-white font-bold hover:bg-mayssa-caramel cursor-pointer"
        >
          Retour au site
        </button>
      </motion.div>
    )
  }

  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.en_attente
  const Icon = config.icon

  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto py-8 px-4"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-mayssa-brown/5 overflow-hidden">
        <div className="px-6 py-6 border-b border-mayssa-brown/5">
          <p className="text-xs font-bold text-mayssa-brown/50 uppercase tracking-wider">Commande n°</p>
          <p className="text-xl font-mono font-bold text-mayssa-brown mt-1">{order.id}</p>
          <p className="text-sm text-mayssa-brown/60 mt-2">{dateStr}</p>
        </div>

        <div className="px-6 py-6">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${config.color}`}
          >
            <Icon size={20} />
            {config.label}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/50 mb-2">Client</h3>
              <p className="text-mayssa-brown font-medium">
                {order.customer.firstName} {order.customer.lastName}
              </p>
              {order.customer.phone && (
                <p className="text-sm text-mayssa-brown/70">{order.customer.phone}</p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/50 mb-2">Articles</h3>
              <ul className="space-y-1 text-sm text-mayssa-brown">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.quantity}× {item.name}</span>
                    <span>{(item.price * item.quantity).toFixed(2).replace('.', ',')} €</span>
                  </li>
                ))}
                {order.deliveryFee != null && order.deliveryFee > 0 && (
                  <li className="flex justify-between pt-2 border-t border-mayssa-brown/10">
                    <span>Livraison</span>
                    <span>+{order.deliveryFee.toFixed(2).replace('.', ',')} €</span>
                  </li>
                )}
                <li className="flex justify-between font-bold pt-2">
                  <span>Total</span>
                  <span className="text-mayssa-caramel">{(order.total ?? 0).toFixed(2).replace('.', ',')} €</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-mayssa-brown text-white font-bold hover:bg-mayssa-caramel cursor-pointer"
          >
            Retour au catalogue
          </button>
        </div>
      </div>
    </motion.div>
  )
}
