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

/** Récupère jour/heure/minute en Europe/Paris pour cohérence avec la boutique */
function getParisDateParts(date: Date): { day: number; hour: number; minute: number } {
  const rtf = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = rtf.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  const weekday = (get('weekday') || '').replace(/\./g, '').toLowerCase().slice(0, 3)
  const dayMap: Record<string, number> = { dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 }
  return {
    day: dayMap[weekday] ?? 0,
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
  }
}

/** Précommande ouverte si la date donnée (ou maintenant à Paris) est dans une plage d'ouverture */
export function isPreorderOpenNow(openings: PreorderOpening[], date?: Date): boolean {
  const now = date ?? new Date()
  const { day: today, hour, minute } = getParisDateParts(now)
  const currentMinutes = hour * 60 + minute
  for (const o of openings) {
    if (o.day !== today) continue
    if (o.fromTime === '00:00' || o.fromTime === '0:00') return true
    const fromMinutes = parseTimeToMinutes(o.fromTime)
    if (currentMinutes >= fromMinutes) return true
  }
  return false
}
