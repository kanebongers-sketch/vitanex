'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Chart, type ChartDatum } from '@/components/ui/Chart'
import { EmptyState } from '@/components/ui/EmptyState'
import { PremiumSlot } from '@/components/ui/PremiumSlot'
import { BarChart3 } from 'lucide-react'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'


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
  if (score >= 20) return 'var(--mf-green)'
  if (score >= 0) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

export default function HrENPSPage() {
  const router = useRouter()
  const { t, taal } = useVertaling()
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<ENPSData | null>(null)
  const [premiumNodig, setPremiumNodig] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/hr/enps')
      if (res.status === 403) {
        const json = (await res.json().catch(() => null)) as { code?: string } | null
        if (json?.code === 'premium') setPremiumNodig(true)
      } else if (res.ok) {
        setData(await res.json() as ENPSData)
      }
      setLaden(false)
    })
  }, [router])

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  if (premiumNodig) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 780, margin: '0 auto' }}>
        <PremiumSlot
          kanUpgraden
          titel={t('werk.hrEnps.premiumTitel')}
          omschrijving={t('werk.hrEnps.premiumOmschrijving')}
        />
      </main>
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 780, margin: '0 auto' }}>
        <Card>
          <EmptyState
            icon={BarChart3}
            title={t('werk.hrEnps.geenDataTitel')}
            description={t('werk.hrEnps.geenDataOmschrijving')}
          />
        </Card>
      </main>
    </div>
  )

  // k-anonimiteit: onder de drempel geeft de API nps: null terug.
  if (data.nps === null) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 780, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>{t('werk.hrEnps.titel')}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('werk.hrEnps.intro')}</p>
        </div>
        <Card>
          <EmptyState
            icon={BarChart3}
            title={t('werk.hrEnps.teWeinigTitel')}
            description={t('werk.hrEnps.teWeinigOmschrijving')}
          />
          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', paddingBottom: 20 }}>
            {data.totaal_respondenten === 1
              ? t('werk.hrEnps.totNuEen', { pct: data.participatie_pct })
              : t('werk.hrEnps.totNuMeer', { aantal: data.totaal_respondenten, pct: data.participatie_pct })}
          </p>
        </Card>
      </main>
    </div>
  )

  const npsKleur = NPS_KLEUR(data.nps)
  const totaal = data.promoters + data.passives + data.detractors || 1

  const distributieData: ChartDatum[] = Array.from({ length: 11 }, (_, i) => ({
    score: String(i),
    aantal: data.distributie[String(i)] ?? 0,
  }))
  const heeftDistributie = Object.keys(data.distributie).length > 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 780, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>{t('werk.hrEnps.titel')}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('werk.hrEnps.intro')}</p>
        </div>

        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: t('werk.hrEnps.score'), waarde: data.nps !== null ? (data.nps > 0 ? '+' : '') + data.nps : '—', kleur: npsKleur },
            { label: t('werk.hrEnps.respondenten'), waarde: String(data.totaal_respondenten), kleur: 'var(--text-1)' },
            { label: t('werk.hrEnps.participatie'), waarde: `${data.participatie_pct}%`, kleur: 'var(--text-1)' },
            { label: t('werk.hrEnps.promoters'), waarde: String(data.promoters), kleur: 'var(--mf-green)' },
          ].map(s => (
            <Card key={s.label} style={{ padding: '16px 18px' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.kleur }}>{s.waarde}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            </Card>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* Segmentbalk */}
          <Card style={{ padding: '20px 22px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14 }}>{t('werk.hrEnps.verdeling')}</p>
            {data.totaal_respondenten === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('werk.hrEnps.nogGeenData')}</p>
            ) : (
              <>
                <div role="img" aria-label={t('werk.hrEnps.verdelingLabel', { detractors: data.detractors, passives: data.passives, promoters: data.promoters })} style={{ height: 12, display: 'flex', borderRadius: 100, overflow: 'hidden', marginBottom: 14 }}>
                  {[
                    { label: t('werk.hrEnps.detractors'), count: data.detractors, kleur: 'var(--mf-red)' },
                    { label: t('werk.hrEnps.passives'),   count: data.passives,   kleur: 'var(--mf-amber)' },
                    { label: t('werk.hrEnps.promoters'),  count: data.promoters,  kleur: 'var(--mf-green)' },
                  ].map(g => (
                    <div key={g.label} style={{ flex: g.count / totaal, background: g.kleur, minWidth: g.count > 0 ? 4 : 0 }} />
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: t('werk.hrEnps.promotersBereik'), count: data.promoters, kleur: 'var(--mf-green)' },
                    { label: t('werk.hrEnps.passivesBereik'),   count: data.passives,  kleur: 'var(--mf-amber)' },
                    { label: t('werk.hrEnps.detractorsBereik'), count: data.detractors, kleur: 'var(--mf-red)' },
                  ].map(g => (
                    <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: g.kleur, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{g.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: g.kleur }}>{g.count}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', width: 32, textAlign: 'right' }}>{Math.round((g.count / totaal) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Trend */}
          <Card style={{ padding: '20px 22px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14 }}>{t('werk.hrEnps.trend')}</p>
            {data.trend.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('werk.hrEnps.geenHistorie')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.trend.map(punt => {
                  const kleur = NPS_KLEUR(punt.nps)
                  const maandLabel = new Date(punt.maand + '-01').toLocaleDateString(INTL_LOCALE[taal], { month: 'short' })
                  return (
                    <div key={punt.maand} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', width: 48, flexShrink: 0 }}>
                        {maandLabel}
                      </span>
                      <div role="img" aria-label={t('werk.hrEnps.trendLabel', { maand: maandLabel, score: punt.nps !== null ? punt.nps : t('werk.hrEnps.geenData'), aantal: punt.respondenten })} style={{ flex: 1, height: 8, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
                        {punt.nps !== null && (
                          <div style={{ height: '100%', width: `${Math.min(100, ((punt.nps + 100) / 200) * 100)}%`, background: kleur, borderRadius: 100 }} />
                        )}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: kleur, width: 36, textAlign: 'right', flexShrink: 0 }}>
                        {punt.nps !== null ? (punt.nps > 0 ? '+' : '') + punt.nps : '—'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-3)', width: 20, flexShrink: 0 }}>{punt.respondenten}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Scoredistributie */}
        <Card style={{ padding: '20px 22px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14 }}>{t('werk.hrEnps.distributie')}</p>
          {!heeftDistributie ? (
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('werk.hrEnps.nogGeenData')}</p>
          ) : (
            <Chart
              type="bar"
              data={distributieData}
              xKey="score"
              series={[{ key: 'aantal', label: t('werk.hrEnps.aantalAntwoorden'), color: 'var(--mentaforce-primary)' }]}
              height={140}
              summary={t('werk.hrEnps.distributieSamenvatting')}
            />
          )}
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12 }}>
            {t('werk.hrEnps.benchmarks')}
          </p>
        </Card>
      </main>
    </div>
  )
}
