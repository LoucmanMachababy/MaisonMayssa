import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { jsPDF } from 'jspdf'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LogOut, Package, Plus, Calendar, Clock, RefreshCw, ClipboardList, Check, X, Trash2, AlertTriangle, Cake, Gift, ShoppingBag, Truck, MapPin, Users, Phone, History, TrendingUp, Pencil, Search, Download, Bell, MessageSquare, MessageCircle, Filter, XCircle, Star, Tag, FileText, LayoutDashboard, Copy, Eye, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCheck, ArrowRight, Settings, Moon, Sun, PanelLeftClose, PanelLeft, Menu, Percent } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { OrderStatus } from '../../lib/firebase'
import {
  adminLogin, adminLogout, onAuthChange,
  listenStock, updateStock, listenSettings, updateSettings,
  listenOrders, updateOrderStatus, deleteOrder, updateOrder,
  listenAllUsers, claimBirthdayGift, listenProductOverrides, deleteUserProfile,
  listenReviews, deleteReview,
  listenPromoCodes,
  listenNotifyWhenAvailable,
  isPreorderOpenNow, isTrompeLoeilProductId, getStockDecrementItems,
  releaseDeliverySlot, reserveDeliverySlot,
  uploadEventPosterImage,
  type StockMap, type Settings as SettingsType, type Order, type OrderSource, type UserProfile, type PreorderOpening, type Review, type PromoCodeRecord, type Poll, type NotifyWhenAvailableEntry,
  listenPolls
} from '../../lib/firebase'
import type { OrderItem } from '../../lib/firebase'
import type { ProductOverrideMap } from '../../types'
import {
  parseDateYyyyMmDd,
  formatOrderItemName,
  getNearestPreparationPickupDate,
  dayOffsetFromTodayToDate,
  expandOrderItemForProductionAggregate,
  normalizeOrderProductBaseId,
} from '../../lib/utils'
import { hapticFeedback } from '../../lib/haptics'
import { buildWhatsAppChatHref } from '../../lib/whatsappOpen'
import { exportSingleOrderPDF } from '../../lib/orderPrint'
import type { User } from 'firebase/auth'
import { useProducts } from '../../hooks/useProducts'
import { AdminProductsTab } from './AdminProductsTab'
import { AdminPlanningTab } from './AdminPlanningTab'
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
import { PRODUCTS, BOX_DECOUVERTE_TROMPE_PRODUCT_ID, isCustomizableTrompeBundleBoxId } from '../../constants'
import { AdminEditOrderModal } from './AdminEditOrderModal'
import { AdminEditReviewModal } from './AdminEditReviewModal'
import { AdminClientProfileModal } from './AdminClientProfileModal'
import { AdminNotificationsCenter } from './AdminNotificationsCenter'
import { AdminDailyReport } from './AdminDailyReport'
import { AdminWhatsAppDropdown } from './AdminWhatsAppDropdown'
import { getPinnedOrders, getPinnedClients, togglePinOrder, isOrderPinned } from '../../lib/adminPins'
import { formatOrderCustomerDisplayName } from '../../lib/orderCustomerDisplay'
import { getOrderDepositAmount, getOrderRemainingToPay, DEPOSIT_50_PERCENT_MIN_TOTAL_EUR } from '../../lib/orderAmounts'
import { AdminDeposit50Prompt } from './AdminDeposit50Prompt'
import { Pin } from 'lucide-react'

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DELIVERY_RADIUS_KM = 5

/** Numéro au format wa.me (33...) pour lien WhatsApp */
function phoneToWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('33') && digits.length >= 11) return digits
  if (digits.startsWith('0') && digits.length >= 10) return '33' + digits.slice(1)
  if (digits.length >= 9) return '33' + digits
  return digits
}

const GOOGLE_REVIEW_LINK = 'https://share.google/PsKmSr5Vx1VXqaNWx'

/** Message WhatsApp "commande validée" pré-rempli */
function buildValidatedMessage(order: Order): string {
  const prenom = order.customer?.firstName ?? 'vous'
  return (
    `Bonjour ${prenom},\n\n` +
    `Votre commande chez Maison Mayssa est bien validée ! 🎂✅\n\n` +
    `Nous vous contacterons dès qu'elle sera prête 😊`
  )
}

/** Message WhatsApp "commande prête" pré-rempli */
function buildReadyMessage(order: Order): string {
  const prenom = order.customer?.firstName ?? 'vous'
  const isDelivery = order.deliveryMode === 'livraison'
  if (isDelivery) {
    return (
      `Bonjour ${prenom},\n\n` +
      `Votre commande Maison Mayssa est prête et en cours de livraison ! 🛵\n\n` +
      `Merci de vous assurer d'être disponible pour la réception 😊`
    )
  }
  return (
    `Bonjour ${prenom},\n\n` +
    `Vous avez commandé des trompe-l'œil pour aujourd'hui chez Maison Mayssa. Votre commande sera prête à être récupérée à partir de 18h.\n\n` +
    `Merci de me préciser l'heure qui vous conviendrait pour le retrait 😊`
  )
}

/** Message WhatsApp "demande d'avis Google" pré-rempli */
function buildReviewMessage(order: Order): string {
  const prenom = order.customer?.firstName ?? 'vous'
  return (
    `Bonjour ${prenom},\n\n` +
    `Merci pour votre commande chez Maison Mayssa ! J'espère que vous vous êtes régalé(e) 😍🎂\n\n` +
    `Si vous avez un moment, un petit avis Google nous aiderait énormément :\n` +
    `👉 ${GOOGLE_REVIEW_LINK}\n\n` +
    `Merci pour votre confiance 🙏`
  )
}

/** Message WhatsApp Business — demande d'acompte 50 % (commandes ≥ 30 € en attente). */
const DEPOSIT_REQUEST_WHATSAPP_MESSAGE = [
  'Bonsoir 😊  ',
  'Merci beaucoup pour votre commande chez Maison Mayssa 💕  ',
  '',
  'Afin de valider votre commande, un acompte de 50% est demandé.  ',
  'Le reste sera à régler lors de la récupération.  ',
  '',
  'Vous pouvez effectuer l\'acompte via : virement bancaire ou PayPal ',
  '',
  'Une fois l\'acompte envoyé, votre commande sera confirmée.  ',
  'Retrait à l\'adresse suivante :  ',
  '📍 3 rue des Edelweiss, 74000 Annecy  ',
  '',
  'Merci pour votre confiance 🌸',
].join('\n')

function shouldShowDepositWhatsAppButton(order: Order): boolean {
  return (
    order.status === 'en_attente' &&
    (order.total ?? 0) >= DEPOSIT_50_PERCENT_MIN_TOTAL_EUR &&
    !!order.customer?.phone?.trim()
  )
}

function depositWhatsAppHref(order: Order): string {
  const phone = phoneToWhatsApp(order.customer!.phone!)
  return buildWhatsAppChatHref(phone, DEPOSIT_REQUEST_WHATSAPP_MESSAGE)
}

/** Message WhatsApp — commande confirmée, retrait sur place (en attente, pas livraison). */
const PICKUP_CONFIRMED_WHATSAPP_MESSAGE = [
  'Bonjour,',
  '',
  'Votre commande a bien été confirmée. Je vous attends au 3 rue des Edelweiss, 74000 Annecy, à l\'heure prévue.',
  '',
  'Merci à vous !',
  'Maison Mayssa',
].join('\n')

function shouldShowPickupRetraitConfirmedWhatsAppButton(order: Order): boolean {
  return (
    order.status === 'en_attente' &&
    order.deliveryMode === 'retrait' &&
    !!order.customer?.phone?.trim()
  )
}

function pickupRetraitConfirmedWhatsAppHref(order: Order): string {
  const phone = phoneToWhatsApp(order.customer!.phone!)
  return buildWhatsAppChatHref(phone, PICKUP_CONFIRMED_WHATSAPP_MESSAGE)
}

/** Message WhatsApp — commande confirmée, livraison (en attente, livraison uniquement). */
const DELIVERY_CONFIRMED_WHATSAPP_MESSAGE = [
  'Bonjour,',
  '',
  'Votre commande a bien été confirmée. À l\'heure de livraison que vous avez indiquée, vous serez livré(e) dans un créneau d\'une heure.',
  '',
  'Merci à vous !',
  'Maison Mayssa',
].join('\n')

function shouldShowDeliveryLivraisonConfirmedWhatsAppButton(order: Order): boolean {
  return (
    order.status === 'en_attente' &&
    order.deliveryMode === 'livraison' &&
    !!order.customer?.phone?.trim()
  )
}

function deliveryLivraisonConfirmedWhatsAppHref(order: Order): string {
  const phone = phoneToWhatsApp(order.customer!.phone!)
  return buildWhatsAppChatHref(phone, DELIVERY_CONFIRMED_WHATSAPP_MESSAGE)
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
  const header = ['Date', 'Heure', 'Client', 'Téléphone', 'Source', 'Statut', 'Mode', 'Adresse', 'Distance km', 'Date retrait', 'Note client', 'Articles', 'Frais livr.', 'Total (€)', 'Acompte (€)', 'Reste à régler (€)'].join(SEP)
  const rows = entries.map(([, o]) => {
    const date = o.createdAt ? new Date(o.createdAt) : null
    const dateStr = date ? date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
    const timeStr = date ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
    const client = formatOrderCustomerDisplayName(o)
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
    const ac = getOrderDepositAmount(o).toFixed(2).replace('.', ',')
    const reste = getOrderRemainingToPay(o).toFixed(2).replace('.', ',')
    return [dateStr, timeStr, client, phone, source, status, mode, `"${adresse}"`, distanceKm, retrait, `"${clientNote}"`, `"${items.replace(/"/g, '""')}"`, deliveryFee, total, ac, reste].join(SEP)
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

    const client = formatOrderCustomerDisplayName(o)
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
    lineY += 5
    const depPdf = getOrderDepositAmount(o)
    if (depPdf > 0) {
      doc.setFont('helvetica', 'normal')
      doc.text('Acompte versé: −' + depPdf.toFixed(2).replace('.', ',') + ' €', margin + 3, lineY)
      lineY += 5
      doc.setFont('helvetica', 'bold')
      doc.text('Reste à régler: ' + getOrderRemainingToPay(o).toFixed(2).replace('.', ',') + ' €', margin + 3, lineY)
      lineY += 5
    }

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
  const [settings, setSettings] = useState<SettingsType>({ preorderDays: [3, 6], preorderMessage: '' })
  const [orders, setOrders] = useState<Record<string, Order>>({})
  const [reviews, setReviews] = useState<Record<string, Review>>({})
  const [tab, setTab] = useState<'resume' | 'commandes' | 'historique' | 'planning_detail' | 'livraison' | 'retrait' | 'ca' | 'avis' | 'stock' | 'jours' | 'creneaux' | 'anniversaires' | 'inscrits' | 'produits' | 'promos' | 'sondage' | 'rappels' | 'abonnes' | 'alertes' | 'carte' | 'sessions' | 'production' | 'planning' | 'livret' | 'catalogue' | 'clients' | 'reglages'>('resume')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showDailyReport, setShowDailyReport] = useState(false)
  const [selectedClientUid, setSelectedClientUid] = useState<string | null>(null)
  const [livraisonMode, setLivraisonMode] = useState<'livraison' | 'retrait'>('livraison')
  const [catalogueSection, setCatalogueSection] = useState<'stock' | 'produits' | 'promos'>('stock')
  const [clientsSection, setClientsSection] = useState<'inscrits' | 'avis' | 'anniversaires' | 'alertes' | 'abonnes'>('inscrits')
  const [reglagesSection, setReglagesSection] = useState<'jours' | 'creneaux' | 'rappels'>('jours')
  const [caPeriod, setCaPeriod] = useState<'jour' | 'semaine' | 'mois'>('semaine')
  const [allUsers, setAllUsers] = useState<Record<string, UserProfile>>({})
  const [productOverrides, setProductOverrides] = useState<ProductOverrideMap>({})
  const [promoCodes, setPromoCodes] = useState<Record<string, PromoCodeRecord>>({})
  const [polls, setPolls] = useState<Record<string, Poll>>({})
  const [notifyWhenAvailableEntries, setNotifyWhenAvailableEntries] = useState<Record<string, NotifyWhenAvailableEntry>>({})
  const { allProducts } = useProducts()
  const [showOffSiteForm, setShowOffSiteForm] = useState(false)
  const [offSitePresetClient, setOffSitePresetClient] = useState<{ uid: string; firstName: string; lastName: string; phone: string; email?: string; address?: string } | null>(null)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
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
  /** Confirmation de refus avec choix de remettre ou non le stock */
  const [refuseConfirm, setRefuseConfirm] = useState<{
    orderId: string
    order: Order
    isDuplicate: boolean
  } | null>(null)
  /** Modale message WhatsApp (copier / ouvrir l’app) — acompte ou retrait confirmé */
  const [whatsappMessageModal, setWhatsappMessageModal] = useState<{
    title: string
    message: string
    waHref: string
    /** Numéro client à copier (iPhone : ouvrir WhatsApp Business → nouvelle discussion → coller) */
    customerPhone: string
  } | null>(null)
  const [whatsappCopyFeedback, setWhatsappCopyFeedback] = useState<'message' | 'phone' | null>(null)
  /** Planning : dates pour lesquelles le bloc "À produire" est replié (vide = tout ouvert par défaut) */
  const [planningProductionCollapsed, setPlanningProductionCollapsed] = useState<Set<string>>(new Set())
  /** Planning : production cumulée — liste détaillée (KPI toujours visibles en dessous) */
  const [planningCumulOpen, setPlanningCumulOpen] = useState(true)
  /** Planning : bitmask des jours sélectionnés pour la prod cumulée (bit i = jour i du planning). Défaut 0b011 = auj+demain. */
  const [planningCumulDays, setPlanningCumulDays] = useState(0b0000011)
  /** Planning : jours repliés en mode "rideau" (dateStr) */
  const [planningDaysCollapsed, setPlanningDaysCollapsed] = useState<Set<string>>(new Set())
  /** Planning : recherche par prénom */
  const [planningSearchQuery, setPlanningSearchQuery] = useState('')
  const bulkValidateRef = useRef<HTMLDivElement>(null)
  /** Décalage en jours pour la fenêtre de planning (0 = aujourd'hui, -10 = 10 jours en arrière) */
  const [planningDayOffset, setPlanningDayOffset] = useState(0)
  /** Filtre statut sur le planning calendrier (défaut : en préparation) */
  const [planningOrderStatusFilter, setPlanningOrderStatusFilter] = useState<OrderStatus | 'all'>('en_preparation')
  const [eventPosterUploading, setEventPosterUploading] = useState(false)
  /** Dates sélectionnées pour l'onglet Production (Set vide = aujourd'hui par défaut) */
  const [productionDates, setProductionDates] = useState<Set<string>>(new Set([]))
  /** Recherche globale (nom, téléphone, n° commande) */
  const [globalSearch, setGlobalSearch] = useState('')
  /** Mode de l'onglet Planning/Historique : calendrier à venir | liste historique */
  const [historiqueMode, setHistoriqueMode] = useState<'calendrier' | 'liste'>('calendrier')
  /** Menu validation en masse ouvert */
  const [bulkValidateOpen, setBulkValidateOpen] = useState(false)
  /** Pins (rafraîchir pour forcer re-render) */
  const [pinsVersion, setPinsVersion] = useState(0)
  const pinnedOrderIds = useMemo(() => getPinnedOrders(), [pinsVersion])
  const pinnedClientPhones = useMemo(() => getPinnedClients(), [pinsVersion])
  /** Dark mode admin (persisté en localStorage) */
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('admin-dark') === '1' } catch { return false }
  })
  /** Sidebar repliée (desktop) */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  /** Sidebar ouverte sur mobile (drawer) */
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

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

  // Persister le dark mode
  useEffect(() => {
    try { localStorage.setItem('admin-dark', darkMode ? '1' : '0') } catch { /* ignore */ }
  }, [darkMode])

  // Fermer le menu validation en masse au clic extérieur
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (bulkValidateRef.current && !bulkValidateRef.current.contains(e.target as Node)) setBulkValidateOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
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

  /** Résultats de la recherche globale (nom, téléphone, n° commande) */
  const globalSearchResults = useMemo((): [string, Order][] => {
    const q = globalSearch.trim().toLowerCase()
    if (q.length < 2) return []
    return Object.entries(orders)
      .filter(([, o]) => {
        const display = formatOrderCustomerDisplayName(o).toLowerCase()
        const phone = (o.customer?.phone ?? '').replace(/[\s\-().+]/g, '')
        const orderNum = o.orderNumber != null ? String(o.orderNumber) : ''
        const handle = (o.customer?.contactHandle ?? '').toLowerCase()
        return display.includes(q) || phone.includes(q) || orderNum.includes(q) || handle.includes(q)
      })
      .sort(([, a], [, b]) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 8)
  }, [orders, globalSearch])

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

  const handleRefuseOrder = async (orderId: string, order: Order, restoreStock = true) => {
    await updateOrderStatus(orderId, 'refusee')
    if (order.deliveryMode === 'livraison' && order.requestedDate && order.requestedTime) {
      releaseDeliverySlot(order.requestedDate, order.requestedTime).catch(console.error)
    }
    if (!restoreStock) return
    // Restaurer le stock de tous les produits décrémentés à la commande.
    // Pour les trompe-l'œil : skip si excludeTrompeLoeilStock=true (hors-site sans déduction)
    for (const item of order.items) {
      const pairs = getStockDecrementItems(item.productId ?? '', item.quantity ?? 1, PRODUCTS, {
        trompeDiscoverySelection: item.trompeDiscoverySelection,
      })
      for (const pair of pairs) {
        const isTrompe = isTrompeLoeilProductId(pair.productId)
        if (isTrompe && (order.excludeTrompeLoeilStock === true || item.excludeTrompeStock === true)) continue
        if (pair.productId in stock) {
          const currentQty = stock[pair.productId] ?? 0
          await updateStock(pair.productId, currentQty + pair.quantity)
        }
      }
    }
  }

  /** Détecte si une commande est probablement un doublon : même numéro de téléphone + autre
   * commande active (non refusée) créée le même jour. */
  const isDuplicateOrder = (orderId: string, order: Order): boolean => {
    const phone = order.customer?.phone?.replace(/\D/g, '')
    if (!phone || phone.length < 8) return false
    const dayStart = new Date(order.createdAt ?? 0)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = dayStart.getTime() + 86400000
    return Object.entries(orders).some(([id, o]) =>
      id !== orderId &&
      o.status !== 'refusee' &&
      o.customer?.phone?.replace(/\D/g, '') === phone &&
      (o.createdAt ?? 0) >= dayStart.getTime() &&
      (o.createdAt ?? 0) < dayEnd
    )
  }

  /** Ouvre la confirmation de refus (avec détection de doublon). */
  const triggerRefuseOrder = (orderId: string, order: Order) => {
    setRefuseConfirm({ orderId, order, isDuplicate: isDuplicateOrder(orderId, order) })
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

  const handlePlanningDateTimeChange = async (orderId: string, order: Order, newDate: string, newTime: string) => {
    const requestedDate = newDate || order.requestedDate || ''
    const requestedTime = newTime || order.requestedTime || ''
    if (!requestedDate || !requestedTime) return
    if (order.deliveryMode === 'livraison' && order.requestedDate && order.requestedTime) {
      releaseDeliverySlot(order.requestedDate, order.requestedTime).catch(console.error)
    }
    await updateOrder(orderId, { requestedDate, requestedTime })
    if (order.deliveryMode === 'livraison' && requestedDate && requestedTime) {
      reserveDeliverySlot(requestedDate, requestedTime).catch(console.error)
    }
  }

  const handleLogout = async () => {
    await adminLogout()
    window.location.hash = ''
  }

  const today = new Date().getDay()
  const isPreorderDay = isPreorderOpenNow(openings)

  // Filtre par recherche (nom, téléphone, pseudo) et dates
  const matchesSearch = (o: Order) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    const display = formatOrderCustomerDisplayName(o).toLowerCase()
    const phone = (o.customer?.phone ?? '').replace(/\s/g, '')
    const handle = (o.customer?.contactHandle ?? '').toLowerCase()
    const qClean = q.replace(/\s/g, '')
    return display.includes(q) || phone.includes(qClean) || handle.includes(q)
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

  const planningCalendarActive = tab === 'planning' || (tab === 'historique' && historiqueMode === 'calendrier')
  const prevPlanningCalendarActiveRef = useRef(false)
  const planningCalendarPendingOffsetRef = useRef(false)

  useEffect(() => {
    const wasActive = prevPlanningCalendarActiveRef.current
    prevPlanningCalendarActiveRef.current = planningCalendarActive

    if (!planningCalendarActive) {
      planningCalendarPendingOffsetRef.current = false
      return
    }

    if (!wasActive) {
      setPlanningOrderStatusFilter('en_preparation')
      planningCalendarPendingOffsetRef.current = true
      if (Object.keys(orders).length > 0) {
        const target = getNearestPreparationPickupDate(orders)
        setPlanningDayOffset(dayOffsetFromTodayToDate(target))
        planningCalendarPendingOffsetRef.current = false
      }
      return
    }

    if (planningCalendarPendingOffsetRef.current && Object.keys(orders).length > 0) {
      const target = getNearestPreparationPickupDate(orders)
      setPlanningDayOffset(dayOffsetFromTodayToDate(target))
      planningCalendarPendingOffsetRef.current = false
    }
  }, [planningCalendarActive, orders])

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
    if ((historiqueVue === 'a_traiter' || historiqueVue === 'a_faire') && trompeLoeilFilter) {
      result = result.filter(([, o]) =>
        o.items?.some((item) => {
          const pairs = getStockDecrementItems(item.productId ?? '', item.quantity ?? 1, PRODUCTS, {
            trompeDiscoverySelection: item.trompeDiscoverySelection,
          })
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

  // Récap trompes l'œil à préparer (vue Historique > À traiter ou À faire)
  const trompeLoeilSummary = useMemo(() => {
    if (historiqueVue !== 'a_traiter' && historiqueVue !== 'a_faire') return [] as { name: string; quantity: number }[]

    const map = new Map<string, number>()

    for (const [, order] of sortedOrders) {
      if (historiqueVue === 'a_traiter') {
        if (order.status !== 'en_preparation' && order.status !== 'validee') continue
        if (order.status === 'validee' && order.requestedDate && order.requestedDate < todayRetraitStr) continue
      } else {
        if (order.status !== 'en_attente') continue
      }

      for (const item of order.items ?? []) {
        const pairs = getStockDecrementItems(item.productId ?? '', item.quantity ?? 1, PRODUCTS, {
          trompeDiscoverySelection: item.trompeDiscoverySelection,
        })
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
        const base = normalizeOrderProductBaseId(item.productId)
        const key =
          (base === BOX_DECOUVERTE_TROMPE_PRODUCT_ID || isCustomizableTrompeBundleBoxId(base)) &&
          item.trompeDiscoverySelection?.length
            ? `${base}:${[...item.trompeDiscoverySelection].sort().join(',')}`
            : base || item.productId || item.name || 'Inconnu'
        const display = formatOrderItemName(item)
        const short = display.length > 25 ? display.slice(0, 22) + '…' : display
        if (!counts[key]) counts[key] = { name: short, qty: 0, ca: 0 }
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
        const base = normalizeOrderProductBaseId(item.productId)
        const key =
          (base === BOX_DECOUVERTE_TROMPE_PRODUCT_ID || isCustomizableTrompeBundleBoxId(base)) &&
          item.trompeDiscoverySelection?.length
            ? `${base}:${[...item.trompeDiscoverySelection].sort().join(',')}`
            : base || item.productId || item.name || 'Inconnu'
        const display = formatOrderItemName(item)
        const short = display.length > 20 ? display.slice(0, 17) + '…' : display
        if (!counts[key]) counts[key] = { name: short, qty: 0 }
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
        const id = (item.productId ?? '').toLowerCase()
        const baseLower = normalizeOrderProductBaseId(item.productId).toLowerCase()
        const cat = id.startsWith('brownie-') ? 'Brownies'
          : id.startsWith('cookie-') ? 'Cookies'
          : id.startsWith('layer-') ? 'Layer Cups'
          : id.startsWith('trompe-loeil-') || id === 'box-trompe-loeil' || id === 'box-fruitee' || id === 'box-de-tout' || baseLower === BOX_DECOUVERTE_TROMPE_PRODUCT_ID ? "Trompe l'œil"
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

  // Comparaison semaine vs semaine précédente
  const comparaisonSemaine = useMemo(() => {
    const n = new Date()
    const startOfWeek = new Date(n)
    startOfWeek.setDate(n.getDate() - n.getDay() + (n.getDay() === 0 ? -6 : 1))
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    const startOfLastWeek = new Date(startOfWeek)
    startOfLastWeek.setDate(startOfWeek.getDate() - 7)
    const endOfLastWeek = new Date(startOfWeek)
    endOfLastWeek.setDate(startOfWeek.getDate() - 1)
    endOfLastWeek.setHours(23, 59, 59, 999)
    const caCetteSemaine = caOrders
      .filter(o => o.createdAt && o.createdAt >= startOfWeek.getTime() && o.createdAt <= endOfWeek.getTime())
      .reduce((s, o) => s + (o.total ?? 0), 0)
    const caSemainePrec = caOrders
      .filter(o => o.createdAt && o.createdAt >= startOfLastWeek.getTime() && o.createdAt <= endOfLastWeek.getTime())
      .reduce((s, o) => s + (o.total ?? 0), 0)
    if (caSemainePrec === 0) return { delta: caCetteSemaine, pct: null }
    const pct = Math.round(((caCetteSemaine - caSemainePrec) / caSemainePrec) * 100)
    return { delta: caCetteSemaine - caSemainePrec, pct }
  }, [caOrders])

  // Top produits par période (jour, semaine, mois)
  const topProduitsByPeriod = useMemo(() => {
    const n = new Date()
    const periods = {
      jour: { start: new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(), end: Date.now() },
      semaine: { start: (() => { const d = new Date(n); d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)); d.setHours(0, 0, 0, 0); return d.getTime() })(), end: Date.now() },
      mois: { start: new Date(n.getFullYear(), n.getMonth(), 1).getTime(), end: Date.now() },
    } as const
    const result: Record<'jour' | 'semaine' | 'mois', { name: string; qty: number }[]> = { jour: [], semaine: [], mois: [] }
    for (const [period, { start, end }] of Object.entries(periods)) {
      const map: Record<string, { name: string; qty: number }> = {}
      for (const o of caOrders) {
        if (!o.createdAt || o.createdAt < start || o.createdAt > end) continue
        for (const item of o.items ?? []) {
          const key = item.productId ?? item.name
          const name = formatOrderItemName(item)
          if (!map[key]) map[key] = { name, qty: 0 }
          map[key].qty += item.quantity
        }
      }
      result[period as keyof typeof result] = Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 10)
    }
    return result
  }, [caOrders])

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

  // CA heure par heure (aujourd'hui)
  const caHourlyData = useMemo(() => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const todayOrders = validatedOrders.filter(o => {
      if (!o.createdAt) return false
      const d = new Date(o.createdAt)
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return s === todayStr
    })
    const byHour: Record<number, number> = {}
    for (let h = 0; h < 24; h++) byHour[h] = 0
    for (const o of todayOrders) {
      const h = new Date(o.createdAt!).getHours()
      byHour[h] = (byHour[h] ?? 0) + (o.total ?? 0)
    }
    return Array.from({ length: Math.min(now.getHours() + 2, 24) }, (_, i) => ({
      heure: `${i}h`,
      ca: Math.round((byHour[i] ?? 0) * 100) / 100,
    }))
  }, [validatedOrders])

  // Dernières 5 commandes (flux temps réel)
  const last5Orders = useMemo(() => {
    return Object.entries(orders)
      .filter(([, o]) => !['refusee'].includes(o.status))
      .sort(([, a], [, b]) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 5)
  }, [orders])

  // Commandes urgentes (retrait dans < 2h)
  const urgentOrders = useMemo(() => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const twoHoursFromNow = now.getTime() + 2 * 60 * 60 * 1000
    return Object.entries(orders)
      .filter(([, o]) => {
        if (!['en_attente', 'en_preparation'].includes(o.status)) return false
        if (!o.requestedDate || !o.requestedTime) return false
        if (o.requestedDate !== todayStr) return false
        const [h, m] = (o.requestedTime ?? '23:59').split(':').map(Number)
        const pickup = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime()
        return pickup <= twoHoursFromNow && pickup >= now.getTime()
      })
      .sort(([, a], [, b]) => {
        const ta = a.requestedTime ?? '23:59'
        const tb = b.requestedTime ?? '23:59'
        return ta.localeCompare(tb)
      })
  }, [orders])

  const isDark = darkMode
  const navItems: { id: string; icon: typeof LayoutDashboard; label: string; badge?: number }[] = [
    { id: 'resume', icon: LayoutDashboard, label: 'Résumé' },
    { id: 'commandes', icon: ClipboardList, label: 'À valider', badge: pendingCount },
    { id: 'historique', icon: Calendar, label: 'Planning' },
    { id: 'livret', icon: Truck, label: 'Journalier', badge: Object.values(orders).filter(o => o.status === 'en_preparation').length },
    { id: 'ca', icon: TrendingUp, label: 'Analytics' },
    { id: 'catalogue', icon: Package, label: 'Carte' },
    { id: 'clients', icon: Users, label: 'Clients' },
    { id: 'reglages', icon: Settings, label: 'Options' },
  ]

  return (
    <div
      className={cn(
        'min-h-dvh min-h-[100dvh] flex',
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-[#fdfaf8] bg-mesh text-mayssa-brown',
      )}
    >
      {/* Overlay mobile sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          sidebarMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarMobileOpen(false)}
        aria-hidden="true"
      />
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-dvh max-h-[100dvh] flex flex-col border-r transition-all duration-300',
          'pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]',
          'lg:translate-x-0',
          sidebarMobileOpen ? 'w-[min(18rem,calc(100vw-1rem))]' : (sidebarCollapsed ? 'w-16' : 'w-56'),
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white/95 backdrop-blur-xl border-mayssa-brown/5',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-3 sm:p-3 border-b border-inherit min-h-[52px]">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', isDark ? 'bg-mayssa-gold/20' : 'bg-mayssa-brown')}>
                <LayoutDashboard size={16} className={isDark ? 'text-mayssa-gold' : 'text-white'} />
              </div>
              <span className="text-xs font-bold truncate">Admin</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSidebarMobileOpen(false)}
              className={cn(
                'min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl transition-colors lg:hidden',
                isDark ? 'hover:bg-zinc-800' : 'hover:bg-mayssa-brown/5',
              )}
              title="Fermer"
              aria-label="Fermer le menu"
            >
              <X size={22} />
            </button>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((s) => !s)}
              className={cn('p-1.5 rounded-lg transition-colors hidden lg:block', isDark ? 'hover:bg-zinc-800' : 'hover:bg-mayssa-brown/5')}
              title={sidebarCollapsed ? 'Ouvrir' : 'Replier'}
            >
              {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto overscroll-y-contain py-2 space-y-0.5 touch-pan-y">
          {navItems.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id as any); setSidebarMobileOpen(false) }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3.5 text-left transition-all lg:py-2.5 min-h-[48px] lg:min-h-0',
                sidebarCollapsed ? 'justify-center px-0' : '',
                tab === t.id
                  ? isDark ? 'bg-mayssa-gold/20 text-mayssa-gold border-r-2 border-mayssa-gold' : 'bg-mayssa-brown/10 text-mayssa-brown border-r-2 border-mayssa-brown'
                  : isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-mayssa-brown/60 hover:bg-mayssa-brown/5 hover:text-mayssa-brown'
              )}
            >
              <t.icon size={18} strokeWidth={2.5} className="flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="text-xs font-bold truncate flex-1">{t.label}</span>
                  {t.badge !== undefined && t.badge > 0 && (
                    <span className={cn('flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-black px-1', isDark ? 'bg-red-500/80 text-white' : 'bg-red-500 text-white')}>
                      {t.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
          {/* Favoris / Pins */}
          {(pinnedOrderIds.length > 0 || pinnedClientPhones.length > 0) && !sidebarCollapsed && (
            <div className="mt-2 pt-2 border-t border-inherit">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/40">Favoris</p>
              {pinnedOrderIds.slice(0, 5).map((id) => {
                const o = orders[id]
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setTab('historique'); setEditingOrderId(id); setSidebarMobileOpen(false) }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-left text-[10px] hover:bg-mayssa-brown/5"
                  >
                    <span className="truncate">#{o?.orderNumber ?? id.slice(-6)}</span>
                    <Pin size={10} className="text-mayssa-gold flex-shrink-0" fill="currentColor" />
                  </button>
                )
              })}
              {pinnedClientPhones.slice(0, 3).map((phone) => {
                const match = Object.entries(allUsers).find(([, u]) => u.phone?.replace(/\D/g, '') === phone)
                return (
                  <button
                    key={phone}
                    type="button"
                    onClick={() => { if (match) { setTab('clients'); setSelectedClientUid(match[0]); setSidebarMobileOpen(false) } }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-left text-[10px] hover:bg-mayssa-brown/5"
                  >
                    <span className="truncate">{match ? `${match[1].firstName} ${match[1].lastName}` : phone}</span>
                    <Pin size={10} className="text-mayssa-gold flex-shrink-0" fill="currentColor" />
                  </button>
                )
              })}
            </div>
          )}
        </nav>
        <div className="p-2 border-t border-inherit pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3.5 rounded-lg transition-colors lg:py-2.5 min-h-[48px] lg:min-h-0',
              sidebarCollapsed ? 'justify-center px-0' : '',
              isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-mayssa-brown/60 hover:bg-mayssa-brown/5'
            )}
            title={isDark ? 'Mode clair' : 'Mode sombre'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {!sidebarCollapsed && <span className="text-xs font-bold">{isDark ? 'Clair' : 'Sombre'}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 ml-0 w-full min-h-0',
          /* Mobile : une seule colonne scrollable (évite le body qui « saute » et garde header + recherche visibles) */
          'max-lg:h-dvh max-lg:max-h-dvh max-lg:overflow-hidden',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56',
        )}
      >
      {/* Header premium admin */}
      <header
        className={cn(
          'sticky top-0 z-30 flex-shrink-0 max-lg:relative max-lg:shrink-0 pt-[env(safe-area-inset-top,0px)]',
          isDark ? 'bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800' : 'bg-white/90 backdrop-blur-2xl border-b border-mayssa-brown/5 shadow-sm',
        )}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 basis-[min(100%,14rem)] sm:basis-auto sm:flex-initial">
            <button
              type="button"
              onClick={() => setSidebarMobileOpen(true)}
              className={cn(
                'lg:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl transition-colors shrink-0',
                isDark ? 'hover:bg-zinc-800' : 'hover:bg-mayssa-brown/5',
              )}
              title="Menu"
              aria-label="Ouvrir le menu"
            >
              <Menu size={24} className={isDark ? 'text-zinc-300' : 'text-mayssa-brown'} />
            </button>
            <div className={cn('h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0', isDark ? 'bg-mayssa-gold/20' : 'bg-mayssa-brown')}>
              <LayoutDashboard size={18} className={isDark ? 'text-mayssa-gold' : 'text-white'} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={cn('text-xs sm:text-sm font-display font-bold tracking-tight truncate', isDark ? 'text-zinc-100' : 'text-mayssa-brown')}>
                Maison Mayssa Admin
              </h1>
              <p className={cn('text-[9px] sm:text-[10px] tabular-nums truncate max-w-[55vw] sm:max-w-[240px] md:max-w-md', isDark ? 'text-zinc-500' : 'text-mayssa-brown/40')}>
                {user.email}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className={cn(
            'flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex-shrink-0 min-h-9',
            settings.ordersOpen === false
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          )}>
            <span className={cn('h-1.5 w-1.5 rounded-full', settings.ordersOpen === false ? 'bg-red-500' : 'bg-emerald-500 animate-pulse')} />
            {settings.ordersOpen === false ? 'Fermé' : 'Ouvert'}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
            {/* Daily report button */}
            <button
              onClick={() => setShowDailyReport(true)}
              className="flex items-center justify-center gap-1.5 min-h-11 min-w-11 sm:min-w-0 px-2.5 sm:px-3 sm:py-2 rounded-xl bg-mayssa-gold/10 text-mayssa-gold text-[10px] font-black uppercase tracking-wider hover:bg-mayssa-gold/20 transition-all cursor-pointer border border-mayssa-gold/20"
              title="Rapport journalier"
            >
              <FileText size={16} className="sm:shrink-0" />
              <span className="hidden sm:inline">Rapport</span>
            </button>

            {/* Notifications bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(s => !s)}
                className={cn(
                  'relative min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl transition-all duration-300 border cursor-pointer',
                  showNotifications
                    ? 'bg-mayssa-brown text-white border-mayssa-brown'
                    : 'bg-mayssa-brown/5 text-mayssa-brown/60 border-mayssa-brown/10 hover:bg-mayssa-brown/10'
                )}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={18} fill={soundEnabled ? 'currentColor' : 'none'} />
              </button>
              <AdminNotificationsCenter
                orders={orders}
                stock={stock}
                allUsers={allUsers}
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onNavigate={(t) => setTab(t as any)}
              />
            </div>

            {/* Sound toggle */}
            <button
              onClick={() => {
                if (soundEnabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
                  Notification.requestPermission()
                }
                setSoundEnabled((s) => !s)
              }}
              className={cn(
                'min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl transition-all duration-300 border cursor-pointer text-lg',
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-mayssa-brown/5 text-mayssa-brown/30 border-mayssa-brown/10'
              )}
              title={soundEnabled ? 'Son activé' : 'Son coupé'}
              aria-label={soundEnabled ? 'Son activé' : 'Son coupé'}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>

            <button
              onClick={handleLogout}
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-mayssa-brown/40 hover:text-red-500 hover:bg-red-50 transition-all duration-300 border border-transparent hover:border-red-200 cursor-pointer"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Recherche globale */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-8 relative z-30 flex-shrink-0 max-lg:shrink-0 w-full min-w-0">
        <div className="relative group w-full min-w-0">
          <Search size={18} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-mayssa-brown/30 group-focus-within:text-mayssa-gold transition-colors pointer-events-none z-[1]" />
          <input
            type="search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Client, tél. ou n° commande…"
            aria-label="Rechercher un client, un numéro de téléphone ou un numéro de commande"
            title="Rechercher un client, un numéro de téléphone ou un numéro de commande"
            className={cn(
              'w-full min-w-0 rounded-[2rem] pl-11 sm:pl-12 pr-11 sm:pr-12 py-3.5 sm:py-4 text-base sm:text-sm font-medium backdrop-blur-xl shadow-premium-shadow focus:outline-none focus:ring-2 focus:ring-mayssa-gold/20 focus:border-mayssa-gold transition-all',
              isDark ? 'border border-zinc-700 bg-zinc-800/80 text-zinc-100 placeholder:text-zinc-500' : 'border border-mayssa-brown/10 text-mayssa-brown placeholder:text-mayssa-brown/30 bg-white/80'
            )}
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-mayssa-brown/30 hover:text-mayssa-brown transition-all"
            >
              <X size={18} />
            </button>
          )}

          {/* Résultats de recherche en direct */}
          <AnimatePresence>
            {globalSearchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className={cn(
                'absolute top-full left-0 right-0 mt-3 p-2 backdrop-blur-2xl rounded-3xl shadow-2xl z-[60] overflow-hidden',
                isDark ? 'bg-zinc-800/95 border border-zinc-700' : 'bg-white/95 border border-white/50'
              )}
              >
                <div className="max-h-[min(400px,70vh)] overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {globalSearchResults.map(([id, order]) => (
                    <button
                      key={id}
                      onClick={() => {
                        setTab('historique')
                        setEditingOrderId(id)
                        setGlobalSearch('')
                      }}
                      className={cn(
                        'w-full flex items-center justify-between p-4 rounded-2xl transition-colors text-left group',
                        isDark ? 'hover:bg-zinc-700/50' : 'hover:bg-mayssa-soft/50'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-mayssa-soft text-mayssa-brown')}>
                          {order.deliveryMode === 'livraison' ? <Truck size={18} /> : <MapPin size={18} />}
                        </div>
                        <div>
                          <p className={cn('text-sm font-bold', isDark ? 'text-zinc-200' : 'text-mayssa-brown')}>
                            {formatOrderCustomerDisplayName(order)}
                          </p>
                          <p className={cn('text-[10px] font-medium', isDark ? 'text-zinc-500' : 'text-mayssa-brown/50')}>
                            {order.orderNumber ? `#${order.orderNumber}` : 'Sans numéro'} • {new Date(order.createdAt ?? 0).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-black text-mayssa-gold">{order.total?.toFixed(0)}€</span>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg",
                          order.status === 'en_attente' ? "bg-amber-100 text-amber-600" :
                          order.status === 'en_preparation' ? "bg-blue-100 text-blue-600" :
                          order.status === 'pret' ? "bg-emerald-100 text-emerald-600" : "bg-mayssa-brown/5 text-mayssa-brown/40"
                        )}>
                          {order.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <main
        className={cn(
          'w-full max-w-full md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-5 py-4 space-y-4 flex-1 overflow-x-hidden',
          'max-lg:min-h-0 max-lg:overflow-y-auto max-lg:overscroll-y-contain touch-pan-y',
          'pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1rem))]',
          isDark ? '' : '',
        )}
      >
        {/* Status banner */}
        <div className={cn(
          'rounded-2xl p-4 text-center shadow-sm',
          settings.ordersOpen === false ? (isDark ? 'bg-red-950/40 border border-red-800' : 'bg-red-50 border border-red-200') :
          isPreorderDay ? (isDark ? 'bg-emerald-950/40 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200') :
          (isDark ? 'bg-amber-950/40 border border-amber-800' : 'bg-amber-50 border border-amber-200')
        )}>
          <p className={cn(
            'text-sm font-bold',
            settings.ordersOpen === false ? (isDark ? 'text-red-300' : 'text-red-800') :
            isPreorderDay ? (isDark ? 'text-emerald-300' : 'text-emerald-800') :
            (isDark ? 'text-amber-300' : 'text-amber-800')
          )}>
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
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
          const endOfToday = startOfToday + 86400000 - 1
          const caJour = validatedOrders.filter(o => o.createdAt != null && o.createdAt >= startOfToday && o.createdAt <= endOfToday).reduce((s, o) => s + (o.total ?? 0), 0)
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <button
                      type="button"
                      onClick={() => setTab('commandes')}
                      className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium-shadow border border-white hover:border-mayssa-gold transition-all duration-700 text-left group"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-mayssa-brown/30 group-hover:text-mayssa-gold transition-all">Commandes</span>
                      <p className={cn("text-4xl font-display font-bold mt-3", pendingCount > 0 ? "text-amber-600" : "text-mayssa-brown")}>{pendingCount}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-mayssa-gold mt-6 flex items-center gap-2">Actions Requises <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" /></p>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTab('historique'); setHistoriqueVue('a_traiter') }}
                      className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium-shadow border border-white hover:border-blue-400 transition-all duration-700 text-left group"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-mayssa-brown/30 group-hover:text-blue-500 transition-all">Atelier</span>
                      <p className={cn("text-4xl font-display font-bold mt-3", preparationCount > 0 ? "text-blue-600" : "text-mayssa-brown")}>{preparationCount}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-6 flex items-center gap-2">En Préparation <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" /></p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('ca')}
                      className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium-shadow border border-white hover:border-mayssa-gold transition-all duration-700 text-left group"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-mayssa-brown/30 group-hover:text-mayssa-gold transition-all">Performance</span>
                      <p className="text-4xl font-display font-bold text-mayssa-gold mt-3 font-numeric">{caJour.toFixed(0)}€</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-mayssa-brown/30 mt-6">Aujourd'hui</p>
                    </button>
                  </div>
                )
              })()}

              {/* Alertes urgentes (retrait dans < 2h) */}
              {urgentOrders.length > 0 && (
                <div className={cn(
                  'rounded-2xl p-4 border-2 animate-pulse',
                  isDark ? 'bg-amber-950/50 border-amber-600/50' : 'bg-amber-50 border-amber-300'
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={18} className="text-amber-600" />
                    <span className={cn('text-sm font-bold', isDark ? 'text-amber-400' : 'text-amber-800')}>
                      {urgentOrders.length} commande{urgentOrders.length > 1 ? 's' : ''} urgente{urgentOrders.length > 1 ? 's' : ''} — retrait dans moins de 2h
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {urgentOrders.slice(0, 5).map(([id, o]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setTab('historique'); setEditingOrderId(id) }}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold transition-colors',
                          isDark ? 'bg-amber-900/50 text-amber-200 hover:bg-amber-800/50' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        )}
                      >
                        {formatOrderCustomerDisplayName(o)} — {o.requestedTime}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CA heure par heure + Flux 5 commandes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* CA heure par heure */}
                <div className={cn(
                  'rounded-2xl p-4 shadow-sm border',
                  isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-white border-mayssa-brown/5'
                )}>
                  <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3', isDark ? 'text-zinc-400' : 'text-mayssa-brown/50')}>
                    CA du jour (heure par heure)
                  </h3>
                  {caHourlyData.length > 0 ? (
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={caHourlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#52525b' : '#e4e4e7'} />
                          <XAxis dataKey="heure" tick={{ fontSize: 10 }} stroke={isDark ? '#a1a1aa' : '#71717a'} />
                          <YAxis tick={{ fontSize: 10 }} stroke={isDark ? '#a1a1aa' : '#71717a'} />
                          <Tooltip
                            contentStyle={isDark ? { backgroundColor: '#27272a', border: '1px solid #3f3f46' } : undefined}
                            formatter={(v) => [v != null ? `${v}€` : '0€', 'CA']}
                          />
                          <Line type="monotone" dataKey="ca" stroke="#C5A059" strokeWidth={2} dot={{ fill: '#C5A059' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className={cn('text-sm', isDark ? 'text-zinc-500' : 'text-mayssa-brown/50')}>Aucune vente aujourd'hui</p>
                  )}
                </div>
                {/* Flux 5 dernières commandes */}
                <div className={cn(
                  'rounded-2xl p-4 shadow-sm border',
                  isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-white border-mayssa-brown/5'
                )}>
                  <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3', isDark ? 'text-zinc-400' : 'text-mayssa-brown/50')}>
                    Dernières commandes
                  </h3>
                  {last5Orders.length === 0 ? (
                    <p className={cn('text-sm', isDark ? 'text-zinc-500' : 'text-mayssa-brown/50')}>Aucune commande</p>
                  ) : (
                    <div className="space-y-2">
                      {last5Orders.map(([id, o]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => { setTab('historique'); setEditingOrderId(id) }}
                          className={cn(
                            'w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors',
                            isDark ? 'hover:bg-zinc-700/50' : 'hover:bg-mayssa-soft/50'
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-xs font-bold truncate', isDark ? 'text-zinc-200' : 'text-mayssa-brown')}>
                              {formatOrderCustomerDisplayName(o)}
                            </p>
                            <p className={cn('text-[10px]', isDark ? 'text-zinc-500' : 'text-mayssa-brown/50')}>
                              {new Date(o.createdAt ?? 0).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={cn('text-xs font-bold flex-shrink-0', isDark ? 'text-mayssa-gold' : 'text-mayssa-brown')}>
                            {o.total?.toFixed(0)}€
                          </span>
                          <span className={cn(
                            'ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0',
                            o.status === 'en_attente' ? 'bg-amber-500/20 text-amber-400' :
                            o.status === 'en_preparation' ? 'bg-blue-500/20 text-blue-400' :
                            o.status === 'pret' ? 'bg-emerald-500/20 text-emerald-400' :
                            isDark ? 'bg-zinc-600 text-zinc-300' : 'bg-mayssa-brown/10 text-mayssa-brown/70'
                          )}>
                            {o.status === 'en_attente' ? 'Att.' : o.status === 'en_preparation' ? 'Prépa' : o.status === 'pret' ? 'Prête' : 'OK'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
                  <>
                  {/* Vue produits à préparer (quantités totales) */}
                  {(() => {
                    const prodMap: Record<string, { name: string; qty: number }> = {}
                    for (const [, o] of ordersPourPrepDate) {
                      if (o.status === 'refusee') continue
                      for (const item of o.items ?? []) {
                        const q = item.quantity ?? 1
                        for (const row of expandOrderItemForProductionAggregate({ ...item, quantity: q })) {
                          const key = row.aggregateKey
                          if (!prodMap[key]) prodMap[key] = { name: row.label, qty: 0 }
                          prodMap[key].qty += row.quantity
                        }
                      }
                    }
                    const prodList = Object.values(prodMap).sort((a, b) => b.qty - a.qty)
                    return (
                      <div className="mb-4 p-3 rounded-xl bg-mayssa-gold/5 border border-mayssa-gold/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2">Produits à préparer ({prodList.reduce((s, p) => s + p.qty, 0)} pièces)</p>
                        <div className="flex flex-wrap gap-2">
                          {prodList.map((p, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-mayssa-brown/10 text-xs font-bold text-mayssa-brown">
                              {p.qty}× {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                  <ul className="space-y-2">
                    {ordersPourPrepDate.map(([id, order]) => {
                      const client = formatOrderCustomerDisplayName(order)
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
                            {/* Checklist */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {[
                                { key: 'stockChecked' as const, label: 'Stock', icon: Package },
                                { key: 'messageSent' as const, label: 'Msg', icon: MessageCircle },
                                { key: 'ready' as const, label: 'Prêt', icon: Check },
                              ].map(({ key, label, icon: Icon }) => {
                                const val = order.adminChecklist?.[key] ?? false
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => updateOrder(id, {
                                      adminChecklist: {
                                        ...order.adminChecklist,
                                        [key]: !val,
                                      },
                                    })}
                                    className={cn(
                                      'flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors',
                                      val ? 'bg-emerald-100 text-emerald-700' : 'bg-mayssa-brown/5 text-mayssa-brown/50'
                                    )}
                                  >
                                    <Icon size={10} />
                                    {label}
                                  </button>
                                )
                              })}
                            </div>
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
                  </>
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
                  onClick={() => { setOffSitePresetClient(null); setShowOffSiteForm(true) }}
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
                    placeholder="Nom, téléphone ou pseudo..."
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
                      <div className="relative" ref={bulkValidateRef}>
                        <button
                          type="button"
                          onClick={() => setBulkValidateOpen((o) => !o)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                        >
                          Tout valider <ChevronDown size={12} className={cn('transition-transform', bulkValidateOpen && 'rotate-180')} />
                        </button>
                        <AnimatePresence>
                          {bulkValidateOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute left-0 top-full mt-1 py-1.5 rounded-xl shadow-xl border border-mayssa-brown/10 bg-white z-50 min-w-[220px]"
                            >
                              {[
                                { key: 'all', label: 'Tout valider', filter: (ids: string[]) => ids },
                                { key: 'no_zone', label: 'Sauf hors zone', filter: (ids: string[]) => ids.filter(id => {
                                  const o = orders[id]
                                  if (!o || o.deliveryMode !== 'livraison') return true
                                  const km = o.distanceKm
                                  return km != null && km <= DELIVERY_RADIUS_KM
                                })},
                                { key: 'no_creneau', label: 'Sauf sans créneau', filter: (ids: string[]) => ids.filter(id => {
                                  const o = orders[id]
                                  return o && o.requestedDate && o.requestedTime
                                })},
                              ].map(({ key, label, filter }) => {
                                const toValidate = filter(ordersToValidate.map(([id]) => id))
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={async () => {
                                      setBulkValidateOpen(false)
                                      if (toValidate.length === 0) return
                                      if (!window.confirm(`Valider ${toValidate.length} commande(s) ?`)) return
                                      for (const id of toValidate) {
                                        const o = orders[id]
                                        if (o) await handleValidateOrder(id, o)
                                      }
                                      setSelectedPendingIds(new Set())
                                    }}
                                    disabled={toValidate.length === 0}
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-mayssa-brown hover:bg-mayssa-soft disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {label} ({toValidate.length})
                                  </button>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
                    <button
                      type="button"
                      onClick={() => { togglePinOrder(id); setPinsVersion(v => v + 1) }}
                      className={cn('p-1.5 rounded-lg transition-colors', isOrderPinned(id) ? 'text-mayssa-gold' : 'text-mayssa-brown/30 hover:text-mayssa-brown/60')}
                      title={isOrderPinned(id) ? 'Retirer des favoris' : 'Épingler'}
                    >
                      <Pin size={14} fill={isOrderPinned(id) ? 'currentColor' : 'none'} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-mayssa-brown/50 uppercase tracking-wider mb-0.5">
                        Commande {order.orderNumber != null ? `#${order.orderNumber}` : `#${id.slice(-8)}`}
                      </p>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-mayssa-brown">
                          {formatOrderCustomerDisplayName(order)}
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
                      {(order.customer?.phone || order.customer?.contactHandle) && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-mayssa-brown/50 flex items-center gap-1">
                            <Phone size={10} />
                            {order.customer.phone || (order.customer.contactPlatform ? `${order.customer.contactPlatform === 'snap' ? 'snap' : 'insta'}: ${order.customer.contactHandle}` : order.customer.contactHandle)}
                          </p>
                          {(orderSource === 'whatsapp' && order.customer?.phone) && (
                            <AdminWhatsAppDropdown order={order} variant="compact" darkMode={isDark} />
                          )}
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText((order.customer?.phone || order.customer?.contactHandle || '').toString()); }}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-mayssa-brown/10 text-mayssa-brown text-[9px] font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
                            title={order.customer?.phone ? 'Copier le numéro' : 'Copier le pseudo'}
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
                      <span className="text-xs font-bold text-mayssa-brown">Total TTC</span>
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
                    {getOrderDepositAmount(order) > 0 && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-mayssa-brown/10">
                        <span className="text-mayssa-brown/70">Acompte versé</span>
                        <span className="font-bold text-mayssa-brown">
                          −{getOrderDepositAmount(order).toFixed(2).replace('.', ',')} €
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs pt-1 mt-0.5 font-bold text-amber-800 border-t border-mayssa-brown/10">
                      <span>Reste à régler</span>
                      <span className="font-numeric text-sm">
                        {getOrderRemainingToPay(order).toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <AdminDeposit50Prompt orderId={id} order={order} variant={isDark ? 'dark' : 'light'} />
                  </div>

                  {/* Actions — zones tactiles plus hautes sur mobile */}
                  <div className="flex flex-wrap gap-2 touch-manipulation max-sm:[&_button]:min-h-12 max-sm:[&_button]:shrink-0 max-sm:[&_a]:min-h-12 max-sm:[&_a]:inline-flex max-sm:[&_a]:items-center">
                    <button
                      onClick={() => { hapticFeedback('light'); exportSingleOrderPDF(order, id) }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-brown/10 text-mayssa-brown text-xs font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
                      title="Télécharger le bon de commande en PDF"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                    {(orderSource === 'whatsapp' && order.customer?.phone) && (
                      <AdminWhatsAppDropdown order={order} variant="full" darkMode={isDark} />
                    )}
                    {shouldShowDepositWhatsAppButton(order) && (
                      <button
                        type="button"
                        onClick={() => {
                          hapticFeedback('light')
                          setWhatsappCopyFeedback(null)
                          setWhatsappMessageModal({
                            title: 'Message WhatsApp — acompte 50 %',
                            message: DEPOSIT_REQUEST_WHATSAPP_MESSAGE,
                            waHref: depositWhatsAppHref(order),
                            customerPhone: order.customer!.phone!.trim(),
                          })
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
                        title="Copier le message ou ouvrir WhatsApp"
                      >
                        <MessageCircle size={14} />
                        Acompte 50 %
                      </button>
                    )}
                    {shouldShowPickupRetraitConfirmedWhatsAppButton(order) && (
                      <button
                        type="button"
                        onClick={() => {
                          hapticFeedback('light')
                          setWhatsappCopyFeedback(null)
                          setWhatsappMessageModal({
                            title: 'Message WhatsApp — retrait confirmé',
                            message: PICKUP_CONFIRMED_WHATSAPP_MESSAGE,
                            waHref: pickupRetraitConfirmedWhatsAppHref(order),
                            customerPhone: order.customer!.phone!.trim(),
                          })
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors cursor-pointer shadow-sm"
                        title="Copier le message ou ouvrir WhatsApp"
                      >
                        <MapPin size={14} />
                        Retrait confirmé
                      </button>
                    )}
                    {shouldShowDeliveryLivraisonConfirmedWhatsAppButton(order) && (
                      <button
                        type="button"
                        onClick={() => {
                          hapticFeedback('light')
                          setWhatsappCopyFeedback(null)
                          setWhatsappMessageModal({
                            title: 'Message WhatsApp — livraison confirmée',
                            message: DELIVERY_CONFIRMED_WHATSAPP_MESSAGE,
                            waHref: deliveryLivraisonConfirmedWhatsAppHref(order),
                            customerPhone: order.customer!.phone!.trim(),
                          })
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors cursor-pointer shadow-sm"
                        title="Copier le message ou ouvrir WhatsApp (Business sur Android si installé)"
                      >
                        <Truck size={14} />
                        Livraison confirmée
                      </button>
                    )}
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
                          onClick={() => triggerRefuseOrder(id, order)}
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

          </motion.section>
        )}

        {/* ===== TOGGLE PLANNING / HISTORIQUE ===== */}
        {tab === 'historique' && (
          <div className="flex gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-mayssa-brown/5">
            {([
              { id: 'calendrier' as const, icon: LayoutDashboard, label: '📅 Planning' },
              { id: 'liste' as const, icon: History, label: '📋 Historique' },
            ] as const).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setHistoriqueMode(m.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  historiqueMode === m.id ? 'bg-mayssa-brown text-white shadow-md' : 'text-mayssa-brown/60 hover:bg-mayssa-soft/80'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* ===== HISTORIQUE DES COMMANDES (mode liste) ===== */}
        {tab === 'historique' && historiqueMode === 'liste' && (
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
                        onClick={() => { setHistoriqueVue(t.vue); if (t.vue !== 'a_traiter' && t.vue !== 'a_faire') setTrompeLoeilFilter(null) }}
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
                {(historiqueVue === 'a_traiter' || historiqueVue === 'a_faire') && trompeLoeilSummary.length > 0 && (
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
                    placeholder="Nom, téléphone ou pseudo..."
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
                              {formatOrderCustomerDisplayName(order)}
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
                          {(order.customer?.phone || order.customer?.contactHandle) && (
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <p className="text-[10px] text-mayssa-brown/50 flex items-center gap-1">
                                <Phone size={10} />
                                {order.customer.phone || (order.customer.contactPlatform ? `${order.customer.contactPlatform === 'snap' ? 'snap' : 'insta'}: ${order.customer.contactHandle}` : order.customer.contactHandle)}
                              </p>
                              {(orderSource === 'whatsapp' && order.customer?.phone) && (
                                <a
                                  href={buildWhatsAppChatHref(phoneToWhatsApp(order.customer.phone), '')}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-500 text-white text-[9px] font-bold hover:bg-green-600 transition-colors"
                                  title="Ouvrir WhatsApp"
                                >
                                  <MessageCircle size={10} />
                                  WhatsApp
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => { navigator.clipboard.writeText((order.customer?.phone || order.customer?.contactHandle || '').toString()); }}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-mayssa-brown/10 text-mayssa-brown text-[9px] font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
                                title={order.customer?.phone ? 'Copier le numéro' : 'Copier le pseudo'}
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
                          <span className="text-xs font-bold text-mayssa-brown">Total TTC</span>
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
                        {getOrderDepositAmount(order) > 0 && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-mayssa-brown/10">
                            <span className="text-mayssa-brown/70">Acompte versé</span>
                            <span className="font-bold text-mayssa-brown">
                              −{getOrderDepositAmount(order).toFixed(2).replace('.', ',')} €
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs pt-1 mt-0.5 font-bold text-amber-800 border-t border-mayssa-brown/10">
                          <span>Reste à régler</span>
                          <span className="font-numeric text-sm">
                            {getOrderRemainingToPay(order).toFixed(2).replace('.', ',')} €
                          </span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <AdminDeposit50Prompt orderId={id} order={order} variant="light" />
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
                        {(orderSource === 'whatsapp' && order.customer?.phone) && (() => {
                          const prenom = order.customer?.firstName ?? ''
                          const ref = order.orderNumber ? `#${order.orderNumber}` : ''
                          const msgs: Record<string, string> = {
                            en_attente: `Bonjour ${prenom} 👋 Votre commande ${ref} a bien été reçue chez Maison Mayssa ! Nous la validons. Merci de votre confiance. L'adresse vous sera donnée 24h avant 🙂`,
                            en_preparation: `Bonjour ${prenom} 👋 Votre commande ${ref} est en cours de préparation chez Maison Mayssa 🍰`,
                            pret: `Bonjour ${prenom} ✅ Votre commande ${ref} est prête ! Vous pouvez venir la récupérer dès maintenant chez Maison Mayssa 🎁\n\nSi vous avez apprécié, un petit avis Google nous aiderait énormément 🙏⭐ → https://share.google/hWmuK4HB8Bcp69KWC\n\nMerci et à bientôt 🍪`,
                            livree: `Bonjour ${prenom} 🚗 Votre commande ${ref} est en route, notre livreur arrive bientôt !\n\nSi vous avez apprécié, un petit avis Google nous aiderait énormément 🙏⭐ → https://share.google/hWmuK4HB8Bcp69KWC\n\nMerci et à bientôt 🍪`,
                            validee: `Bonjour ${prenom} ✅ Votre commande ${ref} est confirmée. Merci pour votre commande chez Maison Mayssa 🍪`,
                            refusee: `Bonjour ${prenom}, malheureusement nous ne pouvons pas honorer votre commande ${ref} pour le moment. N'hésitez pas à nous recontacter pour reprogrammer 🙏`,
                          }
                          const msg = msgs[order.status] ?? msgs['en_attente']
                          return (
                            <a
                              href={buildWhatsAppChatHref(phoneToWhatsApp(order.customer.phone), msg)}
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
                            onClick={() => triggerRefuseOrder(id, order)}
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

        {/* ===== VUE JOURNALIÈRE (planning détaillé) ===== */}
        {tab === 'planning_detail' && (
          <AdminPlanningTab
            orders={orders}
            onEditOrder={(id) => setEditingOrderId(id)}
          />
        )}

        {/* ===== LIVRET (Livraison + Retrait fusionnés) ===== */}
        {tab === 'livret' && (() => {
          const delivInPrep = Object.values(orders).filter(o => o.deliveryMode === 'livraison' && o.status === 'en_preparation').length
          const retrInPrep = Object.values(orders).filter(o => o.deliveryMode === 'retrait' && o.status === 'en_preparation').length
          return (
            <div className="space-y-4">
              <div className="flex gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-mayssa-brown/5">
                {([
                  { id: 'livraison' as const, icon: Truck, label: 'Livraison', badge: delivInPrep },
                  { id: 'retrait' as const, icon: MapPin, label: 'Retrait', badge: retrInPrep },
                ] as const).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setLivraisonMode(s.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      livraisonMode === s.id ? 'bg-mayssa-brown text-white shadow-md' : 'text-mayssa-brown/60 hover:bg-mayssa-soft/80'
                    }`}
                  >
                    <s.icon size={14} />
                    {s.label}
                    {s.badge > 0 && (
                      <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{s.badge}</span>
                    )}
                  </button>
                ))}
              </div>
              <AdminLivraisonTab orders={orders} onEditOrder={(id) => setEditingOrderId(id)} mode={livraisonMode} />
            </div>
          )
        })()}

        {/* ===== LIVRAISON / RETRAIT (onglets individuels conservés) ===== */}
        {tab === 'livraison' && (
          <AdminLivraisonTab orders={orders} onEditOrder={(id) => setEditingOrderId(id)} mode="livraison" />
        )}
        {tab === 'retrait' && (
          <AdminLivraisonTab orders={orders} onEditOrder={(id) => setEditingOrderId(id)} mode="retrait" />
        )}

        {/* ===== CHIFFRE D'AFFAIRES ===== */}
        {tab === 'ca' && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Header Analytics */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium-shadow border border-white flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 text-mayssa-gold mb-2">
                  <TrendingUp size={24} strokeWidth={2.5} />
                  <h3 className="font-display font-bold text-2xl text-mayssa-brown tracking-tight">Performance Globale</h3>
                </div>
                <p className="text-xs font-medium text-mayssa-brown/40 uppercase tracking-widest">Analyse de votre activité commerciale</p>
              </div>
              <div className="flex items-center gap-4 bg-mayssa-soft/30 p-2 rounded-2xl border border-mayssa-brown/5">
                {(['jour', 'semaine', 'mois'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCaPeriod(p)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      caPeriod === p 
                        ? "bg-mayssa-brown text-mayssa-gold shadow-lg" 
                        : "text-mayssa-brown/40 hover:text-mayssa-brown hover:bg-white"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-premium-shadow border border-white hover:border-mayssa-gold transition-all group">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mayssa-brown/30 group-hover:text-mayssa-gold transition-colors">Chiffre d'Affaires</p>
                <p className="text-3xl font-display font-bold text-mayssa-brown mt-4">{caTotal.toFixed(0)}<span className="text-mayssa-gold text-lg ml-1">€</span></p>
                <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 w-fit px-3 py-1 rounded-full">
                  <TrendingUp size={10} />
                  Total validé + livré
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-premium-shadow border border-white hover:border-emerald-400 transition-all group">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mayssa-brown/30 group-hover:text-emerald-500 transition-colors">Panier Moyen</p>
                <p className="text-3xl font-display font-bold text-mayssa-brown mt-4">
                  {caOrders.length > 0 ? (caTotal / caOrders.length).toFixed(1) : '0'}<span className="text-emerald-500 text-lg ml-1">€</span>
                </p>
                <p className="mt-6 text-[10px] font-bold text-mayssa-brown/40 uppercase tracking-widest">Sur {caOrders.length} commandes</p>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-premium-shadow border border-white hover:border-mayssa-gold transition-all group">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mayssa-brown/30 group-hover:text-mayssa-gold transition-colors">Ventes Mois</p>
                <p className="text-3xl font-display font-bold text-mayssa-gold mt-4">{caMois.toFixed(0)}<span className="text-mayssa-brown text-lg ml-1">€</span></p>
                {croissanceMois !== null && (
                  <div className={cn(
                    "mt-6 flex items-center gap-2 text-[10px] font-bold w-fit px-3 py-1 rounded-full",
                    croissanceMois >= 0 ? "text-emerald-600 bg-emerald-500/10" : "text-rose-600 bg-rose-500/10"
                  )}>
                    {croissanceMois >= 0 ? '+' : ''}{croissanceMois}% vs mois dernier
                  </div>
                )}
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-premium-shadow border border-white hover:border-blue-400 transition-all group">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mayssa-brown/30 group-hover:text-blue-500 transition-colors">Activité Semaine</p>
                <p className="text-3xl font-display font-bold text-blue-600 mt-4">{caSemaine.toFixed(0)}<span className="text-mayssa-brown text-lg ml-1">€</span></p>
                {comparaisonSemaine.pct !== null && (
                  <div className={cn(
                    "mt-6 flex items-center gap-2 text-[10px] font-bold w-fit px-3 py-1 rounded-full",
                    comparaisonSemaine.pct >= 0 ? "text-emerald-600 bg-emerald-500/10" : "text-rose-600 bg-rose-500/10"
                  )}>
                    {comparaisonSemaine.pct >= 0 ? '+' : ''}{comparaisonSemaine.pct}% vs sem. dernière
                  </div>
                )}
                <p className="mt-2 text-[10px] font-bold text-mayssa-brown/40 uppercase tracking-widest">Semaine en cours</p>
              </div>
            </div>

            {/* Top produits par période */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium-shadow border border-white">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-mayssa-brown/40 mb-4">Produits les plus vendus</p>
              <div className="flex gap-2 mb-4">
                {(['jour', 'semaine', 'mois'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCaPeriod(p)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase",
                      caPeriod === p ? "bg-mayssa-brown text-mayssa-gold" : "bg-mayssa-brown/5 text-mayssa-brown/60 hover:bg-mayssa-brown/10"
                    )}
                  >
                    {p === 'jour' ? "Aujourd'hui" : p === 'semaine' ? 'Semaine' : 'Mois'}
                  </button>
                ))}
              </div>
              {topProduitsByPeriod[caPeriod].length === 0 ? (
                <p className="text-sm text-mayssa-brown/50">Aucune vente sur cette période</p>
              ) : (
                <ul className="space-y-2">
                  {topProduitsByPeriod[caPeriod].map((p, i) => (
                    <li key={i} className="flex items-center justify-between py-2 border-b border-mayssa-brown/5 last:border-0">
                      <span className="text-sm font-medium text-mayssa-brown">{i + 1}. {p.name}</span>
                      <span className="text-sm font-bold text-mayssa-gold">{p.qty} vendu{p.qty > 1 ? 's' : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Secondary Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution par Source */}
              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium-shadow border border-white">
                <div className="flex items-center justify-between mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-mayssa-brown/40">Distribution par Canal</p>
                  <MessageSquare size={16} className="text-mayssa-gold" />
                </div>
                <div className="space-y-4">
                  {(['site', 'whatsapp', 'instagram', 'snap'] as const).map((src) => {
                    const ordersSrc = caOrders.filter((o) => (o.source ?? 'site') === src)
                    const totalSrc = ordersSrc.reduce((s, o) => s + (o.total ?? 0), 0)
                    const percent = caTotal > 0 ? (totalSrc / caTotal) * 100 : 0
                    const label = src.toUpperCase()
                    const color = src === 'whatsapp' ? 'bg-emerald-500' : src === 'instagram' ? 'bg-rose-500' : src === 'snap' ? 'bg-amber-400' : 'bg-mayssa-brown'
                    
                    return (
                      <div key={src} className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-black tracking-widest">
                          <span className="text-mayssa-brown/60">{label}</span>
                          <span className="text-mayssa-brown font-numeric">{totalSrc.toFixed(0)}€ <span className="text-mayssa-brown/30 ml-2">({ordersSrc.length} cmd)</span></span>
                        </div>
                        <div className="h-3 w-full bg-mayssa-brown/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={cn("h-full rounded-full transition-all", color)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Meilleure Journée d'hier / historique */}
              <div className="bg-gradient-to-br from-mayssa-brown to-mayssa-brown/90 rounded-[2.5rem] p-8 shadow-premium-shadow border border-mayssa-brown/10 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-mayssa-gold/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-mayssa-gold mb-6">
                      <Star size={20} fill="currentColor" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Record Historique</p>
                    </div>
                    {meilleurJour ? (
                      <>
                        <p className="text-5xl font-display font-medium mb-4">{meilleurJour.ca.toFixed(0)}<span className="text-mayssa-gold text-2xl ml-1">€</span></p>
                        <p className="text-sm font-light text-white/60 tracking-wide uppercase italic">{meilleurJour.label}</p>
                      </>
                    ) : (
                      <p className="text-sm text-white/50 italic">Pas encore de données...</p>
                    )}
                  </div>
                  <div className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-mayssa-gold mb-2">Conseil Stratégique</p>
                    <p className="text-xs text-white/70 leading-relaxed font-light">Le panier moyen est en augmentation. Pensez à proposer des offres par lots sur les Trompe-l'œil pour booster les ventes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Courbe CA */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium-shadow border border-white">
              <div className="flex items-center justify-between mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-mayssa-brown/40">Courbe de Croissance</p>
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

        {/* ===== CLIENTS (Inscrits + Avis + Anniv + Alertes + Abonnés fusionnés) ===== */}
        {tab === 'clients' && (
          <div className="flex flex-wrap gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-mayssa-brown/5">
            {([
              { id: 'inscrits' as const, icon: Users, label: 'Inscrits', badge: Object.keys(allUsers).length },
              { id: 'avis' as const, icon: Star, label: 'Avis', badge: Object.keys(reviews).length },
              { id: 'anniversaires' as const, icon: Cake, label: 'Anniv.', badge: upcomingBirthdays.filter(b => !b.claimed).length },
              { id: 'alertes' as const, icon: Bell, label: 'Alertes', badge: Object.keys(notifyWhenAvailableEntries).length },
              { id: 'abonnes' as const, icon: Gift, label: 'Abonnés', badge: 0 },
            ] as const).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setClientsSection(s.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  clientsSection === s.id ? 'bg-mayssa-brown text-white shadow-md' : 'text-mayssa-brown/60 hover:bg-mayssa-soft/80'
                }`}
              >
                <s.icon size={13} />
                {s.label}
                {s.badge > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${clientsSection === s.id ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>{s.badge}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ===== AVIS ===== */}
        {(tab === 'avis' || (tab === 'clients' && clientsSection === 'avis')) && (
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
                    <li key={id} className="flex items-start gap-2 p-3 rounded-xl bg-mayssa-soft/30 border border-mayssa-brown/5 text-sm group">
                      <span className="font-bold text-mayssa-caramel shrink-0">{r.rating}/5</span>
                      {r.comment && <span className="text-mayssa-brown/80 flex-1 line-clamp-2 min-w-0">&laquo; {r.comment} &raquo;</span>}
                      {r.authorName && <span className="text-mayssa-brown/60 shrink-0">— {r.authorName}</span>}
                      <span className="text-[10px] text-mayssa-brown/40 shrink-0">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''}
                      </span>
                      <div className="flex shrink-0 gap-1 opacity-70 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => { hapticFeedback('light'); setEditingReviewId(id) }}
                          className="p-1.5 rounded-lg text-mayssa-caramel hover:bg-mayssa-soft transition-colors"
                          title="Modifier l'avis"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm('Supprimer cet avis ?')) {
                              hapticFeedback('light')
                              try {
                                await deleteReview(id)
                              } catch (err) {
                                console.error('Erreur suppression avis:', err)
                                alert('Impossible de supprimer l\'avis.')
                              }
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Supprimer l'avis"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </motion.section>
        )}

        {/* ===== CATALOGUE (Stock + Produits + Promos fusionnés) ===== */}
        {tab === 'catalogue' && (
          <div className="space-y-4">
            <div className="flex gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-mayssa-brown/5">
              {([
                { id: 'stock' as const, icon: Package, label: 'Stock' },
                { id: 'produits' as const, icon: ShoppingBag, label: 'Produits' },
                { id: 'promos' as const, icon: Tag, label: 'Promos' },
              ] as const).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCatalogueSection(s.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    catalogueSection === s.id ? 'bg-mayssa-brown text-white shadow-md' : 'text-mayssa-brown/60 hover:bg-mayssa-soft/80'
                  }`}
                >
                  <s.icon size={14} />
                  {s.label}
                </button>
              ))}
            </div>
            {catalogueSection === 'stock' && (
              <AdminStockTab
                allProducts={allProducts}
                stock={stock}
                boxDecouverteTrompeExcludedIds={settings.boxDecouverteTrompeExcludedIds ?? []}
              />
            )}
            {catalogueSection === 'produits' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <AdminProductsTab
                  allProducts={allProducts}
                  overrides={productOverrides}
                  boxDecouverteTrompeExcludedIds={settings.boxDecouverteTrompeExcludedIds ?? []}
                />
              </motion.div>
            )}
            {catalogueSection === 'promos' && <AdminPromosTab promoCodes={promoCodes} />}
          </div>
        )}

        {/* ===== STOCK ===== */}
        {tab === 'stock' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AdminStockTab
              allProducts={allProducts}
              stock={stock}
              boxDecouverteTrompeExcludedIds={settings.boxDecouverteTrompeExcludedIds ?? []}
            />
          </motion.div>
        )}

        {/* ===== RÉGLAGES (Jours + Créneaux + Rappels fusionnés) ===== */}
        {tab === 'reglages' && (
          <div className="flex gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-mayssa-brown/5">
            {([
              { id: 'jours' as const, icon: Calendar, label: 'Jours & ouverture' },
              { id: 'creneaux' as const, icon: Clock, label: 'Créneaux' },
              { id: 'rappels' as const, icon: Bell, label: 'Rappels' },
            ] as const).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setReglagesSection(s.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reglagesSection === s.id ? 'bg-mayssa-brown text-white shadow-md' : 'text-mayssa-brown/60 hover:bg-mayssa-soft/80'
                }`}
              >
                <s.icon size={14} />
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* ===== JOURS (horaires précommandes trompe-l'œil) ===== */}
        {(tab === 'jours' || (tab === 'reglages' && reglagesSection === 'jours')) && (
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

            {/* Mode événement (stand / event) */}
            <div className={`rounded-xl p-4 border-2 ${settings.eventModeEnabled ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-mayssa-brown">
                    {settings.eventModeEnabled ? 'Mode événement activé' : 'Mode événement désactivé'}
                  </p>
                  <p className="text-[10px] text-mayssa-brown/60 mt-0.5">
                    Quand activé, le site affiche “Précommandes fermées cette semaine” + ton message (et bloque les boutons commander).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.eventModeEnabled
                    // Quand on active un événement, on ferme les commandes automatiquement.
                    // Quand on désactive, on ré-ouvre automatiquement (tu peux re-fermer ensuite si besoin).
                    updateSettings({
                      eventModeEnabled: next,
                      ...(next ? { ordersOpen: false } : { ordersOpen: true }),
                    })
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    settings.eventModeEnabled
                      ? 'bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  {settings.eventModeEnabled ? 'Désactiver l’événement' : 'Activer un événement'}
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <textarea
                  value={settings.eventModeMessage ?? ''}
                  onChange={e => updateSettings({ eventModeMessage: e.target.value })}
                  placeholder="Ex : Cette semaine je suis en stand : Salon X (adresse), samedi 14h–19h. Venez directement sur place 🙂"
                  rows={3}
                  className="w-full rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs text-mayssa-brown resize-none focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                />
                <p className="text-[10px] text-mayssa-brown/40">
                  Astuce : mets l’adresse + horaires + où te trouver sur le stand.
                </p>
              </div>

              {/* Affiche (optionnelle) */}
              <div className="mt-4 rounded-xl border border-mayssa-brown/10 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm font-bold text-mayssa-brown">Affiche de l’événement (optionnel)</p>
                  {settings.eventModePosterUrl && (
                    <button
                      type="button"
                      onClick={() => updateSettings({ eventModePosterUrl: '' })}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold cursor-pointer"
                    >
                      Supprimer l’image
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={settings.eventModePosterUrl ?? ''}
                  onChange={(e) => updateSettings({ eventModePosterUrl: e.target.value })}
                  placeholder="URL de l’image (optionnel) — sinon uploade juste en dessous"
                  className="w-full rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                />

                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={eventPosterUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        setEventPosterUploading(true)
                        const url = await uploadEventPosterImage(file)
                        await updateSettings({ eventModePosterUrl: url })
                      } catch (err) {
                        console.error(err)
                        alert("Impossible d'uploader l'image pour le moment.")
                      } finally {
                        setEventPosterUploading(false)
                        e.currentTarget.value = ''
                      }
                    }}
                    className="text-xs"
                  />
                  <span className="text-[10px] text-mayssa-brown/50">
                    {eventPosterUploading ? 'Upload en cours…' : 'Formats conseillés : JPG/PNG/WebP'}
                  </span>
                </div>

                {settings.eventModePosterUrl?.trim() && (
                  <div className="pt-2">
                    <img
                      src={settings.eventModePosterUrl}
                      alt="Aperçu affiche événement"
                      className="w-full max-w-md rounded-2xl border border-mayssa-brown/10 shadow-sm"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
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

            {/* Date du prochain restock (header) */}
            <div className="rounded-xl p-4 border border-mayssa-brown/10 bg-white space-y-3">
              <p className="text-sm font-bold text-mayssa-brown">Date du prochain restock</p>
              <p className="text-[10px] text-mayssa-brown/50">
                Affichée dans le header sous « Annecy ». Format YYYY-MM-DD (ex. 2026-03-20) ou texte libre.
              </p>
              <input
                type="text"
                value={settings.nextRestockDate ?? ''}
                onChange={e => updateSettings({ nextRestockDate: e.target.value || undefined })}
                placeholder="Ex : 2026-03-20 ou Samedi 21 mars"
                className="w-full rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
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
        {(tab === 'creneaux' || (tab === 'reglages' && reglagesSection === 'creneaux')) && (
          <AdminCreneauxTab settings={settings} />
        )}

        {/* ===== ANNIVERSAIRES ===== */}
        {(tab === 'anniversaires' || (tab === 'clients' && clientsSection === 'anniversaires')) && (
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
        {(tab === 'inscrits' || (tab === 'clients' && clientsSection === 'inscrits')) && (
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
                      className="flex items-center justify-between p-3 rounded-xl border border-mayssa-brown/10 bg-white hover:bg-mayssa-soft/30 transition-colors gap-2 cursor-pointer group"
                      onClick={() => setSelectedClientUid(uid)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-mayssa-brown group-hover:text-mayssa-gold transition-colors">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-mayssa-brown/70 mt-0.5 flex items-center gap-1.5">
                          <Phone size={12} className="flex-shrink-0" />
                          {u.phone || <span className="text-mayssa-brown/40 italic">Pas de téléphone</span>}
                        </p>
                        <p className="text-[10px] text-mayssa-brown/50 truncate mt-0.5">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <span className="text-[10px] font-semibold text-mayssa-caramel bg-mayssa-caramel/10 px-2 py-1 rounded-lg flex items-center gap-1" title="Points fidélité">
                          <Gift size={12} />
                          {u.loyalty?.points ?? 0} pts
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setOffSitePresetClient({
                              uid,
                              firstName: u.firstName || '',
                              lastName: u.lastName || '',
                              phone: u.phone || '',
                              email: u.email,
                              address: u.address,
                            })
                            setShowOffSiteForm(true)
                          }}
                          className="p-1.5 rounded-lg text-mayssa-caramel hover:bg-mayssa-caramel/10 transition-colors cursor-pointer"
                          title="Commande hors-site"
                        >
                          <ShoppingBag size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Supprimer ${u.firstName} ${u.lastName} ?`)) return
                            try { await deleteUserProfile(uid) } catch (err) { console.error(err) }
                          }}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
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

        {/* Fiche client modale */}
        {selectedClientUid && allUsers[selectedClientUid] && (
          <AdminClientProfileModal
            uid={selectedClientUid}
            profile={allUsers[selectedClientUid]}
            orders={orders}
            onClose={() => setSelectedClientUid(null)}
            onNewOrder={(preset) => {
              setSelectedClientUid(null)
              setOffSitePresetClient(preset)
              setShowOffSiteForm(true)
            }}
            onPinChange={() => setPinsVersion(v => v + 1)}
          />
        )}

        {/* ===== PRODUITS ===== */}
        {(tab === 'produits') && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AdminProductsTab
              allProducts={allProducts}
              overrides={productOverrides}
              boxDecouverteTrompeExcludedIds={settings.boxDecouverteTrompeExcludedIds ?? []}
            />
          </motion.div>
        )}

        {/* ===== CODES PROMO ===== */}
        {tab === 'promos' && (
          <AdminPromosTab promoCodes={promoCodes} />
        )}

        {tab === 'sondage' && (
          <AdminPollsTab polls={polls} />
        )}

        {(tab === 'rappels' || (tab === 'reglages' && reglagesSection === 'rappels')) && (
          <AdminRappelsTab allUsers={allUsers} orders={orders} />
        )}

        {(tab === 'abonnes' || (tab === 'clients' && clientsSection === 'abonnes')) && (
          <AdminSubscribersTab orders={orders} />
        )}

        {(tab === 'alertes' || (tab === 'clients' && clientsSection === 'alertes')) && (
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

          // Agrégation multi-dates (box découverte → une ligne par trompe + libellés catalogue)
          const productionMap = new Map<string, { aggregateKey: string; name: string; quantity: number; orders: number }>()
          let totalOrders = 0
          for (const [, order] of Object.entries(orders)) {
            if (order.status === 'refusee' || order.status === 'livree' || order.status === 'validee' || order.status === 'pret') continue
            if (!order.requestedDate || !selectedDates.has(order.requestedDate)) continue
            totalOrders++
            for (const item of order.items ?? []) {
              const lineQty = item.quantity ?? 1
              const rows = expandOrderItemForProductionAggregate({ ...item, quantity: lineQty })
              rows.forEach((row) => {
                const aggKey = row.aggregateKey
                const existing = productionMap.get(aggKey)
                // +1 par ligne parente : chaque saveur d’une box reçoit le même nombre de « cmd » que de boîtes concernées
                const orderDelta = 1
                if (existing) {
                  existing.quantity += row.quantity
                  existing.orders += orderDelta
                } else {
                  productionMap.set(aggKey, { aggregateKey: aggKey, name: row.label, quantity: row.quantity, orders: orderDelta })
                }
              })
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
                          doc.text(item.orders > 0 ? String(item.orders) : '—', 148, y, { align: 'right' })
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
                        key={item.aggregateKey}
                        className="flex items-center justify-between p-3 rounded-xl bg-mayssa-soft/30 border border-mayssa-brown/5"
                      >
                        <span className="text-sm font-semibold text-mayssa-brown">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-mayssa-brown/40">{item.orders > 0 ? `${item.orders} cmd` : '—'}</span>
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
                              <p className="font-bold text-sm text-mayssa-brown">{formatOrderCustomerDisplayName(order)}</p>
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
        {(tab === 'planning' || (tab === 'historique' && historiqueMode === 'calendrier')) && (() => {
          /** Statuts considérés comme "déjà faits" : pas comptés dans "reste à faire" */
          const DONE_STATUSES = ['validee', 'livree', 'pret'] as const

          /** Agrège les lignes de commandes en liste "à produire" : libellé détaillé → quantité (optionnel filtre par statut). Les boxes trompes sont décomposées en trompes choisies (ou catalogue par défaut). */
          const getProductionList = (dayOrders: [string, Order][], filterStatus?: (s: string) => boolean): { label: string; quantity: number; sortKey: string }[] => {
            const quantityByLabel = new Map<string, number>()
            const sortKeyForLabel = (item: OrderItem): string => {
              const raw = item.productId ?? ''
              const id = raw.toLowerCase()
              const base = normalizeOrderProductBaseId(raw).toLowerCase()
              if (base === BOX_DECOUVERTE_TROMPE_PRODUCT_ID.toLowerCase()) return '0-trompe'
              if (id.includes('trompe-loeil') || id === 'box-trompe-loeil' || id === 'box-fruitee' || id === 'box-de-tout') return '0-trompe'
              if (id.includes('box') || id.includes('mini-box')) return '1-box'
              if (id.startsWith('brownie-')) return '2-brownie'
              if (id.startsWith('cookie-')) return '3-cookie'
              if (id.startsWith('layer-')) return '4-layer'
              if (id.includes('tiramisu')) return '5-tiramisu'
              return '6-other'
            }
            const labelToSortKey = new Map<string, string>()
            const ordersToUse = filterStatus ? dayOrders.filter(([, o]) => filterStatus(o.status ?? '')) : dayOrders
            for (const [, order] of ordersToUse) {
              for (const item of order.items ?? []) {
                const basePid = normalizeOrderProductBaseId(item.productId ?? '').toLowerCase()
                if (basePid === BOX_DECOUVERTE_TROMPE_PRODUCT_ID.toLowerCase()) {
                  const sel = item.trompeDiscoverySelection
                  if (sel?.length) {
                    for (const tid of sel) {
                      const trompeLabel = PRODUCTS.find((p) => p.id === tid)?.name ?? tid
                      quantityByLabel.set(trompeLabel, (quantityByLabel.get(trompeLabel) ?? 0) + item.quantity)
                      if (!labelToSortKey.has(trompeLabel)) labelToSortKey.set(trompeLabel, '0-trompe')
                    }
                  } else {
                    const label = formatOrderItemName(item)
                    quantityByLabel.set(label, (quantityByLabel.get(label) ?? 0) + item.quantity)
                    if (!labelToSortKey.has(label)) labelToSortKey.set(label, '0-trompe')
                  }
                  continue
                }
                if (basePid === 'box-trompe-loeil' || basePid === 'box-fruitee' || basePid === 'box-de-tout') {
                  const sel = item.trompeDiscoverySelection
                  const fallbackIds = PRODUCTS.find((p) => p.id === basePid)?.bundleProductIds ?? []
                  const ids = sel?.length ? sel : fallbackIds
                  for (const tid of ids) {
                    const trompeLabel = PRODUCTS.find((p) => p.id === tid)?.name ?? tid
                    quantityByLabel.set(trompeLabel, (quantityByLabel.get(trompeLabel) ?? 0) + item.quantity)
                    if (!labelToSortKey.has(trompeLabel)) labelToSortKey.set(trompeLabel, '0-trompe')
                  }
                  continue
                }
                const productId = (item.productId ?? '').toLowerCase()
                const baseName = isTrompeLoeilProductId(productId)
                  ? (PRODUCTS.find((p) => p.id === productId)?.name ?? formatOrderItemName(item))
                  : formatOrderItemName(item)
                // On met le "sizeLabel" entre parenthèses pour pouvoir tronquer les descriptions catalogue
                // qui arrivent souvent après un tiret (—/–) sans perdre l'info de format.
                const detail = !isTrompeLoeilProductId(productId) && item.sizeLabel ? ` (${item.sizeLabel})` : ''
                const rawLabel = baseName + detail
                const label = rawLabel.split(/\s*[—–]\s*/)[0]?.trim() || rawLabel
                quantityByLabel.set(label, (quantityByLabel.get(label) ?? 0) + item.quantity)
                if (!labelToSortKey.has(label)) labelToSortKey.set(label, sortKeyForLabel(item))
              }
            }
            return Array.from(quantityByLabel.entries())
              .map(([label, quantity]) => ({ label, quantity, sortKey: labelToSortKey.get(label) ?? '6-other' }))
              .sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.label.localeCompare(b.label))
          }

          /** Fusionne total (toutes cmd) et restant (uniquement cmd pas encore validée/livrée/prête) */
          const getProductionWithRestant = (dayOrders: [string, Order][]): { label: string; total: number; restant: number; sortKey: string }[] => {
            const totalList = getProductionList(dayOrders)
            const restantList = getProductionList(dayOrders, (status) => !DONE_STATUSES.includes(status as typeof DONE_STATUSES[number]))
            const restantByLabel = new Map(restantList.map((r) => [r.label, r.quantity]))
            return totalList.map((t) => ({
              ...t,
              total: t.quantity,
              restant: restantByLabel.get(t.label) ?? 0,
            }))
          }

          const planningSearchLower = planningSearchQuery.trim().toLowerCase()
          const matchesPlanningSearch = (o: Order) =>
            !planningSearchLower ||
            formatOrderCustomerDisplayName(o).toLowerCase().includes(planningSearchLower) ||
            (o.customer?.phone ?? '').replace(/\s/g, '').includes(planningSearchLower.replace(/\s/g, ''))

          // Génère 10 jours à partir du décalage sélectionné
          const days: { dateStr: string; label: string; dayOrders: [string, Order][] }[] = []
          for (let i = 0; i < 10; i++) {
            const d = new Date()
            d.setDate(d.getDate() + planningDayOffset + i)
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
            const dayOrders = Object.entries(orders)
              .filter(([, o]) => o.requestedDate === dateStr && o.status !== 'refusee' && matchesPlanningSearch(o))
              .filter(([, o]) => planningOrderStatusFilter === 'all' || o.status === planningOrderStatusFilter)
              .sort(([, a], [, b]) => (a.requestedTime ?? '00:00').localeCompare(b.requestedTime ?? '00:00'))
            days.push({ dateStr, label: dayName, dayOrders })
          }
          const totalWeek = days.reduce((s, d) => s + d.dayOrders.length, 0)
          const caWeek = days.reduce((s, d) => s + d.dayOrders.reduce((ss, [, o]) => ss + (o.total ?? 0), 0), 0)
          const isPast = planningDayOffset < 0
          const windowContainsToday = planningDayOffset <= 0 && planningDayOffset + 10 > 0
          return (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Navigation temporelle */}
              <div className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-sm border border-mayssa-brown/5">
                <button
                  type="button"
                  onClick={() => { setPlanningDayOffset((o) => o - 10); setPlanningDaysCollapsed(new Set()); setPlanningProductionCollapsed(new Set()) }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-mayssa-brown/70 hover:bg-mayssa-soft hover:text-mayssa-brown transition-colors cursor-pointer flex-shrink-0"
                  title="Reculer de 10 jours"
                >
                  <ChevronLeft size={15} />
                  <span className="hidden sm:inline">10 jours avant</span>
                </button>
                <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                  {!windowContainsToday && (
                    <button
                      type="button"
                      onClick={() => { setPlanningDayOffset(0); setPlanningDaysCollapsed(new Set()); setPlanningProductionCollapsed(new Set()) }}
                      className="text-[10px] font-bold text-mayssa-caramel hover:text-mayssa-brown uppercase tracking-wider transition-colors cursor-pointer px-2 py-1 rounded-lg bg-mayssa-caramel/10 hover:bg-mayssa-caramel/20"
                    >
                      ↩ Aujourd'hui
                    </button>
                  )}
                  <span className="text-[11px] font-bold text-mayssa-brown/60 truncate">
                    {isPast && !windowContainsToday ? '📂 Passé · ' : ''}
                    {days[0] && new Date(days[0].dateStr + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    {' → '}
                    {days[9] && new Date(days[9].dateStr + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setPlanningDayOffset((o) => o + 10); setPlanningDaysCollapsed(new Set()); setPlanningProductionCollapsed(new Set()) }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-mayssa-brown/70 hover:bg-mayssa-soft hover:text-mayssa-brown transition-colors cursor-pointer flex-shrink-0"
                  title="Avancer de 10 jours"
                >
                  <span className="hidden sm:inline">10 jours après</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Barre de recherche par prénom */}
              <div className="flex items-center gap-2">
                <Search size={18} className="text-mayssa-brown/40 flex-shrink-0" />
                <input
                  type="search"
                  value={planningSearchQuery}
                  onChange={(e) => setPlanningSearchQuery(e.target.value)}
                  placeholder="Rechercher par prénom..."
                  className="flex-1 rounded-xl border border-mayssa-brown/15 px-4 py-2.5 text-sm text-mayssa-brown placeholder:text-mayssa-brown/40 bg-white focus:outline-none focus:ring-2 focus:ring-mayssa-caramel/30 focus:border-mayssa-caramel"
                  aria-label="Rechercher par prénom"
                />
                {planningSearchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setPlanningSearchQuery('')}
                    className="p-2 rounded-lg text-mayssa-brown/50 hover:text-mayssa-brown hover:bg-mayssa-brown/10"
                    aria-label="Effacer la recherche"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Filtre statut (défaut : en préparation à l’ouverture) */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/45">Statut</span>
                {([
                  { v: 'all' as const, l: 'Toutes' },
                  { v: 'en_attente' as const, l: 'Attente' },
                  { v: 'en_preparation' as const, l: 'Prépa' },
                  { v: 'pret' as const, l: 'Prête' },
                  { v: 'livree' as const, l: 'Livrée' },
                  { v: 'validee' as const, l: 'Validée' },
                ]).map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPlanningOrderStatusFilter(v)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      planningOrderStatusFilter === v
                        ? 'bg-mayssa-brown text-white shadow-sm'
                        : 'bg-white border border-mayssa-brown/12 text-mayssa-brown/65 hover:bg-mayssa-soft/60'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* KPIs période */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">
                    Commandes ({isPast && !windowContainsToday ? 'passées' : '10j'})
                  </span>
                  <p className="text-xl font-display font-bold text-mayssa-brown mt-0.5">{totalWeek}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">
                    {isPast && !windowContainsToday ? 'CA réalisé' : 'CA prévisionnel'} (10j)
                  </span>
                  <p className="text-xl font-display font-bold text-mayssa-caramel mt-0.5">{caWeek.toFixed(2).replace('.', ',')} €</p>
                </div>
              </div>

              {/* Production cumulée */}
              {(() => {
                // Jours sélectionnés pour la prod cumulée (Set de dateStr)
                // planningCumulDays est réutilisé comme Set<string> via cast — on initialise au premier render
                // Pour éviter de changer le type du state, on stocke la sélection dans planningCumulDays (Set<string>)
                // MAIS ici on utilise un state local via le Set<string> déjà prévu : planningCumulDays (nb) sert de fallback
                // → on utilise planningCumulDays (number) UNIQUEMENT pour savoir si on a déjà des jours sélectionnés
                // En réalité on va utiliser un Set dans planningCumulDays recast, mais le state est number.
                // Solution propre : on utilise planningCumulDays comme index bitmask → NON.
                // On réutilise simplement `planningCumulDays` pour stocker le nb de jours consécutifs depuis aujourd'hui
                // ET on introduit un Set séparé via un state déjà existant.
                // Ici : selectedCumulDates = Set des dateStr cochés. On le gérera avec planningCumulDays comme nb par défaut.
                // Pour la sélection libre, on utilise un Set passé via le state dédié.

                // Calcul du label court pour un dateStr
                const shortLabel = (ds: string, idx: number) => {
                  if (idx === 0) return "Auj."
                  if (idx === 1) return 'Dem.'
                  return parseDateYyyyMmDd(ds).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric' })
                }

                // selectedCumulDates : Set des jours cochés. Par défaut aujourd'hui + demain (indices 0 et 1).
                // On stocke via planningCumulDays (number) = nb de premiers jours sélectionnés consécutifs au départ,
                // mais pour la sélection libre on a besoin d'un vrai Set.
                // → On réutilise `planningCumulDays` comme taille de la fenêtre INITIALE (défaut=2),
                //   et on crée ici un Set dérivé qui peut être modifié via setPlanningCumulDays (juste le nb).
                // Pour la sélection LIBRE, on ajoute un state dédié : planningCumulSelected.
                // Ce state est déjà défini ci-dessus comme `planningCumulDays` (number).
                // → On va simplement utiliser un état Set<string> stocké dans le state `planningCumulDays` REINTERPRÉTÉ.
                // Plutôt que de complexifier, voici l'approche finale :
                // `planningCumulDays` (number) = utilisé pour initialiser la sélection (2 premiers jours par défaut)
                // La sélection libre est stockée dans un Set local via useState — mais on ne peut pas ajouter de useState ici.
                // Solution : on utilise un ref ou on se base sur un Set stocké dans un state existant.
                // → On utilise `planningCumulDays` comme index bitmask sur 7 bits (bit i = jour i sélectionné).
                // Défaut 2 → bits 0 et 1 = 0b0000011 = 3. On reinterprète planningCumulDays comme bitmask.

                const bitmask = planningCumulDays  // chaque bit i = jour i sélectionné
                const toggleCumulDay = (i: number) => {
                  const newMask = bitmask ^ (1 << i)
                  // Au moins 1 jour sélectionné
                  setPlanningCumulDays(newMask === 0 ? (1 << i) : newMask)
                  setPlanningCumulOpen(true)
                }
                const isDaySelected = (i: number) => Boolean(bitmask & (1 << i))

                const cumulOrders = days.filter((_, i) => isDaySelected(i)).flatMap((d) => d.dayOrders)
                const cumulList = getProductionWithRestant(cumulOrders)
                const cumulOrderCount = cumulOrders.length
                const cumulPieceCount = cumulList.reduce((s, r) => s + r.total, 0)
                const selectedLabels = days.filter((_, i) => isDaySelected(i)).map((d) => {
                  const origIdx = days.indexOf(d)
                  return shortLabel(d.dateStr, origIdx)
                })

                return (
                  <div className="bg-white rounded-2xl border border-mayssa-brown/10 shadow-sm overflow-hidden">
                    {/* En-tête */}
                    <div className="flex items-center w-full bg-mayssa-soft/60 border-b border-mayssa-brown/5">
                      <button
                        type="button"
                        onClick={() => setPlanningCumulOpen((v) => !v)}
                        className="flex-1 flex items-center gap-2 px-4 py-3 hover:bg-mayssa-soft transition-colors text-left min-w-0"
                      >
                        <ClipboardList size={15} className="text-mayssa-caramel flex-shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-mayssa-brown/70 flex-shrink-0">
                          Prod. cumulée
                        </span>
                        <span className="text-[10px] text-mayssa-brown/40 truncate">
                          {selectedLabels.join(' + ')} · détail ci-dessous
                        </span>
                        {planningCumulOpen ? <ChevronUp size={15} className="text-mayssa-brown/50 flex-shrink-0 ml-auto" /> : <ChevronDown size={15} className="text-mayssa-brown/50 flex-shrink-0 ml-auto" />}
                      </button>
                      {/* Bouton PDF */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (cumulList.length === 0) return
                          const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
                          const pageW = doc.internal.pageSize.getWidth()
                          doc.setFont('helvetica', 'bold')
                          doc.setFontSize(16)
                          doc.text('Production cumulée — Maison Mayssa', pageW / 2, 18, { align: 'center' })
                          doc.setFont('helvetica', 'normal')
                          doc.setFontSize(10)
                          doc.text(`Jours : ${selectedLabels.join(' + ')}`, pageW / 2, 26, { align: 'center' })
                          doc.setDrawColor(200, 180, 160)
                          doc.line(14, 30, pageW - 14, 30)
                          let y = 38
                          doc.setFont('helvetica', 'bold')
                          doc.setFontSize(10)
                          doc.text('Qté', 14, y)
                          doc.text('Article', 28, y)
                          doc.text('Reste', pageW - 30, y)
                          y += 4
                          doc.line(14, y, pageW - 14, y)
                          y += 5
                          doc.setFont('helvetica', 'normal')
                          doc.setFontSize(10)
                          for (const { label: itemLabel, total, restant } of cumulList) {
                            if (y > 275) { doc.addPage(); y = 20 }
                            doc.setTextColor(restant === 0 ? 80 : 0, restant === 0 ? 150 : 0, 0)
                            doc.text(`${total}×`, 14, y)
                            doc.setTextColor(0, 0, 0)
                            doc.text(itemLabel.length > 55 ? itemLabel.slice(0, 54) + '…' : itemLabel, 28, y)
                            doc.setTextColor(restant === 0 ? 34 : 180, restant === 0 ? 130 : 100, 0)
                            doc.text(restant === 0 ? '✓ fait' : `${restant} à faire`, pageW - 30, y)
                            doc.setTextColor(0, 0, 0)
                            y += 7
                          }
                          doc.save(`production-${selectedLabels.join('-').replace(/[^a-z0-9-]/gi, '')}.pdf`)
                        }}
                        className="px-3 py-3 text-mayssa-brown/50 hover:text-mayssa-caramel hover:bg-mayssa-soft transition-colors flex-shrink-0"
                        title="Télécharger en PDF"
                      >
                        <Download size={15} />
                      </button>
                    </div>

                    {/* Sélecteur de jours (toujours visible) */}
                    <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-mayssa-brown/5 bg-white" onClick={(e) => e.stopPropagation()}>
                      {days.map((d, i) => {
                        const selected = isDaySelected(i)
                        const hasOrders = d.dayOrders.length > 0
                        return (
                          <button
                            key={d.dateStr}
                            type="button"
                            onClick={() => toggleCumulDay(i)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                              selected
                                ? 'bg-mayssa-caramel text-white border-mayssa-caramel'
                                : hasOrders
                                  ? 'bg-white text-mayssa-brown/70 border-mayssa-brown/20 hover:border-mayssa-caramel/50'
                                  : 'bg-white text-mayssa-brown/30 border-mayssa-brown/10 hover:border-mayssa-brown/20'
                            }`}
                          >
                            {shortLabel(d.dateStr, i)}
                            {hasOrders && (
                              <span className={`text-[9px] font-bold ${selected ? 'text-white/80' : 'text-mayssa-caramel'}`}>
                                {d.dayOrders.length}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Chiffres clés — toujours visibles */}
                    <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-gradient-to-b from-mayssa-caramel/8 to-white border-b border-mayssa-brown/5">
                      <div className="text-center rounded-xl bg-white/90 border border-mayssa-brown/10 px-2 py-2 shadow-sm">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-mayssa-brown/45">Commandes</p>
                        <p className="text-2xl sm:text-3xl font-display font-bold text-mayssa-brown tabular-nums leading-tight">{cumulOrderCount}</p>
                      </div>
                      <div className="text-center rounded-xl bg-white/90 border border-mayssa-brown/10 px-2 py-2 shadow-sm">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-mayssa-brown/45">Lignes prod.</p>
                        <p className="text-2xl sm:text-3xl font-display font-bold text-mayssa-caramel tabular-nums leading-tight">{cumulList.length}</p>
                      </div>
                      <div className="text-center rounded-xl bg-white/90 border border-mayssa-brown/10 px-2 py-2 shadow-sm">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-mayssa-brown/45">Pièces</p>
                        <p className="text-2xl sm:text-3xl font-display font-bold text-mayssa-brown tabular-nums leading-tight">{cumulPieceCount}</p>
                      </div>
                    </div>

                    {/* Liste de production */}
                    {planningCumulOpen && (
                      <div className="px-4 py-3">
                        {cumulList.length === 0 ? (
                          <p className="text-xs text-mayssa-brown/30 italic">Aucune commande sur les jours sélectionnés.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {cumulList.map(({ label, total, restant }) => (
                              <li key={label} className="flex items-center justify-between gap-2 text-xs text-mayssa-brown">
                                <div className="flex items-baseline gap-2 min-w-0">
                                  <span className="font-bold text-mayssa-caramel w-6 flex-shrink-0 text-right">{total}×</span>
                                  <span className="truncate">{label}</span>
                                </div>
                                <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${restant === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {restant === 0 ? '✓ fait' : `${restant} à faire`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Calendrier */}
              <div className="space-y-3">
                {days.map(({ dateStr, label, dayOrders }) => {
                  const isToday = dateStr === todayRetraitStr
                  const dayCA = dayOrders.reduce((s, [, o]) => s + (o.total ?? 0), 0)
                  const isDayCollapsed = planningDaysCollapsed.has(dateStr)
                  const toggleDayCollapse = () => {
                    hapticFeedback('light')
                    setPlanningDaysCollapsed((prev) => {
                      const next = new Set(prev)
                      if (next.has(dateStr)) next.delete(dateStr)
                      else next.add(dateStr)
                      return next
                    })
                  }
                  return (
                    <div
                      key={dateStr}
                      className={`rounded-2xl border transition-all ${
                        isToday
                          ? 'border-mayssa-caramel/50 bg-mayssa-caramel/5 shadow-sm'
                          : 'border-mayssa-brown/10 bg-white'
                      }`}
                    >
                      {/* En-tête du jour — cliquable pour replier */}
                      <button
                        type="button"
                        onClick={toggleDayCollapse}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-mayssa-brown/[0.03] transition-colors rounded-t-2xl"
                      >
                        <div className="flex items-center gap-2">
                          {isToday && <span className="w-2 h-2 rounded-full bg-mayssa-caramel" />}
                          <span className={`text-sm font-bold capitalize ${isToday ? 'text-mayssa-caramel' : 'text-mayssa-brown'}`}>
                            {label}
                          </span>
                          {isToday && <span className="text-[9px] font-bold uppercase tracking-wider bg-mayssa-caramel text-white px-1.5 py-0.5 rounded">Aujourd'hui</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          {dayOrders.length > 0 && (
                            <>
                              <span className="text-lg font-display font-bold tabular-nums text-mayssa-brown">{dayOrders.length}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/40">cmd</span>
                              <span className="text-lg font-display font-bold tabular-nums text-mayssa-caramel">{dayCA.toFixed(2).replace('.', ',')} €</span>
                            </>
                          )}
                          {isDayCollapsed
                            ? <ChevronDown size={14} className="text-mayssa-brown/30" />
                            : <ChevronUp size={14} className="text-mayssa-brown/20" />
                          }
                        </div>
                      </button>

                      {/* Contenu du jour — rideau */}
                      <AnimatePresence initial={false}>
                        {!isDayCollapsed && (
                          <motion.div
                            key="day-content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >

                      {/* À produire ce jour : total + reste à faire (ouvrir / masquer) */}
                      {dayOrders.length > 0 && (() => {
                        const productionList = getProductionWithRestant(dayOrders)
                        const isProductionOpen = !planningProductionCollapsed.has(dateStr)
                        const toggleProduction = () => {
                          setPlanningProductionCollapsed((prev) => {
                            const next = new Set(prev)
                            if (next.has(dateStr)) next.delete(dateStr)
                            else next.add(dateStr)
                            return next
                          })
                        }
                        return (
                          <div className="border-b border-mayssa-brown/5">
                            <button
                              type="button"
                              onClick={toggleProduction}
                              className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-mayssa-soft/80 text-left hover:bg-mayssa-soft transition-colors"
                              aria-expanded={isProductionOpen}
                              aria-label={isProductionOpen ? 'Masquer la production du jour' : 'Afficher la production du jour'}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">À produire ce jour</p>
                                <span className="text-lg font-display font-bold tabular-nums text-mayssa-caramel">{productionList.length}</span>
                                <span className="text-[9px] text-mayssa-brown/40">lignes</span>
                              </div>
                              {isProductionOpen ? <ChevronUp size={16} className="text-mayssa-brown/50" /> : <ChevronDown size={16} className="text-mayssa-brown/50" />}
                            </button>
                            {isProductionOpen && (
                              <div className="px-4 pb-3 pt-0 bg-mayssa-soft/80">
                                <p className="text-[9px] text-mayssa-brown/40 mb-2">(total × reste à faire)</p>
                                <ul className="space-y-1 text-xs text-mayssa-brown">
                                  {productionList.map(({ label, total, restant }) => (
                                    <li key={label} className="flex items-baseline gap-2 justify-between">
                                      <div className="flex items-baseline gap-2 min-w-0">
                                        <span className="font-bold text-mayssa-caramel w-6 flex-shrink-0">{total}×</span>
                                        <span className="truncate">{label}</span>
                                      </div>
                                      <span className={`flex-shrink-0 text-[10px] font-semibold ${restant === 0 ? 'text-emerald-600' : 'text-amber-600'}`} title="Reste à faire (hors validée / livrée / prête)">
                                        {restant === 0 ? '✓ fait' : `${restant} à faire`}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Créneaux du jour */}
                      {dayOrders.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-mayssa-brown/30 italic">Aucune commande</p>
                      ) : (
                        <div className="divide-y divide-mayssa-brown/5">
                          {dayOrders.map(([id, order]) => {
                            const orderSource = order.source ?? 'site'
                            const SRC: Record<string, { label: string; bg: string; text: string; border: string }> = {
                              whatsapp:  { label: 'WA',    bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-l-green-400' },
                              snap:      { label: 'Snap',  bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-l-yellow-400' },
                              instagram: { label: 'Insta', bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-l-pink-500' },
                              site:      { label: 'Site',  bg: 'bg-slate-100',  text: 'text-slate-500',  border: 'border-l-slate-300' },
                            }
                            const src = SRC[orderSource] ?? SRC.site
                            return (
                            <div
                              key={id}
                              className={`border-l-[3px] ${src.border}`}
                            >
                              {/* ── Nom + résumé commande — mobile uniquement ── */}
                              <button
                                type="button"
                                onClick={() => setEditingOrderId(id)}
                                className="sm:hidden w-full flex items-start justify-between gap-2 px-4 pt-2.5 pb-1 text-left active:bg-mayssa-brown/5 transition-colors"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-mayssa-brown truncate">
                                    {formatOrderCustomerDisplayName(order)}
                                  </p>
                                  <p className="text-[10px] text-mayssa-brown/50 truncate">
                                    {order.items?.map(i => `${i.quantity}× ${formatOrderItemName(i)}`).join(', ')}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 text-right ml-2">
                                  <p className="text-xs font-bold text-mayssa-caramel">{(order.total ?? 0).toFixed(2).replace('.', ',')} €</p>
                                  <div className="flex items-center justify-end gap-1 mt-0.5">
                                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${src.bg} ${src.text}`}>{src.label}</span>
                                    <span className="text-[10px] text-mayssa-brown/40">{order.deliveryMode === 'livraison' ? '🚗' : '📍'}</span>
                                  </div>
                                </div>
                              </button>

                              {/* ── Ligne date/statut/actions ── */}
                              <div className="flex items-center gap-2 px-4 pb-2.5 sm:py-2.5">
                              <div
                                className="flex flex-col gap-0.5 flex-shrink-0 w-[90px] sm:w-[100px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="date"
                                  value={order.requestedDate ?? ''}
                                  onChange={(e) => handlePlanningDateTimeChange(id, order, e.target.value, order.requestedTime ?? '')}
                                  className="w-full rounded border border-mayssa-brown/15 px-1.5 py-1 text-[10px] font-medium text-mayssa-brown bg-white cursor-pointer"
                                  title="Date souhaitée"
                                  aria-label="Date"
                                />
                                <input
                                  type="time"
                                  value={order.requestedTime ?? ''}
                                  onChange={(e) => handlePlanningDateTimeChange(id, order, order.requestedDate ?? '', e.target.value)}
                                  className="w-full rounded border border-mayssa-brown/15 px-1.5 py-1 text-[10px] font-medium text-mayssa-brown bg-white cursor-pointer"
                                  title="Heure souhaitée"
                                  aria-label="Heure"
                                />
                              </div>
                              {/* Info commande — desktop uniquement */}
                              <button
                                type="button"
                                onClick={() => setEditingOrderId(id)}
                                className="hidden sm:flex min-w-0 flex-1 items-center gap-3 text-left hover:bg-mayssa-brown/5 active:bg-mayssa-brown/10 transition-colors cursor-pointer rounded-lg -m-1 p-1"
                                aria-label={`Voir la commande de ${formatOrderCustomerDisplayName(order)}`}
                              >
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  order.status === 'en_preparation' ? 'bg-blue-400' :
                                  order.status === 'pret' ? 'bg-emerald-400' :
                                  order.status === 'livree' || order.status === 'validee' ? 'bg-emerald-600' :
                                  'bg-amber-400'
                                }`} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-mayssa-brown truncate">
                                    {formatOrderCustomerDisplayName(order)}
                                  </p>
                                  <p className="text-[10px] text-mayssa-brown/50 truncate">
                                    {order.items?.map(i => `${i.quantity}× ${formatOrderItemName(i)}`).join(', ')}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <p className="text-xs font-bold text-mayssa-caramel">{(order.total ?? 0).toFixed(2).replace('.', ',')} €</p>
                                  <div className="flex items-center justify-end gap-1 mt-0.5">
                                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${src.bg} ${src.text}`}>{src.label}</span>
                                    <span className="text-[10px] text-mayssa-brown/40">{order.deliveryMode === 'livraison' ? '🚗' : '📍'}</span>
                                  </div>
                                </div>
                              </button>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
                                {/* Puce statut — ‹ reculer | label | › avancer */}
                                {(() => {
                                  const FLOW: string[] = order.deliveryMode === 'livraison'
                                    ? ['en_attente', 'en_preparation', 'pret', 'livree']
                                    : ['en_attente', 'en_preparation', 'pret', 'validee']
                                  const CFG: Record<string, { short: string; bg: string; text: string; dot: string }> = {
                                    en_attente:    { short: 'Attente', bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400' },
                                    en_preparation:{ short: 'Prépa',   bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
                                    pret:          { short: 'Prête',   bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                                    livree:        { short: 'Livrée',  bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400' },
                                    validee:       { short: 'Validée', bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-500' },
                                    refusee:       { short: 'Refusée', bg: 'bg-red-100',     text: 'text-red-600',     dot: 'bg-red-400' },
                                  }
                                  const s = order.status ?? 'en_attente'
                                  const cfg = CFG[s] ?? CFG.en_attente
                                  const idx = FLOW.indexOf(s)
                                  const prev = idx > 0 ? FLOW[idx - 1] : null
                                  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null
                                  return (
                                    <div className={`flex items-center rounded-lg overflow-hidden text-[10px] font-bold select-none ${cfg.bg} ${cfg.text}`}>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); if (prev) { hapticFeedback('light'); updateOrderStatus(id, prev as OrderStatus) } }}
                                        className={`px-1.5 py-1 border-r border-current/20 transition-opacity ${prev ? 'cursor-pointer hover:opacity-60 active:scale-95' : 'opacity-20 cursor-default'}`}
                                        title={prev ? `← ${CFG[prev]?.short}` : undefined}
                                      >‹</button>
                                      <span className="flex items-center gap-1 px-2 py-1">
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                        {cfg.short}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); if (next) { hapticFeedback('light'); updateOrderStatus(id, next as OrderStatus) } }}
                                        className={`px-1.5 py-1 border-l border-current/20 transition-opacity ${next ? 'cursor-pointer hover:opacity-60 active:scale-95' : 'opacity-20 cursor-default'}`}
                                        title={next ? `→ ${CFG[next]?.short}` : undefined}
                                      >›</button>
                                    </div>
                                  )
                                })()}
                                {shouldShowDepositWhatsAppButton(order) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      hapticFeedback('light')
                                      setWhatsappCopyFeedback(null)
                                      setWhatsappMessageModal({
                                        title: 'Message WhatsApp — acompte 50 %',
                                        message: DEPOSIT_REQUEST_WHATSAPP_MESSAGE,
                                        waHref: depositWhatsAppHref(order),
                                        customerPhone: order.customer!.phone!.trim(),
                                      })
                                    }}
                                    className="p-2 rounded-lg text-emerald-700 hover:text-white hover:bg-emerald-600 transition-colors"
                                    title="Copier ou ouvrir WhatsApp — acompte 50 %"
                                    aria-label="WhatsApp acompte 50 pour cent"
                                  >
                                    <Percent size={16} />
                                  </button>
                                )}
                                {shouldShowPickupRetraitConfirmedWhatsAppButton(order) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      hapticFeedback('light')
                                      setWhatsappCopyFeedback(null)
                                      setWhatsappMessageModal({
                                        title: 'Message WhatsApp — retrait confirmé',
                                        message: PICKUP_CONFIRMED_WHATSAPP_MESSAGE,
                                        waHref: pickupRetraitConfirmedWhatsAppHref(order),
                                        customerPhone: order.customer!.phone!.trim(),
                                      })
                                    }}
                                    className="p-2 rounded-lg text-sky-700 hover:text-white hover:bg-sky-600 transition-colors"
                                    title="Copier ou ouvrir WhatsApp — retrait confirmé"
                                    aria-label="WhatsApp retrait confirmé"
                                  >
                                    <MapPin size={16} />
                                  </button>
                                )}
                                {shouldShowDeliveryLivraisonConfirmedWhatsAppButton(order) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      hapticFeedback('light')
                                      setWhatsappCopyFeedback(null)
                                      setWhatsappMessageModal({
                                        title: 'Message WhatsApp — livraison confirmée',
                                        message: DELIVERY_CONFIRMED_WHATSAPP_MESSAGE,
                                        waHref: deliveryLivraisonConfirmedWhatsAppHref(order),
                                        customerPhone: order.customer!.phone!.trim(),
                                      })
                                    }}
                                    className="p-2 rounded-lg text-violet-700 hover:text-white hover:bg-violet-600 transition-colors"
                                    title="Copier ou ouvrir WhatsApp — livraison confirmée"
                                    aria-label="WhatsApp livraison confirmée"
                                  >
                                    <Truck size={16} />
                                  </button>
                                )}
                                {(orderSource === 'whatsapp' && order.customer?.phone) && (() => {
                                  const phone = phoneToWhatsApp(order.customer.phone)
                                  const isDone = order.status === 'validee' || order.status === 'livree'
                                  return (
                                    <>
                                      {/* Bouton WhatsApp — confirmation "commande validée" */}
                                      <a
                                        href={buildWhatsAppChatHref(phone, buildValidatedMessage(order))}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 rounded-lg text-teal-600 hover:text-white hover:bg-teal-500 transition-colors"
                                        title={`Confirmer la commande à ${order.customer.firstName}`}
                                        aria-label="Envoyer confirmation commande validée"
                                      >
                                        <CheckCheck size={16} />
                                      </a>
                                      {/* Bouton WhatsApp — message "commande prête" pré-rempli */}
                                      <a
                                        href={buildWhatsAppChatHref(phone, buildReadyMessage(order))}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 rounded-lg text-emerald-600 hover:text-white hover:bg-emerald-500 transition-colors"
                                        title={`Message prêt → ${order.customer.firstName}`}
                                        aria-label="Envoyer message commande prête"
                                      >
                                        <MessageCircle size={16} />
                                      </a>
                                      {/* Bouton avis Google — affiché uniquement quand validée ou livrée */}
                                      {isDone && (
                                        <a
                                          href={buildWhatsAppChatHref(phone, buildReviewMessage(order))}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="p-2 rounded-lg text-amber-500 hover:text-white hover:bg-amber-400 transition-colors"
                                          title={`Demander un avis Google à ${order.customer.firstName}`}
                                          aria-label="Demander un avis Google"
                                        >
                                          <Star size={16} />
                                        </a>
                                      )}
                                    </>
                                  )
                                })()}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); hapticFeedback('light'); setEditingOrderId(id) }}
                                  className="p-2 rounded-lg text-mayssa-brown/60 hover:text-mayssa-brown hover:bg-mayssa-brown/10 transition-colors"
                                  title="Voir la commande"
                                  aria-label="Voir la commande"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); hapticFeedback('light'); exportSingleOrderPDF(order, id) }}
                                  className="p-2 rounded-lg text-mayssa-brown/60 hover:text-mayssa-brown hover:bg-mayssa-brown/10 transition-colors"
                                  title="Télécharger le bon de commande (PDF)"
                                  aria-label="Télécharger le bon de commande"
                                >
                                  <Download size={16} />
                                </button>
                              </div>
                              </div>
                            </div>
                          )
                          })}
                        </div>
                      )}

                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </motion.section>
          )
        })()}

        {/* ── Modale message WhatsApp (copier / ouvrir l’app) ── */}
        {whatsappMessageModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="whatsapp-modal-title"
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => { setWhatsappMessageModal(null); setWhatsappCopyFeedback(null) }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-full max-w-lg rounded-2xl shadow-xl p-5 space-y-4 max-h-[90vh] flex flex-col',
                isDark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white',
              )}
            >
              <h2
                id="whatsapp-modal-title"
                className={cn('text-base font-bold', isDark ? 'text-zinc-100' : 'text-mayssa-brown')}
              >
                {whatsappMessageModal.title}
              </h2>
              <p className={cn('text-xs leading-relaxed', isDark ? 'text-zinc-400' : 'text-mayssa-brown/60')}>
                <strong className={cn('font-semibold', isDark ? 'text-zinc-300' : 'text-mayssa-brown/80')}>iPhone :</strong>{' '}
                Safari ne peut pas ouvrir WhatsApp Business à la place de WhatsApp perso. Ouvrez{' '}
                <strong>WhatsApp Business</strong>, touchez <strong>Discussions</strong> puis <strong>nouvelle discussion</strong>, collez le <strong>numéro</strong> copié, puis collez le <strong>message</strong> dans la conversation.
                {' '}Sur Android, le bouton vert tente d’ouvrir WhatsApp Business en priorité.
              </p>
              <textarea
                readOnly
                value={whatsappMessageModal.message}
                rows={12}
                className={cn(
                  'w-full resize-y min-h-[180px] rounded-xl border px-3 py-2 text-sm font-sans leading-relaxed',
                  isDark
                    ? 'bg-zinc-950 border-zinc-600 text-zinc-100'
                    : 'bg-mayssa-soft/30 border-mayssa-brown/15 text-mayssa-brown',
                )}
                onFocus={(e) => e.target.select()}
              />
              <div className="flex flex-col gap-2 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch">
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(whatsappMessageModal.message)
                          setWhatsappCopyFeedback('message')
                          hapticFeedback('light')
                          window.setTimeout(() => setWhatsappCopyFeedback(null), 2500)
                        } catch {
                          setWhatsappCopyFeedback(null)
                        }
                      }}
                      className={cn(
                        'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-colors w-full',
                        whatsappCopyFeedback === 'message'
                          ? 'bg-emerald-600 text-white'
                          : isDark
                            ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-600'
                            : 'bg-mayssa-brown/10 text-mayssa-brown hover:bg-mayssa-brown/20',
                      )}
                    >
                      <Copy size={18} />
                      {whatsappCopyFeedback === 'message' ? 'Message copié' : 'Copier le message'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(whatsappMessageModal.customerPhone)
                          setWhatsappCopyFeedback('phone')
                          hapticFeedback('light')
                          window.setTimeout(() => setWhatsappCopyFeedback(null), 2500)
                        } catch {
                          setWhatsappCopyFeedback(null)
                        }
                      }}
                      className={cn(
                        'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-colors w-full',
                        whatsappCopyFeedback === 'phone'
                          ? 'bg-emerald-600 text-white'
                          : isDark
                            ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-600'
                            : 'bg-mayssa-brown/10 text-mayssa-brown hover:bg-mayssa-brown/20',
                      )}
                    >
                      <Phone size={18} />
                      {whatsappCopyFeedback === 'phone' ? 'Numéro copié' : 'Copier le numéro'}
                    </button>
                  </div>
                  <a
                    href={whatsappMessageModal.waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => hapticFeedback('light')}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#20bd5a] transition-colors sm:w-40 sm:self-stretch"
                  >
                    <MessageCircle size={18} />
                    Ouvrir WhatsApp
                  </a>
                </div>
                <p className={cn('text-[10px] text-center', isDark ? 'text-zinc-500' : 'text-mayssa-brown/45')}>
                  Numéro : {whatsappMessageModal.customerPhone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setWhatsappMessageModal(null); setWhatsappCopyFeedback(null) }}
                className={cn(
                  'w-full text-sm py-2 transition-colors',
                  isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-mayssa-brown/40 hover:text-mayssa-brown',
                )}
              >
                Fermer
              </button>
            </motion.div>
          </div>
        )}

        {/* ── Modal confirmation refus avec choix stock ── */}
        {refuseConfirm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 space-y-4"
            >
              <div>
                <p className="font-bold text-mayssa-brown text-base">
                  Refuser la commande de {formatOrderCustomerDisplayName(refuseConfirm.order)} ?
                </p>
                {refuseConfirm.isDuplicate && (
                  <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      <strong>Doublon détecté</strong> — ce client a une autre commande active aujourd'hui.
                      Le stock a peut-être déjà été déduit par la vraie commande.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    const { orderId, order } = refuseConfirm
                    setRefuseConfirm(null)
                    await handleRefuseOrder(orderId, order, true)
                  }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm transition-colors"
                >
                  <span>Refuser + remettre le stock</span>
                  <span className="text-xs text-red-400 font-normal">comportement normal</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const { orderId, order } = refuseConfirm
                    setRefuseConfirm(null)
                    await handleRefuseOrder(orderId, order, false)
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                    refuseConfirm.isDuplicate
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-mayssa-soft/50 hover:bg-mayssa-soft text-mayssa-brown'
                  }`}
                >
                  <span>Refuser sans remettre le stock</span>
                  <span className={`text-xs font-normal ${refuseConfirm.isDuplicate ? 'text-amber-100' : 'text-mayssa-brown/50'}`}>
                    {refuseConfirm.isDuplicate ? 'recommandé ↑' : 'pour doublon'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setRefuseConfirm(null)}
                className="w-full text-sm text-mayssa-brown/40 hover:text-mayssa-brown transition-colors py-1"
              >
                Annuler
              </button>
            </motion.div>
          </div>
        )}

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

        {/* Edit review modal */}
        {editingReviewId && reviews[editingReviewId] && (
          <AdminEditReviewModal
            reviewId={editingReviewId}
            review={reviews[editingReviewId]}
            onClose={() => setEditingReviewId(null)}
            onSaved={() => setEditingReviewId(null)}
          />
        )}

        {/* Rapport journalier */}
        <AdminDailyReport
          orders={orders}
          isOpen={showDailyReport}
          onClose={() => setShowDailyReport(false)}
        />

        {showOffSiteForm && (
          <AdminOffSiteOrderForm
            allProducts={allProducts}
            stock={stock}
            onClose={() => { setShowOffSiteForm(false); setOffSitePresetClient(null) }}
            onOrderCreated={() => { setShowOffSiteForm(false); setOffSitePresetClient(null) }}
            presetClient={offSitePresetClient}
          />
        )}

        <a
          href="/"
          className={cn('block text-center text-sm py-4 transition-colors', isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-mayssa-brown/40 hover:text-mayssa-brown')}
        >
          ← Retour au site
        </a>
      </main>
      </div>
    </div>
  )
}
