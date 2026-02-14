import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LogOut, Package, Plus, Calendar, RefreshCw, ClipboardList, Check, X, Trash2, AlertTriangle, Cake, Gift, ShoppingBag, Truck, MapPin, Users, Phone, History, TrendingUp } from 'lucide-react'
import {
  adminLogin, adminLogout, onAuthChange,
  listenStock, updateStock, listenSettings, updateSettings,
  listenOrders, updateOrderStatus, deleteOrder,
  listenAllUsers, claimBirthdayGift, listenProductOverrides, deleteUserProfile,
  isPreorderOpenNow,
  type StockMap, type Settings, type Order, type OrderSource, type UserProfile, type PreorderOpening
} from '../../lib/firebase'
import type { ProductOverrideMap } from '../../types'
import type { User } from 'firebase/auth'
import { useProducts } from '../../hooks/useProducts'
import { AdminProductsTab } from './AdminProductsTab'
import { AdminStockTab } from './AdminStockTab'
import { AdminOffSiteOrderForm } from './AdminOffSiteOrderForm'

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export function AdminPanel() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-mayssa-soft flex items-center justify-center">
        <RefreshCw size={32} className="text-mayssa-caramel animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginForm />
  if (user.email !== 'roumayssaghazi213@gmail.com') {
    return <UnauthorizedAccess />
  }
  return <Dashboard user={user} />
}

// --- Login Form ---
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminLogin(email, password)
    } catch {
      setError('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-mayssa-soft flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-display font-bold text-mayssa-brown">Maison Mayssa</h1>
          <p className="text-sm text-mayssa-brown/60">Espace administration</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-xl bg-mayssa-soft/50 px-4 py-3 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            className="w-full rounded-xl bg-mayssa-soft/50 px-4 py-3 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
          />
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-mayssa-brown text-white font-bold hover:bg-mayssa-caramel transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <a href="/" className="block text-center text-xs text-mayssa-brown/40 hover:text-mayssa-brown transition-colors">
          Retour au site
        </a>
      </div>
    </div>
  )
}

// --- Unauthorized Access ---
function UnauthorizedAccess() {
  const handleLogout = async () => {
    await adminLogout()
  }

  return (
    <div className="min-h-screen bg-mayssa-soft flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 space-y-6 text-center">
        <div className="space-y-4">
          <AlertTriangle size={48} className="mx-auto text-red-500" />
          <div className="space-y-2">
            <h1 className="text-xl font-display font-bold text-mayssa-brown">Accès non autorisé</h1>
            <p className="text-sm text-mayssa-brown/60">
              Seul l'administrateur principal peut accéder à cette section.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-mayssa-brown text-white font-bold hover:bg-mayssa-caramel transition-colors cursor-pointer"
          >
            Se déconnecter
          </button>
          <a 
            href="/" 
            className="block text-center text-xs text-mayssa-brown/40 hover:text-mayssa-brown transition-colors"
          >
            Retour au site
          </a>
        </div>
      </div>
    </div>
  )
}

// --- Dashboard ---
function Dashboard({ user }: { user: User }) {
  const [stock, setStock] = useState<StockMap>({})
  const [settings, setSettings] = useState<Settings>({ preorderDays: [3, 6], preorderMessage: '' })
  const [orders, setOrders] = useState<Record<string, Order>>({})
  const [tab, setTab] = useState<'commandes' | 'historique' | 'ca' | 'stock' | 'jours' | 'anniversaires' | 'inscrits' | 'produits'>('commandes')
  const [caPeriod, setCaPeriod] = useState<'jour' | 'semaine' | 'mois'>('semaine')
  const [allUsers, setAllUsers] = useState<Record<string, UserProfile>>({})
  const [productOverrides, setProductOverrides] = useState<ProductOverrideMap>({})
  const { allProducts } = useProducts()
  const [showOffSiteForm, setShowOffSiteForm] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<OrderSource | 'all'>('all')

  useEffect(() => {
    const unsub1 = listenStock(setStock)
    const unsub2 = listenSettings(setSettings)
    const unsub3 = listenOrders(setOrders)
    const unsub4 = listenAllUsers(setAllUsers)
    const unsub5 = listenProductOverrides(setProductOverrides)
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5() }
  }, [])

  // Anniversaires à venir (30 jours)
  const upcomingBirthdays = useMemo(() => {
    const now = new Date()
    return Object.entries(allUsers)
      .filter(([, u]) => u.birthday)
      .map(([uid, u]) => {
        const parts = u.birthday!.split('-').map(Number)
        const month = parts[1]
        const day = parts[2]
        const birthdayThisYear = new Date(now.getFullYear(), month - 1, day)
        if (birthdayThisYear.getTime() < now.getTime() - 86400000) {
          birthdayThisYear.setFullYear(now.getFullYear() + 1)
        }
        const daysUntil = Math.ceil((birthdayThisYear.getTime() - now.getTime()) / 86400000)
        const claimed = u.birthdayGiftClaimed?.[now.getFullYear().toString()] ?? false
        return { uid, profile: u, daysUntil, claimed }
      })
      .filter(b => b.daysUntil <= 30 && b.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }, [allUsers])

  const openings = settings.preorderOpenings && settings.preorderOpenings.length > 0
    ? settings.preorderOpenings
    : (settings.preorderDays || [3, 6]).map((d: number) => ({ day: d, fromTime: '00:00' as string }))

  const updateOpenings = async (next: PreorderOpening[]) => {
    await updateSettings({ preorderOpenings: next })
  }

  const addOpening = () => {
    const next = [...openings, { day: 6, fromTime: '00:00' }]
    updateOpenings(next)
  }

  const removeOpening = (index: number) => {
    const next = openings.filter((_, i) => i !== index)
    updateOpenings(next)
  }

  const setOpeningDay = (index: number, day: number) => {
    const next = openings.map((o, i) => (i === index ? { ...o, day } : o))
    updateOpenings(next)
  }

  const setOpeningTime = (index: number, fromTime: string) => {
    const next = openings.map((o, i) => (i === index ? { ...o, fromTime } : o))
    updateOpenings(next)
  }

  const handleValidateOrder = async (orderId: string, _order: Order) => {
    // Le stock a déjà été décrémenté lors de l'ajout au panier client
    // On marque juste la commande comme validée
    await updateOrderStatus(orderId, 'validee')
  }

  const handleRefuseOrder = async (orderId: string, order: Order) => {
    await updateOrderStatus(orderId, 'refusee')
    // Remettre le stock uniquement pour les produits suivis (trompe l'oeil)
    for (const item of order.items) {
      if (item.productId in stock) {
        const currentQty = stock[item.productId] ?? 0
        await updateStock(item.productId, currentQty + item.quantity)
      }
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    await deleteOrder(orderId)
  }

  const handleLogout = async () => {
    await adminLogout()
    window.location.hash = ''
  }

  const today = new Date().getDay()
  const isPreorderDay = isPreorderOpenNow(openings)

  // Commandes à valider (toutes en_attente, toutes sources)
  const ordersToValidate = Object.entries(orders).filter(
    ([, o]) => o.status === 'en_attente' && (sourceFilter === 'all' || (o.source ?? 'site') === sourceFilter)
  )
  const pendingCount = ordersToValidate.length

  // Toutes les commandes triées (pour historique)
  const sortedOrders = Object.entries(orders)
    .filter(([, o]) => sourceFilter === 'all' || (o.source ?? 'site') === sourceFilter)
    .sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0))

  // Stats CA (commandes validées uniquement)
  const validatedOrders = Object.values(orders).filter((o) => o.status === 'validee')
  const caTotal = validatedOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const caSemaine = validatedOrders
    .filter((o) => o.createdAt && o.createdAt >= startOfWeek.getTime())
    .reduce((s, o) => s + (o.total ?? 0), 0)
  const caMois = validatedOrders
    .filter((o) => o.createdAt && o.createdAt >= startOfMonth)
    .reduce((s, o) => s + (o.total ?? 0), 0)

  // Données graphiques CA (courbe)
  const caChartData = useMemo(() => {
    const data: { label: string; ca: number; date: number }[] = []
    const now = new Date()
    if (caPeriod === 'jour') {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)
        const end = new Date(d)
        end.setHours(23, 59, 59, 999)
        const total = validatedOrders
          .filter((o) => o.createdAt && o.createdAt >= d.getTime() && o.createdAt <= end.getTime())
          .reduce((s, o) => s + (o.total ?? 0), 0)
        data.push({
          label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
          ca: total,
          date: d.getTime(),
        })
      }
    } else if (caPeriod === 'semaine') {
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i * 7)
        d.setDate(d.getDate() - d.getDay())
        d.setHours(0, 0, 0, 0)
        const end = new Date(d)
        end.setDate(end.getDate() + 6)
        end.setHours(23, 59, 59, 999)
        const total = validatedOrders
          .filter((o) => o.createdAt && o.createdAt >= d.getTime() && o.createdAt <= end.getTime())
          .reduce((s, o) => s + (o.total ?? 0), 0)
        data.push({
          label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          ca: total,
          date: d.getTime(),
        })
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
        const total = validatedOrders
          .filter((o) => o.createdAt && o.createdAt >= d.getTime() && o.createdAt <= end.getTime())
          .reduce((s, o) => s + (o.total ?? 0), 0)
        data.push({
          label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          ca: total,
          date: d.getTime(),
        })
      }
    }
    return data
  }, [validatedOrders, caPeriod])

  // Produits les plus vendus (commandes validées)
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; ca: number }> = {}
    for (const order of validatedOrders) {
      for (const item of order.items ?? []) {
        const key = item.name || item.productId || 'Inconnu'
        if (!counts[key]) counts[key] = { name: key.length > 25 ? key.slice(0, 22) + '…' : key, qty: 0, ca: 0 }
        counts[key].qty += item.quantity
        counts[key].ca += item.price * item.quantity
      }
    }
    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)
  }, [validatedOrders])

  return (
    <div className="min-h-screen bg-mayssa-soft">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-display font-bold text-mayssa-brown">Admin Maison Mayssa</h1>
            <p className="text-[10px] text-mayssa-brown/50">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-mayssa-brown/60 hover:bg-mayssa-soft transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            Déco.
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm">
          {([
            { id: 'commandes', icon: ClipboardList, label: 'À valider', badge: pendingCount },
            { id: 'historique', icon: History, label: 'Historique' },
            { id: 'ca', icon: TrendingUp, label: 'CA' },
            { id: 'stock', icon: Package, label: 'Stock' },
            { id: 'jours', icon: Calendar, label: 'Jours' },
            { id: 'anniversaires', icon: Cake, label: 'Anniv.', badge: upcomingBirthdays.filter(b => !b.claimed).length },
            { id: 'inscrits', icon: Users, label: 'Inscrits', badge: Object.keys(allUsers).length },
            { id: 'produits', icon: ShoppingBag, label: 'Produits' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-mayssa-brown text-white shadow-md'
                  : 'text-mayssa-brown/50 hover:bg-mayssa-soft'
              }`}
            >
              <t.icon size={14} />
              {t.label}
              {'badge' in t && t.badge > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Status banner */}
        <div className={`rounded-2xl p-3 text-center ${isPreorderDay ? 'bg-emerald-50 border border-emerald-200' : 'bg-orange-50 border border-orange-200'}`}>
          <p className={`text-xs font-bold ${isPreorderDay ? 'text-emerald-700' : 'text-orange-700'}`}>
            {isPreorderDay
              ? 'Précommandes ouvertes aujourd\'hui'
              : (() => {
                  const next = openings.find(o => o.day > today) ?? openings[0]
                  const label = next ? `${DAY_LABELS[next.day]}${next.fromTime && next.fromTime !== '00:00' ? ` ${next.fromTime}` : ''}` : 'bientôt'
                  return `Fermé — prochaine ouverture : ${label}`
                })()
            }
          </p>
        </div>

        {/* ===== COMMANDES À VALIDER ===== */}
        {tab === 'commandes' && (
          <section className="space-y-3">
            <p className="text-xs text-mayssa-brown/70">
              Toutes les commandes (WhatsApp, Insta, Snap) en attente de validation
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOffSiteForm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-caramel transition-colors cursor-pointer"
              >
                <Plus size={14} />
                Commande hors-site
              </button>
              <div className="flex-1" />
              <select
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value as OrderSource | 'all')}
                className="rounded-xl border border-mayssa-brown/10 px-2 py-2 text-[10px] font-bold text-mayssa-brown bg-white"
              >
                <option value="all">Toutes</option>
                <option value="site">Site</option>
                <option value="snap">Snap</option>
                <option value="instagram">Insta</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            {ordersToValidate.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <ClipboardList size={40} className="mx-auto text-mayssa-brown/20 mb-3" />
                <p className="text-sm text-mayssa-brown/50">Aucune commande en attente</p>
              </div>
            ) : (
              ordersToValidate.map(([id, order]) => {
                const orderSource = order.source ?? 'site'
                return (
                <div
                  key={id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                    order.status === 'en_attente'
                      ? 'border-l-amber-400'
                      : order.status === 'validee'
                        ? 'border-l-emerald-400'
                        : 'border-l-red-400'
                  }`}
                >
                  {/* Header commande */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-mayssa-brown">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        {/* Source badge */}
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          orderSource === 'snap' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          orderSource === 'instagram' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                          orderSource === 'whatsapp' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {orderSource === 'snap' ? 'Snap' : orderSource === 'instagram' ? 'Insta' : orderSource === 'whatsapp' ? 'WhatsApp' : 'Site'}
                        </span>
                      </div>
                      {order.customer?.phone && (
                        <p className="text-[10px] text-mayssa-brown/50">{order.customer.phone}</p>
                      )}
                      {/* Delivery mode + date/time */}
                      {(order.deliveryMode || order.requestedDate) && (
                        <div className="flex items-center gap-2 mt-1">
                          {order.deliveryMode && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-mayssa-brown/50">
                              {order.deliveryMode === 'livraison' ? <Truck size={9} /> : <MapPin size={9} />}
                              {order.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'}
                            </span>
                          )}
                          {order.requestedDate && (
                            <span className="text-[9px] text-mayssa-brown/50">
                              {new Date(order.requestedDate + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              {order.requestedTime && ` à ${order.requestedTime}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-bold ${
                        order.status === 'en_attente'
                          ? 'bg-amber-50 text-amber-700'
                          : order.status === 'validee'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                      }`}>
                        {order.status === 'en_attente' ? 'En attente' : order.status === 'validee' ? 'Validée' : 'Refusée'}
                      </span>
                      <p className="text-[9px] text-mayssa-brown/40 mt-1">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>

                  {/* Admin note */}
                  {order.adminNote && (
                    <p className="text-[10px] text-mayssa-brown/60 italic mb-2 px-1">📝 {order.adminNote}</p>
                  )}

                  {/* Items */}
                  <div className="bg-mayssa-soft/30 rounded-xl p-3 mb-3 space-y-1">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-mayssa-brown">
                          {item.quantity}× {item.name}
                        </span>
                        <span className="font-bold text-mayssa-brown">
                          {(item.price * item.quantity).toFixed(2).replace('.', ',')} €
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-mayssa-brown/10 pt-1 mt-1 flex justify-between">
                      <span className="text-xs font-bold text-mayssa-brown">Total</span>
                      <span className="text-sm font-bold text-mayssa-caramel">
                        {(order.total ?? 0).toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {order.status === 'en_attente' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleValidateOrder(id, order)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                      >
                        <Check size={14} />
                        Valider
                      </button>
                      <button
                        onClick={() => handleRefuseOrder(id, order)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <X size={14} />
                        Refuser
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDeleteOrder(id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-mayssa-soft/50 text-mayssa-brown/40 text-[10px] font-bold hover:bg-red-50 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                      Supprimer
                    </button>
                  )}
                </div>
                )
              })
            )}

            {/* Off-site order form modal */}
            {showOffSiteForm && (
              <AdminOffSiteOrderForm
                allProducts={allProducts}
                stock={stock}
                onClose={() => setShowOffSiteForm(false)}
                onOrderCreated={() => setShowOffSiteForm(false)}
              />
            )}
          </section>
        )}

        {/* ===== HISTORIQUE DES COMMANDES ===== */}
        {tab === 'historique' && (
          <section className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-mayssa-brown text-sm flex items-center gap-2">
                <History size={18} />
                Historique des commandes
              </h3>
              <select
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value as OrderSource | 'all')}
                className="rounded-xl border border-mayssa-brown/10 px-2 py-1.5 text-[10px] font-bold text-mayssa-brown bg-white"
              >
                <option value="all">Toutes sources</option>
                <option value="site">Site</option>
                <option value="snap">Snap</option>
                <option value="instagram">Insta</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            {sortedOrders.length === 0 ? (
              <p className="text-sm text-mayssa-brown/50 text-center py-6">Aucune commande enregistrée</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {sortedOrders.map(([id, order]) => {
                  const orderSource = order.source ?? 'site'
                  return (
                    <div
                      key={id}
                      className={`p-3 rounded-xl border text-left ${
                        order.status === 'validee'
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : order.status === 'refusee'
                            ? 'border-red-200 bg-red-50/30'
                            : 'border-amber-200 bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm text-mayssa-brown">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </p>
                          <p className="text-[10px] text-mayssa-brown/50">{order.customer?.phone}</p>
                          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            orderSource === 'snap' ? 'bg-yellow-100 text-yellow-800' :
                            orderSource === 'instagram' ? 'bg-pink-100 text-pink-800' :
                            orderSource === 'whatsapp' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {orderSource === 'snap' ? 'Snap' : orderSource === 'instagram' ? 'Insta' : orderSource === 'whatsapp' ? 'WhatsApp' : 'Site'}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-mayssa-caramel">
                            {(order.total ?? 0).toFixed(2).replace('.', ',')} €
                          </p>
                          <span className={`text-[9px] font-bold ${
                            order.status === 'validee' ? 'text-emerald-600' :
                            order.status === 'refusee' ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {order.status === 'en_attente' ? 'En attente' : order.status === 'validee' ? 'Validée' : 'Refusée'}
                          </span>
                          <p className="text-[9px] text-mayssa-brown/40 mt-0.5">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-mayssa-brown/60">
                        {order.items?.slice(0, 3).map((item, i) => (
                          <span key={i}>{item.quantity}× {item.name}{i < Math.min(2, (order.items?.length ?? 1) - 1) ? ', ' : ''}</span>
                        ))}
                        {(order.items?.length ?? 0) > 3 && <span> +{(order.items?.length ?? 0) - 3} autre(s)</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ===== CHIFFRE D'AFFAIRES ===== */}
        {tab === 'ca' && (
          <section className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="font-bold text-mayssa-brown text-sm flex items-center gap-2">
              <TrendingUp size={18} />
              Suivi du chiffre d&apos;affaires
            </h3>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-mayssa-caramel/10 border border-mayssa-caramel/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">CA total (validé)</p>
                <p className="text-xl font-display font-bold text-mayssa-caramel">{caTotal.toFixed(2).replace('.', ',')} €</p>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Ce mois</p>
                <p className="text-xl font-display font-bold text-emerald-700">{caMois.toFixed(2).replace('.', ',')} €</p>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Cette semaine</p>
                <p className="text-xl font-display font-bold text-blue-700">{caSemaine.toFixed(2).replace('.', ',')} €</p>
              </div>
              <div className="rounded-xl bg-mayssa-soft/80 border border-mayssa-brown/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Nb commandes validées</p>
                <p className="text-xl font-display font-bold text-mayssa-brown">{validatedOrders.length}</p>
              </div>
            </div>

            {/* CA moyen */}
            <div className="rounded-xl bg-mayssa-soft/50 p-4 border border-mayssa-brown/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Panier moyen (validé)</p>
              <p className="text-lg font-display font-bold text-mayssa-brown">
                {validatedOrders.length > 0
                  ? (caTotal / validatedOrders.length).toFixed(2).replace('.', ',') + ' €'
                  : '—'}
              </p>
            </div>

            {/* Par source */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">CA par source (validé)</p>
              <div className="space-y-2">
                {(['site', 'whatsapp', 'instagram', 'snap'] as const).map((src) => {
                  const ordersSrc = validatedOrders.filter((o) => (o.source ?? 'site') === src)
                  const totalSrc = ordersSrc.reduce((s, o) => s + (o.total ?? 0), 0)
                  const label = src === 'snap' ? 'Snap' : src === 'instagram' ? 'Insta' : src === 'whatsapp' ? 'WhatsApp' : 'Site'
                  return (
                    <div key={src} className="flex items-center justify-between py-2 px-3 rounded-xl bg-mayssa-soft/30">
                      <span className="text-sm font-medium text-mayssa-brown">{label}</span>
                      <span className="text-sm font-bold text-mayssa-caramel">{totalSrc.toFixed(2).replace('.', ',')} €</span>
                      <span className="text-[10px] text-mayssa-brown/50">{ordersSrc.length} cmd.</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Courbe CA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Courbe CA</p>
                <div className="flex gap-1">
                  {(['jour', 'semaine', 'mois'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCaPeriod(p)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        caPeriod === p ? 'bg-mayssa-caramel text-white' : 'bg-mayssa-soft/50 text-mayssa-brown/60 hover:bg-mayssa-soft'
                      }`}
                    >
                      {p === 'jour' ? 'Jours' : p === 'semaine' ? 'Semaines' : 'Mois'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-48 rounded-xl bg-mayssa-soft/30 border border-mayssa-brown/5 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={caChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d4a57430" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="#5b3a29" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#5b3a29" tickFormatter={(v) => `${v}€`} />
                    <Tooltip
                      formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(2).replace('.', ',')} €`, 'CA']}
                      labelFormatter={(label) => label}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Line type="monotone" dataKey="ca" stroke="#a67c52" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="CA" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Produits les plus vendus */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Produits les plus vendus</p>
              {topProducts.length === 0 ? (
                <p className="text-sm text-mayssa-brown/50 text-center py-4">Aucune donnée</p>
              ) : (
                <div className="h-56 rounded-xl bg-mayssa-soft/30 border border-mayssa-brown/5 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d4a57430" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9 }} stroke="#5b3a29" tickFormatter={(v) => `${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} stroke="#5b3a29" width={100} />
                      <Tooltip
                        formatter={(value: number | undefined, _: unknown, props: { payload?: { qty: number; ca: number } }) =>
                          props?.payload ? [`${props.payload.qty} vendu(s) · ${props.payload.ca.toFixed(2).replace('.', ',')} €`, 'Total'] : [value ?? 0, 'Qté']
                        }
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                      <Bar dataKey="qty" fill="#a67c52" radius={[0, 4, 4, 0]} name="Qté vendue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== STOCK ===== */}
        {tab === 'stock' && (
          <AdminStockTab allProducts={allProducts} stock={stock} />
        )}

        {/* ===== JOURS (horaires précommandes trompe-l'œil) ===== */}
        {tab === 'jours' && (
          <section className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <p className="text-xs text-mayssa-brown/60">
              Jours et horaires d&apos;ouverture des précommandes (ex. Samedi toute la journée, Mercredi à partir de midi) :
            </p>
            <div className="space-y-2">
              {openings.map((o, index) => (
                <div key={index} className="flex items-center gap-2 flex-wrap">
                  <select
                    value={o.day}
                    onChange={(e) => setOpeningDay(index, Number(e.target.value))}
                    className="rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs font-bold text-mayssa-brown bg-white"
                  >
                    {DAY_LABELS.map((label, i) => (
                      <option key={i} value={i}>{label}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-mayssa-brown/50">à partir de</span>
                  <input
                    type="time"
                    value={o.fromTime === '00:00' || o.fromTime === '0:00' ? '00:00' : o.fromTime}
                    onChange={(e) => setOpeningTime(index, e.target.value || '00:00')}
                    className="rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs font-bold text-mayssa-brown bg-white w-24"
                  />
                  <button
                    type="button"
                    onClick={() => removeOpening(index)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOpening}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-soft text-mayssa-brown text-xs font-bold hover:bg-mayssa-caramel/20 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                Ajouter un créneau
              </button>
            </div>
          </section>
        )}

        {tab === 'anniversaires' && (
          <section className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-mayssa-brown text-sm">Anniversaires à venir (30 jours)</h3>
              <span className="text-[10px] text-mayssa-brown/50">{upcomingBirthdays.length} client{upcomingBirthdays.length > 1 ? 's' : ''}</span>
            </div>

            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-mayssa-brown/50 text-center py-6">
                Aucun anniversaire dans les 30 prochains jours
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingBirthdays.map(({ uid, profile: u, daysUntil, claimed }) => (
                  <div
                    key={uid}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      daysUntil === 0
                        ? 'border-pink-300 bg-pink-50'
                        : daysUntil <= 7
                          ? 'border-mayssa-caramel/30 bg-mayssa-caramel/5'
                          : 'border-mayssa-brown/10 bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-mayssa-brown truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[10px] text-mayssa-brown/60 truncate">
                        {u.phone || 'Pas de tel.'} &middot; {u.email}
                      </p>
                      <p className={`text-xs font-medium mt-0.5 ${
                        daysUntil === 0 ? 'text-pink-600' : 'text-mayssa-caramel'
                      }`}>
                        {daysUntil === 0
                          ? "Aujourd'hui !"
                          : daysUntil === 1
                            ? 'Demain'
                            : `Dans ${daysUntil} jours`}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      {claimed ? (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
                          <Gift size={10} />
                          Cadeau offert
                        </span>
                      ) : (
                        <button
                          onClick={() => claimBirthdayGift(uid)}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-mayssa-caramel text-white hover:bg-mayssa-brown transition-colors cursor-pointer"
                        >
                          Marquer cadeau offert
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'inscrits' && (
          <section className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-mayssa-brown text-sm flex items-center gap-2">
                <Users size={18} />
                Clients inscrits
              </h3>
              <span className="text-[10px] text-mayssa-brown/50">{Object.keys(allUsers).length} inscrit{Object.keys(allUsers).length !== 1 ? 's' : ''}</span>
            </div>

            {Object.keys(allUsers).length === 0 ? (
              <p className="text-sm text-mayssa-brown/50 text-center py-6">
                Aucun client inscrit pour le moment
              </p>
            ) : (
              <div className="space-y-2">
                {Object.entries(allUsers)
                  .sort(([, a], [, b]) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
                  .map(([uid, u]) => (
                    <div
                      key={uid}
                      className="flex items-center justify-between p-3 rounded-xl border border-mayssa-brown/10 bg-white hover:bg-mayssa-soft/30 transition-colors gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-mayssa-brown">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-mayssa-brown/70 mt-0.5 flex items-center gap-1.5">
                          <Phone size={12} className="flex-shrink-0" />
                          {u.phone || <span className="text-mayssa-brown/40 italic">Pas de téléphone</span>}
                        </p>
                        <p className="text-[10px] text-mayssa-brown/50 truncate mt-0.5">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-mayssa-brown/40">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Supprimer ${u.firstName} ${u.lastName} ? Le profil (points, adresse) sera effacé.`)) return
                            try {
                              await deleteUserProfile(uid)
                            } catch (err) {
                              console.error('Erreur suppression client:', err)
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label={`Supprimer ${u.firstName} ${u.lastName}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {tab === 'produits' && (
          <AdminProductsTab allProducts={allProducts} overrides={productOverrides} />
        )}

        <a
          href="/"
          className="block text-center text-sm text-mayssa-brown/40 hover:text-mayssa-brown transition-colors py-4"
        >
          ← Retour au site
        </a>
      </main>
    </div>
  )
}
