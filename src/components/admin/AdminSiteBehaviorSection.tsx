import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MousePointerClick, Eye, TrendingDown, TrendingUp } from 'lucide-react'
import { adminCard, adminCardPadLg } from './adminTheme'
import { cn } from '../../lib/utils'
import {
  aggregatePageViewsForDays,
  aggregateTargetCountsForDays,
  getRecentDayKeys,
  listenSiteAnalytics,
  SITE_TRACK_GROUP_LABELS,
  type SiteAnalyticsSnapshot,
  type SiteTrackGroup,
} from '../../lib/siteAnalytics'

type BehaviorPeriod = '7d' | '30d' | 'all'

const PERIOD_LABELS: Record<BehaviorPeriod, string> = {
  '7d': '7 jours',
  '30d': '30 jours',
  all: 'Tout',
}

function formatRelativeTime(ts?: number): string {
  if (!ts) return '—'
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days} j`
}

export function AdminSiteBehaviorSection() {
  const [data, setData] = useState<SiteAnalyticsSnapshot>({ targets: {}, pages: {}, daily: {} })
  const [period, setPeriod] = useState<BehaviorPeriod>('30d')

  useEffect(() => {
    return listenSiteAnalytics(setData)
  }, [])

  const dayKeys = useMemo(
    () => (period === 'all' ? Object.keys(data.daily).sort().reverse() : getRecentDayKeys(period === '7d' ? 7 : 30)),
    [data.daily, period],
  )

  const targetCounts = useMemo(() => {
    if (period === 'all') {
      const totals: Record<string, number> = {}
      for (const [id, target] of Object.entries(data.targets)) {
        if (typeof target.count === 'number') totals[id] = target.count
      }
      return totals
    }
    return aggregateTargetCountsForDays(data.daily, dayKeys)
  }, [data.daily, data.targets, dayKeys, period])

  const topTargets = useMemo(() => {
    return Object.entries(targetCounts)
      .map(([id, count]) => {
        const meta = data.targets[id]
        return {
          id,
          count,
          label: meta?.label || id,
          group: (meta?.group ?? 'other') as SiteTrackGroup,
          lastAt: meta?.lastAt,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  }, [targetCounts, data.targets])

  const topPages = useMemo(() => {
    return Object.entries(data.pages)
      .map(([key, page]) => ({
        key,
        views: page.views ?? 0,
        label: page.label || page.path || key.replace(/_/g, '/'),
        path: page.path,
        lastAt: page.lastAt,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8)
  }, [data.pages])

  const totalClicks = useMemo(
    () => Object.values(targetCounts).reduce((sum, n) => sum + n, 0),
    [targetCounts],
  )

  const totalViews = useMemo(() => {
    if (period === 'all') {
      return Object.values(data.pages).reduce((sum, p) => sum + (p.views ?? 0), 0)
    }
    return aggregatePageViewsForDays(data.daily, dayKeys)
  }, [data.daily, data.pages, dayKeys, period])

  const lowEngagement = useMemo(() => {
    if (topTargets.length < 4) return []
    const threshold = Math.max(2, Math.floor(topTargets[0].count * 0.08))
    return topTargets.filter((t) => t.count <= threshold).slice(-5).reverse()
  }, [topTargets])

  const chartData = topTargets.slice(0, 8).map((t) => ({
    name: t.label.length > 22 ? `${t.label.slice(0, 20)}…` : t.label,
    clics: t.count,
  }))

  const hasData = totalClicks > 0 || totalViews > 0

  return (
    <div className="space-y-6 pt-2 border-t border-mayssa-brown/10">
      <div className={cn(adminCard, adminCardPadLg)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-mayssa-gold mb-1">
              <MousePointerClick size={20} />
              <h3 className="font-display font-bold text-xl text-mayssa-brown">Parcours visiteurs</h3>
            </div>
            <p className="text-xs text-mayssa-brown/50">
              Où les clients cliquent et quelles pages ils consultent le plus (données anonymes).
            </p>
          </div>
          <div className="flex items-center gap-2 bg-mayssa-soft/30 p-1.5 rounded-xl border border-mayssa-brown/5">
            {(['7d', '30d', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer',
                  period === p
                    ? 'bg-mayssa-brown text-mayssa-gold shadow-md'
                    : 'text-mayssa-brown/45 hover:text-mayssa-brown hover:bg-white',
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {!hasData ? (
          <div className="py-12 text-center rounded-xl bg-mayssa-soft/20 border border-dashed border-mayssa-brown/10">
            <MousePointerClick size={32} className="mx-auto text-mayssa-brown/25 mb-3" />
            <p className="text-sm text-mayssa-brown/60 font-medium">Pas encore de données de navigation</p>
            <p className="text-xs text-mayssa-brown/40 mt-1 max-w-md mx-auto">
              Les statistiques apparaîtront dès que des visiteurs auront accepté les cookies et navigué sur le site.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl bg-mayssa-soft/40 border border-mayssa-brown/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/45">Pages vues</p>
                <p className="text-2xl font-display font-bold text-mayssa-brown mt-1">{totalViews}</p>
              </div>
              <div className="rounded-xl bg-mayssa-soft/40 border border-mayssa-brown/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/45">Clics enregistrés</p>
                <p className="text-2xl font-display font-bold text-mayssa-gold mt-1">{totalClicks}</p>
              </div>
              <div className="rounded-xl bg-mayssa-soft/40 border border-mayssa-brown/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/45">Zones suivies</p>
                <p className="text-2xl font-display font-bold text-mayssa-brown mt-1">{Object.keys(targetCounts).length}</p>
              </div>
              <div className="rounded-xl bg-mayssa-soft/40 border border-mayssa-brown/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/45">Clics / vue</p>
                <p className="text-2xl font-display font-bold text-emerald-600 mt-1">
                  {totalViews > 0 ? (totalClicks / totalViews).toFixed(1) : '—'}
                </p>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mayssa-brown/40 mb-3">
                  Top clics
                </p>
                <div className="h-52 rounded-xl bg-mayssa-soft/30 border border-mayssa-brown/5 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d4a57430" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9 }} stroke="#5b3a29" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} stroke="#5b3a29" width={110} />
                      <Tooltip
                        formatter={(value) => [Number(value) || 0, 'Clics']}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                      <Bar dataKey="clics" fill="#a67c52" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mayssa-brown/40 mb-3 flex items-center gap-1.5">
                  <MousePointerClick size={12} /> Détail des clics
                </p>
                <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {topTargets.map((target, index) => {
                    const pct = totalClicks > 0 ? Math.round((target.count / totalClicks) * 100) : 0
                    return (
                      <li
                        key={target.id}
                        className="rounded-xl border border-mayssa-brown/5 bg-white/60 px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-mayssa-brown truncate">
                              {index + 1}. {target.label}
                            </p>
                            <p className="text-[10px] text-mayssa-brown/45 mt-0.5">
                              {SITE_TRACK_GROUP_LABELS[target.group]} · {formatRelativeTime(target.lastAt)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-mayssa-gold">{target.count}</p>
                            <p className="text-[10px] text-mayssa-brown/40">{pct}%</p>
                          </div>
                        </div>
                        <div className="mt-2 h-1 rounded-full bg-mayssa-soft overflow-hidden">
                          <div className="h-full bg-mayssa-caramel rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mayssa-brown/40 mb-3 flex items-center gap-1.5">
                  <Eye size={12} /> Pages les plus consultées
                </p>
                <ul className="space-y-2">
                  {topPages.length === 0 ? (
                    <li className="text-sm text-mayssa-brown/50">Aucune page vue pour l&apos;instant.</li>
                  ) : (
                    topPages.map((page, index) => {
                      const pct = totalViews > 0 ? Math.round((page.views / totalViews) * 100) : 0
                      return (
                        <li
                          key={page.key}
                          className="flex items-center justify-between gap-3 rounded-xl border border-mayssa-brown/5 bg-white/60 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-mayssa-brown truncate">
                              {index + 1}. {page.label}
                            </p>
                            {page.path && (
                              <p className="text-[10px] text-mayssa-brown/40 truncate">{page.path}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-mayssa-brown">{page.views}</p>
                            <p className="text-[10px] text-mayssa-brown/40">{pct}%</p>
                          </div>
                        </li>
                      )
                    })
                  )}
                </ul>

                {lowEngagement.length > 0 && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-2">
                      <TrendingDown size={12} /> Peu cliqué — à surveiller
                    </p>
                    <ul className="space-y-1">
                      {lowEngagement.map((t) => (
                        <li key={t.id} className="text-xs text-amber-900/80">
                          {t.label} <span className="text-amber-700/70">({t.count} clic{t.count > 1 ? 's' : ''})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {topTargets[0] && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-1">
                      <TrendingUp size={12} /> Ce qui fonctionne
                    </p>
                    <p className="text-xs text-emerald-900/80 leading-relaxed">
                      <strong>{topTargets[0].label}</strong> concentre le plus de clics ({topTargets[0].count}).
                      {topPages[0] ? ` La page la plus visitée est « ${topPages[0].label} ».` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
