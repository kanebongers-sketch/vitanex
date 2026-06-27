'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface WeekStats {
  stemming: number | null
  slaap: number | null
  stress: number | null
  aantal_checkins: number
  dankbaarheid_items: number
}

interface Rapport {
  samenvatting: string
  patroon: string
  tip: string
  score_label: string
  stats: WeekStats
}

interface WeekRapportResponse {
  rapport: Rapport | null
  week_start: string
  cached: boolean
  bericht?: string
}

const SCORE_LABEL_KLEUR: Record<string, string> = {
  Uitstekend: 'var(--mf-green)',
  Goed: 'var(--mf-purple)',
  Matig: 'var(--mf-amber)',
  Lastig: 'var(--mf-red)',
}

function scoreLabelKleur(label: string): string {
  return SCORE_LABEL_KLEUR[label] ?? 'var(--mf-purple)'
}

interface RingProps {
  value: number
  max: number
  kleur: string
  label: string
  eenheid?: string
  size?: number
  strokeWidth?: number
}

function ProgressRing({ value, max, kleur, label, eenheid = '', size = 80, strokeWidth = 7 }: RingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(Math.max(value / max, 0), 1)
  const dash = pct * circumference
  const displayVal = Number.isInteger(value) ? value : value.toFixed(1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--border)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={kleur} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div style={{ marginTop: -size - 6, height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: kleur, lineHeight: 1 }}>
          {displayVal}{eenheid}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>
          {label}
        </span>
      </div>
    </div>
  )
}

function StatKaart({ waarde, label, kleur }: { waarde: number | string; label: string; kleur: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 14, padding: '16px 12px',
      border: '1px solid var(--border)', textAlign: 'center', flex: 1,
    }}>
      <p style={{ fontSize: 22, fontWeight: 800, color: kleur, margin: 0 }}>{waarde}</p>
      <p style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{label}</p>
    </div>
  )
}

export default function InzichtenPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [vernieuwen, setVernieuwen] = useState(false)
  const [data, setData] = useState<WeekRapportResponse | null>(null)

  const laadRapport = useCallback(async (forceer = false) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    if (forceer) setVernieuwen(true)
    else setLaden(true)

    const url = forceer ? '/api/inzichten/weekrapport?refresh=1' : '/api/inzichten/weekrapport'
    const res = await authFetch(url)
    if (res.ok) {
      const json = await res.json() as WeekRapportResponse
      setData(json)
    }

    setLaden(false)
    setVernieuwen(false)
  }, [router])

  useEffect(() => { laadRapport() }, [laadRapport])

  const rapport = data?.rapport ?? null
  const stats = rapport?.stats ?? null

  const stemmingKleur = (v: number | null) =>
    v === null ? 'var(--text-4)' : v >= 4 ? 'var(--mf-green)' : v >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)'

  const slaapKleur = (v: number | null) =>
    v === null ? 'var(--text-4)' : v >= 7 ? 'var(--mf-green)' : v >= 5 ? 'var(--mf-amber)' : 'var(--mf-red)'

  const rustKleur = (stress: number | null) => {
    if (stress === null) return 'var(--text-4)'
    const rust = 10 - stress
    return rust >= 7 ? 'var(--mf-green)' : rust >= 5 ? 'var(--mf-amber)' : 'var(--mf-red)'
  }

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 900, margin: '0 auto' }}>

        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Wekelijkse inzichten
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-4)' }}>AI-analyse van jouw afgelopen 7 dagen</p>
          </div>
          <button
            onClick={() => laadRapport(true)}
            disabled={vernieuwen}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '8px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
              cursor: vernieuwen ? 'not-allowed' : 'pointer',
              opacity: vernieuwen ? 0.6 : 1, whiteSpace: 'nowrap', marginTop: 2,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: vernieuwen ? 'spin 1s linear infinite' : 'none' }}>
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            {vernieuwen ? 'Laden…' : 'Vernieuwen'}
          </button>
        </header>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Lege staat */}
        {!rapport && (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: '40px 24px',
            textAlign: 'center', border: '1px solid var(--border)',
          }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#7c3aed14', border: '2px solid #7c3aed30', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px #7c3aed20', margin: '0 auto 14px' }}>
              <span style={{ fontSize: 44 }}>📊</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Nog geen inzichten</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65 }}>
              {data?.bericht ?? 'Doe minimaal 3 check-ins deze week om jouw wekelijkse analyse te ontvangen.'}
            </p>
          </div>
        )}

        {rapport && (
          <div className="mf-home-layout">
            {/* Left: score + stats */}
            <div>
              {/* Score label banner */}
              {(() => {
                const kleur = scoreLabelKleur(rapport.score_label)
                return (
                  <div style={{
                    background: kleur + '12',
                    border: `1.5px solid ${kleur}35`,
                    borderRadius: 18, padding: '16px 20px', marginBottom: 18,
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: kleur, margin: 0, letterSpacing: '-0.02em' }}>
                      {rapport.score_label}
                    </p>
                    {data?.week_start && (
                      <p style={{ fontSize: 11, color: kleur + 'aa', marginTop: 4, fontWeight: 500 }}>
                        Week van {new Date(data.week_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                        {data.cached ? ' · gecached' : ''}
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Progress rings */}
              {stats && (
                <div style={{
                  background: 'var(--bg-card)', borderRadius: 20, padding: '22px 16px',
                  border: '1px solid var(--border)', marginBottom: 14,
                  display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                }}>
                  <ProgressRing
                    value={stats.stemming ?? 0}
                    max={5}
                    kleur={stemmingKleur(stats.stemming)}
                    label="Stemming"
                    eenheid="/5"
                  />
                  <ProgressRing
                    value={stats.slaap ?? 0}
                    max={9}
                    kleur={slaapKleur(stats.slaap)}
                    label="Slaap"
                    eenheid="u"
                  />
                  <ProgressRing
                    value={stats.stress !== null ? 10 - stats.stress : 0}
                    max={10}
                    kleur={rustKleur(stats.stress)}
                    label="Rust"
                    eenheid="/10"
                  />
                </div>
              )}

              {/* Stats kaartjes */}
              {stats && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <StatKaart
                    waarde={stats.aantal_checkins}
                    label="Check-ins"
                    kleur={stats.aantal_checkins >= 3 ? 'var(--mf-green)' : 'var(--mf-amber)'}
                  />
                  <StatKaart
                    waarde={stats.dankbaarheid_items}
                    label="Dankbaarheid"
                    kleur={stats.dankbaarheid_items >= 5 ? 'var(--mf-green)' : stats.dankbaarheid_items >= 2 ? 'var(--mf-amber)' : 'var(--text-4)'}
                  />
                </div>
              )}
            </div>

            {/* Right: analyse tekst */}
            <div>
              {/* Samenvatting */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 20, padding: '18px',
                border: '1px solid var(--border)', marginBottom: 14,
              }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 10,
                }}>
                  Samenvatting
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{rapport.samenvatting}</p>
              </div>

              {/* Patroon */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 16, padding: '16px',
                border: '1px solid var(--border)', marginBottom: 14,
              }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 8,
                }}>
                  Patroon
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{rapport.patroon}</p>
              </div>

              {/* Tip */}
              <div style={{
                background: 'var(--mf-green-light)', borderRadius: 16, padding: '16px',
                border: '1px solid var(--mf-green-mid)',
              }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--mf-green-dark)', marginBottom: 8,
                }}>
                  Tip van de week
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{rapport.tip}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
