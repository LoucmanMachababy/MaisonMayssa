import { useState, useMemo } from 'react'
import { X, Minus, Plus, Search, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { createOffSiteOrder, decrementStockBatch, type OrderSource, type OrderItem, type DeliveryMode, type StockMap } from '../../lib/firebase'
import type { ProductWithAvailability } from '../../hooks/useProducts'
import type { ProductCategory } from '../../types'

const ALL_CATEGORIES: ProductCategory[] = [
  "Trompe l'oeil", 'Mini Gourmandises', 'Brownies', 'Cookies', 'Layer Cups', 'Boxes', 'Tiramisus',
]

const SOURCE_OPTIONS: { value: OrderSource; label: string; color: string }[] = [
  { value: 'snap', label: 'Snapchat', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-100 text-pink-800 border-pink-300' },
  { value: 'whatsapp', label: 'WhatsApp', color: 'bg-green-100 text-green-800 border-green-300' },
]

interface CartEntry {
  product: ProductWithAvailability
  quantity: number
  sizeLabel?: string
  unitPrice: number
}

interface AdminOffSiteOrderFormProps {
  allProducts: ProductWithAvailability[]
  stock: StockMap
  onClose: () => void
  onOrderCreated: () => void
}

export function AdminOffSiteOrderForm({ allProducts, stock, onClose, onOrderCreated }: AdminOffSiteOrderFormProps) {
  const [source, setSource] = useState<OrderSource | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [cart, setCart] = useState<CartEntry[]>([])
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('retrait')
  const [address, setAddress] = useState('')
  const [requestedDate, setRequestedDate] = useState('')
  const [requestedTime, setRequestedTime] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [sizePickerFor, setSizePickerFor] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total = cart.reduce((sum, entry) => sum + entry.unitPrice * entry.quantity, 0)

  const availableProducts = useMemo(() => {
    return allProducts.filter(p => p.available !== false)
  }, [allProducts])

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return availableProducts
    const q = searchQuery.toLowerCase()
    return availableProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    )
  }, [availableProducts, searchQuery])

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

  const addToCart = (product: ProductWithAvailability, sizeLabel?: string, price?: number) => {
    const unitPrice = price ?? product.price
    const existingIndex = cart.findIndex(e =>
      e.product.id === product.id && e.sizeLabel === sizeLabel
    )
    if (existingIndex >= 0) {
      setCart(prev => prev.map((e, i) =>
        i === existingIndex ? { ...e, quantity: e.quantity + 1 } : e
      ))
    } else {
      setCart(prev => [...prev, { product, quantity: 1, sizeLabel, unitPrice }])
    }
    setSizePickerFor(null)
  }

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const entry = prev[index]
      const newQty = entry.quantity + delta
      if (newQty <= 0) return prev.filter((_, i) => i !== index)
      return prev.map((e, i) => i === index ? { ...e, quantity: newQty } : e)
    })
  }

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError('')
    if (!source) { setError('Choisissez une source'); return }
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) { setError('Remplissez les infos client'); return }
    if (cart.length === 0) { setError('Ajoutez au moins un produit'); return }

    setSaving(true)
    try {
      const items: OrderItem[] = cart.map(entry => ({
        productId: entry.product.id,
        name: entry.sizeLabel ? `${entry.product.name} (${entry.sizeLabel})` : entry.product.name,
        quantity: entry.quantity,
        price: entry.unitPrice,
        sizeLabel: entry.sizeLabel,
      }))

      await createOffSiteOrder({
        items,
        customer: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          ...(deliveryMode === 'livraison' && address.trim() && { address: address.trim() }),
        },
        total,
        status: 'validee',
        source,
        deliveryMode,
        ...(requestedDate && { requestedDate }),
        ...(requestedTime && { requestedTime }),
        ...(adminNote.trim() && { adminNote: adminNote.trim() }),
      })

      await decrementStockBatch(
        cart.map(entry => ({ productId: entry.product.id, quantity: entry.quantity }))
      )

      onOrderCreated()
      onClose()
    } catch (err: unknown) {
      console.error('[OffSite] Erreur sauvegarde commande:', err)
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : ''
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : ''
      if (code === 'PERMISSION_DENIED' || msg.includes('permission')) {
        setError('Permission refusée par Firebase. Vérifiez les règles de la base.')
      } else {
        setError(msg || 'Erreur lors de la sauvegarde')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-mayssa-brown/10">
          <h2 className="text-base font-display font-bold text-mayssa-brown">Nouvelle commande hors-site</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-mayssa-soft transition-colors cursor-pointer">
            <X size={18} className="text-mayssa-brown/60" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Source */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Source</label>
            <div className="flex gap-2">
              {SOURCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSource(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    source === opt.value ? opt.color : 'bg-white border-mayssa-brown/10 text-mayssa-brown/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Client */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Client</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Prénom"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
              <input
                type="text"
                placeholder="Nom"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
            </div>
            <input
              type="tel"
              placeholder="Téléphone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
            />
          </div>

          {/* Produits */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Produits</label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mayssa-brown/40" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-mayssa-soft/50 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
            </div>

            <div className="border border-mayssa-brown/10 rounded-xl max-h-52 overflow-y-auto">
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
                        <div className={`flex items-center justify-between px-3 py-2 border-t border-mayssa-brown/5 ${isSoldOut ? 'opacity-40' : ''}`}>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-mayssa-brown truncate">{product.name}</p>
                            <p className="text-[10px] text-mayssa-brown/50">
                              {product.price.toFixed(2).replace('.', ',')} €
                              {stockQty !== undefined && <span className="ml-1">· {stockQty} en stock</span>}
                            </p>
                          </div>
                          {product.sizes && product.sizes.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setSizePickerFor(sizePickerFor === product.id ? null : product.id)}
                              disabled={isSoldOut}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-mayssa-brown text-white hover:bg-mayssa-caramel disabled:bg-mayssa-brown/20 transition-colors cursor-pointer text-xs"
                            >
                              <Plus size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToCart(product)}
                              disabled={isSoldOut}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-mayssa-brown text-white hover:bg-mayssa-caramel disabled:bg-mayssa-brown/20 transition-colors cursor-pointer"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                        {/* Size picker inline */}
                        {sizePickerFor === product.id && product.sizes && (
                          <div className="px-3 pb-2 flex flex-wrap gap-1">
                            {product.sizes.map(size => (
                              <button
                                key={size.label}
                                type="button"
                                onClick={() => addToCart(product, size.label, size.price)}
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

            {/* Mini panier */}
            {cart.length > 0 && (
              <div className="mt-3 border border-mayssa-brown/10 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">Panier ({cart.length})</p>
                {cart.map((entry, i) => (
                  <div key={`${entry.product.id}-${entry.sizeLabel ?? ''}`} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-mayssa-brown truncate">
                        {entry.product.name}
                        {entry.sizeLabel && <span className="text-mayssa-brown/50"> ({entry.sizeLabel})</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => updateCartQuantity(i, -1)} className="h-6 w-6 flex items-center justify-center rounded bg-mayssa-soft text-mayssa-brown hover:bg-red-50 cursor-pointer">
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold text-mayssa-brown w-5 text-center">{entry.quantity}</span>
                      <button type="button" onClick={() => updateCartQuantity(i, 1)} className="h-6 w-6 flex items-center justify-center rounded bg-mayssa-soft text-mayssa-brown hover:bg-emerald-50 cursor-pointer">
                        <Plus size={10} />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-mayssa-brown w-14 text-right">
                      {(entry.unitPrice * entry.quantity).toFixed(2).replace('.', ',')} €
                    </span>
                    <button type="button" onClick={() => removeFromCart(i)} className="p-1 text-red-400 hover:text-red-600 cursor-pointer">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <div className="border-t border-mayssa-brown/10 pt-2 flex justify-between">
                  <span className="text-xs font-bold text-mayssa-brown">Total</span>
                  <span className="text-sm font-bold text-mayssa-caramel">{total.toFixed(2).replace('.', ',')} €</span>
                </div>
              </div>
            )}
          </div>

          {/* Mode */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Mode</label>
            <div className="flex gap-2">
              {(['retrait', 'livraison'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDeliveryMode(mode)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    deliveryMode === mode
                      ? 'bg-mayssa-brown text-white border-mayssa-brown'
                      : 'bg-white border-mayssa-brown/10 text-mayssa-brown/50'
                  }`}
                >
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
                onChange={e => setAddress(e.target.value)}
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
                onChange={e => setRequestedDate(e.target.value)}
                className="rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
              <input
                type="time"
                value={requestedTime}
                onChange={e => setRequestedTime(e.target.value)}
                className="rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
              />
            </div>
          </div>

          {/* Note admin */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2 block">Note (optionnel)</label>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Note interne..."
              rows={2}
              className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-mayssa-brown text-white font-bold hover:bg-mayssa-caramel transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer la commande'}
          </button>
        </div>
      </div>
    </div>
  )
}
