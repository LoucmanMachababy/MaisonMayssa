import { useState, useEffect, useMemo } from 'react'
import { listenStock, listenSettings, type StockMap, type Settings } from '../lib/firebase'

export function useStock() {
  const [stock, setStock] = useState<StockMap>({})
  const [settings, setSettings] = useState<Settings>({ preorderDays: [3, 6], preorderMessage: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stockLoaded = false
    let settingsLoaded = false
    const done = () => { if (stockLoaded && settingsLoaded) setLoading(false) }

    const unsubStock = listenStock((data) => {
      setStock(data)
      stockLoaded = true
      done()
    })

    const unsubSettings = listenSettings((data) => {
      setSettings(data)
      settingsLoaded = true
      done()
    })

    return () => { unsubStock(); unsubSettings() }
  }, [])

  const isPreorderDay = useMemo(() => {
    const today = new Date().getDay() // 0=Sun, 1=Mon, ..., 3=Wed, 6=Sat
    return settings.preorderDays.includes(today)
  }, [settings.preorderDays])

  const dayNames = useMemo(() => {
    const names = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
    return settings.preorderDays.map(d => names[d]).join(' et ')
  }, [settings.preorderDays])

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
