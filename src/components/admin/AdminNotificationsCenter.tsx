import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, ShoppingBag, Package, AlertTriangle, Cake, TrendingDown, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Order, UserProfile } from '../../lib/firebase'
import type { StockMap } from '../../lib/firebase'

interface Notification {
  id: string
  type: 'order_pending' | 'low_stock' | 'birthday' | 'order_urgent' | 'order_preparation'
  title: string
  message: string
  time?: string
  action?: () => void
  actionLabel?: string
  priority: 'high' | 'medium' | 'low'
}

interface AdminNotificationsCenterProps {
  orders: Record<string, Order>
  stock: StockMap
  allUsers: Record<string, UserProfile>
  isOpen: boolean
  onClose: () => void
  onNavigate: (tab: string) => void
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export function AdminNotificationsCenter({ orders, stock, allUsers, isOpen, onClose, onNavigate }: AdminNotificationsCenterProps) {
  const notifications = useMemo((): Notification[] => {
    const notifs: Notification[] = []
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const twoHoursFromNow = now.getTime() + 2 * 60 * 60 * 1000

    // === Commandes urgentes (retrait dans < 2h) ===
    Object.entries(orders)
      .filter(([, o]) => {
        if (!['en_attente', 'en_preparation'].includes(o.status)) return false
        if (!o.requestedDate || !o.requestedTime) return false
        if (o.requestedDate !== todayStr) return false
        const [h, m] = (o.requestedTime ?? '23:59').split(':').map(Number)
        const pickup = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime()
        return pickup <= twoHoursFromNow && pickup >= now.getTime()
      })
      .forEach(([id, o]) => {
        const name = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ')
        notifs.push({
          id: `urgent-${id}`,
          type: 'order_urgent',
          title: '⚠️ Commande urgente',
          message: `${name} — retrait à ${o.requestedTime} (dans moins de 2h)`,
          time: o.createdAt ? timeAgo(o.createdAt) : '',
          priority: 'high',
          action: () => { onNavigate('historique'); onClose() },
          actionLabel: 'Voir',
        })
      })

    // === Commandes en attente ===
    const PENDING_ALERT_MS = 30 * 60 * 1000
    const pendingOrders = Object.entries(orders).filter(([, o]) => o.status === 'en_attente')
    if (pendingOrders.length > 0) {
      // List recent pending orders (exclure celles déjà en "non traitées")
      const recent = pendingOrders
        .filter(([, o]) => !o.createdAt || (Date.now() - o.createdAt) <= PENDING_ALERT_MS)
        .sort(([, a], [, b]) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        .slice(0, 3)
      recent.forEach(([id, o]) => {
        const name = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ')
        notifs.push({
          id: `pending-${id}`,
          type: 'order_pending',
          title: '🛒 Nouvelle commande',
          message: `${name} — ${(o.total ?? 0).toFixed(0)}€ (${o.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'})`,
          time: o.createdAt ? timeAgo(o.createdAt) : '',
          priority: 'high',
          action: () => { onNavigate('commandes'); onClose() },
          actionLabel: 'Valider',
        })
      })
    }

    // === Commandes non traitées depuis > 30 min ===
    const stalePending = Object.entries(orders)
      .filter(([, o]) => o.status === 'en_attente' && o.createdAt && (Date.now() - o.createdAt) > PENDING_ALERT_MS)
      .sort(([, a], [, b]) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      .slice(0, 3)
    stalePending.forEach(([id, o]) => {
      const name = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ')
      const mins = Math.floor((Date.now() - (o.createdAt ?? 0)) / 60000)
      notifs.push({
        id: `stale-${id}`,
        type: 'order_pending',
        title: '⏰ Commande non traitée',
        message: `${name} — en attente depuis ${mins} min`,
        time: o.createdAt ? timeAgo(o.createdAt) : '',
        priority: 'high',
        action: () => { onNavigate('commandes'); onClose() },
        actionLabel: 'Voir',
      })
    })

    // === Stock faible ===
    Object.entries(stock)
      .filter(([, qty]) => qty !== null && qty <= 5 && qty > 0)
      .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0))
      .slice(0, 5)
      .forEach(([productId, qty]) => {
        notifs.push({
          id: `stock-${productId}`,
          type: 'low_stock',
          title: '📦 Stock faible',
          message: `${productId.replace(/-/g, ' ')} : ${qty} restant${(qty ?? 0) > 1 ? 's' : ''}`,
          priority: 'medium',
          action: () => { onNavigate('catalogue'); onClose() },
          actionLabel: 'Gérer',
        })
      })

    // === Ruptures ===
    Object.entries(stock)
      .filter(([, qty]) => qty !== null && qty === 0)
      .slice(0, 3)
      .forEach(([productId]) => {
        notifs.push({
          id: `rupture-${productId}`,
          type: 'low_stock',
          title: '🚫 Rupture de stock',
          message: `${productId.replace(/-/g, ' ')} — indisponible`,
          priority: 'high',
          action: () => { onNavigate('catalogue'); onClose() },
          actionLabel: 'Gérer',
        })
      })

    // === Anniversaires dans les 3 prochains jours ===
    Object.entries(allUsers)
      .filter(([, u]) => u.birthday)
      .map(([uid, u]) => {
        const [, month, day] = (u.birthday ?? '').split('-').map(Number)
        const birthdayThisYear = new Date(now.getFullYear(), month - 1, day)
        if (birthdayThisYear < now) birthdayThisYear.setFullYear(now.getFullYear() + 1)
        const daysUntil = Math.ceil((birthdayThisYear.getTime() - now.getTime()) / 86400000)
        return { uid, u, daysUntil }
      })
      .filter(({ daysUntil }) => daysUntil >= 0 && daysUntil <= 3)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .forEach(({ uid, u, daysUntil }) => {
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
        notifs.push({
          id: `birthday-${uid}`,
          type: 'birthday',
          title: '🎂 Anniversaire bientôt',
          message: `${name} — ${daysUntil === 0 ? "C'est aujourd'hui !" : `dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}`,
          priority: 'low',
          action: () => { onNavigate('clients'); onClose() },
          actionLabel: 'Voir',
        })
      })

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return notifs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 20)
  }, [orders, stock, allUsers])

  const highCount = notifications.filter(n => n.priority === 'high').length

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order_pending': return <ShoppingBag size={14} className="text-amber-500" />
      case 'order_urgent': return <AlertTriangle size={14} className="text-red-500" />
      case 'order_preparation': return <Package size={14} className="text-blue-500" />
      case 'low_stock': return <TrendingDown size={14} className="text-orange-500" />
      case 'birthday': return <Cake size={14} className="text-pink-500" />
    }
  }

  return (
    <>
      {/* Badge trigger */}
      {highCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-sm">
          {highCount > 9 ? '9+' : highCount}
        </span>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full right-0 mt-3 w-[min(380px,90vw)] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 z-[90] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-mayssa-brown/5">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-mayssa-gold" />
                  <h3 className="text-sm font-black text-mayssa-brown">Notifications</h3>
                  {notifications.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-mayssa-gold/10 text-mayssa-gold text-[10px] font-black">
                      {notifications.length}
                    </span>
                  )}
                </div>
                <button onClick={onClose} className="p-1.5 rounded-xl text-mayssa-brown/40 hover:text-mayssa-brown hover:bg-mayssa-brown/5 transition-all cursor-pointer">
                  <X size={14} />
                </button>
              </div>

              {/* Notifications list */}
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell size={32} className="mx-auto text-mayssa-brown/15 mb-3" />
                    <p className="text-sm text-mayssa-brown/50 font-medium">Tout est calme !</p>
                    <p className="text-xs text-mayssa-brown/30 mt-1">Aucune alerte pour le moment</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {notifications.map((n, i) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-2xl transition-colors',
                          n.priority === 'high' ? 'bg-red-50/50' : n.priority === 'medium' ? 'bg-amber-50/30' : 'bg-mayssa-soft/30',
                          n.action && 'cursor-pointer hover:bg-mayssa-soft/60'
                        )}
                        onClick={n.action}
                      >
                        <div className={cn(
                          'h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0',
                          n.priority === 'high' ? 'bg-red-100' : n.priority === 'medium' ? 'bg-amber-100' : 'bg-mayssa-soft'
                        )}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-mayssa-brown">{n.title}</p>
                          <p className="text-[10px] text-mayssa-brown/60 mt-0.5 line-clamp-2">{n.message}</p>
                          {n.time && (
                            <p className="text-[9px] text-mayssa-brown/30 flex items-center gap-1 mt-1">
                              <Clock size={8} /> {n.time}
                            </p>
                          )}
                        </div>
                        {n.action && (
                          <div className="flex-shrink-0 flex items-center">
                            <span className={cn(
                              'text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg',
                              n.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-mayssa-gold/10 text-mayssa-gold'
                            )}>
                              {n.actionLabel}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
