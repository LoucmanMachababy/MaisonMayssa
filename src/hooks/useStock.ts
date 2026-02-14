import { useState, useEffect, useMemo } from 'react'
import { isPreorderOpenNow, type StockMap, type Settings, type PreorderOpening } from '../lib/preorder'

export function useStock() {
  const [stock, setStock] = useState<StockMap>({})
  const [settings, setSettings] = useState<Settings>({ preorderDays: [3, 6], preorderMessage: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stockLoaded = false
    let settingsLoaded = false
    let cancelled = false
    const done = () => { if (stockLoaded && settingsLoaded) setLoading(false) }

    let unsubStock: (() => void) | undefined
    let unsubSettings: (() => void) | undefined

    // Importer Firebase de manière différée pour ne pas bloquer le premier affichage
    import('../lib/firebase').then(({ listenStock, listenSettings }) => {
      if (cancelled) return

      unsubStock = listenStock((data) => {
        setStock(data)
        stockLoaded = true
        done()
      })

      unsubSettings = listenSettings((data) => {
        setSettings(data)
        settingsLoaded = true
        done()
      })
    })

    // Si Firebase ne répond pas en 2s, débloquer quand même (réseau lent / mobile)
    const fallback = setTimeout(() => setLoading(false), 2000)

    return () => {
      cancelled = true
      clearTimeout(fallback)
      unsubStock?.()
      unsubSettings?.()
    }
  }, [])

  const isPreorderDay = useMemo(() => {
    // Optimiste pendant le chargement Firebase : permettre l'ajout pour éviter de bloquer
    if (loading) return true
    const openings: PreorderOpening[] = settings.preorderOpenings && settings.preorderOpenings.length > 0
      ? settings.preorderOpenings
      : (settings.preorderDays || [3, 6]).map((day: number) => ({ day, fromTime: '00:00' }))
    return isPreorderOpenNow(openings)
  }, [loading, settings.preorderOpenings, settings.preorderDays])

  const dayNames = useMemo(() => {
    const names = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
    const openings = settings.preorderOpenings && settings.preorderOpenings.length > 0
      ? settings.preorderOpenings
      : (settings.preorderDays || [3, 6]).map((day: number) => ({ day, fromTime: '00:00' }))
    return openings
      .map((o: { day: number; fromTime: string }) =>
        o.fromTime === '00:00' || o.fromTime === '0:00'
          ? names[o.day]
          : `${names[o.day]} ${o.fromTime}`
      )
      .join(' et ')
  }, [settings.preorderOpenings, settings.preorderDays])

  const getStock = (productId: string): number | null => {
    // Returns null if product doesn't have managed stock
    if (productId in stock) return stock[productId]
    return null
  }

  const isSoldOut = (productId: string): boolean => {
    const qty = getStock(productId)
    return qty !== null && qty <= 0
  }

  return {
    stock,
    settings,
    loading,
    isPreorderDay,
    dayNames,
    getStock,
    isSoldOut,
  }
}
