import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Phone, MapPin, Star, ShoppingBag, Calendar, Cake, MessageCircle,
  Clock, Mail, Plus, Minus, Loader2
} from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  adminAddPoints, adminRemovePoints, type UserProfile, type Order
} from '../../lib/firebase'
import { togglePinClient, isClientPinned } from '../../lib/adminPins'
import { Pin } from 'lucide-react'

interface AdminClientProfileModalProps {
  uid: string
  profile: UserProfile
  orders: Record<string, Order>
  onClose: () => void
  onNewOrder: (preset: { uid: string; firstName: string; lastName: string; phone: string; email?: string; address?: string }) => void
  onPinChange?: () => void
}

function phoneToWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('33') && digits.length >= 11) return digits
  if (digits.startsWith('0') && digits.length >= 10) return '33' + digits.slice(1)
  return '33' + digits
}

function formatClientOrderItemName(name?: string): string {
  // La Firebase stocke parfois `name` avec des infos optionnelles ajoutées via ` — ...`
  // (ex: Base/Coulis/Flavor Description). Pour l'écran "commandes clients", on ne garde
  // que le nom produit principal.
  const raw = (name ?? '').trim()
  if (!raw) return 'Article'
  return raw.split(' — ')[0].trim() || raw
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  Douceur: { label: 'Douceur', color: 'text-amber-700', bg: 'bg-amber-50', icon: '🍪' },
  Gourmand: { label: 'Gourmand', color: 'text-orange-700', bg: 'bg-orange-50', icon: '🎂' },
  Prestige: { label: 'Prestige', color: 'text-purple-700', bg: 'bg-purple-50', icon: '👑' },
}

export function AdminClientProfileModal({ uid, profile, orders, onClose, onNewOrder, onPinChange }: AdminClientProfileModalProps) {
  const [pointsDelta, setPointsDelta] = useState('')
  const [pointsNote, setPointsNote] = useState('')
  const [savingPoints, setSavingPoints] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'loyalty'>('overview')

  const clientOrders = useMemo(() => {
    return Object.entries(orders)
      .filter(([, o]) => {
        const phone = o.customer?.phone?.replace(/\D/g, '')
        const profilePhone = profile.phone?.replace(/\D/g, '')
        return (o.userId === uid) || (phone && profilePhone && phone === profilePhone)
      })
      .sort(([, a], [, b]) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  }, [orders, uid, profile.phone])

  const stats = useMemo(() => {
    const completed = clientOrders.filter(([, o]) => ['validee', 'livree'].includes(o.status))
    const totalSpent = completed.reduce((s, [, o]) => s + (o.total ?? 0), 0)
    const avgOrder = completed.length > 0 ? totalSpent / completed.length : 0
    const lastOrder = clientOrders[0]?.[1]
    const daysSinceLastOrder = lastOrder?.createdAt
      ? Math.floor((Date.now() - lastOrder.createdAt) / 86400000)
      : null
    return { totalOrders: clientOrders.length, completedOrders: completed.length, totalSpent, avgOrder, daysSinceLastOrder }
  }, [clientOrders])

  const tier = TIER_CONFIG[profile.loyalty?.tier ?? 'Douceur']

  const handleAddPoints = async (add: boolean) => {
    const pts = parseInt(pointsDelta)
    if (isNaN(pts) || pts <= 0) return
    setSavingPoints(true)
    try {
      if (add) {
        await adminAddPoints(uid, pts, pointsNote || undefined)
      } else {
        await adminRemovePoints(uid, pts, pointsNote || undefined)
      }
      setPointsDelta('')
      setPointsNote('')
    } finally {
      setSavingPoints(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-mayssa-brown to-mayssa-brown/80 p-6 pb-8 text-white">
            <div className="absolute top-4 right-4 flex items-center gap-1">
              {profile.phone && (
                <button
                  onClick={() => { togglePinClient(profile.phone!); onPinChange?.() }}
                  className={cn('p-2 rounded-full transition-colors', isClientPinned(profile.phone) ? 'bg-mayssa-gold/30 text-mayssa-gold' : 'bg-white/10 hover:bg-white/20')}
                  title={isClientPinned(profile.phone) ? 'Retirer des favoris' : 'Épingler'}
                >
                  <Pin size={16} fill={isClientPinned(profile.phone) ? 'currentColor' : 'none'} />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
                {profile.firstName?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <h2 className="text-lg font-bold">{profile.firstName} {profile.lastName}</h2>
                {profile.phone && (
                  <p className="text-white/70 text-sm flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} /> {profile.phone}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn('text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full', tier.bg, tier.color)}>
                    {tier.icon} {tier.label}
                  </span>
                  <span className="text-[10px] text-white/60">
                    {profile.loyalty?.points ?? 0} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: 'Commandes', value: stats.totalOrders },
                { label: 'Total dépensé', value: `${stats.totalSpent.toFixed(0)}€` },
                { label: 'Panier moyen', value: `${stats.avgOrder.toFixed(0)}€` },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-base font-black">{s.value}</p>
                  <p className="text-[9px] text-white/60 uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-mayssa-brown/5 px-4">
            {[
              { id: 'overview', label: 'Profil', icon: <User size={12} /> },
              { id: 'orders', label: `Commandes (${stats.totalOrders})`, icon: <ShoppingBag size={12} /> },
              { id: 'loyalty', label: 'Fidélité', icon: <Star size={12} /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer',
                  activeTab === t.id
                    ? 'border-mayssa-gold text-mayssa-brown'
                    : 'border-transparent text-mayssa-brown/40 hover:text-mayssa-brown'
                )}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Info */}
                <div className="space-y-2">
                  {[
                    { icon: <Mail size={14} />, label: profile.email || '—' },
                    { icon: <Phone size={14} />, label: profile.phone || '—' },
                    { icon: <MapPin size={14} />, label: profile.address || '—' },
                    { icon: <Cake size={14} />, label: profile.birthday || 'Non renseigné' },
                    { icon: <Calendar size={14} />, label: `Inscrit le ${new Date(profile.createdAt).toLocaleDateString('fr-FR')}` },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-mayssa-soft/30">
                      <span className="text-mayssa-brown/40 mt-0.5 flex-shrink-0">{item.icon}</span>
                      <span className="text-xs text-mayssa-brown">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Last activity */}
                {stats.daysSinceLastOrder !== null && (
                  <div className={cn(
                    'rounded-xl p-3 flex items-center gap-3',
                    stats.daysSinceLastOrder > 30 ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'
                  )}>
                    <Clock size={14} className={stats.daysSinceLastOrder > 30 ? 'text-red-400' : 'text-emerald-500'} />
                    <p className="text-xs font-medium text-mayssa-brown">
                      {stats.daysSinceLastOrder === 0 ? 'A commandé aujourd\'hui !' : `Dernière commande : il y a ${stats.daysSinceLastOrder} jour(s)`}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {profile.phone && (
                    <a
                      href={`https://wa.me/${phoneToWhatsApp(profile.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => onNewOrder({ uid, firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone ?? '', email: profile.email, address: profile.address })}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-brown/90 transition-colors cursor-pointer"
                  >
                    <ShoppingBag size={14} /> Nouvelle commande
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-3">
                {clientOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag size={32} className="mx-auto text-mayssa-brown/20 mb-2" />
                    <p className="text-xs text-mayssa-brown/50">Aucune commande trouvée</p>
                  </div>
                ) : (
                  clientOrders.map(([id, order]) => {
                    const date = order.createdAt ? new Date(order.createdAt) : null
                    const items = (order.items ?? [])
                      .map(i => `${i.quantity}× ${formatClientOrderItemName(i.name)}`)
                      .join(', ')
                    return (
                      <div key={id} className="bg-mayssa-soft/30 rounded-xl p-3 border border-mayssa-brown/5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-bold text-mayssa-brown/40 uppercase">
                              #{order.orderNumber ?? id.slice(-6)} • {date?.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </p>
                            <p className="text-xs text-mayssa-brown mt-0.5 line-clamp-1">{items}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-black text-mayssa-gold">{(order.total ?? 0).toFixed(0)}€</p>
                            <span className={cn(
                              'text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md',
                              order.status === 'validee' ? 'bg-emerald-100 text-emerald-700' :
                              order.status === 'refusee' ? 'bg-red-100 text-red-700' :
                              order.status === 'en_attente' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            )}>
                              {order.status === 'validee' ? '✓ Validée' :
                               order.status === 'refusee' ? '✗ Refusée' :
                               order.status === 'en_attente' ? '⏳ Attente' :
                               order.status === 'en_preparation' ? '👩‍🍳 Prépa' :
                               order.status === 'pret' ? '✅ Prête' : '🚗 Livrée'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {activeTab === 'loyalty' && (
              <div className="space-y-4">
                {/* Current balance */}
                <div className="bg-gradient-to-br from-mayssa-gold/10 to-mayssa-gold/5 rounded-2xl p-4 border border-mayssa-gold/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-mayssa-gold">Solde actuel</p>
                      <p className="text-3xl font-black text-mayssa-brown mt-1">{profile.loyalty?.points ?? 0} <span className="text-base font-medium text-mayssa-brown/50">pts</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-mayssa-brown/50">Points à vie</p>
                      <p className="text-lg font-bold text-mayssa-brown">{profile.loyalty?.lifetimePoints ?? 0}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-mayssa-gold/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-mayssa-gold to-mayssa-caramel rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, ((profile.loyalty?.lifetimePoints ?? 0) / 200) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-mayssa-brown/40 mt-1">{profile.loyalty?.lifetimePoints ?? 0} / 200 pts pour Prestige</p>
                </div>

                {/* Add/Remove points */}
                <div className="bg-white border border-mayssa-brown/10 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-mayssa-brown uppercase tracking-wider">Ajuster les points</p>
                  <input
                    type="number"
                    min="1"
                    placeholder="Nombre de points"
                    value={pointsDelta}
                    onChange={e => setPointsDelta(e.target.value)}
                    className="w-full rounded-xl border border-mayssa-brown/10 px-3 py-2 text-sm text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-gold/30"
                  />
                  <input
                    type="text"
                    placeholder="Motif (optionnel)"
                    value={pointsNote}
                    onChange={e => setPointsNote(e.target.value)}
                    className="w-full rounded-xl border border-mayssa-brown/10 px-3 py-2 text-sm text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-gold/30"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddPoints(true)}
                      disabled={savingPoints || !pointsDelta}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 cursor-pointer"
                    >
                      {savingPoints ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      Ajouter
                    </button>
                    <button
                      onClick={() => handleAddPoints(false)}
                      disabled={savingPoints || !pointsDelta}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                    >
                      {savingPoints ? <Loader2 size={12} className="animate-spin" /> : <Minus size={12} />}
                      Retirer
                    </button>
                  </div>
                </div>

                {/* History */}
                <div>
                  <p className="text-xs font-bold text-mayssa-brown uppercase tracking-wider mb-2">Historique récent</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(profile.loyalty?.history ?? []).slice().reverse().slice(0, 20).map((entry, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-mayssa-brown/5 last:border-0">
                        <div>
                          <p className="text-[10px] text-mayssa-brown font-medium">{entry.reason.replace(/_/g, ' ')}</p>
                          {entry.adminNote && <p className="text-[9px] text-mayssa-brown/40">{entry.adminNote}</p>}
                        </div>
                        <span className={cn(
                          'text-xs font-black',
                          entry.points >= 0 ? 'text-emerald-600' : 'text-red-500'
                        )}>
                          {entry.points >= 0 ? '+' : ''}{entry.points}
                        </span>
                      </div>
                    ))}
                    {(profile.loyalty?.history ?? []).length === 0 && (
                      <p className="text-xs text-mayssa-brown/40 text-center py-4">Aucun historique</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
