import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, ShoppingBag, Package, AlertTriangle, Cake, TrendingDown, Clock } from 'lucide-react'
import { isNewOrderInAdminQueue, isOrderOnlinePaid } from '../../lib/orderStatus'
import { cn } from '../../lib/utils'
import type { Order, UserProfile } from '../../lib/firebase'
import { formatOrderCustomerDisplayName } from '../../lib/orderCustomerDisplay'
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
        if (!['en_preparation', 'validee', 'en_attente'].includes(o.status)) return false
        if (!o.requestedDate || !o.requestedTime) return false
        if (o.requestedDate !== todayStr) return false
        const [h, m] = (o.requestedTime ?? '23:59').split(':').map(Number)
        const pickup = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime()
        return pickup <= twoHoursFromNow && pickup >= now.getTime()
      })
      .forEach(([id, o]) => {
        const name = formatOrderCustomerDisplayName(o)
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

    // === Nouvelles commandes en prépa ===
    const PENDING_ALERT_MS = 30 * 60 * 1000
    const pendingOrders = Object.entries(orders).filter(([, o]) => isNewOrderInAdminQueue(o))
    if (pendingOrders.length > 0) {
      const recent = pendingOrders
        .filter(([, o]) => !o.createdAt || (Date.now() - o.createdAt) <= PENDING_ALERT_MS)
        .sort(([, a], [, b]) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        .slice(0, 3)
      recent.forEach(([id, o]) => {
        const name = formatOrderCustomerDisplayName(o)
        const paidLabel = isOrderOnlinePaid(o) ? ' · Validée · Payée' : ' · En prépa'
        notifs.push({
          id: `pending-${id}`,
          type: 'order_pending',
          title: isOrderOnlinePaid(o) ? '✅ Commande validée' : '👩‍🍳 En préparation',
          message: `${name} — ${(o.total ?? 0).toFixed(0)}€ (${o.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'})${paidLabel}`,
          time: o.createdAt ? timeAgo(o.createdAt) : '',
          priority: 'high',
          action: () => { onNavigate('commandes'); onClose() },
          actionLabel: 'Voir',
        })
      })
    }

    // === Commandes non traitées depuis > 30 min ===
    const stalePending = Object.entries(orders)
      .filter(([, o]) => isNewOrderInAdminQueue(o) && o.createdAt && (Date.now() - o.createdAt) > PENDING_ALERT_MS)
      .sort(([, a], [, b]) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      .slice(0, 3)
    stalePending.forEach(([id, o]) => {
      const name = formatOrderCustomerDisplayName(o)
      const mins = Math.floor((Date.now() - (o.createdAt ?? 0)) / 60000)
      notifs.push({
        id: `stale-${id}`,
        type: 'order_pending',
        title: '⏰ Commande en attente de traitement',
        message: `${name} — en prépa depuis ${mins} min`,
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
          message: `${productId} — ${qty} restant${qty !== 1 ? 's' : ''}`,
          priority: qty === 1 ? 'high' : 'medium',
          action: () => { onNavigate('catalogue'); onClose() },
          actionLabel: 'Stock',
        })
      })

    // === Anniversaires à venir (7 jours) ===
    Object.entries(allUsers)
      .filter(([, u]) => u.birthday)
      .forEach(([uid, u]) => {
        const parts = u.birthday!.split('-').map(Number)
        const month = parts[1]
        const day = parts[2]
        const birthdayThisYear = new Date(now.getFullYear(), month - 1, day)
        if (birthdayThisYear.getTime() < now.getTime() - 86400000) {
          birthdayThisYear.setFullYear(now.getFullYear() + 1)
        }
        const daysUntil = Math.ceil((birthdayThisYear.getTime() - now.getTime()) / 86400000)
        if (daysUntil <= 7 && daysUntil >= 0) {
          notifs.push({
            id: `birthday-${uid}`,
            type: 'birthday',
            title: '🎂 Anniversaire bientôt',
            message: `${u.firstName ?? 'Client'} — dans ${daysUntil} jour${daysUntil !== 1 ? 's' : ''}`,
            priority: daysUntil <= 1 ? 'high' : 'medium',
            action: () => { onNavigate('clients'); onClose() },
            actionLabel: 'Clients',
          })
        }
      })

    // === Commandes en préparation (rappel) ===
    const inPrep = Object.entries(orders).filter(([, o]) => o.status === 'en_preparation')
    if (inPrep.length >= 3) {
      notifs.push({
        id: 'prep-summary',
        type: 'order_preparation',
        title: '👩‍🍳 Préparation en cours',
        message: `${inPrep.length} commandes en préparation`,
        priority: 'medium',
        action: () => { onNavigate('commandes'); onClose() },
        actionLabel: 'Voir',
      })
    }

    return notifs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [orders, stock, allUsers, onNavigate, onClose])

  const unreadCount = notifications.filter(n => n.priority === 'high').length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-mayssa-brown/10">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-mayssa-caramel" />
                <h2 className="text-sm font-bold text-mayssa-brown">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{unreadCount}</span>
                )}
              </div>
              <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-mayssa-soft cursor-pointer">
                <X size={18} className="text-mayssa-brown/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-mayssa-brown/50 py-8">Aucune notification</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'p-3 rounded-xl border transition-colors',
                      notif.priority === 'high' ? 'border-red-200 bg-red-50/50' : 'border-mayssa-brown/10 bg-mayssa-soft/30',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        notif.type === 'order_pending' ? 'bg-emerald-100 text-emerald-600' :
                        notif.type === 'order_urgent' ? 'bg-amber-100 text-amber-600' :
                        notif.type === 'low_stock' ? 'bg-orange-100 text-orange-600' :
                        notif.type === 'birthday' ? 'bg-pink-100 text-pink-600' :
                        'bg-blue-100 text-blue-600',
                      )}>
                        {notif.type === 'order_pending' ? <ShoppingBag size={14} /> :
                         notif.type === 'order_urgent' ? <AlertTriangle size={14} /> :
                         notif.type === 'low_stock' ? <TrendingDown size={14} /> :
                         notif.type === 'birthday' ? <Cake size={14} /> :
                         notif.type === 'order_preparation' ? <Package size={14} /> :
                         <Clock size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-mayssa-brown">{notif.title}</p>
                        <p className="text-[11px] text-mayssa-brown/70 mt-0.5">{notif.message}</p>
                        {notif.time && (
                          <p className="text-[10px] text-mayssa-brown/40 mt-1">{notif.time}</p>
                        )}
                        {notif.action && (
                          <button
                            type="button"
                            onClick={notif.action}
                            className="mt-2 text-[10px] font-bold text-mayssa-caramel hover:text-mayssa-brown cursor-pointer"
                          >
                            {notif.actionLabel ?? 'Voir'} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
