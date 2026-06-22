'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface ENPSData {
  nps: number | null
  totaal_respondenten: number
  promoters: number
  passives: number
  detractors: number
  participatie_pct: number
  distributie: Record<string, number>
  trend: { maand: string; nps: number | null; respondenten: number }[]
}

const NPS_KLEUR = (score: number | null) => {
  if (score === null) return 'var(--text-3)'
  if (score >= 30) return 'var(--mf-green)'
  if (score >= 0) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

export default function HrENPSPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<ENPSData | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/hr/enps')
      if (res.ok) setData(await res.json() as ENPSData)
      setLaden(false)
    })
  }, [router])

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-3)' }}>Geen toegang of fout bij laden.</p>
      </main>
    </div>
  )

  const npsKleur = NPS_KLEUR(data.nps)
  const totaal = data.promoters + data.passives + data.detractors || 1

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 780, margin: '0 auto' }}>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 24 }}>eNPS Dashboard</h1>

        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'eNPS score', waarde: data.nps !== null ? (data.nps > 0 ? '+' : '') + data.nps : '—', kleur: npsKleur },
            { label: 'Respondenten', waarde: String(data.totaal_respondenten), kleur: 'var(--text-2)' },
            { label: 'Participatie', waarde: `${data.participatie_pct}%`, kleur: 'var(--text-2)' },
            { label: 'Promoters', waarde: String(data.promoters), kleur: 'var(--mf-green)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: '16px 18px' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.kleur }}>{s.waarde}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* Segmentbalk */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14 }}>Verdeling respondenten</p>
            {data.totaal_respondenten === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Nog geen data</p>
            ) : (
              <>
                <div style={{ height: 12, display: 'flex', borderRadius: 100, overflow: 'hidden', marginBottom: 14 }}>
                  {[
                    { label: 'Detractors', count: data.detractors, kleur: 'var(--mf-red)' },
                    { label: 'Passives',   count: data.passives,   kleur: 'var(--mf-amber)' },
                    { label: 'Promoters',  count: data.promoters,  kleur: 'var(--mf-green)' },
                  ].map(g => (
                    <div key={g.label} style={{ flex: g.count / totaal, background: g.kleur, minWidth: g.count > 0 ? 4 : 0 }} />
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Promoters (9—10)', count: data.promoters, kleur: 'var(--mf-green)' },
                    { label: 'Passives (7—8)',   count: data.passives,  kleur: 'var(--mf-amber)' },
                    { label: 'Detractors (0—6)', count: data.detractors, kleur: 'var(--mf-red)' },
                  ].map(g => (
                    <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: g.kleur, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{g.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: g.kleur }}>{g.count}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', width: 32, textAlign: 'right' }}>{Math.round((g.count / totaal) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Trend */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14 }}>eNPS trend (6 maanden)</p>
            {data.trend.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Nog geen historische data</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.trend.map(t => {
                  const kleur = NPS_KLEUR(t.nps)
                  return (
                    <div key={t.maand} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', width: 48, flexShrink: 0 }}>
                        {new Date(t.maand + '-01').toLocaleDateString('nl-BE', { month: 'short' })}
                      </span>
                      <div style={{ flex: 1, height: 8, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
                        {t.nps !== null && (
                          <div style={{ height: '100%', width: `${Math.min(100, ((t.nps + 100) / 200) * 100)}%`, background: kleur, borderRadius: 100 }} />
                        )}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: kleur, width: 36, textAlign: 'right', flexShrink: 0 }}>
                        {t.nps !== null ? (t.nps > 0 ? '+' : '') + t.nps : '—'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-3)', width: 20, flexShrink: 0 }}>{t.respondenten}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Scoredistributie */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14 }}>Scoredistributie</p>
          {Object.keys(data.distributie).length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Nog geen data</p>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
              {Array.from({ length: 11 }, (_, i) => {
                const count = data.distributie[String(i)] ?? 0
                const max = Math.max(...Object.values(data.distributie), 1)
                const kleur = i >= 9 ? 'var(--mf-green)' : i >= 7 ? 'var(--mf-amber)' : 'var(--mf-red)'
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', background: kleur, borderRadius: '3px 3px 0 0', height: count > 0 ? `${(count / max) * 60}px` : 2, opacity: count > 0 ? 1 : 0.2 }} />
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{i}</span>
                    {count > 0 && <span style={{ fontSize: 9, color: kleur, fontWeight: 700 }}>{count}</span>}
                  </div>
                )
              })}
            </div>
          )}
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12 }}>
            eNPS benchmarks: Excellent ≥ 50 · Goed ≥ 20 · Matig ≥ 0 · Negatief &lt; 0
          </p>
        </div>
      </main>
    </div>
  )
}

