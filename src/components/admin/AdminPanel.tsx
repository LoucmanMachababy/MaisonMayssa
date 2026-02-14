import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LogOut, Package, Plus, Minus, Calendar, RefreshCw, ClipboardList, Check, X, Trash2, AlertTriangle, Cake, Gift, ShoppingBag, Truck, MapPin, Users, Phone, History, TrendingUp, Pencil, Search, Download, Bell, MessageSquare, Filter, XCircle } from 'lucide-react'
import type { OrderStatus } from '../../lib/firebase'
import {
  adminLogin, adminLogout, onAuthChange,
  listenStock, updateStock, listenSettings, updateSettings,
  listenOrders, updateOrderStatus, deleteOrder,
  listenAllUsers, claimBirthdayGift, listenProductOverrides, deleteUserProfile,
  adminAddPoints, adminRemovePoints,
  isPreorderOpenNow,
  type StockMap, type Settings, type Order, type OrderSource, type UserProfile, type PreorderOpening
} from '../../lib/firebase'
import type { ProductOverrideMap } from '../../types'
import type { User } from 'firebase/auth'
import { useProducts } from '../../hooks/useProducts'
import { AdminProductsTab } from './AdminProductsTab'
import { AdminStockTab } from './AdminStockTab'
import { AdminOffSiteOrderForm } from './AdminOffSiteOrderForm'
import { AdminEditOrderModal } from './AdminEditOrderModal'

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const ORDER_STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  en_preparation: 'En préparation',
  pret: 'Prête',
  livree: 'Livrée',
  validee: 'Validée',
  refusee: 'Refusée',
}

// Son de notification pour nouvelle commande (Web Audio API)
function playNewOrderSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch { /* ignore */ }
}

// Export CSV pour Excel (séparateur ;, BOM UTF-8)
function exportOrdersToCSV(entries: [string, Order][]): void {
  const SEP = ';'
  const BOM = '\uFEFF'
  const header = ['Date', 'Heure', 'Client', 'Téléphone', 'Source', 'Statut', 'Mode', 'Adresse', 'Distance km', 'Date retrait', 'Note client', 'Articles', 'Frais livr.', 'Total (€)'].join(SEP)
  const rows = entries.map(([, o]) => {
    const date = o.createdAt ? new Date(o.createdAt) : null
    const dateStr = date ? date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
    const timeStr = date ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
    const client = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ')
    const phone = o.customer?.phone ?? ''
    const source = o.source === 'snap' ? 'Snap' : o.source === 'instagram' ? 'Insta' : o.source === 'whatsapp' ? 'WhatsApp' : 'Site'
    const status = o.status === 'en_attente' ? 'En attente' : o.status === 'en_preparation' ? 'En préparation' : o.status === 'pret' ? 'Prête' : o.status === 'livree' ? 'Livrée' : o.status === 'validee' ? 'Validée' : 'Refusée'
    const mode = o.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'
    const adresse = (o.customer?.address ?? '').replace(/"/g, '""')
    const distanceKm = o.distanceKm != null ? o.distanceKm.toFixed(1) : ''
    const retrait = o.requestedDate
      ? new Date(o.requestedDate + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + (o.requestedTime ? ` ${o.requestedTime}` : '')
      : ''
    const clientNote = (o.clientNote ?? '').replace(/"/g, '""')
    const items = (o.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(' | ')
    const deliveryFee = (o.deliveryFee ?? 0) > 0 ? (o.deliveryFee ?? 0).toFixed(2).replace('.', ',') : ''
    const total = (o.total ?? 0).toFixed(2).replace('.', ',')
    return [dateStr, timeStr, client, phone, source, status, mode, `"${adresse}"`, distanceKm, retrait, `"${clientNote}"`, `"${items.replace(/"/g, '""')}"`, deliveryFee, total].join(SEP)
  })
  const csv = BOM + header + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `commandes-maison-mayssa-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

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
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<OrderSource | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_attente' | 'en_preparation' | 'pret' | 'livree' | 'validee' | 'refusee'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)

  const setDatePreset = (preset: 'today' | '7d' | '30d' | 'month') => {
    const now = new Date()
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    if (preset === 'today') {
      setDateFrom(d.toISOString().slice(0, 10))
      setDateTo(d.toISOString().slice(0, 10))
    } else if (preset === '7d') {
      const start = new Date(d)
      start.setDate(start.getDate() - 6)
      setDateFrom(start.toISOString().slice(0, 10))
      setDateTo(now.toISOString().slice(0, 10))
    } else if (preset === '30d') {
      const start = new Date(d)
      start.setDate(start.getDate() - 29)
      setDateFrom(start.toISOString().slice(0, 10))
      setDateTo(now.toISOString().slice(0, 10))
    } else {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setDateFrom(first.toISOString().slice(0, 10))
      setDateTo(last.toISOString().slice(0, 10))
    }
  }
  const clearFilters = () => {
    setSearchQuery('')
    setDateFrom('')
    setDateTo('')
    setSourceFilter('all')
    setStatusFilter('all')
  }
  const hasActiveFilters = searchQuery.trim() || dateFrom || dateTo || sourceFilter !== 'all' || statusFilter !== 'all'
  const previousPendingIdsRef = useRef<Set<string>>(new Set())
  const isInitialLoadRef = useRef(true)

  useEffect(() => {
    const unsub1 = listenStock(setStock)
    const unsub2 = listenSettings(setSettings)
    const unsub3 = listenOrders(setOrders)
    const unsub4 = listenAllUsers(setAllUsers)
    const unsub5 = listenProductOverrides(setProductOverrides)
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5() }
  }, [])

  // Notification son + navigateur quand nouvelle commande en attente
  useEffect(() => {
    const pending = Object.entries(orders).filter(([, o]) => o.status === 'en_attente')
    const pendingIds = new Set(pending.map(([id]) => id))
    if (isInitialLoadRef.current) {
      previousPendingIdsRef.current = pendingIds
      isInitialLoadRef.current = false
      return
    }
    const prev = previousPendingIdsRef.current
    const newIds = [...pendingIds].filter((id) => !prev.has(id))
    previousPendingIdsRef.current = pendingIds
    if (newIds.length > 0 && soundEnabled) {
      playNewOrderSound()
      if (Notification.permission === 'granted') {
        const count = newIds.length
        new Notification('Nouvelle commande !', {
          body: count === 1 ? 'Une nouvelle commande est en attente.' : `${count} nouvelles commandes en attente.`,
          icon: '/logo.webp',
        })
      }
    }
  }, [orders, soundEnabled])

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
    if (!window.confirm("T'es sûr ? Cette commande sera définitivement supprimée.")) return
    await deleteOrder(orderId)
  }

  const handleLogout = async () => {
    await adminLogout()
    window.location.hash = ''
  }

  const today = new Date().getDay()
  const isPreorderDay = isPreorderOpenNow(openings)

  // Filtre par recherche (nom, téléphone) et dates
  const matchesSearch = (o: Order) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    const name = `${o.customer?.firstName ?? ''} ${o.customer?.lastName ?? ''}`.toLowerCase()
    const phone = (o.customer?.phone ?? '').replace(/\s/g, '')
    const qClean = q.replace(/\s/g, '')
    return name.includes(q) || phone.includes(qClean)
  }
  const matchesDateRange = (o: Order) => {
    const ts = o.createdAt
    if (!ts) return true
    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      if (ts < from) return false
    }
    if (dateTo) {
      const to = new Date(dateTo).setHours(23, 59, 59, 999)
      if (ts > to) return false
    }
    return true
  }

  const matchesStatus = (o: Order) => statusFilter === 'all' || o.status === statusFilter

  // Commandes à valider (toutes en_attente, toutes sources)
  const ordersToValidate = Object.entries(orders)
    .filter(([, o]) => o.status === 'en_attente' && (sourceFilter === 'all' || (o.source ?? 'site') === sourceFilter))
    .filter(([, o]) => matchesSearch(o) && matchesDateRange(o))
  const pendingCount = Object.entries(orders).filter(([, o]) => o.status === 'en_attente').length

  // Toutes les commandes triées (pour historique) avec filtres
  const sortedOrders = Object.entries(orders)
    .filter(([, o]) => (sourceFilter === 'all' || (o.source ?? 'site') === sourceFilter) && matchesStatus(o))
    .filter(([, o]) => matchesSearch(o) && matchesDateRange(o))
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
    <div className="min-h-screen bg-slate-50">
      {/* Header premium */}
      <header className="bg-mayssa-brown text-white sticky top-0 z-20 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-display font-bold tracking-tight">Dashboard Maison Mayssa</h1>
            <p className="text-[10px] text-white/60">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (soundEnabled && Notification.permission === 'default') {
                  Notification.requestPermission()
                }
                setSoundEnabled((s) => !s)
              }}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                soundEnabled ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-white/50'
              }`}
              title={soundEnabled ? 'Son activé' : 'Son désactivé'}
            >
              <Bell size={14} />
              {soundEnabled ? 'On' : 'Off'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-1.5 bg-white/80 backdrop-blur rounded-2xl p-1.5 shadow-md border border-mayssa-brown/5 overflow-x-auto">
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
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-mayssa-brown text-white shadow-md'
                  : 'text-mayssa-brown/60 hover:bg-mayssa-soft/80'
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

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-8">
        {/* Status banner */}
        <div className={`rounded-2xl p-4 text-center shadow-sm ${isPreorderDay ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
          <p className={`text-sm font-bold ${isPreorderDay ? 'text-emerald-800' : 'text-amber-800'}`}>
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
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* KPI + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-mayssa-brown/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">En attente</span>
                  <p className="text-lg font-display font-bold text-mayssa-brown">{pendingCount}</p>
                </div>
                <button
                  onClick={() => setShowOffSiteForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-brown/90 shadow-md transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  Commande hors-site
                </button>
              </div>
            </div>

            {/* Filtres premium */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-mayssa-brown/5 space-y-3">
              <div className="flex items-center gap-2 text-mayssa-brown/70">
                <Filter size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Filtres</span>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    <XCircle size={12} />
                    Effacer
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[130px]">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-mayssa-brown/40" />
                  <input
                    type="text"
                    placeholder="Nom ou téléphone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-mayssa-brown/10 text-xs text-mayssa-brown bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel focus:border-transparent"
                  />
                </div>
                <div className="flex gap-1">
                  {(['today', '7d', '30d', 'month'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setDatePreset(p)}
                      className="px-2.5 py-2 rounded-lg text-[10px] font-bold bg-slate-100 text-mayssa-brown/70 hover:bg-mayssa-soft transition-colors cursor-pointer"
                    >
                      {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7 j' : p === '30d' ? '30 j' : 'Ce mois'}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-xl border border-mayssa-brown/10 px-2.5 py-2 text-xs font-medium text-mayssa-brown bg-white w-32"
                  title="Du"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-xl border border-mayssa-brown/10 px-2.5 py-2 text-xs font-medium text-mayssa-brown bg-white w-32"
                  title="Au"
                />
                <select
                  value={sourceFilter}
                  onChange={e => setSourceFilter(e.target.value as OrderSource | 'all')}
                  className="rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs font-bold text-mayssa-brown bg-white"
                >
                  <option value="all">Toutes sources</option>
                  <option value="site">Site</option>
                  <option value="snap">Snap</option>
                  <option value="instagram">Insta</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>

            {ordersToValidate.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-mayssa-brown/5 text-center">
                <ClipboardList size={48} className="mx-auto text-mayssa-brown/15 mb-4" />
                <p className="text-sm font-medium text-mayssa-brown/60">Aucune commande en attente</p>
                <p className="text-xs text-mayssa-brown/40 mt-1">{hasActiveFilters ? 'Essayez d\'effacer les filtres' : 'Les nouvelles commandes apparaîtront ici'}</p>
              </div>
            ) : (
              ordersToValidate.map(([id, order]) => {
                const orderSource = order.source ?? 'site'
                return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-2xl p-4 shadow-md border border-mayssa-brown/5 border-l-4 ${
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
                        <p className="text-[10px] text-mayssa-brown/50 flex items-center gap-1">
                          <Phone size={10} />
                          {order.customer.phone}
                        </p>
                      )}
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

                  {/* Adresse livraison + infos détaillées */}
                  {(order.customer?.address || order.clientNote || (order.deliveryMode === 'livraison' && order.distanceKm != null)) && (
                    <div className="mb-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                      {order.customer?.address && order.deliveryMode === 'livraison' && (
                        <p className="text-xs text-mayssa-brown flex items-start gap-1.5">
                          <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                          <span>{order.customer.address}</span>
                        </p>
                      )}
                      {order.distanceKm != null && order.deliveryMode === 'livraison' && (
                        <p className="text-[10px] text-mayssa-brown/70">
                          📍 {order.distanceKm.toFixed(1)} km depuis Annecy
                        </p>
                      )}
                      {order.clientNote && (
                        <p className="text-xs text-mayssa-brown flex items-start gap-1.5">
                          <MessageSquare size={12} className="flex-shrink-0 mt-0.5" />
                          <span className="italic">&quot;{order.clientNote}&quot;</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Admin note */}
                  {order.adminNote && (
                    <p className="text-[10px] text-mayssa-brown/60 italic mb-2 px-1">📝 Admin : {order.adminNote}</p>
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
                    {(order.deliveryFee ?? 0) > 0 && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-mayssa-brown/10">
                        <span className="text-mayssa-brown/70">Frais de livraison</span>
                        <span className="font-bold text-mayssa-brown">+{(order.deliveryFee ?? 0).toFixed(2).replace('.', ',')} €</span>
                      </div>
                    )}
                    <div className="border-t border-mayssa-brown/10 pt-1 mt-1 flex justify-between">
                      <span className="text-xs font-bold text-mayssa-brown">Total</span>
                      <span className="text-sm font-bold text-mayssa-caramel">
                        {(order.total ?? 0).toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setEditingOrderId(id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-brown/10 text-mayssa-brown text-xs font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                      Modifier
                    </button>
                    {order.status === 'en_attente' ? (
                      <>
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
                      </>
                    ) : (
                      <button
                        onClick={() => handleDeleteOrder(id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-mayssa-soft/50 text-mayssa-brown/40 text-[10px] font-bold hover:bg-red-50 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                        Supprimer
                      </button>
                    )}
                  </div>
                </motion.div>
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
          </motion.section>
        )}

        {/* ===== HISTORIQUE DES COMMANDES ===== */}
        {tab === 'historique' && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* KPI + Export */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-mayssa-brown/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">Résultats</span>
                <p className="text-lg font-display font-bold text-mayssa-brown">{sortedOrders.length} commande{sortedOrders.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => exportOrdersToCSV(sortedOrders)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md transition-all cursor-pointer"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>

            {/* Filtres premium avec statut */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-mayssa-brown/5 space-y-3">
              <div className="flex items-center gap-2 text-mayssa-brown/70">
                <Filter size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Filtres</span>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    <XCircle size={12} />
                    Effacer
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[130px]">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-mayssa-brown/40" />
                  <input
                    type="text"
                    placeholder="Nom ou téléphone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-mayssa-brown/10 text-xs text-mayssa-brown bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs font-bold text-mayssa-brown bg-white"
                >
                  <option value="all">Tous statuts</option>
                  <option value="en_attente">En attente</option>
                  <option value="en_preparation">En préparation</option>
                  <option value="pret">Prête</option>
                  <option value="livree">Livrée</option>
                  <option value="validee">Validées</option>
                  <option value="refusee">Refusées</option>
                </select>
                <div className="flex gap-1">
                  {(['today', '7d', '30d', 'month'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setDatePreset(p)}
                      className="px-2.5 py-2 rounded-lg text-[10px] font-bold bg-slate-100 text-mayssa-brown/70 hover:bg-mayssa-soft transition-colors cursor-pointer"
                    >
                      {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7 j' : p === '30d' ? '30 j' : 'Ce mois'}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-xl border border-mayssa-brown/10 px-2.5 py-2 text-xs font-medium text-mayssa-brown bg-white w-32"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-xl border border-mayssa-brown/10 px-2.5 py-2 text-xs font-medium text-mayssa-brown bg-white w-32"
                />
                <select
                  value={sourceFilter}
                  onChange={e => setSourceFilter(e.target.value as OrderSource | 'all')}
                  className="rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs font-bold text-mayssa-brown bg-white"
                >
                  <option value="all">Toutes sources</option>
                  <option value="site">Site</option>
                  <option value="snap">Snap</option>
                  <option value="instagram">Insta</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-mayssa-brown/5">
            {sortedOrders.length === 0 ? (
              <div className="py-12 text-center">
                <History size={40} className="mx-auto text-mayssa-brown/15 mb-3" />
                <p className="text-sm font-medium text-mayssa-brown/60">Aucune commande trouvée</p>
                <p className="text-xs text-mayssa-brown/40 mt-1">{hasActiveFilters ? 'Effacez les filtres ou élargissez la période' : 'Les commandes validées ou refusées apparaissent ici'}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {sortedOrders.map(([id, order]) => {
                  const orderSource = order.source ?? 'site'
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border text-left ${
                        order.status === 'validee'
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : order.status === 'refusee'
                            ? 'border-red-200 bg-red-50/30'
                            : 'border-amber-200 bg-amber-50/50'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-sm text-mayssa-brown">
                              {order.customer?.firstName} {order.customer?.lastName}
                            </p>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              orderSource === 'snap' ? 'bg-yellow-100 text-yellow-800' :
                              orderSource === 'instagram' ? 'bg-pink-100 text-pink-800' :
                              orderSource === 'whatsapp' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {orderSource === 'snap' ? 'Snap' : orderSource === 'instagram' ? 'Insta' : orderSource === 'whatsapp' ? 'WhatsApp' : 'Site'}
                            </span>
                          </div>
                          {order.customer?.phone && (
                            <p className="text-[10px] text-mayssa-brown/50 flex items-center gap-1">
                              <Phone size={10} />
                              {order.customer.phone}
                            </p>
                          )}
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
                        <div className="text-right flex-shrink-0">
                          <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-bold ${
                            order.status === 'en_attente'
                              ? 'bg-amber-50 text-amber-700'
                              : order.status === 'en_preparation'
                                ? 'bg-blue-50 text-blue-700'
                                : order.status === 'pret'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : order.status === 'livree' || order.status === 'validee'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : order.status === 'refusee'
                                      ? 'bg-red-50 text-red-600'
                                      : 'bg-slate-50 text-slate-600'
                          }`}>
                            {ORDER_STATUS_LABELS[order.status] ?? order.status}
                          </span>
                          <p className="text-[9px] text-mayssa-brown/40 mt-1">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>

                      {/* Adresse livraison + infos détaillées */}
                      {(order.customer?.address || order.clientNote || (order.deliveryMode === 'livraison' && order.distanceKm != null)) && (
                        <div className="mt-2 p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                          {order.customer?.address && order.deliveryMode === 'livraison' && (
                            <p className="text-xs text-mayssa-brown flex items-start gap-1.5">
                              <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                              <span>{order.customer.address}</span>
                            </p>
                          )}
                          {order.distanceKm != null && order.deliveryMode === 'livraison' && (
                            <p className="text-[10px] text-mayssa-brown/70">
                              📍 {order.distanceKm.toFixed(1)} km depuis Annecy
                            </p>
                          )}
                          {order.clientNote && (
                            <p className="text-xs text-mayssa-brown flex items-start gap-1.5">
                              <MessageSquare size={12} className="flex-shrink-0 mt-0.5" />
                              <span className="italic">&quot;{order.clientNote}&quot;</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Admin note */}
                      {order.adminNote && (
                        <p className="text-[10px] text-mayssa-brown/60 italic mt-2 px-1">📝 Admin : {order.adminNote}</p>
                      )}

                      {/* Items */}
                      <div className="bg-mayssa-soft/30 rounded-xl p-3 mt-2 space-y-1">
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
                        {(order.deliveryFee ?? 0) > 0 && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-mayssa-brown/10">
                            <span className="text-mayssa-brown/70">Frais de livraison</span>
                            <span className="font-bold text-mayssa-brown">+{(order.deliveryFee ?? 0).toFixed(2).replace('.', ',')} €</span>
                          </div>
                        )}
                        <div className="border-t border-mayssa-brown/10 pt-1 mt-1 flex justify-between">
                          <span className="text-xs font-bold text-mayssa-brown">Total</span>
                          <span className="text-sm font-bold text-mayssa-caramel">
                            {(order.total ?? 0).toFixed(2).replace('.', ',')} €
                          </span>
                        </div>
                      </div>

                      {/* Statut + Actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-mayssa-brown/10">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(id, e.target.value as OrderStatus)}
                          className="rounded-lg border border-mayssa-brown/10 px-2 py-1.5 text-[10px] font-bold text-mayssa-brown bg-white cursor-pointer"
                        >
                          <option value="en_attente">En attente</option>
                          <option value="en_preparation">En préparation</option>
                          <option value="pret">Prête</option>
                          <option value="livree">Livrée</option>
                          <option value="validee">Validée</option>
                          <option value="refusee">Refusée</option>
                        </select>
                        <button
                          onClick={() => setEditingOrderId(id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-brown/10 text-mayssa-brown text-xs font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                          Modifier
                        </button>
                        {order.status === 'validee' && (
                          <button
                            onClick={() => handleRefuseOrder(id, order)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <X size={14} />
                            Annuler
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-mayssa-soft/50 text-mayssa-brown/60 text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
            </div>
          </motion.section>
        )}

        {/* ===== CHIFFRE D'AFFAIRES ===== */}
        {tab === 'ca' && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/5 space-y-6"
          >
            <h3 className="font-bold text-mayssa-brown text-sm flex items-center gap-2">
              <TrendingUp size={18} />
              Suivi du chiffre d&apos;affaires
            </h3>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4">
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
              <div className="rounded-xl bg-mayssa-soft/80 border border-mayssa-brown/10 p-4 shadow-sm">
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
                <div className="py-10 text-center rounded-xl bg-mayssa-soft/20 border border-mayssa-brown/5">
                  <Package size={36} className="mx-auto text-mayssa-brown/20 mb-2" />
                  <p className="text-sm text-mayssa-brown/50">Aucune donnée</p>
                </div>
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
          </motion.section>
        )}

        {/* ===== STOCK ===== */}
        {tab === 'stock' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AdminStockTab allProducts={allProducts} stock={stock} />
          </motion.div>
        )}

        {/* ===== JOURS (horaires précommandes trompe-l'œil) ===== */}
        {tab === 'jours' && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/5 space-y-4"
          >
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
          </motion.section>
        )}

        {/* ===== ANNIVERSAIRES ===== */}
        {tab === 'anniversaires' && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-mayssa-brown text-sm">Anniversaires à venir (30 jours)</h3>
              <span className="text-[10px] text-mayssa-brown/50">{upcomingBirthdays.length} client{upcomingBirthdays.length > 1 ? 's' : ''}</span>
            </div>

            {upcomingBirthdays.length === 0 ? (
              <div className="py-12 text-center rounded-xl bg-mayssa-soft/20 border border-mayssa-brown/5">
                <Cake size={40} className="mx-auto text-mayssa-brown/15 mb-3" />
                <p className="text-sm font-medium text-mayssa-brown/60">Aucun anniversaire dans les 30 prochains jours</p>
              </div>
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
          </motion.section>
        )}

        {/* ===== INSCRITS ===== */}
        {tab === 'inscrits' && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-mayssa-brown text-sm flex items-center gap-2">
                <Users size={18} />
                Clients inscrits
              </h3>
              <span className="text-[10px] text-mayssa-brown/50">{Object.keys(allUsers).length} inscrit{Object.keys(allUsers).length !== 1 ? 's' : ''}</span>
            </div>

            {Object.keys(allUsers).length === 0 ? (
              <div className="py-12 text-center rounded-xl bg-mayssa-soft/20 border border-mayssa-brown/5">
                <Users size={40} className="mx-auto text-mayssa-brown/15 mb-3" />
                <p className="text-sm font-medium text-mayssa-brown/60">Aucun client inscrit pour le moment</p>
              </div>
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
                        <span className="text-[10px] font-semibold text-mayssa-caramel bg-mayssa-caramel/10 px-2 py-1 rounded-lg flex items-center gap-1" title="Points fidélité">
                          <Gift size={12} />
                          {u.loyalty?.points ?? 0} pts
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={async () => {
                              const raw = window.prompt(`Points à ajouter pour ${u.firstName} ${u.lastName} ?`)
                              const pts = parseInt(raw ?? '', 10)
                              if (Number.isNaN(pts) || pts <= 0) return
                              try {
                                await adminAddPoints(uid, pts)
                              } catch (err) {
                                console.error('Erreur ajout points:', err)
                              }
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            aria-label="Ajouter des points"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const raw = window.prompt(`Points à retirer pour ${u.firstName} ${u.lastName} ? (max ${u.loyalty?.points ?? 0})`)
                              const pts = parseInt(raw ?? '', 10)
                              if (Number.isNaN(pts) || pts <= 0) return
                              try {
                                await adminRemovePoints(uid, pts)
                              } catch (err) {
                                console.error('Erreur retrait points:', err)
                              }
                            }}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            aria-label="Retirer des points"
                          >
                            <Minus size={14} />
                          </button>
                        </div>
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
          </motion.section>
        )}

        {/* ===== PRODUITS ===== */}
        {tab === 'produits' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AdminProductsTab allProducts={allProducts} overrides={productOverrides} />
          </motion.div>
        )}

        {/* Edit order modal (toujours affiché si on édite, quel que soit l'onglet) */}
        {editingOrderId && orders[editingOrderId] && (
          <AdminEditOrderModal
            orderId={editingOrderId}
            order={orders[editingOrderId]}
            stock={stock}
            onClose={() => setEditingOrderId(null)}
            onSaved={() => setEditingOrderId(null)}
          />
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
