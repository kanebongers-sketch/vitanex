'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Ring } from '@/components/ui/Ring'
import { Badge } from '@/components/ui/Badge'
import { Chart, type ChartDatum } from '@/components/ui/Chart'


interface WeekPunt {
  week: string
  gemiddelde?: number | null
  aantal?: number
}

interface CheckinPunt {
  week: string
  unieke_users: number
  participatie_pct: number
}

interface Techniek {
  naam: string
  count: number
}

interface AnalyticsData {
  stemming_trend: WeekPunt[]
  slaap_trend: WeekPunt[]
  stress_trend: WeekPunt[]
  checkin_trend: CheckinPunt[]
  top_technieken: Techniek[]
  totaal_medewerkers: number
  actief_deze_week: number
  drempel?: number
}

function gemiddelde(punten: WeekPunt[]): number | null {
  const vals = punten.map((p) => p.gemiddelde).filter((v): v is number => typeof v === 'number')
  if (!vals.length) return null
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
}

// Een trend is pas toonbaar als minstens één week een echt gemiddelde heeft
// (weken onder de anonimiteitsdrempel krijgen gemiddelde: null van de API).
function heeftToonbareData(punten: WeekPunt[]): boolean {
  return punten.some((p) => typeof p.gemiddelde === 'number')
}

function recenteWeekRange(): string {
  const nu = new Date()
  const maandag = new Date(nu)
  maandag.setDate(nu.getDate() - nu.getDay() + 1)
  const zondag = new Date(maandag)
  zondag.setDate(maandag.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  return `${fmt(maandag)} – ${fmt(zondag)}`
}

// Maakt van een week-trend de generieke Chart-data: { week, waarde }.
function naarChartData(punten: WeekPunt[]): ChartDatum[] {
  return punten.map((p) => ({ week: p.week.slice(5), waarde: p.gemiddelde ?? null }))
}

export default function HrAnalyticsPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [fout, setFout] = useState<string | null>(null)

  useEffect(() => {
    async function laad() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: profiel } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home')
        return
      }
      const res = await authFetch('/api/hr/analytics')
      if (!res.ok) {
        setFout('Data kon niet worden opgehaald.')
        setLaden(false)
        return
      }
      setData((await res.json()) as AnalyticsData)
      setLaden(false)
    }
    laad()
  }, [router])

  const participatiePct =
    data && data.totaal_medewerkers > 0
      ? Math.round((data.actief_deze_week / data.totaal_medewerkers) * 100)
      : 0

  const gemStemming = data ? gemiddelde(data.stemming_trend) : null
  const gemSlaap = data ? gemiddelde(data.slaap_trend) : null
  const gemStress = data ? gemiddelde(data.stress_trend) : null

  const ringKleur =
    participatiePct >= 70 ? 'var(--mf-green)' : participatiePct >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)'

  const drempel = data?.drempel ?? 5
  const anonimiteitsUitleg = `Resultaten zichtbaar vanaf ${drempel} deelnemers om anonimiteit te garanderen.`

  const kpiKaarten = [
    {
      label: 'Gem. stemming',
      waarde: gemStemming !== null ? `${gemStemming}/5` : '–',
      kleur: gemStemming !== null && gemStemming >= 3.5 ? 'var(--mf-green)' : 'var(--mf-amber)',
      sub: 'Afgelopen 12 weken',
    },
    {
      label: 'Gem. slaap',
      waarde: gemSlaap !== null ? `${gemSlaap}u` : '–',
      kleur: gemSlaap !== null && gemSlaap >= 7 ? 'var(--mf-green)' : 'var(--mf-amber)',
      sub: 'Afgelopen 12 weken',
    },
    {
      label: 'Gem. stress',
      waarde: gemStress !== null ? `${gemStress}/10` : '–',
      kleur: gemStress !== null && gemStress >= 7 ? 'var(--mf-red)' : gemStress !== null && gemStress >= 5 ? 'var(--mf-amber)' : 'var(--mf-green)',
      sub: 'Afgelopen 12 weken',
    },
    {
      label: '% Actief',
      waarde: `${participatiePct}%`,
      kleur: participatiePct >= 70 ? 'var(--mf-green)' : participatiePct >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)',
      sub: 'Deze week',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Team Analytics
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              Week {recenteWeekRange()} &nbsp;·&nbsp; Anonieme wellbeing trends
            </p>
          </div>
          {data && (
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
              <strong style={{ color: 'var(--text-1)' }}>{data.totaal_medewerkers}</strong> medewerkers
            </p>
          )}
        </div>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div className="mf-spinner" />
          </div>
        ) : fout ? (
          <div role="alert" style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)', borderRadius: 'var(--radius-md)', padding: '16px 20px', color: 'var(--mf-red)', fontSize: 14 }}>
            {fout}
          </div>
        ) : data ? (
          <>
            {/* KPI kaartjes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
              {kpiKaarten.map((k) => (
                <Card
                  key={k.label}
                  style={{
                    padding: '20px 22px',
                    borderTop: `3px solid ${k.kleur}`,
                  }}
                >
                  <p style={{ fontSize: 26, fontWeight: 900, color: k.kleur, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {k.waarde}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginTop: 6 }}>{k.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{k.sub}</p>
                </Card>
              ))}
            </div>

            {/* Grafieken rij 1: Stemming + Slaap */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

              {/* Stemming trend */}
              <Card style={{ padding: '20px 22px' }}>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Stemming trend</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Gemiddelde per week (schaal 1–5)</p>
                </div>
                {!heeftToonbareData(data.stemming_trend) ? (
                  <p style={{ fontSize: 13, color: 'var(--text-4)', padding: '32px 0', textAlign: 'center' }}>{anonimiteitsUitleg}</p>
                ) : (
                  <Chart
                    type="area"
                    data={naarChartData(data.stemming_trend)}
                    xKey="week"
                    series={[{ key: 'waarde', label: 'Stemming', color: 'var(--mf-purple)' }]}
                    yDomain={[1, 5]}
                    height={140}
                    summary="Gemiddelde stemming per week op een schaal van 1 tot 5, over de afgelopen weken."
                  />
                )}
              </Card>

              {/* Slaap trend */}
              <Card style={{ padding: '20px 22px' }}>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Slaap trend</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Gem. uren slaap per week</p>
                </div>
                {!heeftToonbareData(data.slaap_trend) ? (
                  <p style={{ fontSize: 13, color: 'var(--text-4)', padding: '32px 0', textAlign: 'center' }}>{anonimiteitsUitleg}</p>
                ) : (
                  <Chart
                    type="area"
                    data={naarChartData(data.slaap_trend)}
                    xKey="week"
                    series={[{ key: 'waarde', label: 'Slaap (uren)', color: 'var(--mf-green)' }]}
                    yDomain={[4, 9]}
                    height={140}
                    summary="Gemiddeld aantal uren slaap per week over de afgelopen weken."
                  />
                )}
              </Card>
            </div>

            {/* Grafieken rij 2: Stress + Participatie */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>

              {/* Stress staafgrafiek */}
              <Card style={{ padding: '20px 22px' }}>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Stress trend</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Gem. stressniveau per week (schaal 1–10)</p>
                </div>
                {!heeftToonbareData(data.stress_trend) ? (
                  <p style={{ fontSize: 13, color: 'var(--text-4)', padding: '32px 0', textAlign: 'center' }}>{anonimiteitsUitleg}</p>
                ) : (
                  <Chart
                    type="bar"
                    data={naarChartData(data.stress_trend)}
                    xKey="week"
                    series={[{ key: 'waarde', label: 'Stress', color: 'var(--mentaforce-primary)' }]}
                    yDomain={[0, 10]}
                    height={140}
                    summary="Gemiddeld stressniveau per week op een schaal van 1 tot 10 over de afgelopen weken."
                  />
                )}
              </Card>

              {/* Participatie ring */}
              <Card
                style={{
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Participatie</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Check-ins deze week</p>
                </div>
                <Ring
                  value={participatiePct}
                  ariaLabel={`Participatie deze week: ${participatiePct} procent actief`}
                  size={108}
                  thickness={10}
                  color={ringKleur}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
                    <strong style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{participatiePct}%</strong>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>actief</span>
                  </span>
                </Ring>
                <p style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>
                  <strong style={{ color: 'var(--text-1)' }}>{data.actief_deze_week}</strong> van{' '}
                  <strong style={{ color: 'var(--text-1)' }}>{data.totaal_medewerkers}</strong> actief
                </p>
              </Card>
            </div>

            {/* Technieken bij hoge stress */}
            {data.top_technieken.length > 0 && (
              <Card style={{ padding: '20px 22px' }}>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Technieken bij hoge stress (30 dagen)</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Gebruikte technieken bij hoge stress (stress ≥ 7)</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {data.top_technieken.map((s) => {
                    const labelMap: Record<string, string> = {
                      box: 'Box breathing',
                      '478': '4-7-8 methode',
                      grounding: 'Grounding',
                      pmr: 'Progressieve spierontspanning',
                      geen_techniek: 'Geen techniek',
                    }
                    return (
                      <Badge key={s.naam} variant="warning" style={{ padding: '8px 14px', fontSize: 12 }}>
                        <strong style={{ fontSize: 15, fontWeight: 900 }}>{s.count}</strong>
                        <span style={{ fontWeight: 600 }}>{labelMap[s.naam] ?? s.naam}</span>
                      </Badge>
                    )
                  })}
                </div>
              </Card>
            )}

            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 16, textAlign: 'center' }}>
              Alle data is geanonimiseerd. Trends worden alleen getoond bij voldoende deelnemers.
            </p>
          </>
        ) : null}
      </main>
    </div>
  )
}
