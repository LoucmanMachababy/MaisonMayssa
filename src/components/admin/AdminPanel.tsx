import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { jsPDF } from 'jspdf'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LogOut, Package, Plus, Minus, Calendar, Clock, RefreshCw, ClipboardList, Check, X, Trash2, AlertTriangle, Cake, Gift, ShoppingBag, Truck, MapPin, Users, Phone, History, TrendingUp, Pencil, Search, Download, Bell, MessageSquare, MessageCircle, Filter, XCircle, Star, Tag, FileText, LayoutDashboard, Copy } from 'lucide-react'
import type { OrderStatus } from '../../lib/firebase'
import {
  adminLogin, adminLogout, onAuthChange,
  listenStock, updateStock, listenSettings, updateSettings,
  listenOrders, updateOrderStatus, deleteOrder,
  listenAllUsers, claimBirthdayGift, listenProductOverrides, deleteUserProfile,
  adminAddPoints, adminRemovePoints,
  listenReviews,
  listenPromoCodes,
  listenNotifyWhenAvailable,
  isPreorderOpenNow, isTrompeLoeilProductId, getStockDecrementItems,
  releaseDeliverySlot,
  type StockMap, type Settings, type Order, type OrderSource, type UserProfile, type PreorderOpening, type Review, type PromoCodeRecord, type Poll, type NotifyWhenAvailableEntry,
  listenPolls
} from '../../lib/firebase'
import type { ProductOverrideMap } from '../../types'
import { parseDateYyyyMmDd, formatOrderItemName } from '../../lib/utils'
import { hapticFeedback } from '../../lib/haptics'
import { exportSingleOrderPDF } from '../../lib/orderPrint'
import type { User } from 'firebase/auth'
import { useProducts } from '../../hooks/useProducts'
import { AdminProductsTab } from './AdminProductsTab'
import { AdminStockTab } from './AdminStockTab'
import { AdminLivraisonTab } from './AdminLivraisonTab'
import { AdminPromosTab } from './AdminPromosTab'
import { AdminCreneauxTab } from './AdminCreneauxTab'
import { AdminPollsTab } from './AdminPollsTab'
import { AdminRappelsTab } from './AdminRappelsTab'
import { AdminSessionsTab } from './AdminSessionsTab'
import { AdminSubscribersTab } from './AdminSubscribersTab'
import { AdminCommunityTab } from './AdminCommunityTab'
import { AdminOffSiteOrderForm } from './AdminOffSiteOrderForm'
import { PRODUCTS } from '../../constants'
import { AdminEditOrderModal } from './AdminEditOrderModal'

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/** Numéro au format wa.me (33...) pour lien WhatsApp */
function phoneToWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('33') && digits.length >= 11) return digits
  if (digits.startsWith('0') && digits.length >= 10) return '33' + digits.slice(1)
  if (digits.length >= 9) return '33' + digits
  return digits
}

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

// Export CSV pour Excel (séparateur ;, BOM UTF-8). filenameSuffix optionnel (ex. a_faire_2026-02-18).
function exportOrdersToCSV(entries: [string, Order][], filenameSuffix?: string): void {
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
    const status = ORDER_STATUS_LABELS[o.status] ?? o.status
    const mode = o.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'
    const adresse = (o.customer?.address ?? '').replace(/"/g, '""')
    const distanceKm = o.distanceKm != null ? o.distanceKm.toFixed(1) : ''
    const retrait = o.requestedDate
      ? parseDateYyyyMmDd(o.requestedDate).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short' }) + (o.requestedTime ? ` ${o.requestedTime}` : '')
      : ''
    const clientNote = (o.clientNote ?? '').replace(/"/g, '""')
    const items = (o.items ?? []).map((i) => `${i.quantity}× ${formatOrderItemName(i)}`).join(' | ')
    const deliveryFee = (o.deliveryFee ?? 0) > 0 ? (o.deliveryFee ?? 0).toFixed(2).replace('.', ',') : ''
    const total = (o.total ?? 0).toFixed(2).replace('.', ',')
    return [dateStr, timeStr, client, phone, source, status, mode, `"${adresse}"`, distanceKm, retrait, `"${clientNote}"`, `"${items.replace(/"/g, '""')}"`, deliveryFee, total].join(SEP)
  })
  const csv = BOM + header + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `commandes-maison-mayssa-${filenameSuffix ?? new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

// Export PDF lisible des commandes filtrées. filenameSuffix optionnel (ex. a_faire_2026-02-18).
function exportOrdersToPDF(entries: [string, Order][], filenameSuffix?: string): void {
  if (entries.length === 0) return

  const doc = new jsPDF({ format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const maxWidth = pageWidth - margin * 2
  let y = 20

  // Titre
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Commandes Maison Mayssa', margin, y)
  y += 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Vue filtrée depuis l’onglet Historique', margin, y)
  y += 15

  entries.forEach(([id, o]) => {
    if (y > 260) {
      doc.addPage()
      y = 20
    }

    const cardY = y
    let lineY = y + 8

    const orderRef = o.orderNumber != null ? `#${o.orderNumber}` : `#${id.slice(-8)}`
    const createdAtDate = o.createdAt ? new Date(o.createdAt) : null
    const dateStr = createdAtDate
      ? createdAtDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : ''
    const timeStr = createdAtDate
      ? createdAtDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : ''

    const client = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ') || 'Client'
    const phone = o.customer?.phone ?? ''
    const statusLabel = ORDER_STATUS_LABELS[o.status ?? ''] ?? (o.status ?? '')
    const modeLabel = o.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Commande ' + orderRef, margin + 3, lineY)
    if (dateStr || timeStr) {
      doc.text(`${dateStr} ${timeStr}`, pageWidth - margin - 40, lineY)
    }
    lineY += 6

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(client, margin + 3, lineY)
    lineY += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    if (phone) {
      doc.text('Tel: ' + phone, margin + 3, lineY)
      lineY += 5
    }
    doc.text(`Statut: ${statusLabel} · Mode: ${modeLabel}`, margin + 3, lineY)
    lineY += 6

    if (o.customer?.address) {
      const addrLines = doc.splitTextToSize(o.customer.address, maxWidth - 6)
      doc.text(addrLines, margin + 3, lineY)
      lineY += addrLines.length * 4.5 + 2
    }

    const itemsStr = (o.items ?? []).map(i => `${i.quantity}x ${formatOrderItemName(i)}`).join(', ')
    if (itemsStr) {
      const itemsLines = doc.splitTextToSize('Articles: ' + itemsStr, maxWidth - 6)
      doc.text(itemsLines, margin + 3, lineY)
      lineY += itemsLines.length * 4.5 + 2
    }

    if (o.clientNote) {
      const noteLines = doc.splitTextToSize('Note client: ' + o.clientNote, maxWidth - 6)
      doc.text(noteLines, margin + 3, lineY)
      lineY += noteLines.length * 4.5 + 2
    }

    doc.setFont('helvetica', 'bold')
    doc.text('Total: ' + (o.total ?? 0).toFixed(2) + ' €', margin + 3, lineY)

    const cardHeight = Math.max(45, lineY - cardY + 8)
    doc.setDrawColor(91, 58, 41)
    doc.setLineWidth(0.3)
    doc.rect(margin, cardY, maxWidth, cardHeight)
    y = cardY + cardHeight + 8
  })

  const suffix = filenameSuffix ?? new Date().toISOString().slice(0, 10)
  doc.save(`commandes-maison-mayssa-${suffix}.pdf`)
}

function exportReviewsToCSV(reviewsMap: Record<string, Review>): void {
  const SEP = ';'
  const BOM = '\uFEFF'
  const header = ['Date', 'Note (1-5)', 'Commentaire', 'Auteur', 'Produits notés', 'Id commande'].join(SEP)
  const rows = Object.entries(reviewsMap)
    .map(([, r]) => {
      const date = r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : ''
      const comment = (r.comment ?? '').replace(/"/g, '""')
      const author = (r.authorName ?? '').replace(/"/g, '""')
      const products = r.productRatings
        ? Object.entries(r.productRatings).map(([pid, note]) => `${pid}: ${note}`).join(' | ')
        : ''
      const orderId = r.orderId ?? ''
      return [date, r.rating, `"${comment}"`, `"${author}"`, `"${products.replace(/"/g, '""')}"`, orderId].join(SEP)
    })
  const csv = BOM + header + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `avis-maison-mayssa-${new Date().toISOString().slice(0, 10)}.csv`
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
  const [reviews, setReviews] = useState<Record<string, Review>>({})
  const [tab, setTab] = useState<'resume' | 'commandes' | 'historique' | 'livraison' | 'retrait' | 'ca' | 'avis' | 'stock' | 'jours' | 'creneaux' | 'anniversaires' | 'inscrits' | 'produits' | 'promos' | 'sondage' | 'rappels' | 'abonnes' | 'alertes' | 'carte' | 'sessions' | 'production' | 'planning'>('resume')
  const [caPeriod, setCaPeriod] = useState<'jour' | 'semaine' | 'mois'>('semaine')
  const [allUsers, setAllUsers] = useState<Record<string, UserProfile>>({})
  const [productOverrides, setProductOverrides] = useState<ProductOverrideMap>({})
  const [promoCodes, setPromoCodes] = useState<Record<string, PromoCodeRecord>>({})
  const [polls, setPolls] = useState<Record<string, Poll>>({})
  const [notifyWhenAvailableEntries, setNotifyWhenAvailableEntries] = useState<Record<string, NotifyWhenAvailableEntry>>({})
  const { allProducts } = useProducts()
  const [showOffSiteForm, setShowOffSiteForm] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<OrderSource | 'all'>('all')
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'livraison' | 'retrait'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_attente' | 'en_preparation' | 'pret' | 'livree' | 'validee' | 'refusee'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  /** Vue Historique : À faire | À traiter (en attente / en prépa) | Passées / Livrées | Toutes */
  const [historiqueVue, setHistoriqueVue] = useState<'a_faire' | 'a_traiter' | 'pret' | 'livree' | 'validee' | 'refusee' | 'toutes'>('a_faire')
  /** En vue À faire : filtrer uniquement les commandes dont la date de retrait = aujourd'hui */
  const [aFaireAujourdhuiOnly, setAFaireAujourdhuiOnly] = useState(false)
  /** Ids des commandes sélectionnées (À valider) pour actions groupées */
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set())
  /** Ids des commandes sélectionnées (Historique) pour changement de statut en masse */
  const [selectedHistoriqueIds, setSelectedHistoriqueIds] = useState<Set<string>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)
  /** Date cible pour "À préparer" (vide = demain). Permet de préparer à l'avance. */
  const [prepTargetDate, setPrepTargetDate] = useState<string>('')
  /** Ids des commandes en cours de mise à jour (spinner). */
  const [preparingOrderIds, setPreparingOrderIds] = useState<Set<string>>(new Set())
  /** Filtre trompe l'oeil actif en vue "À traiter" (nom du parfum, null = tous) */
  const [trompeLoeilFilter, setTrompeLoeilFilter] = useState<string | null>(null)
  /** Filtre produit actif en vue "À valider" (productId, '' = tous) */
  const [pendingProductFilter, setPendingProductFilter] = useState<string>('')
  /** Dates sélectionnées pour l'onglet Production (Set vide = aujourd'hui par défaut) */
  const [productionDates, setProductionDates] = useState<Set<string>>(new Set([]))

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
    setDeliveryFilter('all')
    setStatusFilter('all')
    setHistoriqueVue('a_faire')
    setAFaireAujourdhuiOnly(false)
    setTrompeLoeilFilter(null)
    setPendingProductFilter('')
  }
  const hasActiveFilters = searchQuery.trim() || dateFrom || dateTo || sourceFilter !== 'all' || deliveryFilter !== 'all' || statusFilter !== 'all' || !['a_faire', 'toutes'].includes(historiqueVue) || !!pendingProductFilter
  const previousPendingIdsRef = useRef<Set<string>>(new Set())
  const isInitialLoadRef = useRef(true)
  useEffect(() => {
    const unsub1 = listenStock(setStock)
    const unsub2 = listenSettings(setSettings)
    const unsub3 = listenOrders(setOrders)
    const unsub4 = listenAllUsers(setAllUsers)
    const unsub5 = listenProductOverrides(setProductOverrides)
    const unsub6 = listenReviews(setReviews)
    const unsub7 = listenPromoCodes(setPromoCodes)
    const unsub8 = listenPolls(setPolls)
    const unsub9 = listenNotifyWhenAvailable(setNotifyWhenAvailableEntries)
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsub8(); unsub9() }
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
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
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
    // Accepter = lancer la préparation directement
    await updateOrderStatus(orderId, 'en_preparation')
  }

  const handleRefuseOrder = async (orderId: string, order: Order) => {
    await updateOrderStatus(orderId, 'refusee')
    if (order.deliveryMode === 'livraison' && order.requestedDate && order.requestedTime) {
      releaseDeliverySlot(order.requestedDate, order.requestedTime).catch(console.error)
    }
    // Restaurer le stock de tous les produits décrémentés à la commande.
    // Pour les trompe-l'œil : skip si excludeTrompeLoeilStock=true (hors-site sans déduction)
    for (const item of order.items) {
      const pairs = getStockDecrementItems(item.productId ?? '', item.quantity ?? 1, PRODUCTS)
      for (const pair of pairs) {
        const isTrompe = isTrompeLoeilProductId(pair.productId)
        if (isTrompe && order.excludeTrompeLoeilStock === true) continue
        if (pair.productId in stock) {
          const currentQty = stock[pair.productId] ?? 0
          await updateStock(pair.productId, currentQty + pair.quantity)
        }
      }
    }
  }

  const handleSetOrderPreparationStatus = async (orderId: string, status: 'en_preparation' | 'pret') => {
    setPreparingOrderIds((prev) => new Set(prev).add(orderId))
    try {
      await updateOrderStatus(orderId, status)
    } finally {
      setPreparingOrderIds((prev) => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  const handleBulkStartPreparation = async () => {
    const toStart = ordersPourPrepDate.filter(([, o]) => o.status === 'en_attente').map(([id]) => id)
    if (toStart.length === 0) return
    for (const id of toStart) {
      setPreparingOrderIds((prev) => new Set(prev).add(id))
    }
    try {
      for (const id of toStart) {
        await updateOrderStatus(id, 'en_preparation')
      }
    } finally {
      setPreparingOrderIds((prev) => {
        const next = new Set(prev)
        toStart.forEach((id) => next.delete(id))
        return next
      })
    }
  }

  const handleFinishOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'livree')
  }

  const handleDeleteOrder = async (orderId: string, order?: Order) => {
    if (!window.confirm("T'es sûr ? Cette commande sera définitivement supprimée.")) return
    const o = order ?? orders[orderId]
    if (o && o.deliveryMode === 'livraison' && o.requestedDate && o.requestedTime) {
      releaseDeliverySlot(o.requestedDate, o.requestedTime).catch(console.error)
    }
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

  // Aujourd'hui et demain en YYYY-MM-DD (date de retrait/livraison)
  const todayRetraitStr = useMemo(() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }, [])
  const tomorrowRetraitStr = useMemo(() => {
    const t = new Date()
    t.setDate(t.getDate() + 1)
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }, [])

  // Commandes à valider (toutes en_attente, toutes sources)
  const ordersToValidate = Object.entries(orders)
    .filter(([, o]) => o.status === 'en_attente' && (sourceFilter === 'all' || (o.source ?? 'site') === sourceFilter) && (deliveryFilter === 'all' || o.deliveryMode === deliveryFilter))
    .filter(([, o]) => matchesSearch(o) && matchesDateRange(o))
    .filter(([, o]) => !pendingProductFilter || o.items?.some(i => i.productId === pendingProductFilter))
  const pendingCount = Object.entries(orders).filter(([, o]) => o.status === 'en_attente').length

  // Produits distincts présents dans les commandes en_attente (pour le filtre par produit)
  const allProductsInPendingOrders = useMemo(() => {
    const map = new Map<string, string>()
    for (const [, o] of Object.entries(orders)) {
      if (o.status !== 'en_attente') continue
      for (const item of o.items ?? []) {
        if (item.productId && !map.has(item.productId)) {
          map.set(item.productId, formatOrderItemName(item))
        }
      }
    }
    return Array.from(map.entries()).sort(([, a], [, b]) => a.localeCompare(b, 'fr'))
  }, [orders])

  // Historique : vue "À faire" (retrait >= aujourd'hui, à préparer) | "Passées" (déjà livrées/refusées ou date passée) | "Toutes"
  const sortedOrders = useMemo(() => {
    const entries = Object.entries(orders).filter(
      ([, o]) =>
        (sourceFilter === 'all' || (o.source ?? 'site') === sourceFilter) &&
        (deliveryFilter === 'all' || o.deliveryMode === deliveryFilter)
    )
    const filteredBySearch = entries.filter(([, o]) => matchesSearch(o))

    if (historiqueVue === 'a_faire') {
      const aFaire = filteredBySearch.filter(([, o]) => {
        // "À faire" = commandes en attente d'acceptation
        if (o.status !== 'en_attente') return false
        if (!o.requestedDate) return true
        return o.requestedDate >= todayRetraitStr
      })
      return aFaire.sort(([, a], [, b]) => {
        const dateA = a.requestedDate ?? '9999-12-31'
        const dateB = b.requestedDate ?? '9999-12-31'
        if (dateA !== dateB) return dateA.localeCompare(dateB)
        const timeA = a.requestedTime ?? '00:00'
        const timeB = b.requestedTime ?? '00:00'
        if (timeA !== timeB) return timeA.localeCompare(timeB)
        return (b.createdAt || 0) - (a.createdAt || 0)
      })
    }

    if (historiqueVue === 'a_traiter') {
      // "À traiter" = commandes en préparation + commandes validées (ex. hors site) à préparer pour aujourd'hui ou plus tard
      const aTraiter = filteredBySearch.filter(([, o]) => {
        if (o.status === 'en_preparation') return true
        if (o.status === 'validee') {
          if (!o.requestedDate) return true
          return o.requestedDate >= todayRetraitStr
        }
        return false
      })
      return aTraiter.sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0))
    }

    if (historiqueVue === 'pret') {
      return filteredBySearch
        .filter(([, o]) => o.status === 'pret')
        .sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0))
    }

    if (historiqueVue === 'livree') {
      return filteredBySearch
        .filter(([, o]) => o.status === 'livree')
        .sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0))
    }

    if (historiqueVue === 'validee') {
      return filteredBySearch
        .filter(([, o]) => o.status === 'validee')
        .sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0))
    }

    if (historiqueVue === 'refusee') {
      return filteredBySearch
        .filter(([, o]) => o.status === 'refusee')
        .sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0))
    }

    // Toutes : filtres manuels (date = date de création, statut, etc.)
    return filteredBySearch
      .filter(([, o]) => matchesStatus(o) && matchesDateRange(o))
      .sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0))
  }, [orders, sourceFilter, statusFilter, searchQuery, dateFrom, dateTo, historiqueVue, todayRetraitStr])

  // En vue À faire : commandes dont la date de retrait = aujourd'hui (count + filtre optionnel)
  const aFaireAujourdhuiCount = useMemo(() => {
    if (historiqueVue !== 'a_faire') return 0
    return sortedOrders.filter(([, o]) => o.requestedDate === todayRetraitStr).length
  }, [sortedOrders, historiqueVue, todayRetraitStr])
  const displayedOrders = useMemo(() => {
    let result = sortedOrders
    if (historiqueVue === 'a_faire' && aFaireAujourdhuiOnly) {
      result = result.filter(([, o]) => o.requestedDate === todayRetraitStr)
    }
    if (historiqueVue === 'a_traiter' && trompeLoeilFilter) {
      result = result.filter(([, o]) =>
        o.items?.some((item) => {
          const pairs = getStockDecrementItems(item.productId ?? '', item.quantity ?? 1, PRODUCTS)
          return pairs.some((pair) => {
            if (!isTrompeLoeilProductId(pair.productId)) return false
            const component = PRODUCTS.find(p => p.id === pair.productId)
            return (component?.name ?? pair.productId) === trompeLoeilFilter
          })
        })
      )
    }
    return result
  }, [sortedOrders, historiqueVue, aFaireAujourdhuiOnly, todayRetraitStr, trompeLoeilFilter])

  // Récap trompes l'œil à préparer (vue Historique > À traiter : en préparation + validées ex. hors site)
  const trompeLoeilSummary = useMemo(() => {
    if (historiqueVue !== 'a_traiter') return [] as { name: string; quantity: number }[]

    const map = new Map<string, number>()

    for (const [, order] of sortedOrders) {
      if (order.status !== 'en_preparation' && order.status !== 'validee') continue
      if (order.status === 'validee' && order.requestedDate && order.requestedDate < todayRetraitStr) continue

      for (const item of order.items ?? []) {
        const pairs = getStockDecrementItems(item.productId ?? '', item.quantity ?? 1, PRODUCTS)
        for (const pair of pairs) {
          if (!isTrompeLoeilProductId(pair.productId)) continue
          const component = PRODUCTS.find(p => p.id === pair.productId)
          const label = component?.name ?? pair.productId
          map.set(label, (map.get(label) ?? 0) + pair.quantity)
        }
      }
    }

    return Array.from(map.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [sortedOrders, historiqueVue, todayRetraitStr])

  // CA total des commandes affichées dans À traiter
  const caATraiter = useMemo(() => {
    if (historiqueVue !== 'a_traiter') return 0
    return displayedOrders.reduce((sum, [, o]) => sum + (o.total ?? 0), 0)
  }, [historiqueVue, displayedOrders])

  // Date effective pour "À préparer" (vide = demain)
  const prepDateEffective = prepTargetDate || tomorrowRetraitStr
  // Commandes à préparer pour la date choisie (demain ou autre), tri par créneau puis date création
  const ordersPourPrepDate = useMemo(() => {
    return Object.entries(orders)
      .filter(([, o]) => o.requestedDate === prepDateEffective && o.status !== 'refusee' && o.status !== 'livree')
      .sort(([, a], [, b]) => {
        const timeA = a.requestedTime ?? '00:00'
        const timeB = b.requestedTime ?? '00:00'
        if (timeA !== timeB) return timeA.localeCompare(timeB)
        return (a.createdAt ?? 0) - (b.createdAt ?? 0)
      })
  }, [orders, prepDateEffective])

  // (Auto-transition supprimée : c'est désormais le bouton "Mettre en prépa" dans "À valider" qui lance la préparation)

  // Stats CA : commandes validées ou livrées
  const validatedOrders = Object.values(orders).filter((o) => o.status === 'validee')
  const caOrders = Object.values(orders).filter((o) => o.status === 'validee' || o.status === 'livree')
  const caTotal = caOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const caSemaine = caOrders
    .filter((o) => o.createdAt && o.createdAt >= startOfWeek.getTime())
    .reduce((s, o) => s + (o.total ?? 0), 0)
  const caMois = caOrders
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
        const total = caOrders
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
        const total = caOrders
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
        const total = caOrders
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
  }, [caOrders, caPeriod])

  // Produits les plus vendus (commandes validées + livrées)
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; ca: number }> = {}
    for (const order of caOrders) {
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
  }, [caOrders])

  // Commandes cette semaine (toutes commandes, pour activité)
  const commandesCetteSemaine = useMemo(() => {
    const n = new Date()
    const start = new Date(n)
    start.setDate(n.getDate() - n.getDay())
    start.setHours(0, 0, 0, 0)
    return Object.values(orders).filter((o) => o.createdAt != null && o.createdAt >= start.getTime()).length
  }, [orders])

  // Top 3 produits du mois (commandes validées, ce mois-ci)
  const top3Mois = useMemo(() => {
    const n = new Date()
    const start = new Date(n.getFullYear(), n.getMonth(), 1).getTime()
    const end = new Date(n.getFullYear(), n.getMonth() + 1, 0, 23, 59, 59, 999).getTime()
    const ordersMois = validatedOrders.filter((o) => o.createdAt != null && o.createdAt >= start && o.createdAt <= end)
    const counts: Record<string, { name: string; qty: number }> = {}
    for (const order of ordersMois) {
      for (const item of order.items ?? []) {
        const key = item.name || item.productId || 'Inconnu'
        if (!counts[key]) counts[key] = { name: key.length > 20 ? key.slice(0, 17) + '…' : key, qty: 0 }
        counts[key].qty += item.quantity
      }
    }
    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3)
  }, [validatedOrders])

  // Commandes par jour (14 derniers jours, toutes commandes)
  const ordersPerDayData = useMemo(() => {
    const now = new Date()
    const data: { label: string; count: number; date: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)
      const count = Object.values(orders).filter(
        (o) => o.createdAt && o.createdAt >= d.getTime() && o.createdAt <= end.getTime()
      ).length
      data.push({
        label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
        count,
        date: d.getTime(),
      })
    }
    return data
  }, [orders])

  // CA par catégorie de produit
  const caByCategory = useMemo(() => {
    const map: Record<string, { ca: number; qty: number }> = {}
    for (const order of caOrders) {
      for (const item of order.items ?? []) {
        const id = item.productId ?? ''
        const cat = id.startsWith('brownie-') ? 'Brownies'
          : id.startsWith('cookie-') ? 'Cookies'
          : id.startsWith('layer-') ? 'Layer Cups'
          : id.startsWith('trompe-loeil-') || id === 'box-trompe-loeil' ? "Trompe l'œil"
          : id.startsWith('tiramisu-') ? 'Tiramisus'
          : id.includes('box') || id.includes('mini') ? 'Boxes'
          : 'Autres'
        if (!map[cat]) map[cat] = { ca: 0, qty: 0 }
        map[cat].ca += item.price * item.quantity
        map[cat].qty += item.quantity
      }
    }
    return Object.entries(map)
      .map(([name, { ca, qty }]) => ({ name, ca: Math.round(ca * 100) / 100, qty }))
      .sort((a, b) => b.ca - a.ca)
  }, [caOrders])

  // Taux de conversion et stats livraison/retrait
  const conversionStats = useMemo(() => {
    const all = Object.values(orders)
    const total = all.length
    const validees = all.filter(o => o.status === 'validee' || o.status === 'livree').length
    const refusees = all.filter(o => o.status === 'refusee').length
    const livraison = caOrders.filter(o => o.deliveryMode === 'livraison')
    const retrait = caOrders.filter(o => o.deliveryMode === 'retrait')
    const caLivraison = livraison.reduce((s, o) => s + (o.total ?? 0), 0)
    const caRetrait = retrait.reduce((s, o) => s + (o.total ?? 0), 0)
    return {
      tauxValidation: total > 0 ? Math.round((validees / total) * 100) : 0,
      tauxRefus: total > 0 ? Math.round((refusees / total) * 100) : 0,
      nbLivraison: livraison.length, caLivraison,
      nbRetrait: retrait.length, caRetrait,
    }
  }, [orders, caOrders])

  // Croissance mois vs mois précédent
  const croissanceMois = useMemo(() => {
    const n = new Date()
    const debutMoisPrec = new Date(n.getFullYear(), n.getMonth() - 1, 1).getTime()
    const finMoisPrec = new Date(n.getFullYear(), n.getMonth(), 0, 23, 59, 59, 999).getTime()
    const caMoisPrec = caOrders
      .filter(o => o.createdAt && o.createdAt >= debutMoisPrec && o.createdAt <= finMoisPrec)
      .reduce((s, o) => s + (o.total ?? 0), 0)
    if (caMoisPrec === 0) return null
    return Math.round(((caMois - caMoisPrec) / caMoisPrec) * 100)
  }, [caOrders, caMois])

  // Meilleure journée de tous les temps
  const meilleurJour = useMemo(() => {
    const byDay: Record<string, number> = {}
    for (const o of caOrders) {
      if (!o.createdAt) continue
      const key = new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      byDay[key] = (byDay[key] ?? 0) + (o.total ?? 0)
    }
    const entries = Object.entries(byDay)
    if (entries.length === 0) return null
    const best = entries.reduce((a, b) => b[1] > a[1] ? b : a)
    return { label: best[0], ca: Math.round(best[1] * 100) / 100 }
  }, [caOrders])

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
                if (soundEnabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
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

      {/* Tabs groupés */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 bg-white/80 backdrop-blur rounded-2xl p-2 shadow-md border border-mayssa-brown/5 overflow-x-auto">
          {[
            { label: null, tabs: [{ id: 'resume', icon: LayoutDashboard, label: 'Résumé' }] },
            {
              label: 'Commandes',
              tabs: [
                { id: 'commandes', icon: ClipboardList, label: 'À valider', badge: pendingCount },
                { id: 'historique', icon: History, label: 'Historique' },
                { id: 'production', icon: FileText, label: 'Production' },
                { id: 'planning', icon: LayoutDashboard, label: 'Planning' },
                { id: 'livraison', icon: Truck, label: 'Livraison', badge: Object.values(orders).filter(o => o.deliveryMode === 'livraison' && o.status !== 'refusee').length },
                { id: 'retrait', icon: MapPin, label: 'Retrait', badge: Object.values(orders).filter(o => o.deliveryMode === 'retrait' && o.status !== 'refusee').length },
              ],
            },
            {
              label: 'Vente',
              tabs: [
                { id: 'ca', icon: TrendingUp, label: 'CA' },
                { id: 'stock', icon: Package, label: 'Stock' },
                { id: 'produits', icon: ShoppingBag, label: 'Produits' },
                { id: 'promos', icon: Tag, label: 'Codes promo' },
              ],
            },
            {
              label: 'Communauté',
              tabs: [
                { id: 'avis', icon: Star, label: 'Avis', badge: Object.keys(reviews).length },
                { id: 'inscrits', icon: Users, label: 'Inscrits', badge: Object.keys(allUsers).length },
                { id: 'anniversaires', icon: Cake, label: 'Anniv.', badge: upcomingBirthdays.filter(b => !b.claimed).length },
                { id: 'alertes', icon: Bell, label: 'Alertes', badge: Object.keys(notifyWhenAvailableEntries).length },
                { id: 'abonnes', icon: Package, label: 'Abonnés' },
              ],
            },
            {
              label: 'Réglages',
              tabs: [
                { id: 'jours', icon: Calendar, label: 'Jours' },
                { id: 'creneaux', icon: Clock, label: 'Créneaux' },
                { id: 'rappels', icon: Bell, label: 'Rappels' },
              ],
            },
          ].map((group, gi) => (
            <div key={gi} className="flex items-center gap-1.5 flex-shrink-0">
              {group.label && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-mayssa-brown/40 hidden sm:inline">
                  {group.label}
                </span>
              )}
              {group.tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as typeof tab)}
                  className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tab === t.id ? 'bg-mayssa-brown text-white shadow-md' : 'text-mayssa-brown/60 hover:bg-mayssa-soft/80'
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                  {'badge' in t && (t.badge ?? 0) > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {Number(t.badge)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-8">
        {/* Status banner */}
        <div className={`rounded-2xl p-4 text-center shadow-sm ${
          settings.ordersOpen === false ? 'bg-red-50 border border-red-200' : isPreorderDay ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          <p className={`text-sm font-bold ${
            settings.ordersOpen === false ? 'text-red-800' : isPreorderDay ? 'text-emerald-800' : 'text-amber-800'
          }`}>
            {settings.ordersOpen === false
              ? 'Commandes fermées — les clients ne peuvent pas envoyer de commande'
              : isPreorderDay
                ? 'Précommandes ouvertes aujourd\'hui'
                : (() => {
                    const next = openings.find(o => o.day > today) ?? openings[0]
                    const label = next ? `${DAY_LABELS[next.day]}${next.fromTime && next.fromTime !== '00:00' ? ` ${next.fromTime}` : ''}` : 'bientôt'
                    return `Fermé — prochaine ouverture : ${label}`
                  })()
            }
          </p>
        </div>

        {/* ===== TABLEAU DE BORD RÉSUMÉ ===== */}
        {tab === 'resume' && (() => {
          const now = new Date()
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
          const endOfToday = startOfToday + 86400000 - 1
          const caJour = validatedOrders.filter(o => o.createdAt != null && o.createdAt >= startOfToday && o.createdAt <= endOfToday).reduce((s, o) => s + (o.total ?? 0), 0)
          const livraisonsAujourdhui = Object.values(orders).filter(o => o.deliveryMode === 'livraison' && o.requestedDate === todayStr && o.status !== 'refusee').length
          const retraitsAujourdhui = Object.values(orders).filter(o => o.deliveryMode === 'retrait' && o.requestedDate === todayStr && o.status !== 'refusee').length
          const annivNonSouhaites = upcomingBirthdays.filter(b => !b.claimed).length
          return (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Ouvrir / Fermer les commandes */}
              <div className={`rounded-2xl p-4 border-2 ${settings.ordersOpen === false ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-mayssa-brown">
                      {settings.ordersOpen === false ? 'Commandes fermées' : 'Commandes ouvertes'}
                    </p>
                    <p className="text-[10px] text-mayssa-brown/60 mt-0.5">
                      {settings.ordersOpen === false ? 'Les clients ne peuvent pas envoyer de commande.' : 'Les clients peuvent commander.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSettings({ ordersOpen: !(settings.ordersOpen !== false) })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                      settings.ordersOpen === false ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    {settings.ordersOpen === false ? 'Ouvrir les commandes' : 'Fermer les commandes'}
                  </button>
                </div>
              </div>

              {/* KPIs cliquables */}
              {(() => {
                const preparationCount = Object.values(orders).filter(o => o.status === 'en_preparation').length
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setTab('commandes')}
                      className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5 text-left hover:ring-2 hover:ring-amber-400 transition-all cursor-pointer"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">À valider</span>
                      <p className={`text-xl font-display font-bold mt-0.5 ${pendingCount > 0 ? 'text-amber-600' : 'text-mayssa-brown'}`}>{pendingCount}</p>
                      <p className="text-[10px] text-mayssa-caramel mt-1">Voir →</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTab('historique'); setHistoriqueVue('a_traiter') }}
                      className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5 text-left hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">En préparation</span>
                      <p className={`text-xl font-display font-bold mt-0.5 ${preparationCount > 0 ? 'text-blue-600' : 'text-mayssa-brown'}`}>{preparationCount}</p>
                      <p className="text-[10px] text-blue-500 mt-1">Voir →</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('ca')}
                      className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5 text-left hover:ring-2 hover:ring-mayssa-caramel transition-all cursor-pointer"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">CA aujourd'hui</span>
                      <p className="text-xl font-display font-bold text-mayssa-caramel mt-0.5">{caJour.toFixed(2).replace('.', ',')} €</p>
                      <p className="text-[10px] text-mayssa-brown/50 mt-1">Semaine : {caSemaine.toFixed(2).replace('.', ',')} €</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('ca')}
                      className="bg-gradient-to-br from-mayssa-caramel/10 to-mayssa-soft rounded-xl p-4 shadow-sm border border-mayssa-caramel/20 text-left hover:ring-2 hover:ring-mayssa-caramel transition-all cursor-pointer"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">CA depuis le début</span>
                      <p className="text-xl font-display font-bold text-mayssa-caramel mt-0.5">{caTotal.toFixed(2).replace('.', ',')} €</p>
                      <p className="text-[10px] text-mayssa-brown/50 mt-1">Mois : {caMois.toFixed(2).replace('.', ',')} €</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('livraison')}
                      className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5 text-left hover:ring-2 hover:ring-mayssa-caramel transition-all cursor-pointer"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">Aujourd'hui</span>
                      <p className="text-xl font-display font-bold text-mayssa-brown mt-0.5">{livraisonsAujourdhui} livr. · {retraitsAujourdhui} retr.</p>
                      <p className="text-[10px] text-mayssa-caramel mt-1">Voir Livraison →</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('anniversaires')}
                      className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5 text-left hover:ring-2 hover:ring-mayssa-caramel transition-all cursor-pointer"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">Anniversaires</span>
                      <p className="text-xl font-display font-bold text-mayssa-brown mt-0.5">{annivNonSouhaites} à souhaiter</p>
                      <p className="text-[10px] text-mayssa-caramel mt-1">Voir →</p>
                    </button>
                  </div>
                )
              })()}

              {/* Stats : commandes cette semaine + Top 3 du mois */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">Commandes cette semaine</span>
                  <p className="text-lg font-display font-bold text-mayssa-brown mt-0.5">{commandesCetteSemaine} commande{commandesCetteSemaine !== 1 ? 's' : ''}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">Top 3 du mois</span>
                  {top3Mois.length === 0 ? (
                    <p className="text-sm text-mayssa-brown/50 mt-0.5">Aucune vente ce mois</p>
                  ) : (
                    <ul className="mt-1 space-y-0.5 text-xs font-medium text-mayssa-brown">
                      {top3Mois.map((p, i) => (
                        <li key={i}>{i + 1}. {p.name} — {p.qty} vendu{p.qty > 1 ? 's' : ''}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* À préparer pour demain (ou date au choix) — préparer à l'avance */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-mayssa-brown/5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-mayssa-brown">À préparer pour le</span>
                    <input
                      type="date"
                      value={prepDateEffective}
                      min={todayRetraitStr}
                      onChange={(e) => setPrepTargetDate(e.target.value || '')}
                      className="rounded-xl border border-mayssa-brown/20 px-3 py-2 text-sm font-medium text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                    />
                    <button
                      type="button"
                      onClick={() => setPrepTargetDate('')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        prepDateEffective === tomorrowRetraitStr ? 'bg-mayssa-brown text-white' : 'bg-mayssa-brown/10 text-mayssa-brown hover:bg-mayssa-brown/20'
                      }`}
                    >
                      Demain
                    </button>
                  </div>
                  {ordersPourPrepDate.some(([, o]) => o.status === 'en_attente') && (
                    <button
                      type="button"
                      onClick={handleBulkStartPreparation}
                      disabled={preparingOrderIds.size > 0}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Package size={14} />
                      Tout mettre en préparation
                    </button>
                  )}
                </div>
                {ordersPourPrepDate.length === 0 ? (
                  <p className="text-sm text-mayssa-brown/50 py-2">Aucune commande pour cette date.</p>
                ) : (
                  <ul className="space-y-2">
                    {ordersPourPrepDate.map(([id, order]) => {
                      const client = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Client'
                      const reqDate = order.requestedDate ?? ''
                      const creneau = order.requestedTime
                        ? `${parseDateYyyyMmDd(reqDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à ${order.requestedTime}`
                        : parseDateYyyyMmDd(reqDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
                      const itemsSummary = (order.items ?? []).map((i) => `${i.quantity}× ${formatOrderItemName(i)}`).join(', ')
                      const isPreparing = preparingOrderIds.has(id)
                      return (
                        <li
                          key={id}
                          className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-mayssa-soft/50 border border-mayssa-brown/10"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-mayssa-brown truncate">{client}</p>
                            <p className="text-[10px] text-mayssa-brown/60">{creneau}</p>
                            <p className="text-[10px] text-mayssa-brown/70 truncate mt-0.5">{itemsSummary || '—'}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              order.status === 'en_attente' ? 'bg-amber-50 text-amber-700' : order.status === 'en_preparation' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {order.status === 'en_attente' ? 'En attente' : order.status === 'en_preparation' ? 'En préparation' : 'Prête'}
                            </span>
                            {order.status === 'en_attente' && (
                              <button
                                type="button"
                                onClick={() => handleSetOrderPreparationStatus(id, 'en_preparation')}
                                disabled={isPreparing}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                {isPreparing ? <RefreshCw size={12} className="animate-spin" /> : <Package size={12} />}
                                Préparer
                              </button>
                            )}
                            {order.status === 'en_preparation' && (
                              <button
                                type="button"
                                onClick={() => handleSetOrderPreparationStatus(id, 'pret')}
                                disabled={isPreparing}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                {isPreparing ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                                Prête
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditingOrderId(id)}
                              className="p-1.5 rounded-lg text-mayssa-brown/60 hover:bg-mayssa-brown/10 transition-colors cursor-pointer"
                              title="Modifier"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </motion.section>
          )
        })()}

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
                <select
                  value={deliveryFilter}
                  onChange={e => setDeliveryFilter(e.target.value as 'all' | 'livraison' | 'retrait')}
                  className="rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs font-bold text-mayssa-brown bg-white"
                >
                  <option value="all">Tous modes</option>
                  <option value="livraison">Livraison</option>
                  <option value="retrait">Retrait</option>
                </select>
                {allProductsInPendingOrders.length > 0 && (
                  <select
                    value={pendingProductFilter}
                    onChange={e => setPendingProductFilter(e.target.value)}
                    className="rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs font-bold text-mayssa-brown bg-white"
                  >
                    <option value="">Tous les produits</option>
                    {allProductsInPendingOrders.map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {ordersToValidate.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-mayssa-brown/5 text-center">
                <ClipboardList size={48} className="mx-auto text-mayssa-brown/15 mb-4" />
                <p className="text-sm font-medium text-mayssa-brown/60">Aucune commande en attente</p>
                <p className="text-xs text-mayssa-brown/40 mt-1">{hasActiveFilters ? 'Essayez d\'effacer les filtres' : 'Les nouvelles commandes apparaîtront ici'}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 py-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPendingIds(ordersToValidate.length === selectedPendingIds.size ? new Set() : new Set(ordersToValidate.map(([id]) => id)))}
                    className="text-[10px] font-bold text-mayssa-brown/70 hover:text-mayssa-brown cursor-pointer"
                  >
                    {selectedPendingIds.size === ordersToValidate.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                  {selectedPendingIds.size > 0 && (
                    <>
                      <span className="text-[10px] text-mayssa-brown/50">
                        {selectedPendingIds.size} sélectionnée{selectedPendingIds.size > 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`Valider ${selectedPendingIds.size} commande(s) ?`)) return
                          for (const id of selectedPendingIds) {
                            const o = orders[id]
                            if (o) await handleValidateOrder(id, o)
                          }
                          setSelectedPendingIds(new Set())
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 cursor-pointer"
                      >
                        Valider la sélection
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`Refuser ${selectedPendingIds.size} commande(s) ? Les créneaux livraison seront libérés.`)) return
                          for (const id of selectedPendingIds) {
                            const o = orders[id]
                            if (o) await handleRefuseOrder(id, o)
                          }
                          setSelectedPendingIds(new Set())
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 cursor-pointer"
                      >
                        Refuser la sélection
                      </button>
                    </>
                  )}
                </div>
              {ordersToValidate.map(([id, order]) => {
                const orderSource = order.source ?? 'site'
                const isSelected = selectedPendingIds.has(id)
                return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-2xl p-4 shadow-md border border-mayssa-brown/5 border-l-4 ${isSelected ? 'ring-2 ring-mayssa-caramel' : ''} ${
                    order.status === 'en_attente'
                      ? 'border-l-amber-400'
                      : order.status === 'validee'
                        ? 'border-l-emerald-400'
                        : 'border-l-red-400'
                  }`}
                >
                  {/* Header commande */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setSelectedPendingIds(prev => {
                          const next = new Set(prev)
                          if (next.has(id)) next.delete(id)
                          else next.add(id)
                          return next
                        })}
                        className="rounded border-mayssa-brown/30 text-mayssa-caramel focus:ring-mayssa-caramel"
                      />
                      <span className="sr-only">Sélectionner</span>
                    </label>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-mayssa-brown/50 uppercase tracking-wider mb-0.5">
                        Commande {order.orderNumber != null ? `#${order.orderNumber}` : `#${id.slice(-8)}`}
                      </p>
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
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-mayssa-brown/50 flex items-center gap-1">
                            <Phone size={10} />
                            {order.customer.phone}
                          </p>
                          <a
                            href={`https://wa.me/${phoneToWhatsApp(order.customer.phone)}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-500 text-white text-[9px] font-bold hover:bg-green-600 transition-colors"
                            title="Ouvrir WhatsApp"
                          >
                            <MessageCircle size={10} />
                            WhatsApp
                          </a>
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(order.customer!.phone!); }}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-mayssa-brown/10 text-mayssa-brown text-[9px] font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
                            title="Copier le numéro"
                          >
                            <Copy size={10} />
                            Copier
                          </button>
                        </div>
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
                              {parseDateYyyyMmDd(order.requestedDate).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short' })}
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
                          {item.quantity}× {formatOrderItemName(item)}
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
                    {(order.discountAmount ?? 0) > 0 && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-mayssa-brown/10">
                        <span className="text-emerald-700 flex items-center gap-1">
                          <Tag size={11} />
                          Réduction{order.promoCode ? ` · ${order.promoCode}` : ''}
                        </span>
                        <span className="font-bold text-emerald-700">-{(order.discountAmount ?? 0).toFixed(2).replace('.', ',')} €</span>
                      </div>
                    )}
                    <div className="border-t border-mayssa-brown/10 pt-1 mt-1 flex justify-between items-center">
                      <span className="text-xs font-bold text-mayssa-brown">Total</span>
                      <div className="flex items-center gap-1.5">
                        {(order.discountAmount ?? 0) > 0 && (
                          <span className="text-xs text-mayssa-brown/40 line-through">
                            {((order.total ?? 0) + (order.discountAmount ?? 0)).toFixed(2).replace('.', ',')} €
                          </span>
                        )}
                        <span className="text-sm font-bold text-mayssa-caramel">
                          {(order.total ?? 0).toFixed(2).replace('.', ',')} €
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { hapticFeedback('light'); exportSingleOrderPDF(order, id) }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-brown/10 text-mayssa-brown text-xs font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
                      title="Télécharger le bon de commande en PDF"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                    {order.customer?.phone && (() => {
                      const prenom = order.customer?.firstName ?? ''
                      const ref = order.orderNumber ? `#${order.orderNumber}` : ''
                      const msgs: Record<string, string> = {
                        en_attente: `Bonjour ${prenom} 👋 Votre commande ${ref} a bien été reçue chez Maison Mayssa ! Nous la préparerons très prochainement. Merci de votre confiance 🍪`,
                        en_preparation: `Bonjour ${prenom} 👋 Votre commande ${ref} est en cours de préparation chez Maison Mayssa 🍰`,
                        pret: `Bonjour ${prenom} ✅ Votre commande ${ref} est prête ! Vous pouvez venir la récupérer dès maintenant chez Maison Mayssa 🎁\n\nSi vous avez apprécié, un petit avis Google nous aiderait énormément 🙏⭐ → https://share.google/hWmuK4HB8Bcp69KWC\n\nMerci et à bientôt 🍪`,
                        livree: `Bonjour ${prenom} 🚗 Votre commande ${ref} est en route, notre livreur arrive bientôt !\n\nSi vous avez apprécié, un petit avis Google nous aiderait énormément 🙏⭐ → https://share.google/hWmuK4HB8Bcp69KWC\n\nMerci et à bientôt 🍪`,
                        refusee: `Bonjour ${prenom}, malheureusement nous ne pouvons pas honorer votre commande ${ref} pour le moment. N'hésitez pas à nous recontacter pour reprogrammer 🙏`,
                      }
                      const msg = msgs[order.status] ?? msgs['en_attente']
                      return (
                        <a
                          href={`https://wa.me/${phoneToWhatsApp(order.customer.phone)}?text=${encodeURIComponent(msg)}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
                          title="Envoyer un message WhatsApp"
                        >
                          <MessageCircle size={14} />
                          {order.status === 'pret' ? 'Prête ✅' : order.status === 'livree' ? 'En route 🚗' : order.status === 'refusee' ? 'Refus' : 'Message'}
                        </a>
                      )
                    })()}
                    <button
                      onClick={() => setEditingOrderId(id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-brown/10 text-mayssa-brown text-xs font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                      Modifier
                    </button>
                    {/* Boutons de progression de statut */}
                    {order.status === 'en_attente' && (
                      <>
                        <button
                          onClick={() => handleValidateOrder(id, order)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors cursor-pointer"
                        >
                          <Package size={14} />
                          En prépa
                        </button>
                        <button
                          onClick={() => handleRefuseOrder(id, order)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                          Refuser
                        </button>
                      </>
                    )}
                    {order.status === 'en_preparation' && (
                      <button
                        onClick={() => handleSetOrderPreparationStatus(id, 'pret')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                      >
                        <Check size={14} />
                        Prête ✅
                      </button>
                    )}
                    {order.status === 'pret' && (
                      <button
                        onClick={() => handleFinishOrder(id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-mayssa-caramel text-white text-xs font-bold hover:bg-mayssa-brown transition-colors cursor-pointer"
                      >
                        <Truck size={14} />
                        Livrée 🚗
                      </button>
                    )}
                    {(order.status === 'livree' || order.status === 'validee' || order.status === 'refusee') && (
                      <button
                        onClick={() => handleDeleteOrder(id, order)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-mayssa-soft/50 text-mayssa-brown/40 text-[10px] font-bold hover:bg-red-50 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                        Supprimer
                      </button>
                    )}
                  </div>
                </motion.div>
                )
              })}
              </>
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
            {/* Onglets statut — chaque statut séparé */}
            {(() => {
              const cnt = (status: string | string[]) => {
                const statuses = Array.isArray(status) ? status : [status]
                return Object.values(orders).filter(o => statuses.includes(o.status)).length
              }
              const tabs: { vue: typeof historiqueVue; label: string; count: number; color: string }[] = [
                { vue: 'a_faire',  label: 'En attente',  count: cnt('en_attente'),   color: 'bg-amber-500 text-white' },
                { vue: 'a_traiter',label: 'En prépa',    count: cnt('en_preparation'),color: 'bg-blue-500 text-white' },
                { vue: 'pret',     label: 'Prête',       count: cnt('pret'),          color: 'bg-emerald-500 text-white' },
                { vue: 'livree',   label: 'Livrée',      count: cnt('livree'),        color: 'bg-mayssa-caramel text-white' },
                { vue: 'validee',  label: 'Validée',     count: cnt('validee'),       color: 'bg-purple-500 text-white' },
                { vue: 'refusee',  label: 'Refusée',     count: cnt('refusee'),       color: 'bg-red-500 text-white' },
                { vue: 'toutes',   label: 'Toutes',      count: Object.keys(orders).length, color: 'bg-mayssa-brown text-white' },
              ]
              return (
                <div className="bg-white rounded-2xl shadow-sm border border-mayssa-brown/5 p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {tabs.map((t) => (
                      <button
                        key={t.vue}
                        type="button"
                        onClick={() => { setHistoriqueVue(t.vue); if (t.vue !== 'a_traiter') setTrompeLoeilFilter(null) }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          historiqueVue === t.vue ? t.color + ' shadow-sm' : 'bg-mayssa-soft/60 text-mayssa-brown/60 hover:bg-mayssa-soft'
                        }`}
                      >
                        <span>{t.label}</span>
                        <span className={`text-[10px] font-display font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                          historiqueVue === t.vue ? 'bg-white/25 text-white' : t.count > 0 ? 'bg-mayssa-brown/10 text-mayssa-brown' : 'bg-mayssa-brown/5 text-mayssa-brown/30'
                        }`}>{t.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}

            {(historiqueVue === 'a_faire' || historiqueVue === 'a_traiter') && historiqueVue === 'a_faire' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl px-3 py-2 bg-mayssa-caramel/10 border border-mayssa-caramel/20">
                  <span className="text-[10px] font-bold text-mayssa-brown/70">Retrait aujourd&apos;hui</span>
                  <p className="text-sm font-display font-bold text-mayssa-brown">{aFaireAujourdhuiCount} commande{aFaireAujourdhuiCount !== 1 ? 's' : ''}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAFaireAujourdhuiOnly((v) => !v)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    aFaireAujourdhuiOnly ? 'bg-mayssa-caramel text-white' : 'bg-white border border-mayssa-brown/10 text-mayssa-brown/70 hover:bg-mayssa-soft/50'
                  }`}
                >
                  Aujourd&apos;hui uniquement
                </button>
              </div>
            )}

            {/* KPI + Export */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-mayssa-brown/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">
                    {historiqueVue === 'a_faire' ? (aFaireAujourdhuiOnly ? "Aujourd'hui" : 'En attente') : historiqueVue === 'a_traiter' ? 'En préparation' : historiqueVue === 'pret' ? 'Prêtes' : historiqueVue === 'livree' ? 'Livrées' : historiqueVue === 'validee' ? 'Validées' : historiqueVue === 'refusee' ? 'Refusées' : 'Toutes'}
                  </span>
                  <p className="text-lg font-display font-bold text-mayssa-brown">{displayedOrders.length} commande{displayedOrders.length !== 1 ? 's' : ''}</p>
                </div>
                {historiqueVue === 'a_traiter' && (
                  <div className="bg-emerald-50 rounded-xl px-4 py-2 shadow-sm border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80">CA total à traiter</span>
                    <p className="text-lg font-display font-bold text-emerald-800">{caATraiter.toFixed(2)} €</p>
                  </div>
                )}
                {historiqueVue === 'a_traiter' && trompeLoeilSummary.length > 0 && (
                  <div className="bg-mayssa-caramel/10 rounded-xl px-4 py-2 shadow-sm border border-mayssa-caramel/30 max-w-full">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-caramel/80">
                        Trompes l&apos;œil — cliquer pour filtrer
                      </span>
                      {trompeLoeilFilter && (
                        <button
                          type="button"
                          onClick={() => setTrompeLoeilFilter(null)}
                          className="flex items-center gap-0.5 text-[9px] font-bold text-mayssa-caramel hover:text-mayssa-brown cursor-pointer"
                        >
                          <XCircle size={11} />
                          Tout voir
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {trompeLoeilSummary.map((item) => {
                        const isActive = trompeLoeilFilter === item.name
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => setTrompeLoeilFilter(isActive ? null : item.name)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-mayssa-caramel text-white shadow-sm'
                                : 'bg-white/70 text-mayssa-brown hover:bg-white border border-mayssa-caramel/20'
                            }`}
                          >
                            <span>{item.name}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-display font-bold tabular-nums ${
                              isActive ? 'bg-white/20' : 'bg-mayssa-caramel/10 text-mayssa-caramel'
                            }`}>
                              {item.quantity}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportOrdersToPDF(displayedOrders, `${historiqueVue}_${todayRetraitStr}`)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-caramel shadow-md transition-all cursor-pointer"
                >
                  <FileText size={16} />
                  Export PDF
                </button>
                <button
                  onClick={() => exportOrdersToCSV(displayedOrders, `${historiqueVue}_${todayRetraitStr}`)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md transition-all cursor-pointer"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
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
                {historiqueVue === 'toutes' && (
                  <>
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
                      title="Date de création"
                    />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="rounded-xl border border-mayssa-brown/10 px-2.5 py-2 text-xs font-medium text-mayssa-brown bg-white w-32"
                      title="Date de création"
                    />
                  </>
                )}
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
                <select
                  value={deliveryFilter}
                  onChange={e => setDeliveryFilter(e.target.value as 'all' | 'livraison' | 'retrait')}
                  className="rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs font-bold text-mayssa-brown bg-white"
                >
                  <option value="all">Tous modes</option>
                  <option value="livraison">Livraison</option>
                  <option value="retrait">Retrait</option>
                </select>
              </div>
              {historiqueVue !== 'toutes' && (
                <p className="text-[10px] text-mayssa-brown/50">
                  {historiqueVue === 'a_faire' && 'Nouvelles commandes en attente de validation.'}
                  {historiqueVue === 'a_traiter' && 'Commandes en cours de préparation.'}
                  {historiqueVue === 'pret' && 'Commandes prêtes à être récupérées ou livrées.'}
                  {historiqueVue === 'livree' && 'Commandes livrées au client.'}
                  {historiqueVue === 'validee' && 'Commandes confirmées.'}
                  {historiqueVue === 'refusee' && 'Commandes refusées.'}
                </p>
              )}
            </div>

            {displayedOrders.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 py-2">
                <button
                  type="button"
                  onClick={() => setSelectedHistoriqueIds(selectedHistoriqueIds.size === displayedOrders.length ? new Set() : new Set(displayedOrders.map(([id]) => id)))}
                  className="text-[10px] font-bold text-mayssa-brown/70 hover:text-mayssa-brown cursor-pointer"
                >
                  {selectedHistoriqueIds.size === displayedOrders.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                {selectedHistoriqueIds.size > 0 && (
                  <>
                    <span className="text-[10px] text-mayssa-brown/50">{selectedHistoriqueIds.size} sélectionnée{selectedHistoriqueIds.size > 1 ? 's' : ''}</span>
                    <select
                      className="rounded-lg border border-mayssa-brown/20 px-2 py-1.5 text-[10px] font-bold text-mayssa-brown bg-white cursor-pointer"
                      defaultValue=""
                      onChange={async (e) => {
                        const status = e.target.value as OrderStatus | ''
                        if (!status) return
                        e.target.value = ''
                        for (const id of selectedHistoriqueIds) {
                          await updateOrderStatus(id, status)
                        }
                        setSelectedHistoriqueIds(new Set())
                      }}
                    >
                      <option value="">Changer le statut…</option>
                      <option value="en_preparation">En préparation</option>
                      <option value="pret">Prête</option>
                      <option value="livree">Livrée</option>
                      <option value="validee">Validée</option>
                    </select>
                  </>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-mayssa-brown/5">
            {displayedOrders.length === 0 ? (
              <div className="py-12 text-center">
                <History size={40} className="mx-auto text-mayssa-brown/15 mb-3" />
                <p className="text-sm font-medium text-mayssa-brown/60">Aucune commande trouvée</p>
                <p className="text-xs text-mayssa-brown/40 mt-1">{hasActiveFilters || aFaireAujourdhuiOnly ? 'Effacez les filtres ou élargissez la période' : 'Les commandes validées ou refusées apparaissent ici'}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {displayedOrders.map(([id, order]) => {
                  const orderSource = order.source ?? 'site'
                  const isSelectedHist = selectedHistoriqueIds.has(id)
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border text-left ${isSelectedHist ? 'ring-2 ring-mayssa-caramel' : ''} ${
                        order.status === 'refusee'
                          ? 'border-red-200 bg-red-50/30'
                          : order.status === 'en_preparation'
                            ? 'border-blue-200 bg-blue-50/40'
                            : order.status === 'pret' || order.status === 'livree' || order.status === 'validee'
                              ? 'border-emerald-200 bg-emerald-50/40'
                              : 'border-amber-200 bg-amber-50/50'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelectedHist}
                            onChange={() => setSelectedHistoriqueIds(prev => {
                              const next = new Set(prev)
                              if (next.has(id)) next.delete(id)
                              else next.add(id)
                              return next
                            })}
                            className="rounded border-mayssa-brown/30 text-mayssa-caramel focus:ring-mayssa-caramel"
                          />
                          <span className="sr-only">Sélectionner</span>
                        </label>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-mayssa-brown/50 uppercase tracking-wider mb-0.5">
                            Commande {order.orderNumber != null ? `#${order.orderNumber}` : `#${id.slice(-8)}`}
                          </p>
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
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <p className="text-[10px] text-mayssa-brown/50 flex items-center gap-1">
                                <Phone size={10} />
                                {order.customer.phone}
                              </p>
                              <a
                                href={`https://wa.me/${phoneToWhatsApp(order.customer.phone)}`}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-500 text-white text-[9px] font-bold hover:bg-green-600 transition-colors"
                                title="Ouvrir WhatsApp"
                              >
                                <MessageCircle size={10} />
                                WhatsApp
                              </a>
                              <button
                                type="button"
                                onClick={() => { navigator.clipboard.writeText(order.customer!.phone!); }}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-mayssa-brown/10 text-mayssa-brown text-[9px] font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
                                title="Copier le numéro"
                              >
                                <Copy size={10} />
                                Copier
                              </button>
                            </div>
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
                                  {parseDateYyyyMmDd(order.requestedDate).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short' })}
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
                              {item.quantity}× {formatOrderItemName(item)}
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
                        {(order.discountAmount ?? 0) > 0 && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-mayssa-brown/10">
                            <span className="text-emerald-700 flex items-center gap-1">
                              <Tag size={11} />
                              Réduction{order.promoCode ? ` · ${order.promoCode}` : ''}
                            </span>
                            <span className="font-bold text-emerald-700">-{(order.discountAmount ?? 0).toFixed(2).replace('.', ',')} €</span>
                          </div>
                        )}
                        <div className="border-t border-mayssa-brown/10 pt-1 mt-1 flex justify-between items-center">
                          <span className="text-xs font-bold text-mayssa-brown">Total</span>
                          <div className="flex items-center gap-1.5">
                            {(order.discountAmount ?? 0) > 0 && (
                              <span className="text-xs text-mayssa-brown/40 line-through">
                                {((order.total ?? 0) + (order.discountAmount ?? 0)).toFixed(2).replace('.', ',')} €
                              </span>
                            )}
                            <span className="text-sm font-bold text-mayssa-caramel">
                              {(order.total ?? 0).toFixed(2).replace('.', ',')} €
                            </span>
                          </div>
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
                          onClick={() => { hapticFeedback('light'); exportSingleOrderPDF(order, id) }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-brown/10 text-mayssa-brown text-xs font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
                          title="Télécharger le bon de commande en PDF"
                        >
                          <Download size={14} />
                          PDF
                        </button>
                        {order.customer?.phone && (() => {
                          const prenom = order.customer?.firstName ?? ''
                          const ref = order.orderNumber ? `#${order.orderNumber}` : ''
                          const msgs: Record<string, string> = {
                            en_attente: `Bonjour ${prenom} 👋 Votre commande ${ref} a bien été reçue chez Maison Mayssa ! Nous la préparerons très prochainement. Merci de votre confiance 🍪`,
                            en_preparation: `Bonjour ${prenom} 👋 Votre commande ${ref} est en cours de préparation chez Maison Mayssa 🍰`,
                            pret: `Bonjour ${prenom} ✅ Votre commande ${ref} est prête ! Vous pouvez venir la récupérer dès maintenant chez Maison Mayssa 🎁\n\nSi vous avez apprécié, un petit avis Google nous aiderait énormément 🙏⭐ → https://share.google/hWmuK4HB8Bcp69KWC\n\nMerci et à bientôt 🍪`,
                            livree: `Bonjour ${prenom} 🚗 Votre commande ${ref} est en route, notre livreur arrive bientôt !\n\nSi vous avez apprécié, un petit avis Google nous aiderait énormément 🙏⭐ → https://share.google/hWmuK4HB8Bcp69KWC\n\nMerci et à bientôt 🍪`,
                            validee: `Bonjour ${prenom} ✅ Votre commande ${ref} est confirmée. Merci pour votre commande chez Maison Mayssa 🍪`,
                            refusee: `Bonjour ${prenom}, malheureusement nous ne pouvons pas honorer votre commande ${ref} pour le moment. N'hésitez pas à nous recontacter pour reprogrammer 🙏`,
                          }
                          const msg = msgs[order.status] ?? msgs['en_attente']
                          return (
                            <a
                              href={`https://wa.me/${phoneToWhatsApp(order.customer.phone)}?text=${encodeURIComponent(msg)}`}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
                              title="Envoyer un message WhatsApp contextualisé"
                            >
                              <MessageCircle size={14} />
                              {order.status === 'pret' ? 'Prête ✅' : order.status === 'livree' ? 'En route 🚗' : order.status === 'validee' ? 'Confirmée ✅' : order.status === 'refusee' ? 'Refus' : 'Message'}
                            </a>
                          )
                        })()}
                        <button
                          onClick={() => setEditingOrderId(id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-brown/10 text-mayssa-brown text-xs font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                          Modifier
                        </button>
                        {historiqueVue === 'a_faire' && order.status === 'en_attente' && (
                          <button
                            onClick={() => updateOrderStatus(id, 'en_preparation')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            <Package size={14} />
                            Accepter → En prépa
                          </button>
                        )}
                        {historiqueVue === 'a_traiter' && order.status === 'en_preparation' && (
                          <button
                            onClick={() => handleFinishOrder(id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                          >
                            <Check size={14} />
                            Terminé
                          </button>
                        )}
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
                          onClick={() => handleDeleteOrder(id, order)}
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

        {/* ===== LIVRAISON ===== */}
        {tab === 'livraison' && (
          <AdminLivraisonTab orders={orders} onEditOrder={(id) => setEditingOrderId(id)} mode="livraison" />
        )}
        {tab === 'retrait' && (
          <AdminLivraisonTab orders={orders} onEditOrder={(id) => setEditingOrderId(id)} mode="retrait" />
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">CA total (validé + livré)</p>
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Nb commandes (validé + livré)</p>
                <p className="text-xl font-display font-bold text-mayssa-brown">{caOrders.length}</p>
              </div>
            </div>

            {/* CA moyen */}
            <div className="rounded-xl bg-mayssa-soft/50 p-4 border border-mayssa-brown/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Panier moyen (validé + livré)</p>
              <p className="text-lg font-display font-bold text-mayssa-brown">
                {caOrders.length > 0
                  ? (caTotal / caOrders.length).toFixed(2).replace('.', ',') + ' €'
                  : '—'}
              </p>
            </div>

            {/* Par source */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">CA par source (validé + livré)</p>
              <div className="space-y-2">
                {(['site', 'whatsapp', 'instagram', 'snap'] as const).map((src) => {
                  const ordersSrc = caOrders.filter((o) => (o.source ?? 'site') === src)
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

            {/* Commandes par jour (14 derniers jours) */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Commandes par jour (14 derniers jours)</p>
              <div className="h-40 rounded-xl bg-mayssa-soft/30 border border-mayssa-brown/5 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersPerDayData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d4a57430" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 8 }} stroke="#5b3a29" interval={0} />
                    <YAxis tick={{ fontSize: 9 }} stroke="#5b3a29" allowDecimals={false} />
                    <Tooltip
                      formatter={(value: number | undefined) => [value ?? 0, 'Commandes']}
                      labelFormatter={(label) => label}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Bar dataKey="count" fill="#5b3a29" radius={[4, 4, 0, 0]} name="Commandes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Croissance + meilleur jour */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-mayssa-soft/50 border border-mayssa-brown/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-1">Croissance vs mois préc.</p>
                {croissanceMois === null ? (
                  <p className="text-lg font-display font-bold text-mayssa-brown/30">—</p>
                ) : (
                  <p className={`text-xl font-display font-bold ${croissanceMois >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {croissanceMois >= 0 ? '+' : ''}{croissanceMois}%
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-mayssa-soft/50 border border-mayssa-brown/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-1">Meilleure journée</p>
                {meilleurJour ? (
                  <>
                    <p className="text-lg font-display font-bold text-mayssa-caramel">{meilleurJour.ca.toFixed(2).replace('.', ',')} €</p>
                    <p className="text-[10px] text-mayssa-brown/50 mt-0.5">{meilleurJour.label}</p>
                  </>
                ) : (
                  <p className="text-lg font-display font-bold text-mayssa-brown/30">—</p>
                )}
              </div>
            </div>

            {/* Taux conversion + livraison vs retrait */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Conversion & modes de retrait</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-[10px] text-emerald-700 font-bold mb-0.5">Taux validation</p>
                  <p className="text-xl font-display font-bold text-emerald-700">{conversionStats.tauxValidation}%</p>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                  <p className="text-[10px] text-red-600 font-bold mb-0.5">Taux refus</p>
                  <p className="text-xl font-display font-bold text-red-500">{conversionStats.tauxRefus}%</p>
                </div>
                <div className="rounded-xl bg-mayssa-soft/50 border border-mayssa-brown/5 p-3">
                  <p className="text-[10px] text-mayssa-brown/60 font-bold mb-0.5">🚗 Livraison ({conversionStats.nbLivraison})</p>
                  <p className="text-sm font-bold text-mayssa-brown">{conversionStats.caLivraison.toFixed(2).replace('.', ',')} €</p>
                </div>
                <div className="rounded-xl bg-mayssa-soft/50 border border-mayssa-brown/5 p-3">
                  <p className="text-[10px] text-mayssa-brown/60 font-bold mb-0.5">📍 Retrait ({conversionStats.nbRetrait})</p>
                  <p className="text-sm font-bold text-mayssa-brown">{conversionStats.caRetrait.toFixed(2).replace('.', ',')} €</p>
                </div>
              </div>
            </div>

            {/* CA par catégorie */}
            {caByCategory.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">CA par catégorie</p>
                <div className="space-y-1.5">
                  {caByCategory.map(({ name, ca, qty }) => {
                    const pct = caTotal > 0 ? (ca / caTotal) * 100 : 0
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-medium text-mayssa-brown">{name}</span>
                          <span className="font-bold text-mayssa-caramel">{ca.toFixed(2).replace('.', ',')} €
                            <span className="text-mayssa-brown/40 font-normal ml-1">· {qty} pcs</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-mayssa-soft/60 overflow-hidden">
                          <div className="h-full rounded-full bg-mayssa-caramel" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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

        {/* ===== AVIS ===== */}
        {tab === 'avis' && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/5 space-y-4"
          >
            <h3 className="font-bold text-mayssa-brown text-sm flex items-center gap-2">
              <Star size={18} />
              Avis clients
            </h3>
            <p className="text-xs text-mayssa-brown/60">
              {Object.keys(reviews).length} avis au total. Export CSV : note, commentaire, auteur, produits notés, id commande.
            </p>
            <button
              type="button"
              onClick={() => exportReviewsToCSV(reviews)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mayssa-caramel text-white text-sm font-bold hover:bg-mayssa-caramel/90 transition-colors cursor-pointer"
            >
              <Download size={16} />
              Exporter en CSV
            </button>
            {Object.keys(reviews).length === 0 ? (
              <div className="py-10 text-center rounded-xl bg-mayssa-soft/20 border border-mayssa-brown/5">
                <MessageSquare size={36} className="mx-auto text-mayssa-brown/20 mb-2" />
                <p className="text-sm text-mayssa-brown/50">Aucun avis pour l&apos;instant</p>
              </div>
            ) : (
              <ul className="space-y-3 max-h-80 overflow-y-auto">
                {Object.entries(reviews)
                  .sort(([, a], [, b]) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
                  .map(([id, r]) => (
                    <li key={id} className="flex items-start gap-2 p-3 rounded-xl bg-mayssa-soft/30 border border-mayssa-brown/5 text-sm">
                      <span className="font-bold text-mayssa-caramel">{r.rating}/5</span>
                      {r.comment && <span className="text-mayssa-brown/80 flex-1 line-clamp-2">&laquo; {r.comment} &raquo;</span>}
                      {r.authorName && <span className="text-mayssa-brown/60 shrink-0">— {r.authorName}</span>}
                      <span className="text-[10px] text-mayssa-brown/40 shrink-0">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
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
            {/* Toggle Commandes ouvertes / fermées */}
            <div className={`rounded-xl p-4 border-2 ${settings.ordersOpen === false ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-mayssa-brown">
                    {settings.ordersOpen === false ? 'Commandes fermées' : 'Commandes ouvertes'}
                  </p>
                  <p className="text-[10px] text-mayssa-brown/60 mt-0.5">
                    {settings.ordersOpen === false
                      ? 'Les clients ne peuvent pas envoyer de commande. Active pour rouvrir.'
                      : 'Les clients peuvent commander. Désactive pour fermer temporairement.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings({ ordersOpen: !(settings.ordersOpen !== false) })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    settings.ordersOpen === false
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  {settings.ordersOpen === false ? 'Ouvrir les commandes' : 'Fermer les commandes'}
                </button>
              </div>
            </div>

            {/* Résumé de l'état actuel */}
            <div className="rounded-xl px-4 py-3 bg-mayssa-soft/60 border border-mayssa-brown/8 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/40 mb-2">État actuel</p>
              {/* Ouverture précommandes */}
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  settings.preorderOpenDate
                    ? (() => {
                        const now = new Date()
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
                        const open = settings.preorderOpenDate < todayStr ||
                          (settings.preorderOpenDate === todayStr && (() => {
                            const [h,m] = (settings.preorderOpenTime ?? '00:00').split(':').map(Number)
                            return now.getHours()*60+now.getMinutes() >= (h??0)*60+(m??0)
                          })())
                        return open ? 'bg-emerald-400' : 'bg-amber-400'
                      })()
                    : 'bg-mayssa-brown/20'
                }`} />
                <span className="text-xs text-mayssa-brown/70">
                  {settings.preorderOpenDate
                    ? (() => {
                        const now = new Date()
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
                        const open = settings.preorderOpenDate < todayStr ||
                          (settings.preorderOpenDate === todayStr && (() => {
                            const [h,m] = (settings.preorderOpenTime ?? '00:00').split(':').map(Number)
                            return now.getHours()*60+now.getMinutes() >= (h??0)*60+(m??0)
                          })())
                        const dateLabel = parseDateYyyyMmDd(settings.preorderOpenDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
                        const timeLabel = settings.preorderOpenTime && settings.preorderOpenTime !== '00:00' ? ` à ${settings.preorderOpenTime}` : ''
                        return open
                          ? <><span className="font-semibold text-emerald-700">Précommandes ouvertes</span> (depuis {dateLabel}{timeLabel})</>
                          : <><span className="font-semibold text-amber-700">Ouverture</span> {dateLabel}{timeLabel}</>
                      })()
                    : <span className="text-mayssa-brown/40">Ouverture : jours récurrents</span>
                  }
                </span>
              </div>
              {/* Dates de récupération */}
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${settings.pickupDates && settings.pickupDates.length > 0 ? 'bg-mayssa-caramel' : 'bg-mayssa-brown/20'}`} />
                <span className="text-xs text-mayssa-brown/70">
                  {settings.pickupDates && settings.pickupDates.length > 0
                    ? <><span className="font-semibold text-mayssa-brown">{settings.pickupDates.length} date{settings.pickupDates.length > 1 ? 's' : ''} de récupération</span> — {settings.pickupDates.slice(0,2).map(d => parseDateYyyyMmDd(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })).join(', ')}{settings.pickupDates.length > 2 ? ` +${settings.pickupDates.length - 2}` : ''}</>
                    : <span className="text-mayssa-brown/40">Récupération : jours récurrents</span>
                  }
                </span>
              </div>
            </div>

            {/* Message global aux clients */}
            <div className="rounded-xl p-4 border border-mayssa-brown/10 bg-white space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-mayssa-brown">Message global aux clients</p>
                <button
                  type="button"
                  onClick={() => updateSettings({ globalMessageEnabled: !settings.globalMessageEnabled })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    settings.globalMessageEnabled
                      ? 'bg-mayssa-caramel text-white hover:bg-mayssa-brown'
                      : 'bg-slate-100 text-mayssa-brown/60 hover:bg-slate-200'
                  }`}
                >
                  {settings.globalMessageEnabled ? 'Activé ✓' : 'Désactivé'}
                </button>
              </div>
              <textarea
                value={settings.globalMessage ?? ''}
                onChange={e => updateSettings({ globalMessage: e.target.value })}
                placeholder="Ex : Fermeture du 20 au 25 mars. Reprise des commandes le 26."
                rows={3}
                className="w-full rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs text-mayssa-brown resize-none focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
              <p className="text-[10px] text-mayssa-brown/40">
                Ce message s&apos;affiche en bannière caramel sur le site pour tous les visiteurs.
              </p>
            </div>

            {/* Section A : Ouverture des précommandes */}
            <div className="rounded-xl p-4 border border-mayssa-brown/10 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-mayssa-brown">Ouverture des précommandes</p>
                {settings.preorderOpenDate && (
                  <button type="button"
                    onClick={() => updateSettings({ preorderOpenDate: undefined, preorderOpenTime: undefined })}
                    className="text-[10px] text-red-400 hover:text-red-600 font-bold cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <p className="text-[10px] text-mayssa-brown/50">
                Date et heure à partir desquelles les clients peuvent précommander. Les dates de récupération ci-dessous ne sont visibles qu&apos;à partir de ce moment.
              </p>
              <div className="flex gap-2 flex-wrap items-center">
                <input type="date"
                  value={settings.preorderOpenDate ?? ''}
                  onChange={e => updateSettings({ preorderOpenDate: e.target.value || undefined })}
                  className="flex-1 min-w-32 rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                />
                <input type="time"
                  value={settings.preorderOpenTime ?? '00:00'}
                  onChange={e => updateSettings({ preorderOpenTime: e.target.value || '00:00' })}
                  className="w-24 rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                />
              </div>
              {settings.preorderOpenDate && (
                <p className="text-[10px] text-mayssa-caramel font-semibold">
                  Ouverture : {parseDateYyyyMmDd(settings.preorderOpenDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {settings.preorderOpenTime && settings.preorderOpenTime !== '00:00' ? ` à ${settings.preorderOpenTime}` : ' toute la journée'}
                </p>
              )}
            </div>

            {/* Section B : Dates de récupération */}
            <div className="rounded-xl p-4 border border-mayssa-brown/10 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-mayssa-brown">Dates de récupération</p>
                <span className="text-[10px] text-mayssa-brown/40">
                  {settings.pickupDates && settings.pickupDates.length > 0
                    ? `${settings.pickupDates.length} date(s)`
                    : 'Jours récurrents actifs'}
                </span>
              </div>
              <p className="text-[10px] text-mayssa-brown/50">
                Dates proposées aux clients pour récupérer/recevoir leur commande. Si vide, les jours récurrents (ci-dessous) sont utilisés.
              </p>
              <div className="flex gap-2 flex-wrap">
                <input type="date"
                  id="admin-pickup-date-input"
                  className="flex-1 min-w-32 rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                />
                <button type="button"
                  onClick={() => {
                    const dateEl = document.getElementById('admin-pickup-date-input') as HTMLInputElement | null
                    const date = dateEl?.value
                    if (!date) return
                    const current = settings.pickupDates ?? []
                    if (!current.includes(date)) {
                      updateSettings({ pickupDates: [...current, date].sort() })
                    }
                    if (dateEl) dateEl.value = ''
                  }}
                  className="px-4 py-2 rounded-xl bg-mayssa-caramel text-white text-xs font-bold hover:bg-mayssa-brown transition-colors cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
              {settings.pickupDates && settings.pickupDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {settings.pickupDates.map(date => (
                    <div key={date} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-mayssa-soft border border-mayssa-brown/10">
                      <span className="text-xs font-semibold text-mayssa-brown capitalize">
                        {parseDateYyyyMmDd(date).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <button type="button"
                        onClick={() => updateSettings({ pickupDates: (settings.pickupDates ?? []).filter(d => d !== date) })}
                        className="text-mayssa-brown/30 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => updateSettings({ pickupDates: [] })}
                    className="text-[10px] text-red-400 hover:text-red-600 font-bold cursor-pointer px-2 py-1.5"
                  >
                    Tout effacer
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-mayssa-brown/40 italic">
                  Aucune date — les jours récurrents configurés ci-dessous sont utilisés.
                </p>
              )}
            </div>

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

        {/* ===== CRÉNEAUX RÉCEPTION / LIVRAISON ===== */}
        {tab === 'creneaux' && (
          <AdminCreneauxTab settings={settings} />
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

        {/* ===== CODES PROMO ===== */}
        {tab === 'promos' && (
          <AdminPromosTab promoCodes={promoCodes} />
        )}

        {tab === 'sondage' && (
          <AdminPollsTab polls={polls} />
        )}

        {tab === 'rappels' && (
          <AdminRappelsTab allUsers={allUsers} />
        )}

        {tab === 'abonnes' && (
          <AdminSubscribersTab orders={orders} />
        )}

        {tab === 'alertes' && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <p className="text-sm text-mayssa-brown/70">
              Personnes inscrites pour être prévenues quand un produit revient en stock.
            </p>
            {(() => {
              const byProduct = Object.entries(notifyWhenAvailableEntries).reduce<Record<string, { name: string; emails: string[] }>>((acc, [, e]) => {
                if (!acc[e.productId]) acc[e.productId] = { name: e.productName, emails: [] }
                if (!acc[e.productId].emails.includes(e.email)) acc[e.productId].emails.push(e.email)
                return acc
              }, {})
              const productIds = Object.keys(byProduct).sort()
              if (productIds.length === 0) {
                return <p className="text-sm text-mayssa-brown/50">Aucune inscription pour l’instant.</p>
              }
              return (
                <div className="space-y-3">
                  {productIds.map((productId) => {
                    const { name, emails } = byProduct[productId]
                    const list = emails.join(', ')
                    return (
                      <div key={productId} className="rounded-xl bg-white/80 border border-mayssa-brown/10 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-mayssa-brown">{name}</p>
                            <p className="text-xs text-mayssa-brown/60 mt-0.5">{emails.length} inscription(s)</p>
                            <p className="text-xs text-mayssa-brown/70 mt-1 break-all">{list || '—'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (list) {
                                navigator.clipboard.writeText(list)
                                hapticFeedback('success')
                              }
                            }}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-brown/90 cursor-pointer"
                          >
                            <ClipboardList size={14} />
                            Copier les emails
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </motion.section>
        )}

        {tab === 'sessions' && (
          <AdminSessionsTab />
        )}

        {tab === 'carte' && (
          <AdminCommunityTab orders={orders} />
        )}

        {/* ===== PRODUCTION ===== */}
        {tab === 'production' && (() => {
          // Toutes les dates uniques avec commandes actives, triées
          const allDatesWithOrders = Array.from(
            new Set(
              Object.values(orders)
                .filter(o => o.requestedDate && o.status !== 'refusee')
                .map(o => o.requestedDate!)
            )
          ).sort()

          // Si aucune sélection → aujourd'hui par défaut
          const selectedDates = productionDates.size > 0 ? productionDates : new Set([todayRetraitStr])

          // Clic simple = sélection unique de cette date
          const selectDate = (d: string) => {
            setProductionDates(new Set([d]))
          }
          // Clic sur "+" = ajouter/retirer de la multi-sélection
          const toggleDate = (d: string) => {
            setProductionDates(prev => {
              const next = new Set(prev)
              if (next.has(d)) { next.delete(d) } else { next.add(d) }
              return next.size === 0 ? new Set([todayRetraitStr]) : next
            })
          }

          // Agrégation multi-dates
          const productionMap = new Map<string, { name: string; quantity: number; orders: number }>()
          let totalOrders = 0
          for (const [, order] of Object.entries(orders)) {
            if (order.status === 'refusee' || order.status === 'livree' || order.status === 'validee' || order.status === 'pret') continue
            if (!order.requestedDate || !selectedDates.has(order.requestedDate)) continue
            totalOrders++
            for (const item of order.items ?? []) {
              const key = item.name || item.productId || 'Inconnu'
              const existing = productionMap.get(key)
              if (existing) { existing.quantity += item.quantity ?? 1; existing.orders++ }
              else { productionMap.set(key, { name: key, quantity: item.quantity ?? 1, orders: 1 }) }
            }
          }
          const productionList = Array.from(productionMap.values()).sort((a, b) => b.quantity - a.quantity)

          const datesLabel = selectedDates.size === 1
            ? (() => {
                const d = [...selectedDates][0]
                if (d === todayRetraitStr) return "Aujourd'hui"
                if (d === tomorrowRetraitStr) return 'Demain'
                return parseDateYyyyMmDd(d).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' })
              })()
            : `${selectedDates.size} jours sélectionnés`

          return (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Sélecteur multi-dates */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-mayssa-brown/5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">
                    Dates de production
                    <span className="normal-case font-normal text-mayssa-brown/40 ml-1">— clic = jour seul · + = combiner</span>
                  </p>
                  {selectedDates.size > 1 && (
                    <button
                      type="button"
                      onClick={() => setProductionDates(new Set())}
                      className="text-[10px] font-bold text-mayssa-caramel hover:text-mayssa-brown cursor-pointer"
                    >
                      Tout déselectionner
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allDatesWithOrders.map((d) => {
                    const isSelected = selectedDates.has(d)
                    const isOnlySelected = isSelected && selectedDates.size === 1
                    const isToday = d === todayRetraitStr
                    const isTomorrow = d === tomorrowRetraitStr
                    const isPast = d < todayRetraitStr
                    const label = isToday ? "Aujourd'hui" : isTomorrow ? 'Demain' : parseDateYyyyMmDd(d).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'short' })
                    const count = Object.values(orders).filter(o => o.requestedDate === d && o.status !== 'refusee' && o.status !== 'livree' && o.status !== 'validee' && o.status !== 'pret').length
                    return (
                      <div key={d} className="flex items-center rounded-xl overflow-hidden border-2 transition-all" style={{ borderColor: isSelected ? 'var(--color-mayssa-caramel, #C49A6C)' : 'transparent' }}>
                        {/* Clic principal = sélection unique */}
                        <button
                          type="button"
                          onClick={() => selectDate(d)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-mayssa-caramel text-white'
                              : isPast
                              ? 'bg-mayssa-soft/50 text-mayssa-brown/50 hover:bg-mayssa-soft'
                              : 'bg-mayssa-soft text-mayssa-brown hover:bg-mayssa-caramel/10'
                          }`}
                        >
                          <span className="capitalize">{label}</span>
                          {count > 0 && (
                            <span className={`px-1 py-0.5 rounded text-[9px] font-display font-bold tabular-nums ${
                              isSelected ? 'bg-white/25 text-white' : 'bg-mayssa-caramel/15 text-mayssa-caramel'
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                        {/* Bouton + = ajouter à la sélection (ou retirer si déjà dedans et pas seul) */}
                        {!isOnlySelected && (
                          <button
                            type="button"
                            onClick={() => toggleDate(d)}
                            title={isSelected ? 'Retirer' : 'Ajouter à la sélection'}
                            className={`px-1.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer border-l ${
                              isSelected
                                ? 'bg-mayssa-brown text-white border-white/20 hover:bg-red-500'
                                : isPast
                                ? 'bg-mayssa-soft/50 text-mayssa-brown/40 border-mayssa-brown/10 hover:bg-mayssa-caramel/20 hover:text-mayssa-caramel'
                                : 'bg-mayssa-soft text-mayssa-brown/50 border-mayssa-brown/10 hover:bg-mayssa-caramel/20 hover:text-mayssa-caramel'
                            }`}
                          >
                            {isSelected ? '−' : '+'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {allDatesWithOrders.length === 0 && (
                    <p className="text-xs text-mayssa-brown/40 italic">Aucune commande enregistrée</p>
                  )}
                </div>
              </div>

              {/* Liste agrégée */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-mayssa-brown/5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-mayssa-brown text-base flex items-center gap-2">
                      <FileText size={18} className="text-mayssa-caramel" />
                      Liste de production — <span className="capitalize">{datesLabel}</span>
                    </h3>
                    <p className="text-[11px] text-mayssa-brown/50 mt-0.5">
                      {totalOrders} commande{totalOrders !== 1 ? 's' : ''} concernée{totalOrders !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const lines = productionList.map(p => `${p.quantity}× ${p.name}`).join('\n')
                        navigator.clipboard.writeText(`Liste de production — ${datesLabel}\n\n${lines}`)
                        hapticFeedback('success')
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-caramel transition-colors cursor-pointer"
                    >
                      <ClipboardList size={14} />
                      Copier
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const doc = new jsPDF({ unit: 'mm', format: 'a4' })
                        const today = new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                        const totalPieces = productionList.reduce((s, p) => s + p.quantity, 0)

                        // En-tête
                        doc.setFont('helvetica', 'bold')
                        doc.setFontSize(20)
                        doc.text('Maison Mayssa', 20, 20)
                        doc.setFontSize(13)
                        doc.setFont('helvetica', 'normal')
                        doc.text(`Liste de production — ${datesLabel}`, 20, 30)
                        doc.setFontSize(9)
                        doc.setTextColor(120, 100, 80)
                        doc.text(`Généré le ${today} · ${totalOrders} commande${totalOrders !== 1 ? 's' : ''} · ${totalPieces} pièce${totalPieces !== 1 ? 's' : ''}`, 20, 37)

                        // Ligne séparatrice
                        doc.setDrawColor(196, 154, 108)
                        doc.setLineWidth(0.5)
                        doc.line(20, 41, 190, 41)

                        // Tableau
                        let y = 50
                        doc.setFontSize(10)
                        doc.setTextColor(80, 60, 40)
                        doc.setFont('helvetica', 'bold')
                        doc.text('Produit', 20, y)
                        doc.text('Cmds', 148, y, { align: 'right' })
                        doc.text('Qté', 190, y, { align: 'right' })
                        y += 5
                        doc.setDrawColor(220, 200, 180)
                        doc.setLineWidth(0.3)
                        doc.line(20, y, 190, y)
                        y += 6

                        doc.setFont('helvetica', 'normal')
                        for (const item of productionList) {
                          if (y > 270) {
                            doc.addPage()
                            y = 20
                          }
                          doc.setFontSize(10)
                          doc.setTextColor(60, 40, 20)
                          doc.text(item.name, 20, y)
                          doc.setTextColor(150, 120, 90)
                          doc.text(String(item.orders), 148, y, { align: 'right' })
                          doc.setFont('helvetica', 'bold')
                          doc.setTextColor(196, 154, 108)
                          doc.setFontSize(11)
                          doc.text(String(item.quantity), 190, y, { align: 'right' })
                          doc.setFont('helvetica', 'normal')
                          doc.setFontSize(10)
                          doc.setTextColor(60, 40, 20)
                          y += 7
                          doc.setDrawColor(240, 230, 220)
                          doc.setLineWidth(0.2)
                          doc.line(20, y - 1.5, 190, y - 1.5)
                        }

                        // Total
                        y += 3
                        doc.setDrawColor(196, 154, 108)
                        doc.setLineWidth(0.5)
                        doc.line(20, y, 190, y)
                        y += 6
                        doc.setFont('helvetica', 'bold')
                        doc.setFontSize(11)
                        doc.setTextColor(60, 40, 20)
                        doc.text('TOTAL PIÈCES', 20, y)
                        doc.setTextColor(196, 154, 108)
                        doc.setFontSize(14)
                        doc.text(String(totalPieces), 190, y, { align: 'right' })

                        const filename = `production-${[...selectedDates].sort().join('_')}.pdf`
                        doc.save(filename)
                        hapticFeedback('success')
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-caramel text-white text-xs font-bold hover:bg-mayssa-brown transition-colors cursor-pointer"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                  </div>
                </div>

                {productionList.length === 0 ? (
                  <div className="py-12 text-center rounded-xl bg-mayssa-soft/20 border border-mayssa-brown/5">
                    <Package size={40} className="mx-auto text-mayssa-brown/15 mb-3" />
                    <p className="text-sm font-medium text-mayssa-brown/60">Aucune commande pour cette sélection</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {productionList.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-3 rounded-xl bg-mayssa-soft/30 border border-mayssa-brown/5"
                      >
                        <span className="text-sm font-semibold text-mayssa-brown">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-mayssa-brown/40">{item.orders} cmd</span>
                          <span className="text-xl font-display font-bold text-mayssa-caramel w-10 text-right">{item.quantity}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-mayssa-brown/10">
                      <span className="text-xs font-bold text-mayssa-brown/60 uppercase tracking-wider">Total pièces</span>
                      <span className="text-2xl font-display font-bold text-mayssa-brown">
                        {productionList.reduce((s, p) => s + p.quantity, 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Détail par commande — groupé par date si multi-sélection */}
              {totalOrders > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-mayssa-brown/5 space-y-4">
                  <h4 className="font-bold text-mayssa-brown text-sm">Détail par commande</h4>
                  {[...selectedDates].sort().map(d => {
                    const dayOrders = Object.entries(orders)
                      .filter(([, o]) => o.requestedDate === d && o.status !== 'refusee' && o.status !== 'livree' && o.status !== 'validee' && o.status !== 'pret')
                      .sort(([, a], [, b]) => (a.requestedTime ?? '00:00').localeCompare(b.requestedTime ?? '00:00'))
                    if (dayOrders.length === 0) return null
                    const dayLabel = d === todayRetraitStr ? "Aujourd'hui" : d === tomorrowRetraitStr ? 'Demain' : parseDateYyyyMmDd(d).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' })
                    return (
                      <div key={d} className="space-y-2">
                        {selectedDates.size > 1 && (
                          <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-caramel capitalize">{dayLabel}</p>
                        )}
                        {dayOrders.map(([id, order]) => (
                          <div key={id} className="flex items-start gap-3 p-3 rounded-xl border border-mayssa-brown/10">
                            <div className="flex-shrink-0 text-center min-w-[44px]">
                              <p className="text-[10px] font-bold text-mayssa-caramel">{order.requestedTime ?? '—'}</p>
                              <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                order.status === 'en_preparation' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {order.status === 'en_preparation' ? 'Prépa' : 'Att.'}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-mayssa-brown">{order.customer?.firstName} {order.customer?.lastName}</p>
                              <p className="text-[10px] text-mayssa-brown/50">{order.deliveryMode === 'livraison' ? '🚗 Livraison' : '📍 Retrait'}</p>
                              <ul className="mt-1 space-y-0.5">
                                {order.items?.map((item, i) => (
                                  <li key={i} className="text-xs text-mayssa-brown">{item.quantity}× {formatOrderItemName(item)}</li>
                                ))}
                              </ul>
                            </div>
                            <span className="flex-shrink-0 font-bold text-sm text-mayssa-caramel">{(order.total ?? 0).toFixed(2).replace('.', ',')} €</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.section>
          )
        })()}

        {/* ===== PLANNING HEBDOMADAIRE ===== */}
        {tab === 'planning' && (() => {
          // Génère les 7 prochains jours (aujourd'hui inclus)
          const days: { dateStr: string; label: string; dayOrders: [string, Order][] }[] = []
          for (let i = 0; i < 7; i++) {
            const d = new Date()
            d.setDate(d.getDate() + i)
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
            const dayOrders = Object.entries(orders)
              .filter(([, o]) => o.requestedDate === dateStr && o.status !== 'refusee')
              .sort(([, a], [, b]) => (a.requestedTime ?? '00:00').localeCompare(b.requestedTime ?? '00:00'))
            days.push({ dateStr, label: dayName, dayOrders })
          }
          const totalWeek = days.reduce((s, d) => s + d.dayOrders.length, 0)
          const caWeek = days.reduce((s, d) => s + d.dayOrders.reduce((ss, [, o]) => ss + (o.total ?? 0), 0), 0)
          return (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* KPIs semaine */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">Commandes (7j)</span>
                  <p className="text-xl font-display font-bold text-mayssa-brown mt-0.5">{totalWeek}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">CA prévisionnel (7j)</span>
                  <p className="text-xl font-display font-bold text-mayssa-caramel mt-0.5">{caWeek.toFixed(2).replace('.', ',')} €</p>
                </div>
              </div>

              {/* Calendrier */}
              <div className="space-y-3">
                {days.map(({ dateStr, label, dayOrders }) => {
                  const isToday = dateStr === todayRetraitStr
                  const dayCA = dayOrders.reduce((s, [, o]) => s + (o.total ?? 0), 0)
                  return (
                    <div
                      key={dateStr}
                      className={`rounded-2xl border transition-all ${
                        isToday
                          ? 'border-mayssa-caramel/50 bg-mayssa-caramel/5 shadow-sm'
                          : 'border-mayssa-brown/10 bg-white'
                      }`}
                    >
                      {/* En-tête du jour */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-mayssa-brown/5">
                        <div className="flex items-center gap-2">
                          {isToday && <span className="w-2 h-2 rounded-full bg-mayssa-caramel" />}
                          <span className={`text-sm font-bold capitalize ${isToday ? 'text-mayssa-caramel' : 'text-mayssa-brown'}`}>
                            {label}
                          </span>
                          {isToday && <span className="text-[9px] font-bold uppercase tracking-wider bg-mayssa-caramel text-white px-1.5 py-0.5 rounded">Aujourd'hui</span>}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-mayssa-brown/50 font-bold">
                          {dayOrders.length > 0 && (
                            <>
                              <span>{dayOrders.length} cmd</span>
                              <span className="text-mayssa-caramel">{dayCA.toFixed(2).replace('.', ',')} €</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Créneaux du jour */}
                      {dayOrders.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-mayssa-brown/30 italic">Aucune commande</p>
                      ) : (
                        <div className="divide-y divide-mayssa-brown/5">
                          {dayOrders.map(([id, order]) => (
                            <div key={id} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="text-[10px] font-bold text-mayssa-brown/40 w-10 flex-shrink-0">{order.requestedTime ?? '—'}</span>
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                order.status === 'en_preparation' ? 'bg-blue-400' :
                                order.status === 'pret' ? 'bg-emerald-400' :
                                order.status === 'livree' || order.status === 'validee' ? 'bg-emerald-600' :
                                'bg-amber-400'
                              }`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-mayssa-brown truncate">
                                  {order.customer?.firstName} {order.customer?.lastName}
                                </p>
                                <p className="text-[10px] text-mayssa-brown/50 truncate">
                                  {order.items?.map(i => `${i.quantity}× ${formatOrderItemName(i)}`).join(', ')}
                                </p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-xs font-bold text-mayssa-caramel">{(order.total ?? 0).toFixed(2).replace('.', ',')} €</p>
                                <p className="text-[10px] text-mayssa-brown/40">{order.deliveryMode === 'livraison' ? '🚗' : '📍'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.section>
          )
        })()}

        {/* Edit order modal (toujours affiché si on édite, quel que soit l'onglet) */}
        {editingOrderId && orders[editingOrderId] && (
          <AdminEditOrderModal
            orderId={editingOrderId}
            order={orders[editingOrderId]}
            stock={stock}
            allProducts={allProducts}
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
