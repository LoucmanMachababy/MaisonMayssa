import { useState, useEffect } from 'react'
import { updateOrder, type Order } from '../../lib/firebase'
import {
  getSuggestedDeposit50Percent,
  getOrderDepositAmount,
  isDepositMatchingSuggested50,
} from '../../lib/orderAmounts'

type AdminDeposit50PromptProps = {
  orderId: string
  order: Order
  variant?: 'light' | 'dark'
}

function declineStorageKey(orderId: string): string {
  return `mm_deposit50_declined_${orderId}`
}

/**
 * Commandes ≥ 30 € (en attente / préparation) : acompte 50 % en un clic, ou montant libre.
 */
export function AdminDeposit50Prompt({ orderId, order, variant = 'light' }: AdminDeposit50PromptProps) {
  const suggested = getSuggestedDeposit50Percent(order)
  const [saving, setSaving] = useState(false)
  const [editingCustom, setEditingCustom] = useState(false)
  const [customInput, setCustomInput] = useState('')
  /** « Non » sans acompte : on n’écrit pas Firebase ; on cache la question Oui/Non pour éviter la boucle. */
  const [skipped50Question, setSkipped50Question] = useState(false)

  const total = order.total ?? 0
  const deposit = getOrderDepositAmount(order)
  const is50 = isDepositMatchingSuggested50(order)

  useEffect(() => {
    try {
      setSkipped50Question(sessionStorage.getItem(declineStorageKey(orderId)) === '1')
    } catch {
      setSkipped50Question(false)
    }
  }, [orderId])

  const clearDecline50 = () => {
    try {
      sessionStorage.removeItem(declineStorageKey(orderId))
    } catch {
      /* ignore */
    }
    setSkipped50Question(false)
  }

  const openCustomEditor = () => {
    setCustomInput(deposit > 0 ? String(deposit) : '')
    setEditingCustom(true)
  }

  if (suggested == null) return null
  if (order.status !== 'en_attente' && order.status !== 'en_preparation') return null

  const isDark = variant === 'dark'

  const apply50 = async (yes: boolean) => {
    setSaving(true)
    try {
      await updateOrder(orderId, { depositAmount: yes ? suggested : null })
      if (yes) clearDecline50()
    } catch (err) {
      console.error('[AdminDeposit50Prompt]', err)
    } finally {
      setSaving(false)
    }
  }

  /** « Non » : si aucun acompte en base, ne rien envoyer à Firebase + masquer la question 50 %. */
  const handleNo50 = () => {
    if (deposit <= 0) {
      try {
        sessionStorage.setItem(declineStorageKey(orderId), '1')
      } catch {
        /* ignore */
      }
      setSkipped50Question(true)
      return
    }
    void apply50(false)
  }

  const saveCustom = async () => {
    const raw = customInput.trim().replace(',', '.')
    if (raw === '') {
      setSaving(true)
      try {
        await updateOrder(orderId, { depositAmount: null })
        clearDecline50()
        setEditingCustom(false)
      } catch (err) {
        console.error('[AdminDeposit50Prompt]', err)
      } finally {
        setSaving(false)
      }
      return
    }
    const v = parseFloat(raw)
    if (Number.isNaN(v) || v < 0) return
    const clamped = Math.min(total, Math.round(v * 100) / 100)
    setSaving(true)
    try {
      await updateOrder(orderId, { depositAmount: clamped <= 0 ? null : clamped })
      if (clamped > 0) clearDecline50()
      setEditingCustom(false)
      setCustomInput('')
    } catch (err) {
      console.error('[AdminDeposit50Prompt]', err)
    } finally {
      setSaving(false)
    }
  }

  const box =
    isDark
      ? 'rounded-xl border border-amber-500/35 bg-amber-950/25 px-3 py-2.5'
      : 'rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5'

  const label = isDark ? 'text-amber-100/90' : 'text-mayssa-brown'
  const muted = isDark ? 'text-amber-200/70' : 'text-mayssa-brown/65'
  const btnYes = isDark
    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
    : 'bg-emerald-600 text-white hover:bg-emerald-700'
  const btnNo = isDark
    ? 'bg-white/10 text-amber-100 hover:bg-white/15 border border-amber-400/30'
    : 'bg-white text-mayssa-brown border border-mayssa-brown/15 hover:bg-mayssa-soft'
  const btnGhost = isDark
    ? 'text-amber-200/80 hover:text-amber-100 underline-offset-2'
    : 'text-mayssa-brown/60 hover:text-mayssa-brown underline-offset-2'
  const btnOutline = isDark
    ? 'border border-amber-400/40 text-amber-100 hover:bg-white/5'
    : 'border border-mayssa-brown/20 text-mayssa-brown hover:bg-white'

  const inputCls = isDark
    ? 'w-full rounded-lg border border-amber-400/30 bg-zinc-900/80 px-2 py-1.5 text-xs font-bold text-amber-50'
    : 'w-full rounded-lg border border-mayssa-brown/15 bg-white px-2 py-1.5 text-xs font-bold text-mayssa-brown'

  if (editingCustom) {
    return (
      <div className={box}>
        <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${muted}`}>Montant d&apos;acompte (€)</p>
        <p className={`text-[10px] mb-2 ${muted}`}>
          Total commande : {total.toFixed(2).replace('.', ',')} € — laisser vide + Enregistrer pour tout retirer.
        </p>
        <input
          type="text"
          inputMode="decimal"
          placeholder="ex. 15,50"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          className={inputCls}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            disabled={saving}
            onClick={saveCustom}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-50 ${btnYes}`}
          >
            {saving ? '…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setEditingCustom(false)
              setCustomInput('')
            }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-50 ${btnNo}`}
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  if (deposit > 0) {
    return (
      <div className={box}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={`text-xs font-semibold ${label}`}>
              {is50 ? (
                <>
                  Acompte 50 % ({suggested.toFixed(2).replace('.', ',')} €) enregistré — reste à régler mis à jour.
                </>
              ) : (
                <>
                  Acompte de{' '}
                  <span className={`font-black ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                    {deposit.toFixed(2).replace('.', ',')} €
                  </span>{' '}
                  enregistré <span className={`font-normal ${muted}`}>(montant libre)</span>.
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              disabled={saving}
              onClick={openCustomEditor}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${btnOutline}`}
            >
              Autre montant
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                try {
                  await updateOrder(orderId, { depositAmount: null })
                  clearDecline50()
                } catch (err) {
                  console.error('[AdminDeposit50Prompt]', err)
                } finally {
                  setSaving(false)
                }
              }}
              className={`text-[11px] font-bold cursor-pointer disabled:opacity-50 ${btnGhost}`}
            >
              Retirer l&apos;acompte
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (skipped50Question) {
    return (
      <div className={box}>
        <div className="space-y-2">
          <p className={`text-xs font-medium leading-snug ${label}`}>
            Pas d&apos;acompte 50 % enregistré pour l&apos;instant — rien n&apos;a été modifié sur la commande.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={openCustomEditor}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${btnOutline}`}
            >
              Autre montant
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => apply50(true)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${btnYes}`}
            >
              Oui, 50 % réglé
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={clearDecline50}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${btnNo}`}
            >
              Revoir la question
            </button>
          </div>
          <p className={`text-[10px] leading-snug ${muted}`}>
            « Revoir la question » réaffiche &quot;50 % réglé ?&quot;. « Autre montant » pour un montant libre.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={box}>
      <div className="space-y-2">
        <p className={`text-xs font-semibold leading-snug ${label}`}>
          Acompte de{' '}
          <span className={`font-black ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
            {suggested.toFixed(2).replace('.', ',')} €
          </span>{' '}
          (50 % du total) réglé ?
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => apply50(true)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${btnYes}`}
          >
            {saving ? '…' : 'Oui'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleNo50}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${btnNo}`}
          >
            Non
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={openCustomEditor}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${btnOutline}`}
          >
            Autre montant
          </button>
        </div>
        <p className={`text-[10px] leading-snug ${muted}`}>
          « Non » = pas d&apos;enregistrement 50 % (tu peux utiliser « Autre montant » ou ignorer). « Oui » enregistre l&apos;acompte.
        </p>
      </div>
    </div>
  )
}
