import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Plus } from 'lucide-react'
import { createPoll, type Poll } from '../../lib/firebase'

interface AdminPollsTabProps {
  polls: Record<string, Poll>
}

export function AdminPollsTab({ polls }: AdminPollsTabProps) {
  const [question, setQuestion] = useState('')
  const [optionsText, setOptionsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const labels = optionsText.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!question.trim() || labels.length < 2) {
      return
    }
    setLoading(true)
    setSuccess('')
    try {
      await createPoll(question.trim(), labels)
      setSuccess('Sondage créé.')
      setQuestion('')
      setOptionsText('')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const entries = Object.entries(polls)

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-mayssa-brown/5">
        <h3 className="font-bold text-mayssa-brown flex items-center gap-2 mb-4">
          <BarChart3 size={18} />
          Créer un sondage
        </h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-mayssa-brown/70 mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Quel prochain trompe-l'œil voulez-vous ?"
              className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2 text-sm border border-mayssa-brown/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-mayssa-brown/70 mb-1">Options (une par ligne)</label>
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder="Mangue\nCitron\nPistache\nFramboise"
              rows={4}
              className="w-full rounded-xl bg-mayssa-soft/50 px-3 py-2 text-sm border border-mayssa-brown/10"
            />
          </div>
          {success && <p className="text-xs text-emerald-600">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-mayssa-caramel text-white font-bold disabled:opacity-50"
          >
            <Plus size={16} />
            {loading ? 'Création...' : 'Créer le sondage'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm border border-mayssa-brown/5">
        <h3 className="font-bold text-mayssa-brown mb-3">Sondages ({entries.length})</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-mayssa-brown/50">Aucun sondage.</p>
        ) : (
          <ul className="space-y-4">
            {entries.map(([id, poll]) => (
              <li key={id} className="rounded-xl bg-mayssa-soft/50 p-3 border border-mayssa-brown/5">
                <p className="font-semibold text-mayssa-brown text-sm mb-2">{poll.question}</p>
                <ul className="space-y-1">
                  {Object.entries(poll.optionLabels ?? {}).map(([optId, label]) => (
                    <li key={optId} className="flex justify-between text-xs">
                      <span>{label}</span>
                      <span className="font-bold text-mayssa-caramel">{poll.options?.[optId] ?? 0} vote(s)</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  )
}
