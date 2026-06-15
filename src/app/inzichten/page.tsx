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
  Uitstekend: '#1D9E75',
  Goed: '#6366f1',
  Matig: '#F59E0B',
  Lastig: '#EF4444',
}

function scoreLabelKleur(label: string): string {
  return SCORE_LABEL_KLEUR[label] ?? '#6366f1'
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
          fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth}
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
        <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>
          {label}
        </span>
      </div>
    </div>
  )
}

function StatKaart({ waarde, label, kleur }: { waarde: number | string; label: string; kleur: string }) {
  return (
    <div style={{
      background: 'white', borderRadius: 14, padding: '16px 12px',
      border: '1px solid #E5E7EB', textAlign: 'center', flex: 1,
    }}>
      <p style={{ fontSize: 22, fontWeight: 800, color: kleur, margin: 0 }}>{waarde}</p>
      <p style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{label}</p>
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
    v === null ? '#9CA3AF' : v >= 4 ? '#1D9E75' : v >= 3 ? '#F59E0B' : '#EF4444'

  const slaapKleur = (v: number | null) =>
    v === null ? '#9CA3AF' : v >= 7 ? '#1D9E75' : v >= 5 ? '#F59E0B' : '#EF4444'

  const rustKleur = (stress: number | null) => {
    if (stress === null) return '#9CA3AF'
    const rust = 10 - stress
    return rust >= 7 ? '#1D9E75' : rust >= 5 ? '#F59E0B' : '#EF4444'
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Wekelijkse inzichten
            </h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>AI-analyse van jouw afgelopen 7 dagen</p>
          </div>
          <button
            onClick={() => laadRapport(true)}
            disabled={vernieuwen}
            style={{
              background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
              padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#374151',
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
            background: 'white', borderRadius: 20, padding: '40px 24px',
            textAlign: 'center', border: '1px solid #E5E7EB',
          }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📊</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Nog geen inzichten</p>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65 }}>
              {data?.bericht ?? 'Doe minimaal 3 check-ins deze week om jouw wekelijkse analyse te ontvangen.'}
            </p>
          </div>
        )}

        {rapport && (
          <>
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
                background: 'white', borderRadius: 20, padding: '22px 16px',
                border: '1px solid #E5E7EB', marginBottom: 14,
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
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <StatKaart
                  waarde={stats.aantal_checkins}
                  label="Check-ins"
                  kleur={stats.aantal_checkins >= 3 ? '#1D9E75' : '#F59E0B'}
                />
                <StatKaart
                  waarde={stats.dankbaarheid_items}
                  label="Dankbaarheid"
                  kleur={stats.dankbaarheid_items >= 5 ? '#1D9E75' : stats.dankbaarheid_items >= 2 ? '#F59E0B' : '#9CA3AF'}
                />
              </div>
            )}

            {/* Samenvatting */}
            <div style={{
              background: 'white', borderRadius: 20, padding: '18px',
              border: '1px solid #E5E7EB', marginBottom: 14,
            }}>
              <p style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10,
              }}>
                Samenvatting
              </p>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{rapport.samenvatting}</p>
            </div>

            {/* Patroon */}
            <div style={{
              background: 'white', borderRadius: 16, padding: '16px',
              border: '1px solid #E5E7EB', marginBottom: 14,
            }}>
              <p style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 8,
              }}>
                Patroon
              </p>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>{rapport.patroon}</p>
            </div>

            {/* Tip */}
            <div style={{
              background: '#F0FDF4', borderRadius: 16, padding: '16px',
              border: '1px solid #BBF7D0',
            }}>
              <p style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: '#15803D', marginBottom: 8,
              }}>
                Tip van de week
              </p>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>{rapport.tip}</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
