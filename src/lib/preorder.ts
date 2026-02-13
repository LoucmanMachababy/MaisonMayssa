// Logique de précommande (pure, sans dépendance Firebase)

export type PreorderOpening = { day: number; fromTime: string }

export type Settings = {
  preorderDays: number[]
  preorderOpenings?: PreorderOpening[]
  preorderMessage: string
}

export type StockMap = Record<string, number>

/** Parse "HH:mm" en minutes depuis minuit */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Précommande ouverte si la date donnée (ou maintenant) est dans une plage d'ouverture */
export function isPreorderOpenNow(openings: PreorderOpening[], date?: Date): boolean {
  const now = date ?? new Date()
  const today = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  for (const o of openings) {
    if (o.day !== today) continue
    if (o.fromTime === '00:00' || o.fromTime === '0:00') return true
    const fromMinutes = parseTimeToMinutes(o.fromTime)
    if (currentMinutes >= fromMinutes) return true
  }
  return false
}
