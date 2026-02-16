import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tag, Plus, Trash2 } from 'lucide-react'
import { createPromoCode, deletePromoCode, type PromoCodeRecord } from '../../lib/firebase'

interface AdminPromosTabProps {
  promoCodes: Record<string, PromoCodeRecord>
}

export function AdminPromosTab({ promoCodes }: AdminPromosTabProps) {
  const [code, setCode] = useState('')
  const [type, setType] = useState<'fixed' | 'percent'>('fixed')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const val = type === 'percent' ? parseFloat(value) : parseFloat(value)
    if (isNaN(val) || val <= 0) {
      setError(type === 'percent' ? 'Valeur % doit être > 0' : 'Montant doit être > 0')
      return
    }
    if (type === 'percent' && val > 100) {
      setError('Pourcentage max 100')
      return
    }
    if (!code.trim()) {
      setError('Saisis un code')
      return
    }
    setLoading(true)
    try {
      await createPromoCode({
        code: code.trim(),
        type,
        value: val,
        minOrder: minOrder.trim() ? parseFloat(minOrder) : undefined,
        maxUses: maxUses.trim() ? parseInt(maxUses, 10) : undefined,
        expiresAt: expiresAt.trim() ? new Date(expiresAt).getTime() : undefined,
      })
      setSuccess(`Code "${code.trim().toUpperCase()}" créé`)
      setCode('')
      setValue('')
      setMinOrder('')
      setMaxUses('')
      setExpiresAt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur création')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (codeKey: string) => {
    setDeleting(codeKey)
    try {
      await deletePromoCode(codeKey)
    } finally {
      setDeleting(null)
    }
  }

  const entries = Object.entries(promoCodes)

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-mayssa-brown/5">
        <h3 className="font-bold text-mayssa-brown flex items-center gap-2 mb-4">
          <Tag size={18} />
          Créer un code promo
        </h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mayssa-brown/70 mb-1">Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EX: BIENVENUE"
                className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2 text-sm border border-mayssa-brown/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mayssa-brown/70 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'fixed' | 'percent')}
                className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2 text-sm border border-mayssa-brown/10"
              >
                <option value="fixed">Montant fixe (€)</option>
                <option value="percent">Pourcentage (%)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mayssa-brown/70 mb-1">
                {type === 'fixed' ? 'Montant (€)' : 'Pourcentage (%)'}
              </label>
              <input
                type="number"
                min={0}
                step={type === 'percent' ? 1 : 0.01}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'fixed' ? '5' : '10'}
                className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2 text-sm border border-mayssa-brown/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mayssa-brown/70 mb-1">Commande min (€) optionnel</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="—"
                className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2 text-sm border border-mayssa-brown/10"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mayssa-brown/70 mb-1">Utilisations max optionnel</label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="—"
                className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2 text-sm border border-mayssa-brown/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mayssa-brown/70 mb-1">Expire le (optionnel)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2 text-sm border border-mayssa-brown/10"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-emerald-600">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-mayssa-caramel text-white font-bold hover:bg-mayssa-brown disabled:opacity-50"
          >
            <Plus size={16} />
            {loading ? 'Création...' : 'Créer le code'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm border border-mayssa-brown/5">
        <h3 className="font-bold text-mayssa-brown mb-3">Codes existants ({entries.length})</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-mayssa-brown/50">Aucun code pour l’instant.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map(([codeKey, record]) => (
              <li
                key={codeKey}
                className="flex items-center justify-between gap-2 rounded-xl bg-mayssa-soft/50 px-3 py-2.5 border border-mayssa-brown/5"
              >
                <div className="min-w-0">
                  <span className="font-bold text-mayssa-brown">{codeKey}</span>
                  <span className="text-mayssa-brown/60 text-xs ml-2">
                    {record.type === 'fixed' ? `${record.value} €` : `${record.value} %`}
                    {record.minOrder != null && ` · min ${record.minOrder} €`}
                    {record.maxUses != null && ` · max ${record.maxUses} utilisations`}
                    {' · '}utilisé {record.usedCount ?? 0} fois
                    {record.expiresAt != null && (
                      <span className={record.expiresAt < Date.now() ? ' text-red-500' : ''}>
                        {' · expire '}
                        {new Date(record.expiresAt).toLocaleDateString('fr-FR', { dateStyle: 'short' })}
                      </span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(codeKey)}
                  disabled={deleting === codeKey}
                  className="flex-shrink-0 p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                  aria-label={`Supprimer ${codeKey}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  )
}
