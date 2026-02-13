import { useState, useMemo } from 'react'
import { Minus, Plus, ChevronDown, ChevronUp, Infinity, X } from 'lucide-react'
import { updateStock, initializeStock, removeStockTracking, type StockMap } from '../../lib/firebase'
import type { ProductWithAvailability } from '../../hooks/useProducts'
import type { ProductCategory } from '../../types'

const ALL_CATEGORIES: ProductCategory[] = [
  "Trompe l'oeil", 'Mini Gourmandises', 'Brownies', 'Cookies', 'Layer Cups', 'Boxes', 'Tiramisus',
]

interface AdminStockTabProps {
  allProducts: ProductWithAvailability[]
  stock: StockMap
}

export function AdminStockTab({ allProducts, stock }: AdminStockTabProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Trompe l'oeil"]))
  const [saving, setSaving] = useState<string | null>(null)
  const [initQty, setInitQty] = useState<Record<string, string>>({})

  const productsByCategory = useMemo(() => {
    const grouped: Record<string, ProductWithAvailability[]> = {}
    for (const cat of ALL_CATEGORIES) {
      const products = allProducts.filter(p => p.category === cat && p.available !== false)
      if (products.length > 0) grouped[cat] = products
    }
    return grouped
  }, [allProducts])

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

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

  const handleEnableTracking = async (productId: string) => {
    const qty = parseInt(initQty[productId] || '10', 10)
    setSaving(productId)
    await initializeStock(productId, isNaN(qty) ? 10 : qty)
    setSaving(null)
    setInitQty(prev => { const next = { ...prev }; delete next[productId]; return next })
  }

  const handleDisableTracking = async (productId: string) => {
    setSaving(productId)
    await removeStockTracking(productId)
    setSaving(null)
  }

  const handleResetCategory = async (cat: string, qty: number) => {
    const products = productsByCategory[cat] ?? []
    for (const p of products) {
      if (p.id in stock) {
        await updateStock(p.id, qty)
      }
    }
  }

  const getTrackedCount = (cat: string) => {
    return (productsByCategory[cat] ?? []).filter(p => p.id in stock).length
  }

  return (
    <section className="space-y-3">
      {Object.entries(productsByCategory).map(([cat, products]) => {
        const isExpanded = expandedCategories.has(cat)
        const trackedCount = getTrackedCount(cat)
        return (
          <div key={cat} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Category header */}
            <button
              type="button"
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-mayssa-soft/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-mayssa-brown">{cat}</span>
                <span className="text-[10px] text-mayssa-brown/50">
                  {trackedCount}/{products.length} suivis
                </span>
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-mayssa-brown/40" /> : <ChevronDown size={16} className="text-mayssa-brown/40" />}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {/* Bulk actions for tracked products */}
                {trackedCount > 0 && (
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => handleResetCategory(cat, 20)}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Tout à 20
                    </button>
                    <button
                      onClick={() => handleResetCategory(cat, 10)}
                      className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      Tout à 10
                    </button>
                    <button
                      onClick={() => handleResetCategory(cat, 0)}
                      className="flex-1 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Tout à 0
                    </button>
                  </div>
                )}

                {products.map(product => {
                  const isTracked = product.id in stock
                  const qty = stock[product.id] ?? 0
                  const isSaving = saving === product.id

                  if (isTracked) {
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                          qty === 0 ? 'bg-red-50 border border-red-200' : 'bg-mayssa-soft/30 border border-mayssa-brown/5'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-mayssa-brown truncate">{product.name}</p>
                          <p className={`text-[10px] font-bold ${qty === 0 ? 'text-red-500' : qty <= 5 ? 'text-orange-500' : 'text-emerald-600'}`}>
                            {qty === 0 ? 'Rupture' : `${qty} en stock`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStockChange(product.id, -1)}
                            disabled={qty === 0 || isSaving}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-mayssa-brown/10 text-mayssa-brown hover:bg-red-50 disabled:opacity-30 transition-all cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => handleStockSet(product.id, e.target.value)}
                            className="w-12 text-center rounded-lg border border-mayssa-brown/10 py-1 text-xs font-bold text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                          />
                          <button
                            onClick={() => handleStockChange(product.id, 1)}
                            disabled={isSaving}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-mayssa-brown/10 text-mayssa-brown hover:bg-emerald-50 disabled:opacity-30 transition-all cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => handleDisableTracking(product.id)}
                            disabled={isSaving}
                            title="Arrêter le suivi (illimité)"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-mayssa-brown/30 hover:bg-red-50 hover:text-red-400 disabled:opacity-30 transition-all cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )
                  }

                  // Not tracked - show "enable" option
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 rounded-xl p-3 bg-mayssa-soft/10 border border-dashed border-mayssa-brown/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-mayssa-brown/60 truncate">{product.name}</p>
                        <p className="text-[10px] text-mayssa-brown/40 flex items-center gap-1">
                          <Infinity size={10} /> Illimité
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          placeholder="10"
                          value={initQty[product.id] ?? ''}
                          onChange={e => setInitQty(prev => ({ ...prev, [product.id]: e.target.value }))}
                          className="w-12 text-center rounded-lg border border-mayssa-brown/10 py-1 text-xs text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel placeholder:text-mayssa-brown/30"
                        />
                        <button
                          onClick={() => handleEnableTracking(product.id)}
                          disabled={isSaving}
                          className="px-2.5 py-1.5 rounded-lg bg-mayssa-brown text-white text-[10px] font-bold hover:bg-mayssa-caramel disabled:opacity-30 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Suivre
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
