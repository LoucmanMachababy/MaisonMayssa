import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Clock, Calendar, Save, List, Timer } from 'lucide-react'
import { updateSettings, type Settings } from '../../lib/firebase'
import { getMinDate, generateTimeSlotsFromWindow, normalizeTimeSlotHHmm } from '../../lib/delivery'

interface AdminCreneauxTabProps {
  settings: Settings
}

type SlotMode = 'range' | 'list'

const STEP_OPTIONS = [15, 30, 45, 60] as const

/** Parse "18:30" ou "18:00, 19:00" en tableau de créneaux valides (HH:mm) */
function parseSlotsInput(value: string): string[] {
  const result: string[] = []
  for (const s of value.split(/[,;\s]+/)) {
    const n = normalizeTimeSlotHHmm(s.trim())
    if (n) result.push(n)
  }
  return result
}

function formatSlotsForInput(slots: string[] | undefined): string {
  if (!slots || slots.length === 0) return ''
  return slots.map((t) => normalizeTimeSlotHHmm(t) ?? t).join(', ')
}

function timeInputValue(hhmm: string | undefined): string {
  const n = hhmm ? normalizeTimeSlotHHmm(hhmm) : null
  return n ?? '10:00'
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

  const [retraitMode, setRetraitMode] = useState<SlotMode>(settings.retraitSlotWindow ? 'range' : 'list')
  const [retraitFrom, setRetraitFrom] = useState(timeInputValue(settings.retraitSlotWindow?.from))
  const [retraitTo, setRetraitTo] = useState(timeInputValue(settings.retraitSlotWindow?.to))
  const [retraitStep, setRetraitStep] = useState<number>(settings.retraitSlotWindow?.everyMinutes ?? 30)
  const [retraitInput, setRetraitInput] = useState(formatSlotsForInput(settings.retraitTimeSlots))

  const [livraisonMode, setLivraisonMode] = useState<SlotMode>(settings.livraisonSlotWindow ? 'range' : 'list')
  const [livraisonFrom, setLivraisonFrom] = useState(timeInputValue(settings.livraisonSlotWindow?.from))
  const [livraisonTo, setLivraisonTo] = useState(timeInputValue(settings.livraisonSlotWindow?.to))
  const [livraisonStep, setLivraisonStep] = useState<number>(settings.livraisonSlotWindow?.everyMinutes ?? 30)
  const [livraisonOvernight, setLivraisonOvernight] = useState(settings.livraisonSlotWindow?.overnight === true)
  const [livraisonInput, setLivraisonInput] = useState(formatSlotsForInput(settings.livraisonTimeSlots))

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const retraitPreview = useMemo(() => {
    const from = normalizeTimeSlotHHmm(retraitFrom)
    const to = normalizeTimeSlotHHmm(retraitTo)
    if (!from || !to) return []
    return generateTimeSlotsFromWindow(from, to, retraitStep, false)
  }, [retraitFrom, retraitTo, retraitStep])

  const livraisonPreview = useMemo(() => {
    const from = normalizeTimeSlotHHmm(livraisonFrom)
    const to = normalizeTimeSlotHHmm(livraisonTo)
    if (!from || !to) return []
    return generateTimeSlotsFromWindow(from, to, livraisonStep, livraisonOvernight)
  }, [livraisonFrom, livraisonTo, livraisonStep, livraisonOvernight])

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
    setRetraitMode(settings.retraitSlotWindow ? 'range' : 'list')
    setRetraitFrom(timeInputValue(settings.retraitSlotWindow?.from))
    setRetraitTo(timeInputValue(settings.retraitSlotWindow?.to))
    setRetraitStep(settings.retraitSlotWindow?.everyMinutes ?? 30)
    setRetraitInput(formatSlotsForInput(settings.retraitTimeSlots))
    setLivraisonMode(settings.livraisonSlotWindow ? 'range' : 'list')
    setLivraisonFrom(timeInputValue(settings.livraisonSlotWindow?.from))
    setLivraisonTo(timeInputValue(settings.livraisonSlotWindow?.to))
    setLivraisonStep(settings.livraisonSlotWindow?.everyMinutes ?? 30)
    setLivraisonOvernight(settings.livraisonSlotWindow?.overnight === true)
    setLivraisonInput(formatSlotsForInput(settings.livraisonTimeSlots))
  }, [
    settings.firstAvailableDateRetrait,
    settings.firstAvailableDateLivraison,
    settings.firstAvailableDate,
    settings.lastAvailableDate,
    settings.availableWeekdays,
    settings.retraitTimeSlots,
    settings.livraisonTimeSlots,
    settings.retraitSlotWindow,
    settings.livraisonSlotWindow,
    today,
  ])

  const handleSave = async () => {
    setMessage(null)
    setSaving(true)
    try {
      let retraitSlots: string[]
      if (retraitMode === 'range') {
        const from = normalizeTimeSlotHHmm(retraitFrom)
        const to = normalizeTimeSlotHHmm(retraitTo)
        if (!from || !to) {
          setMessage({ type: 'error', text: 'Retrait : heures de début et fin invalides.' })
          setSaving(false)
          return
        }
        retraitSlots = generateTimeSlotsFromWindow(from, to, retraitStep, false)
        if (retraitSlots.length === 0) {
          setMessage({ type: 'error', text: 'Retrait : la fin doit être après le début (même journée).' })
          setSaving(false)
          return
        }
      } else {
        retraitSlots = parseSlotsInput(retraitInput)
      }

      let livraisonSlots: string[]
      if (livraisonMode === 'range') {
        const from = normalizeTimeSlotHHmm(livraisonFrom)
        const to = normalizeTimeSlotHHmm(livraisonTo)
        if (!from || !to) {
          setMessage({ type: 'error', text: 'Livraison : heures de début et fin invalides.' })
          setSaving(false)
          return
        }
        livraisonSlots = generateTimeSlotsFromWindow(from, to, livraisonStep, livraisonOvernight)
        if (livraisonSlots.length === 0) {
          setMessage({
            type: 'error',
            text: livraisonOvernight
              ? 'Livraison : impossible de générer des créneaux. Vérifiez début / fin.'
              : 'Livraison : la fin doit être après le début, ou cochez « Passer minuit » (ex. 20h → 2h).',
          })
          setSaving(false)
          return
        }
      } else {
        livraisonSlots = parseSlotsInput(livraisonInput)
      }

      await updateSettings({
        firstAvailableDateRetrait: firstAvailableDateRetrait.trim() || undefined,
        firstAvailableDateLivraison: firstAvailableDateLivraison.trim() || undefined,
        lastAvailableDate: lastAvailableDate.trim() || undefined,
        availableWeekdays: availableWeekdays.length > 0 ? availableWeekdays : undefined,
        retraitTimeSlots: retraitSlots.length > 0 ? retraitSlots : retraitMode === 'list' ? null : undefined,
        livraisonTimeSlots: livraisonSlots.length > 0 ? livraisonSlots : livraisonMode === 'list' ? null : undefined,
        retraitSlotWindow:
          retraitMode === 'range'
            ? {
                from: normalizeTimeSlotHHmm(retraitFrom)!,
                to: normalizeTimeSlotHHmm(retraitTo)!,
                everyMinutes: retraitStep,
                overnight: false,
              }
            : null,
        livraisonSlotWindow:
          livraisonMode === 'range'
            ? {
                from: normalizeTimeSlotHHmm(livraisonFrom)!,
                to: normalizeTimeSlotHHmm(livraisonTo)!,
                everyMinutes: livraisonStep,
                ...(livraisonOvernight ? { overnight: true } : {}),
              }
            : null,
      })
      setMessage({
        type: 'success',
        text: `Créneaux enregistrés : ${retraitSlots.length} créneau(x) retrait, ${livraisonSlots.length} livraison. Les clients les voient tout de suite au panier.`,
      })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur enregistrement' })
    } finally {
      setSaving(false)
    }
  }

  const modeBtn = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
      active ? 'bg-mayssa-brown text-white border-mayssa-brown' : 'bg-white border-mayssa-brown/15 text-mayssa-brown/60 hover:border-mayssa-caramel/40'
    }`

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
          Créneaux — retrait & livraison
        </h3>
        <p className="text-xs text-mayssa-brown/60">
          Définissez soit une <strong>plage horaire</strong> (ex. 10h–15h toutes les 30 min), soit une <strong>liste précise</strong>. Les mêmes créneaux sont proposés aux clients sur le site au moment de la commande.
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
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-mayssa-brown/70 mb-1.5 flex items-center gap-1">
              <Calendar size={14} />
              Dernière date disponible (optionnel)
            </label>
            <input
              type="date"
              value={lastAvailableDate}
              onChange={(e) => setLastAvailableDate(e.target.value)}
              min={
                firstAvailableDateRetrait && firstAvailableDateLivraison
                  ? firstAvailableDateRetrait < firstAvailableDateLivraison
                    ? firstAvailableDateRetrait
                    : firstAvailableDateLivraison
                  : today
              }
              className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm border border-mayssa-brown/10 text-mayssa-brown max-w-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-mayssa-brown/70 mb-1.5">Jours proposés au calendrier client</label>
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
      </div>

      {/* Retrait */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-mayssa-brown/5 space-y-4">
        <h4 className="font-bold text-mayssa-brown flex items-center gap-2 text-sm">
          <Timer size={16} className="text-mayssa-caramel" />
          Heures de retrait
        </h4>
        <div className="flex gap-2">
          <button type="button" className={modeBtn(retraitMode === 'range')} onClick={() => setRetraitMode('range')}>
            <Timer size={14} />
            Plage horaire
          </button>
          <button type="button" className={modeBtn(retraitMode === 'list')} onClick={() => setRetraitMode('list')}>
            <List size={14} />
            Liste manuelle
          </button>
        </div>
        {retraitMode === 'range' ? (
          <div className="space-y-3 rounded-xl border border-mayssa-brown/10 bg-mayssa-soft/30 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold uppercase text-mayssa-brown/50 mb-1">De</label>
                <input
                  type="time"
                  value={retraitFrom}
                  onChange={(e) => setRetraitFrom(e.target.value)}
                  className="w-full rounded-xl border border-mayssa-brown/15 px-3 py-2 text-sm text-mayssa-brown bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-mayssa-brown/50 mb-1">À</label>
                <input
                  type="time"
                  value={retraitTo}
                  onChange={(e) => setRetraitTo(e.target.value)}
                  className="w-full rounded-xl border border-mayssa-brown/15 px-3 py-2 text-sm text-mayssa-brown bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-mayssa-brown/50 mb-1">Pas</label>
                <select
                  value={retraitStep}
                  onChange={(e) => setRetraitStep(Number(e.target.value))}
                  className="w-full rounded-xl border border-mayssa-brown/15 px-3 py-2 text-sm text-mayssa-brown bg-white cursor-pointer"
                >
                  {STEP_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      Toutes les {s} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-mayssa-brown/50">Même journée uniquement (ex. 10:00 → 15:00).</p>
            {retraitPreview.length > 0 && (
              <div className="rounded-lg bg-white border border-mayssa-brown/10 px-3 py-2">
                <p className="text-[10px] font-bold text-mayssa-caramel mb-1">{retraitPreview.length} créneaux générés</p>
                <p className="text-xs text-mayssa-brown/80 break-words">{retraitPreview.join(', ')}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-mayssa-brown/70 mb-1.5">Créneaux (séparés par des virgules)</label>
            <input
              type="text"
              value={retraitInput}
              onChange={(e) => setRetraitInput(e.target.value)}
              placeholder="Ex: 18:30 ou 10:00, 11:00, 14:00"
              className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm border border-mayssa-brown/10 text-mayssa-brown placeholder:text-mayssa-brown/40"
            />
            <p className="text-[10px] text-mayssa-brown/50 mt-1">Si vide à l’enregistrement, le site garde le défaut (18:30) tant qu’aucune liste n’est en base.</p>
          </div>
        )}
      </div>

      {/* Livraison */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-mayssa-brown/5 space-y-4">
        <h4 className="font-bold text-mayssa-brown flex items-center gap-2 text-sm">
          <Clock size={16} className="text-mayssa-caramel" />
          Heures de livraison
        </h4>
        <div className="flex gap-2">
          <button type="button" className={modeBtn(livraisonMode === 'range')} onClick={() => setLivraisonMode('range')}>
            <Timer size={14} />
            Plage horaire
          </button>
          <button type="button" className={modeBtn(livraisonMode === 'list')} onClick={() => setLivraisonMode('list')}>
            <List size={14} />
            Liste manuelle
          </button>
        </div>
        {livraisonMode === 'range' ? (
          <div className="space-y-3 rounded-xl border border-mayssa-brown/10 bg-mayssa-soft/30 p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={livraisonOvernight}
                onChange={(e) => setLivraisonOvernight(e.target.checked)}
                className="rounded border-mayssa-brown/30 text-mayssa-caramel focus:ring-mayssa-caramel"
              />
              <span className="text-xs text-mayssa-brown">Passer minuit (ex. 20:00 → 02:00)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold uppercase text-mayssa-brown/50 mb-1">De</label>
                <input
                  type="time"
                  value={livraisonFrom}
                  onChange={(e) => setLivraisonFrom(e.target.value)}
                  className="w-full rounded-xl border border-mayssa-brown/15 px-3 py-2 text-sm text-mayssa-brown bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-mayssa-brown/50 mb-1">À</label>
                <input
                  type="time"
                  value={livraisonTo}
                  onChange={(e) => setLivraisonTo(e.target.value)}
                  className="w-full rounded-xl border border-mayssa-brown/15 px-3 py-2 text-sm text-mayssa-brown bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-mayssa-brown/50 mb-1">Pas</label>
                <select
                  value={livraisonStep}
                  onChange={(e) => setLivraisonStep(Number(e.target.value))}
                  className="w-full rounded-xl border border-mayssa-brown/15 px-3 py-2 text-sm text-mayssa-brown bg-white cursor-pointer"
                >
                  {STEP_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      Toutes les {s} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {livraisonPreview.length > 0 && (
              <div className="rounded-lg bg-white border border-mayssa-brown/10 px-3 py-2 max-h-32 overflow-y-auto">
                <p className="text-[10px] font-bold text-mayssa-caramel mb-1">{livraisonPreview.length} créneaux générés</p>
                <p className="text-xs text-mayssa-brown/80 break-words">{livraisonPreview.join(', ')}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-mayssa-brown/70 mb-1.5">Créneaux (séparés par des virgules)</label>
            <input
              type="text"
              value={livraisonInput}
              onChange={(e) => setLivraisonInput(e.target.value)}
              placeholder="Ex: 20:00, 20:30, 21:00…"
              className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2.5 text-sm border border-mayssa-brown/10 text-mayssa-brown placeholder:text-mayssa-brown/40"
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-mayssa-brown/5 space-y-4">
        {message && (
          <p className={`text-xs font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>{message.text}</p>
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
