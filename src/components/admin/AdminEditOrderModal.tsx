import { useState, useMemo } from 'react'
import { X, Minus, Plus, Trash2, Truck, MapPin } from 'lucide-react'
import { updateOrder, updateStock, type Order, type OrderItem, type DeliveryMode, type StockMap } from '../../lib/firebase'

interface AdminEditOrderModalProps {
  orderId: string
  order: Order
  stock: StockMap
  onClose: () => void
  onSaved: () => void
}

export function AdminEditOrderModal({ orderId, order, stock, onClose, onSaved }: AdminEditOrderModalProps) {
  const [firstName, setFirstName] = useState(order.customer?.firstName ?? '')
  const [lastName, setLastName] = useState(order.customer?.lastName ?? '')
  const [phone, setPhone] = useState(order.customer?.phone ?? '')
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(order.deliveryMode ?? 'retrait')
  const [address, setAddress] = useState(order.customer?.address ?? '')
  const [requestedDate, setRequestedDate] = useState(order.requestedDate ?? '')
  const [requestedTime, setRequestedTime] = useState(order.requestedTime ?? '')
  const [clientNote, setClientNote] = useState(order.clientNote ?? '')
  const [adminNote, setAdminNote] = useState(order.adminNote ?? '')
  const [items, setItems] = useState<OrderItem[]>(() =>
    (order.items ?? []).map((i) => ({ ...i }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items]
  )

  const updateItemQuantity = (index: number, delta: number) => {
    setItems((prev) => {
      const entry = prev[index]
      const newQty = Math.max(0, entry.quantity + delta)
      if (newQty === 0) return prev.filter((_, i) => i !== index)
      return prev.map((e, i) =>
        i === index ? { ...e, quantity: newQty } : e
      )
    })
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError('')
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError('Remplissez les infos client')
      return
    }
    if (items.length === 0) {
      setError('Ajoutez au moins un produit')
      return
    }

    setSaving(true)
    try {
      const oldItems = order.items ?? []
      const oldByProduct: Record<string, number> = {}
      for (const it of oldItems) {
        oldByProduct[it.productId] = (oldByProduct[it.productId] ?? 0) + it.quantity
      }
      const newByProduct: Record<string, number> = {}
      for (const it of items) {
        newByProduct[it.productId] = (newByProduct[it.productId] ?? 0) + it.quantity
      }

      const allProductIds = new Set([...Object.keys(oldByProduct), ...Object.keys(newByProduct)])

      for (const productId of allProductIds) {
        if (!(productId in stock)) continue
        const oldQty = oldByProduct[productId] ?? 0
        const newQty = newByProduct[productId] ?? 0
        const diff = oldQty - newQty
        if (diff === 0) continue
        const qty = Math.max(0, (stock[productId] ?? 0) + diff)
        await updateStock(productId, qty)
      }

      await updateOrder(orderId, {
        customer: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          ...(deliveryMode === 'livraison' && address.trim() && { address: address.trim() }),
        },
        items,
        total,
        deliveryMode,
        requestedDate: requestedDate || undefined,
        requestedTime: requestedTime || undefined,
        clientNote: clientNote.trim() || undefined,
        adminNote: adminNote.trim() || undefined,
      })

      onSaved()
      onClose()
    } catch (err: unknown) {
      console.error('[EditOrder] Erreur:', err)
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-mayssa-brown/10">
          <h2 className="text-base font-display font-bold text-mayssa-brown">Modifier la commande</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-mayssa-soft transition-colors cursor-pointer">
            <X size={18} className="text-mayssa-brown/60" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Client */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Client</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
              <input
                type="text"
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
            </div>
            <input
              type="tel"
              placeholder="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
            />
          </div>

          {/* Mode */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Mode</label>
            <div className="flex gap-2">
              {(['retrait', 'livraison'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDeliveryMode(mode)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    deliveryMode === mode
                      ? 'bg-mayssa-brown text-white border-mayssa-brown'
                      : 'bg-white border-mayssa-brown/10 text-mayssa-brown/50'
                  }`}
                >
                  {mode === 'retrait' ? <MapPin size={14} /> : <Truck size={14} />}
                  {mode === 'retrait' ? 'Retrait' : 'Livraison'}
                </button>
              ))}
            </div>
          </div>

          {deliveryMode === 'livraison' && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Adresse de livraison</label>
              <input
                type="text"
                placeholder="Adresse complète..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
            </div>
          )}

          {/* Date / Heure */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Date / Heure</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
              <input
                type="time"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
            </div>
          </div>

          {/* Produits */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Produits</label>
            <div className="border border-mayssa-brown/10 rounded-xl p-3 space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-mayssa-brown truncate">{item.name}</p>
                    <p className="text-[10px] text-mayssa-brown/50">
                      {(item.price * item.quantity).toFixed(2).replace('.', ',')} €
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(i, -1)}
                      className="h-6 w-6 flex items-center justify-center rounded bg-mayssa-soft text-mayssa-brown hover:bg-red-50 cursor-pointer"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-bold text-mayssa-brown w-6 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(i, 1)}
                      className="h-6 w-6 flex items-center justify-center rounded bg-mayssa-soft text-mayssa-brown hover:bg-emerald-50 cursor-pointer"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div className="border-t border-mayssa-brown/10 pt-2 flex justify-between">
                <span className="text-xs font-bold text-mayssa-brown">Total</span>
                <span className="text-sm font-bold text-mayssa-caramel">{total.toFixed(2).replace('.', ',')} €</span>
              </div>
            </div>
            <p className="text-[10px] text-mayssa-brown/40 mt-1">
              Pour ajouter des produits, supprimez et recréez la commande.
            </p>
          </div>

          {/* Note client */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Note client (consignes, créneau...)</label>
            <textarea
              value={clientNote}
              onChange={(e) => setClientNote(e.target.value)}
              placeholder="Note du client..."
              rows={2}
              className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel resize-none"
            />
          </div>

          {/* Note admin */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Note admin (interne)</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Note interne..."
              rows={2}
              className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-mayssa-brown text-white font-bold hover:bg-mayssa-caramel transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
