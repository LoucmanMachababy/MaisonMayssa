import { useState, useEffect, useCallback } from 'react'
import { PRODUCTS } from '../constants'
import type { Product } from '../types'

const STORAGE_KEY = 'maison-mayssa-favorites'

export function useFavorites(products?: Product[]) {
  const catalog = products || PRODUCTS
  const [favorites, setFavorites] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: Product[] = JSON.parse(saved)
        // Validate against current catalog (remove stale favorites)
        const validIds = new Set(catalog.map(p => p.id))
        return parsed.filter(p => validIds.has(p.id))
      }
      return []
    } catch {
      return []
    }
  })

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  const isFavorite = useCallback((productId: string) => {
    return favorites.some(p => p.id === productId)
  }, [favorites])

  const addFavorite = useCallback((product: Product) => {
    setFavorites(prev => {
      if (prev.some(p => p.id === product.id)) return prev
      return [...prev, product]
    })
  }, [])

  const removeFavorite = useCallback((productId: string) => {
    setFavorites(prev => prev.filter(p => p.id !== productId))
  }, [])

  const toggleFavorite = useCallback((product: Product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id)
      return false
    } else {
      addFavorite(product)
      return true
    }
  }, [isFavorite, addFavorite, removeFavorite])

  const clearFavorites = useCallback(() => {
    setFavorites([])
  }, [])

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    count: favorites.length,
  }
}
