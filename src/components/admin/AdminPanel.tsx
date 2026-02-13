import { useState, useEffect, useMemo } from 'react'
import { LogOut, Package, Minus, Plus, Calendar, RefreshCw, ClipboardList, Check, X, Trash2, AlertTriangle, Cake, Gift, ShoppingBag } from 'lucide-react'
import {
  adminLogin, adminLogout, onAuthChange,
  listenStock, updateStock, listenSettings, updateSettings,
  listenOrders, updateOrderStatus, deleteOrder,
  listenAllUsers, claimBirthdayGift, listenProductOverrides,
  isPreorderOpenNow,
  type StockMap, type Settings, type Order, type UserProfile, type PreorderOpening
} from '../../lib/firebase'
import { PRODUCTS } from '../../constants'
import type { ProductOverrideMap } from '../../types'
import type { User } from 'firebase/auth'
import { useProducts } from '../../hooks/useProducts'
import { AdminProductsTab } from './AdminProductsTab'

const TROMPE_LOEIL_PRODUCTS = PRODUCTS.filter(p => p.category === "Trompe l'oeil")
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
  const [saving, setSaving] = useState<string | null>(null)
  const [tab, setTab] = useState<'commandes' | 'stock' | 'jours' | 'anniversaires' | 'produits'>('commandes')
  const [allUsers, setAllUsers] = useState<Record<string, UserProfile>>({})
  const [productOverrides, setProductOverrides] = useState<ProductOverrideMap>({})
  const { allProducts } = useProducts()

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

  const handleStockChange = async (productId: string, delta: number) => {
    const current = stock[productId] ?? 0
    const newVal = Math.max(0, current + delta)
    setSaving(productId)
    await updateStock(productId, newVal)
    setSaving(null)
  }

  const handleStockSet = async (productId: string, value: string) => {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 0) return
    setSaving(productId)
    await updateStock(productId, num)
    setSaving(null)
  }

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
    // Remettre le stock car la commande est refusée
    for (const item of order.items) {
      const currentQty = stock[item.productId] ?? 0
      await updateStock(item.productId, currentQty + item.quantity)
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

  // Trier les commandes : en_attente d'abord, puis par date décroissante
  const sortedOrders = Object.entries(orders).sort(([, a], [, b]) => {
    if (a.status === 'en_attente' && b.status !== 'en_attente') return -1
    if (a.status !== 'en_attente' && b.status === 'en_attente') return 1
    return (b.createdAt || 0) - (a.createdAt || 0)
  })

  const pendingCount = sortedOrders.filter(([, o]) => o.status === 'en_attente').length

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
            { id: 'commandes', icon: ClipboardList, label: 'Commandes', badge: pendingCount },
            { id: 'stock', icon: Package, label: 'Stock' },
            { id: 'jours', icon: Calendar, label: 'Jours' },
            { id: 'anniversaires', icon: Cake, label: 'Anniv.', badge: upcomingBirthdays.filter(b => !b.claimed).length },
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

        {/* ===== COMMANDES ===== */}
        {tab === 'commandes' && (
          <section className="space-y-3">
            {sortedOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <ClipboardList size={40} className="mx-auto text-mayssa-brown/20 mb-3" />
                <p className="text-sm text-mayssa-brown/50">Aucune commande pour le moment</p>
              </div>
            ) : (
              sortedOrders.map(([id, order]) => (
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
                      <p className="text-sm font-bold text-mayssa-brown">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </p>
                      {order.customer?.phone && (
                        <p className="text-[10px] text-mayssa-brown/50">{order.customer.phone}</p>
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
              ))
            )}
          </section>
        )}

        {/* ===== STOCK ===== */}
        {tab === 'stock' && (
          <section className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="space-y-3">
              {TROMPE_LOEIL_PRODUCTS.map((product) => {
                const qty = stock[product.id] ?? 0
                const isSaving = saving === product.id
                return (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                      qty === 0 ? 'bg-red-50 border border-red-200' : 'bg-mayssa-soft/30 border border-mayssa-brown/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-mayssa-brown truncate">{product.name}</p>
                      <p className={`text-[10px] font-bold ${qty === 0 ? 'text-red-500' : qty <= 5 ? 'text-orange-500' : 'text-emerald-600'}`}>
                        {qty === 0 ? 'Rupture' : `${qty} en stock`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStockChange(product.id, -1)}
                        disabled={qty === 0 || isSaving}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-mayssa-brown/10 text-mayssa-brown hover:bg-red-50 disabled:opacity-30 transition-all cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => handleStockSet(product.id, e.target.value)}
                        className="w-14 text-center rounded-lg border border-mayssa-brown/10 py-1 text-sm font-bold text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                      />
                      <button
                        onClick={() => handleStockChange(product.id, 1)}
                        disabled={isSaving}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-mayssa-brown/10 text-mayssa-brown hover:bg-emerald-50 disabled:opacity-30 transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={async () => { for (const p of TROMPE_LOEIL_PRODUCTS) await updateStock(p.id, 20) }}
                className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Remettre tout à 20
              </button>
              <button
                onClick={async () => { for (const p of TROMPE_LOEIL_PRODUCTS) await updateStock(p.id, 0) }}
                className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
              >
                Tout mettre à 0
              </button>
            </div>
          </section>
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
