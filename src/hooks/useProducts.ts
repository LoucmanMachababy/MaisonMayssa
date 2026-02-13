import { useState, useEffect, useMemo } from 'react'
import { PRODUCTS } from '../constants'
import { listenProductOverrides } from '../lib/firebase'
import type { Product, ProductOverrideMap } from '../types'

export type ProductWithAvailability = Product & { available: boolean }

export function useProducts() {
  const [overrides, setOverrides] = useState<ProductOverrideMap>({})

  useEffect(() => {
    return listenProductOverrides(setOverrides)
  }, [])

  const allProducts = useMemo<ProductWithAvailability[]>(() => {
    // 1. Merge static products with their overrides
    const merged: ProductWithAvailability[] = PRODUCTS.map(p => {
      const override = overrides[p.id]
      if (!override) return { ...p, available: true }
      const { isCustom: _, ...overrideFields } = override
      return { ...p, ...overrideFields, available: override.available !== false } as ProductWithAvailability
    })

    // 2. Add custom products (created by admin, not in constants.ts)
    const staticIds = new Set(PRODUCTS.map(p => p.id))
    for (const [id, override] of Object.entries(overrides)) {
      if (!staticIds.has(id) && override.isCustom && override.category) {
        merged.push({
          id,
          name: override.name || 'Nouveau produit',
          price: override.price || 0,
          category: override.category,
          description: override.description,
          image: override.image,
          badges: override.badges,
          sizes: override.sizes,
          originalPrice: override.originalPrice,
          available: override.available !== false,
        })
      }
    }

    return merged
  }, [overrides])

  const availableProducts = useMemo(
    () => allProducts.filter(p => p.available),
    [allProducts]
  )

  return { allProducts, availableProducts, overrides }
}
