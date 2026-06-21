'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface WeekPunt {
  week: string
  gemiddelde?: number
  aantal?: number
}

interface CheckinPunt {
  week: string
  unieke_users: number
  participatie_pct: number
}

interface Stressor {
  naam: string
  count: number
}

interface AnalyticsData {
  stemming_trend: WeekPunt[]
  slaap_trend: WeekPunt[]
  stress_trend: WeekPunt[]
  checkin_trend: CheckinPunt[]
  top_stressoren: Stressor[]
  totaal_medewerkers: number
  actief_deze_week: number
}

function gemiddelde(punten: WeekPunt[]): number | null {
  const vals = punten.map((p) => p.gemiddelde).filter((v): v is number => v !== undefined)
  if (!vals.length) return null
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
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

// Eenvoudige SVG lijnengrafiek
function LijnenGrafiek({
  punten,
  kleur,
  min,
  max,
  label,
}: {
  punten: WeekPunt[]
  kleur: string
  min: number
  max: number
  label: string
}) {
  const breedte = 480
  const hoogte = 120
  const padding = { left: 32, right: 16, top: 12, bottom: 24 }
  const innerB = breedte - padding.left - padding.right
  const innerH = hoogte - padding.top - padding.bottom

  if (!punten.length) {
    return (
      <div style={{ height: hoogte, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', fontSize: 13 }}>
        Geen data beschikbaar
      </div>
    )
  }

  const bereik = max - min || 1
  const xStap = innerB / Math.max(punten.length - 1, 1)

  const puntenCoords = punten.map((p, i) => {
    const x = padding.left + i * xStap
    const y = padding.top + innerH - ((( p.gemiddelde ?? min) - min) / bereik) * innerH
    return { x, y, waarde: p.gemiddelde, week: p.week }
  })

  const pad = puntenCoords
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')

  const vulPad =
    pad +
    ` L${puntenCoords[puntenCoords.length - 1].x.toFixed(1)},${(padding.top + innerH).toFixed(1)}` +
    ` L${padding.left.toFixed(1)},${(padding.top + innerH).toFixed(1)} Z`

  return (
    <svg viewBox={`0 0 ${breedte} ${hoogte}`} style={{ width: '100%', height: hoogte, overflow: 'visible' }}>
      {/* Grid lijnen */}
      {[0, 0.5, 1].map((f) => {
        const y = padding.top + innerH - f * innerH
        return (
          <line
            key={f}
            x1={padding.left}
            y1={y}
            x2={breedte - padding.right}
            y2={y}
            stroke="#F3F4F6"
            strokeWidth={1}
          />
        )
      })}

      {/* Y-as labels */}
      <text x={padding.left - 4} y={padding.top + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">{max}</text>
      <text x={padding.left - 4} y={padding.top + innerH + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">{min}</text>

      {/* Vulling onder lijn */}
      <path d={vulPad} fill={kleur} fillOpacity={0.08} />

      {/* Hoofdlijn */}
      <path d={pad} fill="none" stroke={kleur} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Datapunten */}
      {puntenCoords.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={kleur} />
      ))}

      {/* X-as labels (elke 3e week) */}
      {puntenCoords
        .filter((_, i) => i % 3 === 0)
        .map((p, i) => (
          <text key={i} x={p.x} y={hoogte - 4} textAnchor="middle" fontSize={9} fill="#9CA3AF">
            {p.week.slice(5)}
          </text>
        ))}
    </svg>
  )
}

// Staafgrafiek voor stress
function StaafGrafiek({ punten, kleur }: { punten: WeekPunt[]; kleur: string }) {
  const breedte = 480
  const hoogte = 120
  const padding = { left: 32, right: 16, top: 12, bottom: 24 }
  const innerB = breedte - padding.left - padding.right
  const innerH = hoogte - padding.top - padding.bottom
  const max = 10

  if (!punten.length) {
    return (
      <div style={{ height: hoogte, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', fontSize: 13 }}>
        Geen data beschikbaar
      </div>
    )
  }

  const staafBreedte = Math.max(4, (innerB / punten.length) * 0.6)

  return (
    <svg viewBox={`0 0 ${breedte} ${hoogte}`} style={{ width: '100%', height: hoogte, overflow: 'visible' }}>
      {/* Grid */}
      {[0, 0.5, 1].map((f) => {
        const y = padding.top + innerH - f * innerH
        return (
          <line key={f} x1={padding.left} y1={y} x2={breedte - padding.right} y2={y} stroke="#F3F4F6" strokeWidth={1} />
        )
      })}
      <text x={padding.left - 4} y={padding.top + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">{max}</text>
      <text x={padding.left - 4} y={padding.top + innerH + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">0</text>

      {punten.map((p, i) => {
        const x = padding.left + (i / Math.max(punten.length - 1, 1)) * innerB
        const val = p.gemiddelde ?? 0
        const staafH = (val / max) * innerH
        const y = padding.top + innerH - staafH
        const stressKleur = val >= 7 ? 'var(--mf-red)' : val >= 5 ? 'var(--mf-amber)' : kleur
        return (
          <rect
            key={i}
            x={x - staafBreedte / 2}
            y={y}
            width={staafBreedte}
            height={staafH}
            fill={stressKleur}
            fillOpacity={0.85}
            rx={2}
          />
        )
      })}

      {punten
        .filter((_, i) => i % 3 === 0)
        .map((p, i) => {
          const x = padding.left + ((punten.findIndex((q) => q.week === p.week)) / Math.max(punten.length - 1, 1)) * innerB
          return (
            <text key={i} x={x} y={hoogte - 4} textAnchor="middle" fontSize={9} fill="#9CA3AF">
              {p.week.slice(5)}
            </text>
          )
        })}
    </svg>
  )
}

// Ring-percentage voor participatie
function RingParticipatie({ pct, kleur }: { pct: number; kleur: string }) {
  const straal = 44
  const omtrek = 2 * Math.PI * straal
  const gevuld = (pct / 100) * omtrek
  return (
    <svg width={108} height={108} viewBox="0 0 108 108">
      <circle cx={54} cy={54} r={straal} fill="none" stroke="#F3F4F6" strokeWidth={10} />
      <circle
        cx={54}
        cy={54}
        r={straal}
        fill="none"
        stroke={kleur}
        strokeWidth={10}
        strokeDasharray={`${gevuld} ${omtrek - gevuld}`}
        strokeDashoffset={omtrek / 4}
        strokeLinecap="round"
      />
      <text x={54} y={50} textAnchor="middle" fontSize={18} fontWeight={800} fill="#111827">{pct}%</text>
      <text x={54} y={66} textAnchor="middle" fontSize={10} fill="#9CA3AF">actief</text>
    </svg>
  )
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-app, #F9FAFB)' }}>
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
          <div style={{ background: 'var(--mf-red-light)', border: '1px solid #FECACA', borderRadius: 12, padding: '16px 20px', color: '#B91C1C', fontSize: 14 }}>
            {fout}
          </div>
        ) : data ? (
          <>
            {/* KPI kaartjes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
              {kpiKaarten.map((k) => (
                <div
                  key={k.label}
                  style={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: 16,
                    padding: '20px 22px',
                    borderTop: `3px solid ${k.kleur}`,
                  }}
                >
                  <p style={{ fontSize: 26, fontWeight: 900, color: k.kleur, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {k.waarde}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginTop: 6 }}>{k.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Grafieken rij 1: Stemming + Slaap */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

              {/* Stemming trend */}
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 22px' }}>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Stemming trend</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Gemiddelde per week (schaal 1–5)</p>
                </div>
                <LijnenGrafiek
                  punten={data.stemming_trend}
                  kleur="#6366f1"
                  min={1}
                  max={5}
                  label="stemming"
                />
              </div>

              {/* Slaap trend */}
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 22px' }}>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Slaap trend</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Gem. uren slaap per week</p>
                </div>
                <LijnenGrafiek
                  punten={data.slaap_trend}
                  kleur="#1D9E75"
                  min={4}
                  max={9}
                  label="slaap"
                />
              </div>
            </div>

            {/* Grafieken rij 2: Stress + Participatie */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>

              {/* Stress staafgrafiek */}
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 22px' }}>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Stress trend</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Gem. stressniveau per week (1–10) — rood = hoog stress</p>
                </div>
                <StaafGrafiek punten={data.stress_trend} kleur="#1D9E75" />
              </div>

              {/* Participatie ring */}
              <div
                style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: 16,
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
                <RingParticipatie
                  pct={participatiePct}
                  kleur={participatiePct >= 70 ? 'var(--mf-green)' : participatiePct >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)'}
                />
                <p style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>
                  <strong style={{ color: 'var(--text-1)' }}>{data.actief_deze_week}</strong> van{' '}
                  <strong style={{ color: 'var(--text-1)' }}>{data.totaal_medewerkers}</strong> actief
                </p>
              </div>
            </div>

            {/* Top stressoren */}
            {data.top_stressoren.length > 0 && (
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 22px' }}>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Top stressoren (30 dagen)</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Gebruikte technieken bij hoge stress (stress ≥ 7)</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {data.top_stressoren.map((s) => {
                    const labelMap: Record<string, string> = {
                      box: 'Box breathing',
                      '478': '4-7-8 methode',
                      grounding: 'Grounding',
                      pmr: 'Progressieve spierontspanning',
                      geen_techniek: 'Geen techniek',
                    }
                    return (
                      <div
                        key={s.naam}
                        style={{
                          background: 'var(--mf-amber-light)',
                          border: '1px solid #FDE68A',
                          borderRadius: 10,
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--mf-amber-dark)' }}>{s.count}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-amber-dark)' }}>
                          {labelMap[s.naam] ?? s.naam}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
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
