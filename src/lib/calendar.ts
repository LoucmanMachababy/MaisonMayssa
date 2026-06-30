/**
 * Génération d'un fichier .ics (iCalendar) pour ajouter le retrait click & collect
 * à l'agenda du client. Aucune dépendance externe — le format est simple et
 * supporté par Google Agenda, Apple Calendar et Outlook.
 */

import { STORE_ADDRESS_FULL, STORE_NAME } from '../constants/store'

export type PickupEvent = {
  /** Numéro de commande affiché (ex. "#1001") ou identifiant. */
  orderRef: string
  /** Date de retrait au format YYYY-MM-DD. */
  date: string
  /** Heure de retrait au format HH:mm (optionnelle). */
  time?: string
  /** Durée du créneau en minutes (défaut 30, aligné sur les créneaux générés). */
  durationMinutes?: number
}

/** Échappe les caractères spéciaux iCalendar (RFC 5545). */
function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Formate un Date en timestamp iCalendar local sans fuseau (YYYYMMDDTHHMMSS). */
function toIcsLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  )
}

/**
 * Construit le contenu d'un fichier .ics pour un retrait.
 * Retourne `null` si la date est invalide.
 */
export function buildPickupIcs(event: PickupEvent): string | null {
  const { orderRef, date, time, durationMinutes = 30 } = event
  if (!date || typeof date !== 'string') return null
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return null

  // Si l'heure n'est pas fournie, on place le retrait à 12h00 par défaut.
  const [hh, mm] = (time && /^\d{1,2}:\d{2}$/.test(time) ? time : '12:00').split(':').map(Number)
  const start = new Date(y, m - 1, d, hh, mm, 0)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start.getTime() + durationMinutes * 60_000)

  // UID déterministe (pas de Math.random / Date.now non requis) basé sur la commande.
  const uid = `pickup-${orderRef.replace(/[^a-zA-Z0-9]/g, '')}@maison-mayssa.fr`

  const summary = escapeIcs(`Retrait commande ${orderRef} — ${STORE_NAME}`)
  const location = escapeIcs(STORE_ADDRESS_FULL)
  const description = escapeIcs(
    `Présentez le numéro ${orderRef} au comptoir. Aucun paiement sur place : c'est déjà réglé.`,
  )

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Maison Mayssa//Click and Collect//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${toIcsLocal(start)}`,
    `DTEND:${toIcsLocal(end)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    // Rappel 2h avant le retrait.
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${summary}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  // RFC 5545 : séparateur de ligne CRLF.
  return lines.join('\r\n')
}

/** Déclenche le téléchargement d'un .ics dans le navigateur. */
export function downloadPickupIcs(event: PickupEvent, fileName = 'retrait-maison-mayssa.ics'): boolean {
  const ics = buildPickupIcs(event)
  if (!ics) return false
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}
