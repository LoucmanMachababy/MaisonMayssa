import { useState, useEffect, useMemo } from 'react'
import { PRODUCTS } from '../constants'
import type { Product, ProductOverrideMap } from '../types'
import { isProductVisible, isProductOrderable } from '../lib/productHelpers'

export type ProductWithAvailability = Product & {
  available: boolean
  visible: boolean
  pinned?: boolean
}

function mergeProduct(p: Product, override?: ProductOverrideMap[string]): ProductWithAvailability {
  if (!override) {
    return {
      ...p,
      available: p.available !== false,
      visible: p.visible !== false,
      pinned: p.pinned ?? false,
    }
  }
  const isCustom = override.isCustom === true
  // image/images/category exclus : le catalogue reste la source de vérité (évite URLs / catégories obsolètes Firebase)
  const { isCustom: _, image: _img, images: _imgs, category: _cat, ...rawOverride } = override
  const overrideFields = Object.fromEntries(
    Object.entries(rawOverride).filter(([, v]) => v !== null && v !== undefined),
  )
  const merged = {
    ...p,
    ...overrideFields,
    category: isCustom && override.category ? override.category : p.category,
    available: p.available === true
      ? true
      : override.available !== undefined
        ? override.available
        : (p.available !== false),
    // visible:true dans le catalogue = toujours afficher (admin peut masquer le reste)
    visible: p.visible === true
      ? true
      : override.visible !== undefined
        ? override.visible
        : (p.visible !== false),
    pinned: override.pinned ?? p.pinned ?? false,
    highlightAsNew:
      override.highlightAsNew != null ? Boolean(override.highlightAsNew) : (p.highlightAsNew ?? false),
    image: isCustom && override.image ? override.image : p.image,
    images: isCustom && override.images?.length ? override.images : p.images,
  } as ProductWithAvailability
  return merged
}

export function useProducts() {
  const [overrides, setOverrides] = useState<ProductOverrideMap>({})

  useEffect(() => {
    let unsub: (() => void) | undefined
    let cancelled = false

    import('../lib/firebase').then(({ listenProductOverrides }) => {
      if (cancelled) return
      unsub = listenProductOverrides(setOverrides)
    })

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [])

  const allProducts = useMemo<ProductWithAvailability[]>(() => {
    const merged: ProductWithAvailability[] = PRODUCTS.map((p) => mergeProduct(p, overrides[p.id]))

    const staticIds = new Set(PRODUCTS.map((p) => p.id))
    for (const [id, override] of Object.entries(overrides)) {
      if (!staticIds.has(id) && override.isCustom && override.category) {
        merged.push({
          id,
          name: override.name || 'Nouveau produit',
          price: override.price || 0,
          category: override.category,
          description: override.description,
          image: override.image,
          badges: override.badges == null ? undefined : override.badges,
          sizes: override.sizes,
          originalPrice: override.originalPrice,
          available: override.available !== false,
          visible: override.visible !== false,
          pinned: override.pinned ?? false,
          highlightAsNew: override.highlightAsNew != null ? Boolean(override.highlightAsNew) : false,
          subcategory: override.subcategory,
        })
      }
    }

    return merged
  }, [overrides])

  /** Produits visibles sur le catalogue (disponibles + bientôt disponibles). */
  const catalogProducts = useMemo(
    () => allProducts.filter(isProductVisible),
    [allProducts],
  )

  /** Produits commandables (visible + available). */
  const availableProducts = useMemo(
    () => allProducts.filter(isProductOrderable),
    [allProducts],
  )

  const comingSoonProducts = useMemo(
    () => allProducts.filter((p) => isProductVisible(p) && p.available === false),
    [allProducts],
  )

  return { allProducts, catalogProducts, availableProducts, comingSoonProducts, overrides }
}
