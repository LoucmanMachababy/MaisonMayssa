import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, RotateCcw, Plus, Trash2, Tag } from 'lucide-react'
import { PRODUCTS } from '../../constants'
import { updateProductOverride, setProductOverride, deleteProductOverride } from '../../lib/firebase'
import type { ProductOverrideMap, ProductOverride, ProductCategory, ProductBadge, ProductSize } from '../../types'
import type { ProductWithAvailability } from '../../hooks/useProducts'

const ALL_CATEGORIES: ProductCategory[] = [
  "Trompe l'oeil", 'Mini Gourmandises', 'Brownies', 'Cookies', 'Layer Cups', 'Boxes', 'Tiramisus',
]

const ALL_BADGES: { value: ProductBadge; label: string }[] = [
  { value: 'best-seller', label: 'Best seller' },
  { value: 'nouveau', label: 'Nouveau' },
  { value: 'coup-de-coeur', label: 'Coup de coeur' },
  { value: 'populaire', label: 'Populaire' },
]

const staticProductMap = new Map(PRODUCTS.map(p => [p.id, p]))

interface AdminProductsTabProps {
  allProducts: ProductWithAvailability[]
  overrides: ProductOverrideMap
}

export function AdminProductsTab({ allProducts, overrides }: AdminProductsTabProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(ALL_CATEGORIES))
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const productsByCategory = useMemo(() => {
    const grouped: Record<string, ProductWithAvailability[]> = {}
    for (const cat of ALL_CATEGORIES) {
      grouped[cat] = allProducts.filter(p => p.category === cat)
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

  const hasOverride = (productId: string) => !!overrides[productId]
  const isCustomProduct = (productId: string) => !!overrides[productId]?.isCustom

  const handleToggleAvailability = async (product: ProductWithAvailability) => {
    setSaving(product.id)
    await updateProductOverride(product.id, { available: !product.available })
    setSaving(null)
  }

  const handleResetProduct = async (productId: string) => {
    setSaving(productId)
    await deleteProductOverride(productId)
    setSaving(null)
  }

  const handleDeleteCustomProduct = async (productId: string) => {
    setSaving(productId)
    await deleteProductOverride(productId)
    setSaving(null)
  }

  const unavailableCount = allProducts.filter(p => !p.available).length

  return (
    <section className="space-y-4">
      {/* Header stats */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-mayssa-brown">{allProducts.length} produits</p>
          <p className="text-[10px] text-mayssa-brown/50">
            {unavailableCount > 0 ? `${unavailableCount} en rupture` : 'Tous disponibles'}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-caramel transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Ajouter un produit
        </button>
      </div>

      {/* Add product form */}
      {showAddForm && (
        <AddProductForm
          onClose={() => setShowAddForm(false)}
          onSaved={() => setShowAddForm(false)}
        />
      )}

      {/* Products by category */}
      {ALL_CATEGORIES.map(cat => {
        const products = productsByCategory[cat] || []
        if (products.length === 0) return null
        const isExpanded = expandedCategories.has(cat)
        const catUnavailable = products.filter(p => !p.available).length

        return (
          <div key={cat} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between p-4 hover:bg-mayssa-soft/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-mayssa-brown">{cat}</span>
                <span className="text-[10px] text-mayssa-brown/40">{products.length} produit{products.length > 1 ? 's' : ''}</span>
                {catUnavailable > 0 && (
                  <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {catUnavailable} rupture
                  </span>
                )}
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-mayssa-brown/40" /> : <ChevronDown size={16} className="text-mayssa-brown/40" />}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    hasOverride={hasOverride(product.id)}
                    isCustom={isCustomProduct(product.id)}
                    isEditing={editingProduct === product.id}
                    isSaving={saving === product.id}
                    onToggleAvailability={() => handleToggleAvailability(product)}
                    onEdit={() => setEditingProduct(editingProduct === product.id ? null : product.id)}
                    onReset={() => handleResetProduct(product.id)}
                    onDelete={() => handleDeleteCustomProduct(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}

// --- Product Card ---
interface ProductCardProps {
  product: ProductWithAvailability
  hasOverride: boolean
  isCustom: boolean
  isEditing: boolean
  isSaving: boolean
  onToggleAvailability: () => void
  onEdit: () => void
  onReset: () => void
  onDelete: () => void
}

function ProductCard({ product, hasOverride, isCustom, isEditing, isSaving, onToggleAvailability, onEdit, onReset, onDelete }: ProductCardProps) {
  return (
    <div className={`rounded-xl border transition-all ${
      !product.available
        ? 'border-red-200 bg-red-50/50 opacity-70'
        : hasOverride
          ? 'border-mayssa-caramel/30 bg-mayssa-caramel/5'
          : 'border-mayssa-brown/10 bg-white'
    }`}>
      {/* Compact row */}
      <div className="flex items-center gap-3 p-3">
        {/* Image */}
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        )}
        {!product.image && (
          <div className="w-10 h-10 rounded-lg bg-mayssa-soft/50 flex items-center justify-center flex-shrink-0">
            <Tag size={16} className="text-mayssa-brown/30" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-mayssa-brown truncate">{product.name}</p>
            {hasOverride && !isCustom && (
              <span className="text-[8px] bg-mayssa-caramel/20 text-mayssa-caramel px-1 py-0.5 rounded font-bold flex-shrink-0">
                Modifié
              </span>
            )}
            {isCustom && (
              <span className="text-[8px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-bold flex-shrink-0">
                Custom
              </span>
            )}
          </div>
          <p className="text-[10px] text-mayssa-brown/50">
            {product.price.toFixed(2).replace('.', ',')} €
            {product.sizes && product.sizes.length > 0 && ` — ${product.sizes.length} tailles`}
          </p>
        </div>

        {/* Toggle availability */}
        <button
          onClick={onToggleAvailability}
          disabled={isSaving}
          className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
            product.available ? 'bg-emerald-400' : 'bg-red-400'
          }`}
          title={product.available ? 'Disponible' : 'En rupture'}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            product.available ? 'left-5.5 translate-x-0' : 'left-0.5'
          }`} />
        </button>

        {/* Edit button */}
        <button
          onClick={onEdit}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
            isEditing
              ? 'bg-mayssa-brown text-white'
              : 'bg-mayssa-soft/50 text-mayssa-brown/60 hover:bg-mayssa-soft'
          }`}
        >
          {isEditing ? 'Fermer' : 'Modifier'}
        </button>
      </div>

      {/* Expanded edit form */}
      {isEditing && (
        <ProductEditForm
          product={product}
          hasOverride={hasOverride}
          isCustom={isCustom}
          onReset={onReset}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}

// --- Product Edit Form ---
interface ProductEditFormProps {
  product: ProductWithAvailability
  hasOverride: boolean
  isCustom: boolean
  onReset: () => void
  onDelete: () => void
}

function ProductEditForm({ product, hasOverride, isCustom, onReset, onDelete }: ProductEditFormProps) {
  const staticProduct = staticProductMap.get(product.id)
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(product.price.toString())
  const [originalPrice, setOriginalPrice] = useState(product.originalPrice?.toString() || '')
  const [description, setDescription] = useState(product.description || '')
  const [badges, setBadges] = useState<ProductBadge[]>(product.badges || [])
  const [sizes, setSizes] = useState<ProductSize[]>(product.sizes || [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleBadge = (badge: ProductBadge) => {
    setBadges(prev => prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge])
  }

  const updateSize = (index: number, field: keyof ProductSize, value: string) => {
    setSizes(prev => prev.map((s, i) => {
      if (i !== index) return s
      if (field === 'price' || field === 'ml') return { ...s, [field]: parseFloat(value) || 0 }
      return { ...s, [field]: value }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const priceNum = parseFloat(price)
    const origPriceNum = originalPrice ? parseFloat(originalPrice) : undefined

    if (isCustom) {
      // For custom products, set the full override
      await setProductOverride(product.id, {
        name,
        price: priceNum,
        originalPrice: origPriceNum,
        description: description || undefined,
        badges: badges.length > 0 ? badges : undefined,
        sizes: sizes.length > 0 ? sizes : undefined,
        category: product.category,
        isCustom: true,
        available: product.available,
      })
    } else {
      // For static products, only save the diff
      const override: Partial<ProductOverride> = {}
      if (name !== staticProduct?.name) override.name = name
      if (priceNum !== staticProduct?.price) override.price = priceNum
      if (origPriceNum !== staticProduct?.originalPrice) override.originalPrice = origPriceNum
      if (description !== (staticProduct?.description || '')) override.description = description || undefined
      if (JSON.stringify(badges) !== JSON.stringify(staticProduct?.badges || [])) override.badges = badges
      if (JSON.stringify(sizes) !== JSON.stringify(staticProduct?.sizes || [])) override.sizes = sizes

      if (Object.keys(override).length > 0) {
        await updateProductOverride(product.id, override)
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-3 pb-3 space-y-3 border-t border-mayssa-brown/5 pt-3">
      {/* Name */}
      <div>
        <label className="text-[10px] font-bold text-mayssa-brown/60 block mb-1">Nom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg bg-mayssa-soft/30 px-3 py-2 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
        />
      </div>

      {/* Price row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-mayssa-brown/60 block mb-1">Prix (€)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg bg-mayssa-soft/30 px-3 py-2 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-mayssa-brown/60 block mb-1">Ancien prix (promo)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            placeholder="—"
            className="w-full rounded-lg bg-mayssa-soft/30 px-3 py-2 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] font-bold text-mayssa-brown/60 block mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg bg-mayssa-soft/30 px-3 py-2 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel resize-none"
        />
      </div>

      {/* Badges */}
      <div>
        <label className="text-[10px] font-bold text-mayssa-brown/60 block mb-1">Badges</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_BADGES.map(b => (
            <button
              key={b.value}
              onClick={() => toggleBadge(b.value)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                badges.includes(b.value)
                  ? 'bg-mayssa-caramel text-white'
                  : 'bg-mayssa-soft/50 text-mayssa-brown/40 hover:bg-mayssa-soft'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sizes */}
      {sizes.length > 0 && (
        <div>
          <label className="text-[10px] font-bold text-mayssa-brown/60 block mb-1">Tailles & prix</label>
          <div className="space-y-1.5">
            {sizes.map((size, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={size.label}
                  onChange={(e) => updateSize(i, 'label', e.target.value)}
                  className="flex-1 rounded-lg bg-mayssa-soft/30 px-2 py-1.5 text-[11px] text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-1 focus:ring-mayssa-caramel"
                />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={size.price}
                  onChange={(e) => updateSize(i, 'price', e.target.value)}
                  className="w-20 rounded-lg bg-mayssa-soft/30 px-2 py-1.5 text-[11px] text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-1 focus:ring-mayssa-caramel text-right"
                />
                <span className="text-[10px] text-mayssa-brown/40">€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-xl bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-caramel transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>

        {hasOverride && !isCustom && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-50 text-orange-600 text-[10px] font-bold hover:bg-orange-100 transition-colors cursor-pointer"
            title="Remettre les valeurs d'origine"
          >
            <RotateCcw size={12} />
            Réinitialiser
          </button>
        )}

        {isCustom && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}

// --- Add Product Form ---
function AddProductForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('Brownies')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !price) return
    setSaving(true)
    const productId = `custom-${Date.now()}`
    await setProductOverride(productId, {
      name: name.trim(),
      category,
      price: parseFloat(price),
      description: description.trim() || undefined,
      isCustom: true,
      available: true,
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3 border-2 border-mayssa-caramel/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-mayssa-brown">Nouveau produit</h3>
        <button onClick={onClose} className="text-[10px] text-mayssa-brown/40 hover:text-mayssa-brown cursor-pointer">
          Annuler
        </button>
      </div>

      <div>
        <label className="text-[10px] font-bold text-mayssa-brown/60 block mb-1">Nom *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Brownie Pistache"
          className="w-full rounded-lg bg-mayssa-soft/30 px-3 py-2 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-mayssa-brown/60 block mb-1">Catégorie *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="w-full rounded-lg bg-mayssa-soft/30 px-3 py-2 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
          >
            {ALL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="w-28">
          <label className="text-[10px] font-bold text-mayssa-brown/60 block mb-1">Prix (€) *</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="3.50"
            className="w-full rounded-lg bg-mayssa-soft/30 px-3 py-2 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-mayssa-brown/60 block mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description du produit..."
          className="w-full rounded-lg bg-mayssa-soft/30 px-3 py-2 text-sm text-mayssa-brown border border-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving || !name.trim() || !price}
        className="w-full py-2.5 rounded-xl bg-mayssa-brown text-white text-xs font-bold hover:bg-mayssa-caramel transition-colors disabled:opacity-50 cursor-pointer"
      >
        {saving ? 'Création...' : 'Créer le produit'}
      </button>
    </div>
  )
}
