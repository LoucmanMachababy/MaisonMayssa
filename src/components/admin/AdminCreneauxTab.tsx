import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Calendar, Save } from 'lucide-react'
import { updateSettings, type Settings } from '../../lib/firebase'
import { getMinDate } from '../../lib/delivery'

interface AdminCreneauxTabProps {
  settings: Settings
}

/** Parse "18:30" ou "18:00, 19:00" en tableau de créneaux valides (HH:mm) */
function parseSlotsInput(value: string): string[] {
  const result: string[] = []
  for (const s of value.split(/[,;\s]+/)) {
    const t = s.trim()
    const match = t.match(/^(\d{1,2}):(\d{2})$/)
    if (match) {
      const h = String(parseInt(match[1], 10)).padStart(2, '0')
      const m = String(parseInt(match[2], 10)).padStart(2, '0')
      result.push(`${h}:${m}`)
    }
  }
  return result
}

function formatSlotsForInput(slots: string[] | undefined): string {
  if (!slots || slots.length === 0) return ''
  return slots.join(', ')
}

export function AdminCreneauxTab({ settings }: AdminCreneauxTabProps) {
  const today = getMinDate()
  const [firstAvailableDateRetrait, setFirstAvailableDateRetrait] = useState(settings.firstAvailableDateRetrait?.trim() ?? settings.firstAvailableDate?.trim() ?? today)
  const [firstAvailableDateLivraison, setFirstAvailableDateLivraison] = useState(settings.firstAvailableDateLivraison?.trim() ?? settings.firstAvailableDate?.trim() ?? today)
  const [lastAvailableDate, setLastAvailableDate] = useState(settings.lastAvailableDate ?? '')
  const WEEKDAYS: { value: number; label: string }[] = [
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mer' },
    { value: 4, label: 'Jeu' },
    { value: 5, label: 'Ven' },
    { value: 6, label: 'Sam' },
    { value: 0, label: 'Dim' },
  ]
  const [availableWeekdays, setAvailableWeekdays] = useState<number[]>(settings.availableWeekdays ?? [3, 6])
  const [retraitInput, setRetraitInput] = useState(formatSlotsForInput(settings.retraitTimeSlots))
  const [livraisonInput, setLivraisonInput] = useState(formatSlotsForInput(settings.livraisonTimeSlots))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const toggleWeekday = (day: number) => {
    setAvailableWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    )
  }

  useEffect(() => {
    setFirstAvailableDateRetrait(settings.firstAvailableDateRetrait?.trim() ?? settings.firstAvailableDate?.trim() ?? today)
    setFirstAvailableDateLivraison(settings.firstAvailableDateLivraison?.trim() ?? settings.firstAvailableDate?.trim() ?? today)
    setLastAvailableDate(settings.lastAvailableDate ?? '')
    setAvailableWeekdays(settings.availableWeekdays && settings.availableWeekdays.length > 0 ? settings.availableWeekdays : [3, 6])
    setRetraitInput(formatSlotsForInput(settings.retraitTimeSlots))
    setLivraisonInput(formatSlotsForInput(settings.livraisonTimeSlots))
  }, [settings.firstAvailableDateRetrait, settings.firstAvailableDateLivraison, settings.firstAvailableDate, settings.lastAvailableDate, settings.availableWeekdays, settings.retraitTimeSlots, settings.livraisonTimeSlots, today])

  const handleSave = async () => {
    setMessage(null)
    setSaving(true)
    try {
      const retraitSlots = parseSlotsInput(retraitInput)
      const livraisonSlots = parseSlotsInput(livraisonInput)
      await updateSettings({
        firstAvailableDateRetrait: firstAvailableDateRetrait.trim() || undefined,
        firstAvailableDateLivraison: firstAvailableDateLivraison.trim() || undefined,
        lastAvailableDate: lastAvailableDate.trim() || undefined,
        availableWeekdays: availableWeekdays.length > 0 ? availableWeekdays : undefined,
        retraitTimeSlots: retraitSlots.length > 0 ? retraitSlots : undefined,
        livraisonTimeSlots: livraisonSlots.length > 0 ? livraisonSlots : undefined,
      })
      setMessage({ type: 'success', text: 'Créneaux enregistrés. Dates de retrait et livraison gérées séparément.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur enregistrement' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-mayssa-brown/5 space-y-5">
        <h3 className="font-bold text-mayssa-brown flex items-center gap-2">
          <Clock size={18} />
          Créneaux de réception / livraison
        </h3>
        <p className="text-xs text-mayssa-brown/60">
          Les clients ne pourront sélectionner que les dates et créneaux définis ci-dessous.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-mayssa-brown/70 mb-1.5 flex items-center gap-1">
              <Calendar size={14} />
              Première date retrait (sur place)
            </label>
            <input
              type="date"
              value={firstAvailableDateRetrait}
              onChange={(e) => setFirstAvailableDateRetrait(e.target.value)}
              min={today}
              className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm border border-mayssa-brown/10 text-mayssa-brown"
            />
            <p className="text-[10px] text-mayssa-brown/50 mt-1">À partir de cette date pour le calendrier retrait.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-mayssa-brown/70 mb-1.5 flex items-center gap-1">
              <Calendar size={14} />
              Première date livraison
            </label>
            <input
              type="date"
              value={firstAvailableDateLivraison}
              onChange={(e) => setFirstAvailableDateLivraison(e.target.value)}
              min={today}
              className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm border border-mayssa-brown/10 text-mayssa-brown"
            />
            <p className="text-[10px] text-mayssa-brown/50 mt-1">À partir de cette date pour le calendrier livraison.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-mayssa-brown/70 mb-1.5 flex items-center gap-1">
              <Calendar size={14} />
              Dernière date disponible (optionnel, retrait et livraison)
            </label>
            <input
              type="date"
              value={lastAvailableDate}
              onChange={(e) => setLastAvailableDate(e.target.value)}
              min={firstAvailableDateRetrait && firstAvailableDateLivraison ? (firstAvailableDateRetrait < firstAvailableDateLivraison ? firstAvailableDateRetrait : firstAvailableDateLivraison) : today}
              className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm border border-mayssa-brown/10 text-mayssa-brown max-w-xs"
            />
            <p className="text-[10px] text-mayssa-brown/50 mt-1">Laisser vide = pas de limite.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-mayssa-brown/70 mb-1.5">Jours proposés (retrait / livraison)</label>
          <p className="text-[10px] text-mayssa-brown/50 mb-2">Seuls ces jours apparaîtront dans le calendrier client. Décocher un jour (ex. Samedi) pour le désactiver.</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableWeekdays.includes(value)}
                  onChange={() => toggleWeekday(value)}
                  className="rounded border-mayssa-brown/30 text-mayssa-caramel focus:ring-mayssa-caramel"
                />
                <span className="text-sm text-mayssa-brown">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-mayssa-brown/70 mb-1.5">Créneaux retrait (séparés par des virgules)</label>
          <input
            type="text"
            value={retraitInput}
            onChange={(e) => setRetraitInput(e.target.value)}
            placeholder="Ex: 18:30 ou 18:00, 18:30, 19:00"
            className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm border border-mayssa-brown/10 text-mayssa-brown placeholder:text-mayssa-brown/40"
          />
          <p className="text-[10px] text-mayssa-brown/50 mt-1">Format HH:mm. Si vide, défaut = 18:30.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-mayssa-brown/70 mb-1.5">Créneaux livraison (séparés par des virgules)</label>
          <input
            type="text"
            value={livraisonInput}
            onChange={(e) => setLivraisonInput(e.target.value)}
            placeholder="Ex: 20:00, 20:30, 21:00, 21:30, 22:00, 22:30, 23:00, 23:30, 00:00, 00:30, 01:00, 01:30, 02:00"
            className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm border border-mayssa-brown/10 text-mayssa-brown placeholder:text-mayssa-brown/40"
          />
          <p className="text-[10px] text-mayssa-brown/50 mt-1">Format HH:mm. Si vide, défaut = créneaux 20h–02h30.</p>
        </div>

        {message && (
          <p className={`text-xs font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mayssa-brown text-white text-sm font-bold hover:bg-mayssa-caramel transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Save size={16} />
          {saving ? 'Enregistrement...' : 'Enregistrer les créneaux'}
        </button>
      </div>
    </motion.section>
  )
}
