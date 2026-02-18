import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { jsPDF } from 'jspdf'
import { Truck, MapPin, Phone, Calendar, Download, Filter, XCircle, MessageSquare, Package, Pencil, FileText, ArrowUpDown } from 'lucide-react'
import { updateOrderStatus, type Order, type OrderStatus } from '../../lib/firebase'
import { parseDateYyyyMmDd } from '../../lib/utils'

const ORDER_STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  en_preparation: 'En préparation',
  pret: 'Prête',
  livree: 'Livrée',
  validee: 'Validée',
  refusee: 'Refusée',
}

interface AdminLivraisonTabProps {
  orders: Record<string, Order>
  onEditOrder: (orderId: string) => void
  /** Affiche uniquement les livraisons ou uniquement les retraits (onglets séparés dans l'admin). */
  mode: 'livraison' | 'retrait'
}

// Export CSV des retraits (date retrait, heure, client, articles)
function exportRetraitsCSV(entries: [string, Order][]): void {
  const SEP = ';'
  const BOM = '\uFEFF'
  const header = ['N° commande', 'Date retrait', 'Heure', 'Client', 'Téléphone', 'Note client', 'Articles', 'Total (€)', 'Statut'].join(SEP)
  const rows = entries.map(([id, o]) => {
    const orderRef = o.orderNumber != null ? `#${o.orderNumber}` : id
    const dateStr = o.requestedDate ? parseDateYyyyMmDd(o.requestedDate).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
    const timeStr = o.requestedTime ?? ''
    const client = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ')
    const phone = o.customer?.phone ?? ''
    const noteClient = (o.clientNote ?? '').replace(/"/g, '""')
    const items = (o.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(' | ')
    const total = (o.total ?? 0).toFixed(2).replace('.', ',')
    const status = ORDER_STATUS_LABELS[o.status] ?? o.status
    return [orderRef, dateStr, timeStr, client, phone, `"${noteClient}"`, `"${items.replace(/"/g, '""')}"`, total, status].join(SEP)
  })
  const csv = BOM + header + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `retraits-maison-mayssa-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

// Export PDF des retraits (pour impression, liste des retraits du jour)
function exportRetraitsPDF(entries: [string, Order][], dateLabel: string): void {
  if (entries.length === 0) return
  const doc = new jsPDF({ format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const maxWidth = pageWidth - margin * 2
  let y = 20

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Retraits Maison Mayssa', margin, y)
  y += 8
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(dateLabel || 'Toutes dates', margin, y)
  y += 15

  entries.forEach(([id, o]) => {
    if (y > 260) {
      doc.addPage()
      y = 20
    }
    const cardY = y
    let lineY = y + 8
    const orderRef = o.orderNumber != null ? `#${o.orderNumber}` : `#${id.slice(-8)}`
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Commande ' + orderRef, margin + 3, lineY)
    lineY += 6
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    const client = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ')
    doc.text(client || 'Client', margin + 3, lineY)
    lineY += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    if (o.customer?.phone) {
      doc.text('Tel: ' + o.customer.phone, margin + 3, lineY)
      lineY += 6
    }
    const timeStr = o.requestedDate
      ? parseDateYyyyMmDd(o.requestedDate).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'short' })
      : ''
    const heure = o.requestedTime ? ' à ' + o.requestedTime : ''
    doc.text('Créneau retrait: ' + timeStr + heure, margin + 3, lineY)
    lineY += 6
    const itemsStr = (o.items ?? []).map(i => `${i.quantity}x ${i.name}`).join(', ')
    const itemsLines = doc.splitTextToSize('Articles: ' + itemsStr, maxWidth - 6)
    doc.text(itemsLines, margin + 3, lineY)
    lineY += itemsLines.length * 5 + 2
    if (o.clientNote) {
      const noteLines = doc.splitTextToSize('Note: ' + o.clientNote, maxWidth - 6)
      doc.text(noteLines, margin + 3, lineY)
      lineY += noteLines.length * 5 + 2
    }
    doc.setFont('helvetica', 'bold')
    doc.text('Total: ' + (o.total ?? 0).toFixed(2) + ' euros', margin + 3, lineY)
    const cardHeight = Math.max(50, lineY - cardY + 10)
    doc.setDrawColor(91, 58, 41)
    doc.setLineWidth(0.3)
    doc.rect(margin, cardY, maxWidth, cardHeight)
    y = cardY + cardHeight + 10
  })

  const dateSuffix = entries[0]?.[1]?.requestedDate ?? new Date().toISOString().slice(0, 10)
  doc.save(`retraits-maison-mayssa-${dateSuffix}.pdf`)
}

// Export CSV des livraisons (lieu, date, contact, articles)
function exportLivraisonsCSV(entries: [string, Order][]): void {
  const SEP = ';'
  const BOM = '\uFEFF'
  const header = ['N° commande', 'Date livraison', 'Heure', 'Client', 'Téléphone', 'Adresse', 'Distance km', 'Note client', 'Articles', 'Total (€)', 'Statut'].join(SEP)
  const rows = entries.map(([id, o]) => {
    const orderRef = o.orderNumber != null ? `#${o.orderNumber}` : id
    const dateStr = o.requestedDate ? parseDateYyyyMmDd(o.requestedDate).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
    const timeStr = o.requestedTime ?? ''
    const client = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ')
    const phone = o.customer?.phone ?? ''
    const adresse = (o.customer?.address ?? '').replace(/"/g, '""')
    const distanceKm = o.distanceKm != null ? o.distanceKm.toFixed(1) : ''
    const noteClient = (o.clientNote ?? '').replace(/"/g, '""')
    const items = (o.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(' | ')
    const total = (o.total ?? 0).toFixed(2).replace('.', ',')
    const status = ORDER_STATUS_LABELS[o.status] ?? o.status
    return [orderRef, dateStr, timeStr, client, phone, `"${adresse}"`, distanceKm, `"${noteClient}"`, `"${items.replace(/"/g, '""')}"`, total, status].join(SEP)
  })
  const csv = BOM + header + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `livraisons-maison-mayssa-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

// Export PDF des livraisons (pour impression ou tournée)
function exportLivraisonsPDF(entries: [string, Order][], dateLabel: string): void {
  if (entries.length === 0) return
  const doc = new jsPDF({ format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const maxWidth = pageWidth - margin * 2
  let y = 20

  // Titre
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Livraisons Maison Mayssa', margin, y)
  y += 8
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(dateLabel || 'Toutes dates', margin, y)
  y += 15

  entries.forEach(([id, o]) => {
    // Nouvelle page si besoin
    if (y > 260) {
      doc.addPage()
      y = 20
    }

    const cardY = y
    let lineY = y + 8
    const orderRef = o.orderNumber != null ? `#${o.orderNumber}` : `#${id.slice(-8)}`
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Commande ' + orderRef, margin + 3, lineY)
    lineY += 6
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    const client = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ')
    doc.text(client || 'Client', margin + 3, lineY)
    lineY += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    if (o.customer?.phone) {
      doc.text('Tel: ' + o.customer.phone, margin + 3, lineY)
      lineY += 6
    }
    if (o.customer?.address) {
      const addr = doc.splitTextToSize(o.customer.address, maxWidth - 6)
      doc.text(addr, margin + 3, lineY)
      lineY += addr.length * 5 + 2
    }
    const timeStr = o.requestedDate
      ? parseDateYyyyMmDd(o.requestedDate).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'short' })
      : ''
    const heure = o.requestedTime ? ' a ' + o.requestedTime : ''
    doc.text('Creneau: ' + timeStr + heure, margin + 3, lineY)
    lineY += 6
    const itemsStr = (o.items ?? []).map(i => `${i.quantity}x ${i.name}`).join(', ')
    const itemsLines = doc.splitTextToSize('Articles: ' + itemsStr, maxWidth - 6)
    doc.text(itemsLines, margin + 3, lineY)
    lineY += itemsLines.length * 5 + 2
    if (o.clientNote) {
      const noteLines = doc.splitTextToSize('Note: ' + o.clientNote, maxWidth - 6)
      doc.text(noteLines, margin + 3, lineY)
      lineY += noteLines.length * 5 + 2
    }
    doc.setFont('helvetica', 'bold')
    doc.text('Total: ' + (o.total ?? 0).toFixed(2) + ' euros', margin + 3, lineY)
    if (o.distanceKm != null) {
      doc.setFont('helvetica', 'normal')
      doc.text(o.distanceKm.toFixed(1) + ' km', pageWidth - margin - 25, lineY)
    }

    const cardHeight = Math.max(55, lineY - cardY + 10)
    doc.setDrawColor(91, 58, 41)
    doc.setLineWidth(0.3)
    doc.rect(margin, cardY, maxWidth, cardHeight)
    y = cardY + cardHeight + 10
  })

  const dateSuffix = entries[0]?.[1]?.requestedDate ?? new Date().toISOString().slice(0, 10)
  doc.save(`livraisons-maison-mayssa-${dateSuffix}.pdf`)
}

function getTodayYyyyMmDd(): string {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export function AdminLivraisonTab({ orders, onEditOrder, mode }: AdminLivraisonTabProps) {
  const [dateFilter, setDateFilter] = useState(getTodayYyyyMmDd)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'client' | 'total'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const deliveryOrders = useMemo(() => {
    const entries = Object.entries(orders)
      .filter(([, o]) => o.deliveryMode === 'livraison')
      .filter(([, o]) => {
        if (!statusFilter || statusFilter === 'all') return true
        return o.status === statusFilter
      })
      .filter(([, o]) => {
        if (!dateFilter) return true
        return o.requestedDate === dateFilter
      })
      .sort(([, a], [, b]) => {
        let cmp = 0
        if (sortBy === 'date') {
          const dateA = a.requestedDate ? (() => {
            const d = parseDateYyyyMmDd(a.requestedDate)
            const [h, m] = (a.requestedTime || '00:00').split(':').map(Number)
            d.setHours(h || 0, m || 0, 0, 0)
            return d.getTime()
          })() : 0
          const dateB = b.requestedDate ? (() => {
            const d = parseDateYyyyMmDd(b.requestedDate)
            const [h, m] = (b.requestedTime || '00:00').split(':').map(Number)
            d.setHours(h || 0, m || 0, 0, 0)
            return d.getTime()
          })() : 0
          cmp = dateA - dateB
        } else if (sortBy === 'distance') {
          const distA = a.distanceKm ?? 999
          const distB = b.distanceKm ?? 999
          cmp = distA - distB
        } else if (sortBy === 'client') {
          const nameA = `${a.customer?.firstName ?? ''} ${a.customer?.lastName ?? ''}`.toLowerCase()
          const nameB = `${b.customer?.firstName ?? ''} ${b.customer?.lastName ?? ''}`.toLowerCase()
          cmp = nameA.localeCompare(nameB)
        } else {
          cmp = (a.total ?? 0) - (b.total ?? 0)
        }
        return sortOrder === 'asc' ? cmp : -cmp
      })
    return entries
  }, [orders, dateFilter, statusFilter, sortBy, sortOrder])

  const pickupOrders = useMemo(() => {
    const entries = Object.entries(orders)
      .filter(([, o]) => o.deliveryMode === 'retrait')
      .filter(([, o]) => {
        if (!statusFilter || statusFilter === 'all') return true
        return o.status === statusFilter
      })
      .filter(([, o]) => {
        if (!dateFilter) return true
        return o.requestedDate === dateFilter
      })
      .sort(([, a], [, b]) => {
        let cmp = 0
        if (sortBy === 'date') {
          const dateA = a.requestedDate ? (() => {
            const d = parseDateYyyyMmDd(a.requestedDate)
            const [h, m] = (a.requestedTime || '00:00').split(':').map(Number)
            d.setHours(h || 0, m || 0, 0, 0)
            return d.getTime()
          })() : 0
          const dateB = b.requestedDate ? (() => {
            const d = parseDateYyyyMmDd(b.requestedDate)
            const [h, m] = (b.requestedTime || '00:00').split(':').map(Number)
            d.setHours(h || 0, m || 0, 0, 0)
            return d.getTime()
          })() : 0
          cmp = dateA - dateB
        } else if (sortBy === 'distance') {
          const distA = a.distanceKm ?? 999
          const distB = b.distanceKm ?? 999
          cmp = distA - distB
        } else if (sortBy === 'client') {
          const nameA = `${a.customer?.firstName ?? ''} ${a.customer?.lastName ?? ''}`.toLowerCase()
          const nameB = `${b.customer?.firstName ?? ''} ${b.customer?.lastName ?? ''}`.toLowerCase()
          cmp = nameA.localeCompare(nameB)
        } else {
          cmp = (a.total ?? 0) - (b.total ?? 0)
        }
        return sortOrder === 'asc' ? cmp : -cmp
      })
    return entries
  }, [orders, dateFilter, statusFilter, sortBy, sortOrder])

  const displayOrders = mode === 'livraison' ? deliveryOrders : pickupOrders

  const slotsSummary = useMemo(() => {
    const byTime: Record<string, number> = {}
    for (const [, o] of displayOrders) {
      const t = o.requestedTime ?? '—'
      byTime[t] = (byTime[t] ?? 0) + 1
    }
    return Object.entries(byTime).sort(([a], [b]) => a.localeCompare(b))
  }, [displayOrders])

  const hasFilters = !!dateFilter || !!statusFilter && statusFilter !== 'all'

  const clearFilters = () => {
    setDateFilter('')
    setStatusFilter('all')
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* En-tête avec stats et export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-mayssa-brown/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">
              {mode === 'livraison' ? 'Livraisons' : 'Retraits'}
            </span>
            <p className="text-lg font-display font-bold text-mayssa-brown">{displayOrders.length} commande{displayOrders.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-mayssa-brown/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">Total</span>
            <p className="text-lg font-display font-bold text-mayssa-caramel">
              {displayOrders.reduce((sum, [, o]) => sum + (o.total ?? 0), 0).toFixed(2).replace('.', ',')} €
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const dateLabel = dateFilter
                ? new Date(dateFilter + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Toutes dates'
              mode === 'livraison' ? exportLivraisonsPDF(displayOrders, dateLabel) : exportRetraitsPDF(displayOrders, dateLabel)
            }}
            disabled={displayOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-caramel shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileText size={16} />
            Export PDF
          </button>
          <button
            onClick={() => mode === 'livraison' ? exportLivraisonsCSV(displayOrders) : exportRetraitsCSV(displayOrders)}
            disabled={displayOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {slotsSummary.length > 0 && (
        <div className="rounded-xl px-4 py-2.5 bg-mayssa-soft/60 border border-mayssa-brown/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">
            {dateFilter ? new Date(dateFilter + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Par créneau'}
          </span>
          <p className="text-sm font-bold text-mayssa-brown mt-0.5">
            {slotsSummary.map(([time, count]) => `${time} → ${count}`).join(' · ')}
          </p>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-mayssa-brown/5 space-y-3">
        <div className="flex items-center gap-2 text-mayssa-brown/70">
          <Filter size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">Filtres</span>
          {hasFilters && (
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
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs font-bold text-mayssa-brown bg-white"
            title={mode === 'livraison' ? 'Date de livraison' : 'Date de retrait'}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs font-bold text-mayssa-brown bg-white"
          >
            <option value="all">Tous statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_preparation">En préparation</option>
            <option value="pret">Prête</option>
            <option value="livree">Livrée</option>
            <option value="validee">Validée</option>
            <option value="refusee">Refusée</option>
          </select>
          <select
            value={mode === 'retrait' && sortBy === 'distance' ? 'date' : sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'distance' | 'client' | 'total')}
            className="rounded-xl border border-mayssa-brown/10 px-3 py-2 text-xs font-bold text-mayssa-brown bg-white"
          >
            <option value="date">{mode === 'livraison' ? 'Date livraison' : 'Date retrait'}</option>
            {mode === 'livraison' && <option value="distance">Distance</option>}
            <option value="client">Client (A-Z)</option>
            <option value="total">Montant total</option>
          </select>
          <button
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-mayssa-brown/10 bg-white text-xs font-bold text-mayssa-brown hover:bg-mayssa-soft/50 transition-colors cursor-pointer"
            title={sortOrder === 'asc' ? 'Croissant (A→Z, 0→9)' : 'Décroissant (Z→A, 9→0)'}
          >
            <ArrowUpDown size={14} />
            {sortOrder === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {displayOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-mayssa-brown/5 text-center">
            {mode === 'livraison' ? (
              <Truck size={48} className="mx-auto text-mayssa-brown/15 mb-4" />
            ) : (
              <MapPin size={48} className="mx-auto text-mayssa-brown/15 mb-4" />
            )}
            <p className="text-sm font-medium text-mayssa-brown/60">
              {mode === 'livraison' ? 'Aucune livraison' : 'Aucun retrait'}
            </p>
            <p className="text-xs text-mayssa-brown/40 mt-1">
              {hasFilters ? 'Essayez d\'effacer les filtres' : mode === 'livraison' ? 'Les commandes en livraison apparaîtront ici' : 'Les commandes en retrait apparaîtront ici'}
            </p>
          </div>
        ) : (
          displayOrders.map(([id, order]) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl p-4 shadow-md border border-mayssa-brown/5 border-l-4 ${mode === 'livraison' ? 'border-l-blue-400' : 'border-l-emerald-400'}`}
            >
              {/* Header: N° commande + Client + Contact */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] font-bold text-mayssa-brown/50 uppercase tracking-wider mb-0.5">
                    Commande {order.orderNumber != null ? `#${order.orderNumber}` : `#${id.slice(-8)}`}
                  </p>
                  <p className="text-sm font-bold text-mayssa-brown">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                  {order.customer?.phone && (
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="text-xs text-mayssa-caramel hover:underline flex items-center gap-1 mt-1"
                    >
                      <Phone size={12} />
                      {order.customer.phone}
                    </a>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
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
                </div>
              </div>

              {/* Lieu de livraison (ou créneau retrait) */}
              <div className={`p-3 rounded-xl mb-3 space-y-2 ${mode === 'livraison' ? (!order.customer?.address ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50/80 border border-blue-100') : 'bg-emerald-50/80 border border-emerald-100'}`}>
                {mode === 'livraison' && (
                  order.customer?.address ? (
                    <p className="text-xs text-mayssa-brown flex items-start gap-2">
                      <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{order.customer.address}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700 flex items-start gap-2 font-medium">
                      <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                      <span>⚠️ Adresse non renseignée — Cliquez sur « Modifier la commande » pour l&apos;ajouter</span>
                    </p>
                  )
                )}
                {mode === 'livraison' && order.distanceKm != null && (
                  <p className="text-[10px] text-mayssa-brown/70">
                    📍 {order.distanceKm.toFixed(1)} km depuis Annecy
                  </p>
                )}
                {(order.requestedDate || order.requestedTime) && (
                  <p className="text-xs text-mayssa-brown flex items-center gap-2">
                    <Calendar size={12} />
                    {order.requestedDate
                      ? parseDateYyyyMmDd(order.requestedDate).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'long' })
                      : ''}
                    {order.requestedTime && (
                      <span className="font-bold">{mode === 'livraison' ? 'à' : '—'} {order.requestedTime}</span>
                    )}
                  </p>
                )}
                {order.clientNote && (
                  <p className="text-xs text-mayssa-brown flex items-start gap-2 italic">
                    <MessageSquare size={12} className="flex-shrink-0 mt-0.5" />
                    <span>&quot;{order.clientNote}&quot;</span>
                  </p>
                )}
              </div>

              {/* Articles */}
              <div className="bg-mayssa-soft/30 rounded-xl p-3 mb-3 space-y-1">
                <p className="text-[10px] font-bold text-mayssa-brown/60 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <Package size={10} />
                  Articles
                </p>
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-mayssa-brown">{item.quantity}× {item.name}</span>
                    <span className="font-bold text-mayssa-brown">
                      {(item.price * item.quantity).toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                ))}
                {mode === 'livraison' && (order.deliveryFee ?? 0) > 0 && (
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
              <button
                onClick={() => onEditOrder(id)}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-mayssa-brown/10 text-mayssa-brown text-xs font-bold hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
              >
                <Pencil size={14} />
                Modifier la commande
              </button>
            </motion.div>
          ))
        )}
      </div>
    </motion.section>
  )
}
