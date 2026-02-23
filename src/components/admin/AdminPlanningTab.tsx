import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Search, X, MapPin, Phone, Calendar, Clock,
  MessageCircle, Star, Pencil, Package, MessageSquare,
  ClipboardList,
} from 'lucide-react'
import { updateOrderStatus, updateOrder, releaseDeliverySlot, reserveDeliverySlot, type Order, type OrderStatus } from '../../lib/firebase'
import { formatOrderItemName } from '../../lib/utils'
import { hapticFeedback } from '../../lib/haptics'
import type { OrderItem } from '../../lib/firebase'

// ─── Helpers ────────────────────────────────────────────────────────────────

function phoneToWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('33') && digits.length >= 11) return digits
  if (digits.startsWith('0') && digits.length >= 10) return '33' + digits.slice(1)
  if (digits.length >= 9) return '33' + digits
  return digits
}

const GOOGLE_REVIEW_LINK = 'https://share.google/PsKmSr5Vx1VXqaNWx'

function buildReadyMessage(order: Order): string {
  const prenom = order.customer?.firstName ?? 'vous'
  if (order.deliveryMode === 'livraison') {
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

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Production list ─────────────────────────────────────────────────────────

const BOX_TROMPE_LOEIL_LABELS = [
  "Trompe l'oeil Mangue",
  "Trompe l'oeil Citron",
  "Trompe l'oeil Pistache",
  "Trompe l'oeil Passion",
  "Trompe l'oeil Framboise",
  "Trompe l'oeil Cacahuète",
  "Trompe l'oeil Fraise",
]

const DONE_STATUSES = ['validee', 'livree', 'pret'] as const

function getProductionList(
  dayOrders: [string, Order][],
  filterStatus?: (s: string) => boolean,
): { label: string; quantity: number; sortKey: string }[] {
  const quantityByLabel = new Map<string, number>()
  const sortKeyForLabel = (item: OrderItem): string => {
    const id = (item.productId ?? '').toLowerCase()
    if (id.includes('trompe-loeil') || id === 'box-trompe-loeil') return '0-trompe'
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
      const productId = (item.productId ?? '').toLowerCase()
      if (productId === 'box-trompe-loeil') {
        for (const trompeLabel of BOX_TROMPE_LOEIL_LABELS) {
          quantityByLabel.set(trompeLabel, (quantityByLabel.get(trompeLabel) ?? 0) + item.quantity)
          if (!labelToSortKey.has(trompeLabel)) labelToSortKey.set(trompeLabel, '0-trompe')
        }
        continue
      }
      const baseName = formatOrderItemName(item)
      const detail = item.sizeLabel ? ` — ${item.sizeLabel}` : ''
      const label = baseName + detail
      quantityByLabel.set(label, (quantityByLabel.get(label) ?? 0) + item.quantity)
      if (!labelToSortKey.has(label)) labelToSortKey.set(label, sortKeyForLabel(item))
    }
  }
  return Array.from(quantityByLabel.entries())
    .map(([label, quantity]) => ({ label, quantity, sortKey: labelToSortKey.get(label) ?? '6-other' }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.label.localeCompare(b.label))
}

function getProductionWithRestant(dayOrders: [string, Order][]): { label: string; total: number; restant: number; sortKey: string }[] {
  const totalList = getProductionList(dayOrders)
  const restantList = getProductionList(dayOrders, (status) => !DONE_STATUSES.includes(status as typeof DONE_STATUSES[number]))
  const restantByLabel = new Map(restantList.map((r) => [r.label, r.quantity]))
  return totalList.map((t) => ({ ...t, total: t.quantity, restant: restantByLabel.get(t.label) ?? 0 }))
}

// ─── Statut config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; short: string; bg: string; text: string; dot: string; border: string }> = {
  en_attente:    { label: 'En attente',     short: 'Attente', bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400',   border: 'border-l-amber-400' },
  en_preparation:{ label: 'En préparation', short: 'Prépa',   bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500',    border: 'border-l-blue-400' },
  pret:          { label: 'Prête',          short: 'Prête',   bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-l-emerald-400' },
  livree:        { label: 'Livrée',         short: 'Livrée',  bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400',    border: 'border-l-gray-300' },
  validee:       { label: 'Validée',        short: 'Validée', bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-500',  border: 'border-l-purple-400' },
  refusee:       { label: 'Refusée',        short: 'Refusée', bg: 'bg-red-100',     text: 'text-red-600',     dot: 'bg-red-400',     border: 'border-l-red-400' },
}

const SOURCE_CFG: Record<string, { label: string; bg: string; text: string }> = {
  whatsapp:  { label: 'WhatsApp', bg: 'bg-green-100',  text: 'text-green-700' },
  snap:      { label: 'Snap',     bg: 'bg-yellow-100', text: 'text-yellow-700' },
  instagram: { label: 'Insta',    bg: 'bg-pink-100',   text: 'text-pink-700' },
  site:      { label: 'Site',     bg: 'bg-slate-100',  text: 'text-slate-500' },
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface AdminPlanningTabProps {
  orders: Record<string, Order>
  onEditOrder: (orderId: string) => void
}

export function AdminPlanningTab({ orders, onEditOrder }: AdminPlanningTabProps) {
  const [dayOffset, setDayOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  const [productionOpen, setProductionOpen] = useState<Set<string>>(new Set())

  const todayStr = getTodayStr()
  const searchLower = search.trim().toLowerCase()

  const matchesSearch = (o: Order) =>
    !searchLower ||
    (o.customer?.firstName ?? '').toLowerCase().includes(searchLower) ||
    (o.customer?.lastName ?? '').toLowerCase().includes(searchLower) ||
    (o.customer?.phone ?? '').includes(searchLower)

  // Génère 10 jours à partir de l'offset
  const days = useMemo(() => {
    const result: { dateStr: string; label: string; dayOrders: [string, Order][] }[] = []
    for (let i = 0; i < 10; i++) {
      const d = new Date()
      d.setDate(d.getDate() + dayOffset + i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      const dayOrders = Object.entries(orders)
        .filter(([, o]) => o.requestedDate === dateStr && o.status !== 'refusee' && matchesSearch(o))
        .sort(([, a], [, b]) => (a.requestedTime ?? '00:00').localeCompare(b.requestedTime ?? '00:00'))
      result.push({ dateStr, label, dayOrders })
    }
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, dayOffset, searchLower])

  const totalOrders = days.reduce((s, d) => s + d.dayOrders.length, 0)
  const totalCA = days.reduce((s, d) => s + d.dayOrders.reduce((ss, [, o]) => ss + (o.total ?? 0), 0), 0)
  const isPast = dayOffset < 0 && dayOffset + 10 <= 0
  const windowContainsToday = dayOffset <= 0 && dayOffset + 10 > 0

  const navigate = (delta: number) => {
    setDayOffset((o) => o + delta)
    setCollapsedDays(new Set())
    setProductionOpen(new Set())
  }

  const handleDateTimeChange = async (orderId: string, order: Order, newDate: string, newTime: string) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* ── Navigation temporelle ── */}
      <div className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-sm border border-mayssa-brown/5">
        <button
          type="button"
          onClick={() => navigate(-10)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-mayssa-brown/70 hover:bg-mayssa-soft hover:text-mayssa-brown transition-colors cursor-pointer flex-shrink-0"
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Précédent</span>
        </button>
        <div className="flex-1 flex items-center justify-center gap-2 min-w-0 flex-wrap">
          {!windowContainsToday && (
            <button
              type="button"
              onClick={() => { setDayOffset(0); setCollapsedDays(new Set()); setProductionOpen(new Set()) }}
              className="text-[10px] font-bold text-mayssa-caramel uppercase tracking-wider cursor-pointer px-2 py-1 rounded-lg bg-mayssa-caramel/10 hover:bg-mayssa-caramel/20 transition-colors flex-shrink-0"
            >
              ↩ Aujourd'hui
            </button>
          )}
          <span className="text-[11px] font-bold text-mayssa-brown/60 truncate">
            {isPast ? '📂 ' : '📅 '}
            {days[0] && new Date(days[0].dateStr + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            {' → '}
            {days[9] && new Date(days[9].dateStr + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate(10)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-mayssa-brown/70 hover:bg-mayssa-soft hover:text-mayssa-brown transition-colors cursor-pointer flex-shrink-0"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* ── Recherche ── */}
      <div className="flex items-center gap-2">
        <Search size={18} className="text-mayssa-brown/40 flex-shrink-0" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, prénom ou téléphone…"
          className="flex-1 rounded-xl border border-mayssa-brown/15 px-4 py-2.5 text-sm text-mayssa-brown placeholder:text-mayssa-brown/40 bg-white focus:outline-none focus:ring-2 focus:ring-mayssa-caramel/30 focus:border-mayssa-caramel"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="p-2 rounded-lg text-mayssa-brown/50 hover:text-mayssa-brown hover:bg-mayssa-brown/10">
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">
            {isPast ? 'Commandes passées' : 'Commandes (10j)'}
          </span>
          <p className="text-xl font-display font-bold text-mayssa-brown mt-0.5">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">
            {isPast ? 'CA réalisé' : 'CA prévisionnel'} (10j)
          </span>
          <p className="text-xl font-display font-bold text-mayssa-caramel mt-0.5">{totalCA.toFixed(2).replace('.', ',')} €</p>
        </div>
      </div>

      {/* ── Jours ── */}
      <div className="space-y-4">
        {days.map(({ dateStr, label, dayOrders }) => {
          const isToday = dateStr === todayStr
          const isTomorrow = (() => {
            const tom = new Date(); tom.setDate(tom.getDate() + 1)
            return dateStr === `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`
          })()
          const isCollapsed = collapsedDays.has(dateStr)
          const isProductionOpen = productionOpen.has(dateStr)
          const dayCA = dayOrders.reduce((s, [, o]) => s + (o.total ?? 0), 0)
          const productionList = getProductionWithRestant(dayOrders)
          const livraisons = dayOrders.filter(([, o]) => o.deliveryMode === 'livraison').length
          const retraits = dayOrders.filter(([, o]) => o.deliveryMode === 'retrait').length

          return (
            <div
              key={dateStr}
              className={`rounded-2xl border overflow-hidden ${
                isToday ? 'border-mayssa-caramel/50 shadow-md' : 'border-mayssa-brown/10 bg-white shadow-sm'
              }`}
            >
              {/* En-tête du jour */}
              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light')
                  setCollapsedDays((prev) => {
                    const next = new Set(prev)
                    if (next.has(dateStr)) next.delete(dateStr)
                    else next.add(dateStr)
                    return next
                  })
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${
                  isToday ? 'bg-mayssa-caramel/10 hover:bg-mayssa-caramel/15' : 'bg-mayssa-soft/50 hover:bg-mayssa-soft/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isToday && <span className="w-2.5 h-2.5 rounded-full bg-mayssa-caramel flex-shrink-0" />}
                  <div className="min-w-0">
                    <span className={`text-sm font-bold capitalize ${isToday ? 'text-mayssa-caramel' : 'text-mayssa-brown'}`}>
                      {label}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isToday && <span className="text-[9px] font-bold uppercase tracking-wider bg-mayssa-caramel text-white px-1.5 py-0.5 rounded">Aujourd'hui</span>}
                      {isTomorrow && !isToday && <span className="text-[9px] font-bold uppercase tracking-wider bg-mayssa-brown/80 text-white px-1.5 py-0.5 rounded">Demain</span>}
                      {dayOrders.length > 0 && (
                        <span className="text-[10px] text-mayssa-brown/50">
                          {livraisons > 0 && `🚗 ${livraisons}`}{livraisons > 0 && retraits > 0 && ' · '}{retraits > 0 && `📍 ${retraits}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {dayOrders.length > 0 && (
                    <>
                      <div className="text-right">
                        <p className="text-sm font-bold text-mayssa-brown">{dayOrders.length} cmd</p>
                        <p className="text-xs font-bold text-mayssa-caramel">{dayCA.toFixed(2).replace('.', ',')} €</p>
                      </div>
                    </>
                  )}
                  {isCollapsed
                    ? <ChevronDown size={16} className="text-mayssa-brown/40" />
                    : <ChevronUp size={16} className="text-mayssa-brown/20" />
                  }
                </div>
              </button>

              {/* Contenu du jour */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    {dayOrders.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-mayssa-brown/30 italic">Aucune commande ce jour.</p>
                    ) : (
                      <>
                        {/* Récap production (collapsible) */}
                        {productionList.length > 0 && (
                          <div className="border-b border-mayssa-brown/5">
                            <button
                              type="button"
                              onClick={() =>
                                setProductionOpen((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(dateStr)) next.delete(dateStr)
                                  else next.add(dateStr)
                                  return next
                                })
                              }
                              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-mayssa-soft/60 hover:bg-mayssa-soft transition-colors text-left"
                            >
                              <div className="flex items-center gap-2">
                                <ClipboardList size={13} className="text-mayssa-caramel" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/70">À produire</span>
                                <span className="text-[9px] text-mayssa-brown/40">({productionList.length} lignes)</span>
                              </div>
                              {isProductionOpen ? <ChevronUp size={14} className="text-mayssa-brown/40" /> : <ChevronDown size={14} className="text-mayssa-brown/40" />}
                            </button>
                            {isProductionOpen && (
                              <div className="px-4 py-3 bg-mayssa-soft/40">
                                <ul className="space-y-1.5">
                                  {productionList.map(({ label: pLabel, total, restant }) => (
                                    <li key={pLabel} className="flex items-center justify-between gap-2 text-xs text-mayssa-brown">
                                      <div className="flex items-baseline gap-2 min-w-0">
                                        <span className="font-bold text-mayssa-caramel w-6 flex-shrink-0 text-right">{total}×</span>
                                        <span className="truncate">{pLabel}</span>
                                      </div>
                                      <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${restant === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {restant === 0 ? '✓ fait' : `${restant} à faire`}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Cartes commandes */}
                        <div className="divide-y divide-mayssa-brown/5">
                          {dayOrders.map(([id, order]) => (
                            <OrderCard
                              key={id}
                              orderId={id}
                              order={order}
                              onEdit={onEditOrder}
                              onDateTimeChange={handleDateTimeChange}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Carte commande ───────────────────────────────────────────────────────────

interface OrderCardProps {
  orderId: string
  order: Order
  onEdit: (id: string) => void
  onDateTimeChange: (id: string, order: Order, date: string, time: string) => Promise<void>
}

function OrderCard({ orderId, order, onEdit, onDateTimeChange }: OrderCardProps) {
  const s = order.status ?? 'en_attente'
  const cfg = STATUS_CFG[s] ?? STATUS_CFG.en_attente
  const src = SOURCE_CFG[order.source ?? 'site'] ?? SOURCE_CFG.site
  const isDelivery = order.deliveryMode === 'livraison'
  const isDone = s === 'validee' || s === 'livree'

  const FLOW: string[] = isDelivery
    ? ['en_attente', 'en_preparation', 'pret', 'livree']
    : ['en_attente', 'en_preparation', 'pret', 'validee']
  const idx = FLOW.indexOf(s)
  const prev = idx > 0 ? FLOW[idx - 1] : null
  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null

  return (
    <div className={`p-4 border-l-4 ${cfg.border} bg-white`}>
      {/* Ligne 1 : n° commande + source + mode + créneau */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-mayssa-brown/40">
            #{order.orderNumber != null ? order.orderNumber : orderId.slice(-6).toUpperCase()}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${src.bg} ${src.text}`}>{src.label}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDelivery ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {isDelivery ? '🚗 Livraison' : '📍 Retrait'}
          </span>
        </div>
        {/* Statut avec flèches */}
        <div className={`flex items-center rounded-lg overflow-hidden text-[10px] font-bold select-none flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
          <button
            type="button"
            onClick={() => { if (prev) { hapticFeedback('light'); updateOrderStatus(orderId, prev as OrderStatus) } }}
            className={`px-2 py-1.5 border-r border-current/20 transition-opacity ${prev ? 'cursor-pointer hover:opacity-60 active:scale-95' : 'opacity-20 cursor-default'}`}
            title={prev ? `← ${STATUS_CFG[prev]?.short}` : undefined}
          >‹</button>
          <span className="flex items-center gap-1 px-2 py-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
            {cfg.short}
          </span>
          <button
            type="button"
            onClick={() => { if (next) { hapticFeedback('light'); updateOrderStatus(orderId, next as OrderStatus) } }}
            className={`px-2 py-1.5 border-l border-current/20 transition-opacity ${next ? 'cursor-pointer hover:opacity-60 active:scale-95' : 'opacity-20 cursor-default'}`}
            title={next ? `→ ${STATUS_CFG[next]?.short}` : undefined}
          >›</button>
        </div>
      </div>

      {/* Ligne 2 : client + téléphone */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-base font-bold text-mayssa-brown leading-tight">
            {order.customer?.firstName} {order.customer?.lastName}
          </p>
          {order.customer?.phone && (
            <a
              href={`tel:${order.customer.phone}`}
              className="text-xs text-mayssa-caramel hover:underline flex items-center gap-1 mt-0.5"
            >
              <Phone size={11} />
              {order.customer.phone}
            </a>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-display font-bold text-mayssa-caramel">
            {(order.total ?? 0).toFixed(2).replace('.', ',')} €
          </p>
          {isDelivery && (order.deliveryFee ?? 0) > 0 && (
            <p className="text-[10px] text-mayssa-brown/40">dont {(order.deliveryFee ?? 0).toFixed(2)} € livr.</p>
          )}
        </div>
      </div>

      {/* Créneau date / heure */}
      <div className={`rounded-xl p-3 mb-3 space-y-2 ${isDelivery ? 'bg-blue-50 border border-blue-100' : 'bg-emerald-50 border border-emerald-100'}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-mayssa-brown">
            <Calendar size={13} className="flex-shrink-0 text-mayssa-brown/60" />
            <input
              type="date"
              value={order.requestedDate ?? ''}
              onChange={(e) => onDateTimeChange(orderId, order, e.target.value, order.requestedTime ?? '')}
              className="rounded border border-mayssa-brown/15 px-2 py-1 text-xs font-medium text-mayssa-brown bg-white cursor-pointer"
              title="Date souhaitée"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-mayssa-brown">
            <Clock size={13} className="flex-shrink-0 text-mayssa-brown/60" />
            <input
              type="time"
              value={order.requestedTime ?? ''}
              onChange={(e) => onDateTimeChange(orderId, order, order.requestedDate ?? '', e.target.value)}
              className="rounded border border-mayssa-brown/15 px-2 py-1 text-xs font-medium text-mayssa-brown bg-white cursor-pointer"
              title="Heure souhaitée"
            />
          </div>
        </div>
        {isDelivery && order.customer?.address && (
          <p className="text-xs text-mayssa-brown flex items-start gap-1.5">
            <MapPin size={13} className="flex-shrink-0 mt-0.5 text-blue-500" />
            <span>{order.customer.address}</span>
          </p>
        )}
        {isDelivery && !order.customer?.address && (
          <p className="text-xs text-amber-700 flex items-center gap-1.5 font-medium">
            <MapPin size={13} className="flex-shrink-0 text-amber-500" />
            ⚠️ Adresse non renseignée
          </p>
        )}
        {isDelivery && order.distanceKm != null && (
          <p className="text-[10px] text-mayssa-brown/60">📍 {order.distanceKm.toFixed(1)} km depuis Annecy</p>
        )}
      </div>

      {/* Articles */}
      <div className="bg-mayssa-soft/30 rounded-xl p-3 mb-3">
        <p className="text-[10px] font-bold text-mayssa-brown/50 uppercase tracking-wider flex items-center gap-1 mb-2">
          <Package size={10} />
          Articles
        </p>
        <ul className="space-y-1">
          {(order.items ?? []).map((item, i) => (
            <li key={i} className="flex items-center justify-between text-xs text-mayssa-brown">
              <span>{item.quantity}× {formatOrderItemName(item)}</span>
              <span className="font-bold text-mayssa-brown/70">{(item.price * item.quantity).toFixed(2).replace('.', ',')} €</span>
            </li>
          ))}
        </ul>
        {isDelivery && (order.deliveryFee ?? 0) > 0 && (
          <div className="flex items-center justify-between text-xs pt-1.5 mt-1.5 border-t border-mayssa-brown/10 text-mayssa-brown/60">
            <span>Frais de livraison</span>
            <span>+{(order.deliveryFee ?? 0).toFixed(2).replace('.', ',')} €</span>
          </div>
        )}
      </div>

      {/* Note client */}
      {order.clientNote && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3 flex items-start gap-2">
          <MessageSquare size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-mayssa-brown italic">"{order.clientNote}"</p>
        </div>
      )}


      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {order.customer?.phone && (
          <>
            <a
              href={`https://wa.me/${phoneToWhatsApp(order.customer.phone)}?text=${encodeURIComponent(buildReadyMessage(order))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
              title="Message commande prête"
            >
              <MessageCircle size={14} />
              Prête
            </a>
            {isDone && (
              <a
                href={`https://wa.me/${phoneToWhatsApp(order.customer.phone)}?text=${encodeURIComponent(buildReviewMessage(order))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 text-white text-xs font-bold hover:bg-amber-500 transition-colors"
                title="Demander un avis Google"
              >
                <Star size={14} />
                Avis
              </a>
            )}
            <a
              href={`https://wa.me/${phoneToWhatsApp(order.customer.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200 transition-colors"
              title="Appeler / WhatsApp"
            >
              <Phone size={14} />
              Contact
            </a>
          </>
        )}
        <button
          type="button"
          onClick={() => { hapticFeedback('light'); onEdit(orderId) }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-brown/10 text-mayssa-brown text-xs font-bold hover:bg-mayssa-brown/20 transition-colors ml-auto cursor-pointer"
        >
          <Pencil size={14} />
          Modifier
        </button>
      </div>
    </div>
  )
}
