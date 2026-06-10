import { useEffect, useState } from 'react'
import { listenSettings, type Settings } from '../lib/firebase'

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    return listenSettings(setSettings)
  }, [])

  return settings
}
