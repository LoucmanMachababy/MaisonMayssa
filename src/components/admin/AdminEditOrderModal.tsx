import { useState, useMemo } from 'react'
import { X, Minus, Plus, Trash2, Truck, MapPin, Search, ChevronDown, ChevronUp, Printer } from 'lucide-react'
import { updateOrder, updateStock, isTrompeLoeilProductId, releaseDeliverySlot, reserveDeliverySlot, type Order, type OrderItem, type DeliveryMode, type StockMap } from '../../lib/firebase'
import { formatOrderItemName } from '../../lib/utils'
import { printOrderSlip } from '../../lib/orderPrint'
import type { ProductWithAvailability } from '../../hooks/useProducts'
import type { ProductCategory } from '../../types'

const ALL_CATEGORIES: ProductCategory[] = [
  "Trompe l'oeil", 'Mini Gourmandises', 'Brownies', 'Cookies', 'Layer Cups', 'Boxes', 'Tiramisus',
]

interface AdminEditOrderModalProps {
  orderId: string
  order: Order
  stock: StockMap
  allProducts: ProductWithAvailability[]
  onClose: () => void
  onSaved: () => void
}

export function AdminEditOrderModal({ orderId, order, stock, allProducts, onClose, onSaved }: AdminEditOrderModalProps) {
  const [firstName, setFirstName] = useState(order.customer?.firstName ?? '')
  const [lastName, setLastName] = useState(order.customer?.lastName ?? '')
  const [phone, setPhone] = useState(order.customer?.phone ?? '')
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(order.deliveryMode ?? 'retrait')
  const [address, setAddress] = useState(order.customer?.address ?? '')
  const [requestedDate, setRequestedDate] = useState(order.requestedDate ?? '')
  const [requestedTime, setRequestedTime] = useState(order.requestedTime ?? '')
  const [deliveryFee, setDeliveryFee] = useState<number>(order.deliveryFee ?? 0)
  const [clientNote, setClientNote] = useState(order.clientNote ?? '')
  const [adminNote, setAdminNote] = useState(order.adminNote ?? '')
  const [excludeTrompeLoeilStock, setExcludeTrompeLoeilStock] = useState(order.excludeTrompeLoeilStock ?? false)
  const [items, setItems] = useState<OrderItem[]>(() =>
    (order.items ?? []).map((i) => ({ ...i }))
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set(ALL_CATEGORIES))
  const [sizePickerFor, setSizePickerFor] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [manualTotal, setManualTotal] = useState<string>('')

  const itemsTotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items]
  )
  const total = itemsTotal + (deliveryMode === 'livraison' ? deliveryFee : 0)

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

  // Tous les produits (y compris rupture) pour pouvoir ajouter en édition
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts
    const q = searchQuery.toLowerCase()
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    )
  }, [allProducts, searchQuery])

  const productsByCategory = useMemo(() => {
    const grouped: Record<string, ProductWithAvailability[]> = {}
    for (const cat of ALL_CATEGORIES) {
      const products = filteredProducts.filter(p => p.category === cat)
      if (products.length > 0) grouped[cat] = products
    }
    return grouped
  }, [filteredProducts])

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const addItem = (product: ProductWithAvailability, sizeLabel?: string, price?: number) => {
    const unitPrice = price ?? product.price
    const itemName = sizeLabel ? `${product.name} (${sizeLabel})` : product.name
    const existingIndex = items.findIndex(it =>
      it.productId === product.id && (it.sizeLabel ?? undefined) === (sizeLabel ?? undefined)
    )
    if (existingIndex >= 0) {
      setItems(prev => prev.map((it, i) =>
        i === existingIndex ? { ...it, quantity: it.quantity + 1 } : it
      ))
    } else {
      setItems(prev => [...prev, {
        productId: product.id,
        name: itemName,
        quantity: 1,
        price: unitPrice,
        ...(sizeLabel && { sizeLabel }),
      }])
    }
    setSizePickerFor(null)
  }

  const handleSubmit = async () => {
    setError('')
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError('Remplissez les infos client')
      return
    }
    if (deliveryMode === 'livraison' && !address.trim()) {
      setError('L\'adresse est obligatoire pour une livraison')
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

      // Ajustement stock si bascule "exclure trompes l'oeil"
      const wasExcluded = order.excludeTrompeLoeilStock === true
      if (excludeTrompeLoeilStock && !wasExcluded) {
        // On exclut maintenant : remettre le stock des trompes l'oeil
        for (const item of items) {
          if (isTrompeLoeilProductId(item.productId) && item.productId in stock) {
            const currentQty = stock[item.productId] ?? 0
            await updateStock(item.productId, currentQty + item.quantity)
          }
        }
      } else if (!excludeTrompeLoeilStock && wasExcluded) {
        // On compte maintenant : déduire le stock des trompes l'oeil
        for (const item of items) {
          if (isTrompeLoeilProductId(item.productId) && item.productId in stock) {
            const currentQty = stock[item.productId] ?? 0
            await updateStock(item.productId, Math.max(0, currentQty - item.quantity))
          }
        }
      }

      // Créneaux livraison : libérer l'ancien, réserver le nouveau
      if (order.deliveryMode === 'livraison' && order.requestedDate && order.requestedTime) {
        releaseDeliverySlot(order.requestedDate, order.requestedTime).catch(console.error)
      }
      if (deliveryMode === 'livraison' && requestedDate && requestedTime) {
        reserveDeliverySlot(requestedDate, requestedTime).catch(console.error)
      }

      const finalTotal = manualTotal.trim() && !isNaN(parseFloat(manualTotal))
        ? parseFloat(manualTotal)
        : total

      await updateOrder(orderId, {
        customer: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          ...(deliveryMode === 'livraison' && address.trim() && { address: address.trim() }),
        },
        items,
        total: finalTotal,
        deliveryMode,
        ...(deliveryMode === 'livraison' ? (deliveryFee > 0 ? { deliveryFee } : { deliveryFee: undefined }) : { deliveryFee: undefined }),
        requestedDate: requestedDate || undefined,
        requestedTime: requestedTime || undefined,
        clientNote: clientNote.trim() || undefined,
        adminNote: adminNote.trim() || undefined,
        excludeTrompeLoeilStock,
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
          <h2 className="text-base font-display font-bold text-mayssa-brown">
            Modifier la commande {order.orderNumber != null ? `#${order.orderNumber}` : `#${orderId.slice(-8)}`}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const currentOrder: Order = {
                  ...order,
                  customer: { firstName, lastName, phone, ...(address && { address }) },
                  deliveryMode,
                  requestedDate: requestedDate || order.requestedDate,
                  requestedTime: requestedTime || order.requestedTime,
                  items,
                  total,
                  deliveryFee: deliveryMode === 'livraison' ? deliveryFee : 0,
                  clientNote: clientNote || undefined,
                  adminNote: adminNote || undefined,
                }
                printOrderSlip(currentOrder, orderId)
              }}
              className="p-2 rounded-lg hover:bg-mayssa-soft transition-colors cursor-pointer text-mayssa-brown/70 hover:text-mayssa-brown"
              title="Imprimer le bon de commande"
            >
              <Printer size={18} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-mayssa-soft transition-colors cursor-pointer">
              <X size={18} className="text-mayssa-brown/60" />
            </button>
          </div>
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

          {items.some(i => isTrompeLoeilProductId(i.productId)) && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeTrompeLoeilStock}
                onChange={e => setExcludeTrompeLoeilStock(e.target.checked)}
                className="rounded border-mayssa-brown/20 text-mayssa-caramel focus:ring-mayssa-caramel"
              />
              <span className="text-xs text-mayssa-brown">Ne pas compter cette commande dans le stock des trompes l&apos;œil</span>
            </label>
          )}

          {deliveryMode === 'livraison' && (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Adresse de livraison (obligatoire)</label>
                <input
                  type="text"
                  placeholder="Adresse complète..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Frais de livraison</label>
                <div className="flex flex-wrap items-center gap-2">
                  {[0, 3, 5, 7, 10].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setDeliveryFee(fee)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        deliveryFee === fee
                          ? 'bg-mayssa-brown text-white border-mayssa-brown'
                          : 'bg-white border-mayssa-brown/10 text-mayssa-brown/70 hover:bg-mayssa-soft/50'
                      }`}
                    >
                      {fee === 0 ? 'Gratuit' : `${fee} €`}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="Autre"
                    value={[0, 3, 5, 7, 10].includes(deliveryFee) ? '' : deliveryFee}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      setDeliveryFee(isNaN(v) || v < 0 ? 0 : Math.round(v * 100) / 100)
                    }}
                    className="w-20 rounded-xl border border-mayssa-brown/10 px-2 py-2 text-xs font-bold text-mayssa-brown bg-white focus:outline-none focus:ring-2 focus:ring-mayssa-caramel [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-mayssa-brown/50">€</span>
                </div>
              </div>
            </>
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
            <div className="border border-mayssa-brown/10 rounded-xl p-3 space-y-2 mb-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-mayssa-brown truncate">{formatOrderItemName(item)}</p>
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
              {deliveryMode === 'livraison' && deliveryFee > 0 && (
                <div className="border-t border-mayssa-brown/10 pt-2 flex justify-between">
                  <span className="text-xs text-mayssa-brown/70">Frais de livraison</span>
                  <span className="text-xs font-bold text-mayssa-brown">+{deliveryFee.toFixed(2).replace('.', ',')} €</span>
                </div>
              )}
              <div className="border-t border-mayssa-brown/10 pt-2 flex justify-between">
                <span className="text-xs font-bold text-mayssa-brown">Total</span>
                <span className="text-sm font-bold text-mayssa-caramel">{total.toFixed(2).replace('.', ',')} €</span>
              </div>
            </div>

            {/* Ajouter des produits (même en rupture) */}
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mayssa-brown/40" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-mayssa-soft/50 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
            </div>
            <div className="border border-mayssa-brown/10 rounded-xl max-h-40 overflow-y-auto">
              {Object.entries(productsByCategory).map(([cat, products]) => (
                <div key={cat}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-mayssa-soft/30 text-xs font-bold text-mayssa-brown/70 hover:bg-mayssa-soft/50 transition-colors cursor-pointer sticky top-0"
                  >
                    {cat} ({products.length})
                    {expandedCategories.has(cat) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {expandedCategories.has(cat) && products.map(product => {
                    const stockQty = stock[product.id]
                    const isSoldOut = stockQty !== undefined && stockQty <= 0
                    return (
                      <div key={product.id}>
                        <div className={`flex items-center justify-between px-3 py-2 border-t border-mayssa-brown/5 ${isSoldOut ? 'bg-amber-50/50' : ''}`}>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-mayssa-brown truncate">{product.name}</p>
                            <p className="text-[10px] text-mayssa-brown/50">
                              {product.price.toFixed(2).replace('.', ',')} €
                              {stockQty !== undefined && (
                                <span className={isSoldOut ? ' text-amber-600 font-medium' : ''}>
                                  {isSoldOut ? ' · Rupture' : ` · ${stockQty} en stock`}
                                </span>
                              )}
                            </p>
                          </div>
                          {product.sizes && product.sizes.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setSizePickerFor(sizePickerFor === product.id ? null : product.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-mayssa-brown text-white hover:bg-mayssa-caramel transition-colors cursor-pointer text-xs"
                            >
                              <Plus size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addItem(product)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-mayssa-brown text-white hover:bg-mayssa-caramel transition-colors cursor-pointer"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                        {sizePickerFor === product.id && product.sizes && (
                          <div className="px-3 pb-2 flex flex-wrap gap-1">
                            {product.sizes.map(size => (
                              <button
                                key={size.label}
                                type="button"
                                onClick={() => addItem(product, size.label, size.price)}
                                className="px-2 py-1 rounded-lg bg-mayssa-soft text-[10px] font-bold text-mayssa-brown hover:bg-mayssa-caramel/20 transition-colors cursor-pointer"
                              >
                                {size.label} · {size.price.toFixed(2).replace('.', ',')} €
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-mayssa-brown/40 mt-1">
              Vous pouvez ajouter des produits même en rupture de stock.
            </p>
          </div>

          {/* Total personnalisé */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">
              Total personnalisé (optionnel)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={0.01}
                value={manualTotal}
                onChange={e => setManualTotal(e.target.value)}
                placeholder={`${total.toFixed(2)} € (calculé)`}
                className="flex-1 rounded-xl border border-mayssa-brown/10 px-3 py-2 text-sm font-bold text-mayssa-brown bg-mayssa-soft/50 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {manualTotal && (
                <button type="button" onClick={() => setManualTotal('')}
                  className="text-[10px] text-mayssa-brown/50 hover:text-red-400 cursor-pointer whitespace-nowrap">
                  Réinitialiser
                </button>
              )}
            </div>
            {manualTotal && !isNaN(parseFloat(manualTotal)) && (
              <p className="text-[10px] text-amber-600">
                Total modifié : {parseFloat(manualTotal).toFixed(2)} € (calculé : {total.toFixed(2)} €)
              </p>
            )}
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
