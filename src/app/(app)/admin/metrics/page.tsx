'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Activity, AlertTriangle, ChevronLeft } from 'lucide-react'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'

interface Metrics {
  totaalGebruikers: number
  actievenVandaag: number
  actieven7d: number
  actieven30d: number
  weekRetentiePct: number | null
  perDag: { datum: string; actieven: number }[]
  eventsPerType: { event: string; aantal: number }[]
  clientFouten: {
    aantal30d: number
    recent: { wanneer: string; melding: string; pad: string }[]
  }
  meetVanaf: string | null
}

function StatKaart({ label, waarde, sub }: { label: string; waarde: string; sub?: string }) {
  return (
    <Card>
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{waarde}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{sub}</p>}
    </Card>
  )
}

export default function AdminMetricsPage() {
  const router = useRouter()
  const { t, taal } = useVertaling()
  const locale = INTL_LOCALE[taal]
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<Metrics | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const res = await authFetch('/api/admin/metrics')
      if (res.status === 403) { router.push('/home'); return }
      if (res.ok) setData((await res.json()) as Metrics)
      setLaden(false)
    })
  }, [router])

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" role="status" aria-label={t('werk.adminMetrics.laden')} />
      </div>
    </div>
  )

  const maxActieven = data ? Math.max(1, ...data.perDag.map((d) => d.actieven)) : 1

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 920, margin: '0 auto' }}>
        <Link href="/admin" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: 'var(--text-3)', textDecoration: 'none', marginBottom: 16,
        }}>
          <ChevronLeft size={15} aria-hidden /> {t('werk.adminMetrics.terug')}
        </Link>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            {t('werk.adminMetrics.titel')}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {t('werk.adminMetrics.intro')}
            {data?.meetVanaf && <> {t('werk.adminMetrics.meetVanaf', { datum: new Date(data.meetVanaf).toLocaleDateString(locale) })}</>}
          </p>
        </div>

        {!data ? (
          <Card>
            <EmptyState
              icon={Activity}
              title={t('werk.adminMetrics.leegTitel')}
              description={t('werk.adminMetrics.leegOmschrijving')}
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <StatKaart label={t('werk.adminMetrics.actiefVandaag')} waarde={String(data.actievenVandaag)} />
              <StatKaart label={t('werk.adminMetrics.actief7')} waarde={String(data.actieven7d)} />
              <StatKaart label={t('werk.adminMetrics.actief30')} waarde={String(data.actieven30d)} sub={t('werk.adminMetrics.vanAccounts', { aantal: data.totaalGebruikers })} />
              <StatKaart
                label={t('werk.adminMetrics.terugkeer')}
                waarde={data.weekRetentiePct === null ? '—' : `${data.weekRetentiePct}%`}
                sub={data.weekRetentiePct === null ? t('werk.adminMetrics.weinigHistorie') : t('werk.adminMetrics.beideWeken')}
              />
            </div>

            <Card>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14 }}>
                {t('werk.adminMetrics.perDagTitel')}
              </h2>
              <div role="img" aria-label={t('werk.adminMetrics.perDagLabel', { max: maxActieven })}
                style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
                {data.perDag.map((d) => (
                  <div key={d.datum} title={`${d.datum}: ${d.actieven}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <div style={{
                      height: `${Math.max(3, (d.actieven / maxActieven) * 100)}%`,
                      background: d.actieven > 0 ? 'var(--mentaforce-primary)' : 'var(--border)',
                      borderRadius: 3, opacity: d.actieven > 0 ? 0.9 : 0.5,
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-4)' }}>
                <span>{data.perDag[0]?.datum}</span>
                <span>{data.perDag[data.perDag.length - 1]?.datum}</span>
              </div>
            </Card>

            <Card>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14 }}>
                {t('werk.adminMetrics.perFeature')}
              </h2>
              {data.eventsPerType.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('werk.adminMetrics.geenEvents')}</p>
              ) : (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.eventsPerType.map((e) => (
                    <li key={e.event} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-2)' }}>{e.event}</span>
                      <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{e.aantal}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={16} color="var(--mf-amber)" aria-hidden />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
                  {t('werk.adminMetrics.fouten', { aantal: data.clientFouten.aantal30d })}
                </h2>
              </div>
              {data.clientFouten.recent.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('werk.adminMetrics.geenFouten')}</p>
              ) : (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.clientFouten.recent.map((f, i) => (
                    <li key={`${f.wanneer}-${i}`} style={{ fontSize: 13, borderLeft: '2px solid var(--mf-amber)', paddingLeft: 10 }}>
                      <span style={{ color: 'var(--text-1)' }}>{f.melding}</span>
                      <span style={{ color: 'var(--text-4)' }}> · {f.pad} · {new Date(f.wanneer).toLocaleString(locale)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
