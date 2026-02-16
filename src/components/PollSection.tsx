import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import { listenPolls, votePoll, getPollVote, type Poll } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

const POLL_GUEST_ID_KEY = 'maison-mayssa-poll-guest-id'

function getVoterId(userId: string | undefined): string {
  if (userId) return userId
  let guest = localStorage.getItem(POLL_GUEST_ID_KEY)
  if (!guest) {
    guest = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(POLL_GUEST_ID_KEY, guest)
  }
  return guest
}

export function PollSection() {
  const { user } = useAuth()
  const [polls, setPolls] = useState<Record<string, Poll>>({})
  const [voted, setVoted] = useState<Record<string, string>>({}) // pollId -> optionId
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    return listenPolls(setPolls)
  }, [])

  const entries = Object.entries(polls)
  const latest = entries.length > 0
    ? entries.sort(([, a], [, b]) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0]
    : null

  useEffect(() => {
    if (!latest) return
    const [pollId] = latest
    const voterId = getVoterId(user?.uid)
    getPollVote(pollId, voterId).then((opt) => {
      if (opt) setVoted((prev) => ({ ...prev, [pollId]: opt }))
    })
  }, [latest?.[0], user?.uid])

  if (!latest) return null
  const [pollId, poll] = latest
  const hasVoted = !!voted[pollId]
  const totalVotes = Object.values(poll.options ?? {}).reduce((a, b) => a + b, 0)

  const handleVote = async (optionId: string) => {
    const voterId = getVoterId(user?.uid)
    setLoading(optionId)
    try {
      const ok = await votePoll(pollId, optionId, voterId)
      if (ok) setVoted((prev) => ({ ...prev, [pollId]: optionId }))
    } finally {
      setLoading(null)
    }
  }

  const optionEntries = Object.entries(poll.optionLabels ?? {}).map(([optId, label]) => ({
    optId,
    label,
    count: poll.options?.[optId] ?? 0,
  }))

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      className="mt-12 sm:mt-16 section-shell bg-white/80 border border-mayssa-brown/5 rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={20} className="text-mayssa-caramel" />
        <h2 className="text-xl font-display font-bold text-mayssa-brown">Votez pour le prochain trompe-l'œil</h2>
      </div>
      <p className="text-sm text-mayssa-brown/80 mb-4">{poll.question}</p>

      {hasVoted ? (
        <div className="space-y-2">
          {optionEntries.map(({ optId, label, count }) => (
            <div key={optId} className="flex items-center gap-2">
              <span className="w-32 text-sm text-mayssa-brown/80">{label}</span>
              <div className="flex-1 h-6 rounded-full bg-mayssa-soft/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-mayssa-caramel transition-all"
                  style={{ width: totalVotes > 0 ? `${(count / totalVotes) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-sm font-bold text-mayssa-brown w-12 text-right">{count}</span>
            </div>
          ))}
          <p className="text-xs text-mayssa-brown/50 mt-2">Merci d'avoir voté !</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {optionEntries.map(({ optId, label }) => (
            <button
              key={optId}
              type="button"
              onClick={() => handleVote(optId)}
              disabled={loading !== null}
              className="px-4 py-2 rounded-xl bg-mayssa-soft/50 border border-mayssa-brown/10 text-sm font-medium text-mayssa-brown hover:bg-mayssa-caramel/20 hover:border-mayssa-caramel/30 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </motion.section>
  )
}
