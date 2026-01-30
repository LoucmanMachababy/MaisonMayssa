import { useState, useEffect, useCallback } from 'react'
import type { Product } from '../types'

const STORAGE_KEY = 'maison-mayssa-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
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
