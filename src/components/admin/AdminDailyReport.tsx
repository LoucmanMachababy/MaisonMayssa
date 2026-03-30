import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Download, CheckCircle, Clock, Truck, MapPin, Package, MessageCircle } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { cn } from '../../lib/utils'
import type { Order } from '../../lib/firebase'
import { parseDateYyyyMmDd, formatOrderItemName, expandOrderItemForProductionAggregate } from '../../lib/utils'
import { formatOrderCustomerDisplayName } from '../../lib/orderCustomerDisplay'

interface AdminDailyReportProps {
  orders: Record<string, Order>
  isOpen: boolean
  onClose: () => void
}

export function AdminDailyReport({ orders, isOpen, onClose }: AdminDailyReportProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })

  const reportOrders = Object.entries(orders).filter(([, o]) => {
    if (!o.requestedDate) return false
    return o.requestedDate === selectedDate && !['refusee'].includes(o.status)
  }).sort(([, a], [, b]) => {
    const timeA = a.requestedTime ?? '00:00'
    const timeB = b.requestedTime ?? '00:00'
    return timeA.localeCompare(timeB)
  })

  const stats = {
    total: reportOrders.length,
    livraison: reportOrders.filter(([, o]) => o.deliveryMode === 'livraison').length,
    retrait: reportOrders.filter(([, o]) => o.deliveryMode === 'retrait').length,
    ca: reportOrders.filter(([, o]) => ['validee', 'livree', 'en_preparation', 'pret'].includes(o.status)).reduce((s, [, o]) => s + (o.total ?? 0), 0),
    enAttente: reportOrders.filter(([, o]) => o.status === 'en_attente').length,
    enPreparation: reportOrders.filter(([, o]) => o.status === 'en_preparation').length,
    pret: reportOrders.filter(([, o]) => o.status === 'pret').length,
    livrees: reportOrders.filter(([, o]) => ['livree', 'validee'].includes(o.status)).length,
  }

  // Production recap: sum all items (box découverte → une ligne par trompe choisi)
  const productionMap: Record<string, { name: string; qty: number }> = {}
  for (const [, o] of reportOrders) {
    if (o.status === 'refusee') continue
    for (const item of o.items ?? []) {
      const q = item.quantity ?? 1
      for (const row of expandOrderItemForProductionAggregate({ ...item, quantity: q })) {
        const key = row.aggregateKey
        if (!productionMap[key]) productionMap[key] = { name: row.label, qty: 0 }
        productionMap[key].qty += row.quantity
      }
    }
  }
  const productionList = Object.values(productionMap).sort((a, b) => b.qty - a.qty)

  const handleExportPDF = () => {
    const doc = new jsPDF({ format: 'a4' })
    const margin = 15
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 20

    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Rapport Journalier — Maison Mayssa', margin, y)
    y += 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const dateLabel = parseDateYyyyMmDd(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    doc.text(dateLabel, margin, y)
    y += 3
    doc.setLineWidth(0.5)
    doc.setDrawColor(197, 160, 89)
    doc.line(margin, y + 2, pageWidth - margin, y + 2)
    y += 12

    // Stats
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Résumé', margin, y)
    y += 7
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total commandes : ${stats.total}`, margin, y); y += 5
    doc.text(`Livraisons : ${stats.livraison}  |  Retraits : ${stats.retrait}`, margin, y); y += 5
    doc.text(`CA estimé : ${stats.ca.toFixed(2)} €`, margin, y); y += 10

    // Production
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('À préparer', margin, y)
    y += 7
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    for (const p of productionList) {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.text(`• ${p.qty}× ${p.name}`, margin + 3, y)
      y += 5
    }
    y += 5

    // Orders
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Détail des commandes', margin, y)
    y += 7

    for (const [, o] of reportOrders) {
      if (y > 250) { doc.addPage(); y = 20 }
      const client = formatOrderCustomerDisplayName(o)
      const creneau = o.requestedTime ?? '—'
      const mode = o.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'
      const total = (o.total ?? 0).toFixed(2)
      const items = (o.items ?? []).map(i => `${i.quantity}× ${formatOrderItemName(i)}`).join(', ')

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${creneau} — ${client} (${mode}) — ${total} €`, margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      const itemLines = doc.splitTextToSize(items, pageWidth - margin * 2 - 10)
      doc.text(itemLines, margin + 5, y)
      y += itemLines.length * 4.5 + 2
      if (o.customer?.address && o.deliveryMode === 'livraison') {
        const addrLines = doc.splitTextToSize(`📍 ${o.customer.address}`, pageWidth - margin * 2 - 10)
        doc.text(addrLines, margin + 5, y)
        y += addrLines.length * 4.5 + 2
      }
      if (o.clientNote) {
        doc.text(`Note : ${o.clientNote}`, margin + 5, y)
        y += 5
      }
      y += 2
    }

    doc.save(`rapport-maison-mayssa-${selectedDate}.pdf`)
  }

  const handleCopyForWhatsApp = () => {
    const dateLabel = parseDateYyyyMmDd(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    let text = `📋 *Résumé du jour — ${dateLabel}*\n\n`
    text += `📦 ${stats.total} commande${stats.total > 1 ? 's' : ''} • CA : ${stats.ca.toFixed(0)}€\n`
    text += `🚚 ${stats.livraison} livraison${stats.livraison > 1 ? 's' : ''} • 📍 ${stats.retrait} retrait${stats.retrait > 1 ? 's' : ''}\n\n`
    if (productionList.length > 0) {
      text += `*À préparer :*\n`
      productionList.forEach(p => { text += `• ${p.qty}× ${p.name}\n` })
    }
    navigator.clipboard.writeText(text)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[min(480px,100vw)] bg-white z-[110] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-mayssa-brown/5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-mayssa-gold/10 flex items-center justify-center">
                  <FileText size={16} className="text-mayssa-gold" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-mayssa-brown">Rapport Journalier</h2>
                  <p className="text-[10px] text-mayssa-brown/40">Synthèse de la journée</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyForWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors cursor-pointer"
                  title="Copier le résumé pour WhatsApp"
                >
                  <MessageCircle size={12} /> Copier
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-brown/90 transition-colors cursor-pointer"
                >
                  <Download size={12} /> PDF
                </button>
                <button onClick={onClose} className="p-2 rounded-xl text-mayssa-brown/40 hover:bg-mayssa-brown/5 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Date selector */}
            <div className="px-6 py-3 border-b border-mayssa-brown/5">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-mayssa-brown/15 px-4 py-2.5 text-sm text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-gold/30"
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total commandes', value: stats.total, icon: <Package size={14} />, color: 'text-mayssa-brown' },
                  { label: 'CA estimé', value: `${stats.ca.toFixed(0)}€`, icon: <CheckCircle size={14} />, color: 'text-mayssa-gold' },
                  { label: 'Livraisons', value: stats.livraison, icon: <Truck size={14} />, color: 'text-blue-600' },
                  { label: 'Retraits', value: stats.retrait, icon: <MapPin size={14} />, color: 'text-emerald-600' },
                ].map(s => (
                  <div key={s.label} className="bg-mayssa-soft/40 rounded-2xl p-4 border border-mayssa-brown/5">
                    <div className={cn('flex items-center gap-1.5 text-mayssa-brown/50 mb-2', s.color)}>{s.icon}</div>
                    <p className={cn('text-xl font-black', s.color)}>{s.value}</p>
                    <p className="text-[9px] text-mayssa-brown/40 uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Status breakdown */}
              <div className="bg-white rounded-2xl border border-mayssa-brown/8 p-4 space-y-2">
                <p className="text-xs font-black text-mayssa-brown uppercase tracking-wider mb-3">Avancement</p>
                {[
                  { label: 'En attente', count: stats.enAttente, color: 'bg-amber-400' },
                  { label: 'En préparation', count: stats.enPreparation, color: 'bg-blue-400' },
                  { label: 'Prête', count: stats.pret, color: 'bg-emerald-400' },
                  { label: 'Livré / Validé', count: stats.livrees, color: 'bg-purple-400' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className={cn('h-2 w-2 rounded-full flex-shrink-0', s.color)} />
                    <p className="text-xs text-mayssa-brown flex-1">{s.label}</p>
                    <p className="text-xs font-black text-mayssa-brown">{s.count}</p>
                  </div>
                ))}
              </div>

              {/* Production list */}
              {productionList.length > 0 && (
                <div className="bg-white rounded-2xl border border-mayssa-brown/8 p-4">
                  <p className="text-xs font-black text-mayssa-brown uppercase tracking-wider mb-3">📋 À préparer</p>
                  <div className="space-y-2">
                    {productionList.map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-mayssa-brown/5 last:border-0">
                        <p className="text-xs text-mayssa-brown">{p.name}</p>
                        <span className="text-xs font-black text-mayssa-brown bg-mayssa-gold/10 text-mayssa-gold px-2 py-0.5 rounded-lg">
                          × {p.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders list */}
              {reportOrders.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-black text-mayssa-brown uppercase tracking-wider">Commandes du jour</p>
                  {reportOrders.map(([id, o]) => {
                    const client = formatOrderCustomerDisplayName(o)
                    const items = (o.items ?? []).map(i => `${i.quantity}× ${formatOrderItemName(i)}`).join(', ')
                    return (
                      <div key={id} className={cn(
                        'rounded-2xl p-4 border-l-4 space-y-2',
                        o.status === 'en_attente' ? 'bg-amber-50 border-l-amber-400' :
                        o.status === 'en_preparation' ? 'bg-blue-50 border-l-blue-400' :
                        o.status === 'pret' ? 'bg-emerald-50 border-l-emerald-400' :
                        'bg-mayssa-soft/30 border-l-mayssa-brown/20'
                      )}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Clock size={10} className="text-mayssa-brown/40" />
                              <span className="text-[10px] font-bold text-mayssa-brown/50">{o.requestedTime ?? '—'}</span>
                              {o.deliveryMode === 'livraison'
                                ? <Truck size={10} className="text-blue-500" />
                                : <MapPin size={10} className="text-emerald-500" />}
                            </div>
                            <p className="text-sm font-bold text-mayssa-brown mt-0.5">{client}</p>
                          </div>
                          <p className="text-sm font-black text-mayssa-gold">{(o.total ?? 0).toFixed(0)}€</p>
                        </div>
                        <p className="text-[10px] text-mayssa-brown/60">{items}</p>
                        {o.customer?.address && o.deliveryMode === 'livraison' && (
                          <p className="text-[10px] text-blue-700 flex items-start gap-1">
                            <MapPin size={9} className="mt-0.5 flex-shrink-0" />{o.customer.address}
                          </p>
                        )}
                        {o.clientNote && (
                          <p className="text-[10px] italic text-mayssa-brown/50">"{o.clientNote}"</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {reportOrders.length === 0 && (
                <div className="text-center py-12">
                  <FileText size={32} className="mx-auto text-mayssa-brown/15 mb-3" />
                  <p className="text-sm text-mayssa-brown/50">Aucune commande ce jour</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
