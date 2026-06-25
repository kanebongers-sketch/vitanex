'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

// ─── MomentumNudge ────────────────────────────────────────────────────────────

function MomentumNudge({ checklist }: { checklist: TaakItem[] }) {
  const gedaan = checklist.filter(t => t.status === 'gedaan')
  const open   = checklist.filter(t => t.status === 'open')

  if (gedaan.length === 0 || open.length === 0) return null

  const volgende = open[0]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: 'var(--mf-green-light)',
        border: '1px solid var(--mf-green-mid)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(29,158,117,0.08)',
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>🔥</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--mf-green-mid)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Momentum
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--mf-green-dark)' }}>
          {gedaan.length} gedaan — ga door met <strong>{volgende.titel}</strong>
        </p>
      </div>
      <Link
        href={volgende.url}
        style={{
          flexShrink: 0,
          padding: '8px 14px',
          background: 'var(--mf-green)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          borderRadius: 'var(--radius-btn)',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {volgende.icoon} Nu →
      </Link>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaakItem {
  id: string
  icoon: string
  titel: string
  status: 'gedaan' | 'open'
  detail: string
  url: string
}

interface VandaagScores {
  gedaan: number
  totaal: number
  score_pct: number
  water_ml: number
  water_doel_ml: number
  slaap_uren: number | null
  stemming_waarde: number | null
  focus_minuten: number
  meditatie_minuten: number
}

interface VandaagData {
  checklist: TaakItem[]
  scores: VandaagScores
  suggestie: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDatum(): { dag: string; datum: string } {
  const nu = new Date()
  const dag = nu.toLocaleDateString('nl-NL', { weekday: 'long' })
  const datum = nu.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return {
    dag: dag.charAt(0).toUpperCase() + dag.slice(1),
    datum,
  }
}

function ringKleur(pct: number): string {
  if (pct >= 70) return 'var(--mf-green)'
  if (pct >= 40) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

// ─── ProgressRing Component ───────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 54
  const omtrek = 2 * Math.PI * r
  const gevuld = (pct / 100) * omtrek
  const kleur = ringKleur(pct)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={136} height={136} viewBox="0 0 136 136" aria-label={`${pct}% compleet`}>
        <circle
          cx={68}
          cy={68}
          r={r}
          fill="none"
          stroke="var(--bg-subtle)"
          strokeWidth={12}
        />
        <circle
          cx={68}
          cy={68}
          r={r}
          fill="none"
          stroke={kleur}
          strokeWidth={12}
          strokeDasharray={omtrek}
          strokeDashoffset={omtrek - gevuld}
          strokeLinecap="round"
          transform="rotate(-90 68 68)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x={68} y={62} textAnchor="middle" fill={kleur} fontSize={26} fontWeight={700}>
          {pct}%
        </text>
        <text x={68} y={80} textAnchor="middle" fill="var(--text-3)" fontSize={11}>
          compleet
        </text>
      </svg>
    </div>
  )
}

// ─── TaakKaart Component ──────────────────────────────────────────────────────

function TaakKaart({ taak, onClick }: { taak: TaakItem; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const gedaan = taak.status === 'gedaan'

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '14px 16px',
        background: gedaan ? 'var(--mf-green-light)' : hovered ? 'var(--bg-subtle)' : 'var(--bg-card)',
        border: gedaan
          ? '1px solid rgba(29, 158, 117, 0.25)'
          : '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease',
        transform: hovered && !gedaan ? 'translateX(2px)' : 'none',
        boxShadow: hovered ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
      }}
      aria-label={`${taak.titel}: ${taak.detail}`}
    >
      {/* Icoon */}
      <span
        style={{
          fontSize: 22,
          minWidth: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: gedaan ? 'rgba(29, 158, 117, 0.12)' : 'var(--bg-subtle)',
          borderRadius: '50%',
        }}
      >
        {taak.icoon}
      </span>

      {/* Tekst */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: gedaan ? 'var(--mf-green-dark)' : 'var(--text-1)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {taak.titel}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: gedaan ? 'var(--mf-green)' : 'var(--text-3)',
            marginTop: 2,
          }}
        >
          {taak.detail}
        </p>
      </div>

      {/* Status badge */}
      <span
        style={{
          minWidth: 28,
          height: 28,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: gedaan ? 'var(--mf-green)' : 'var(--border)',
          flexShrink: 0,
          transition: 'background 0.2s ease',
        }}
        aria-hidden="true"
      >
        {gedaan ? (
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 7L5.5 10L11.5 4"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
            <path
              d="M3.5 5H6.5M5 3.5V6.5"
              stroke="var(--text-3)"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
    </button>
  )
}

// ─── DagdeelSuggestie Component ───────────────────────────────────────────────

function DagdeelSuggestie({ suggestie }: { suggestie: string }) {
  if (!suggestie) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        background: 'var(--mf-green-light)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(29, 158, 117, 0.2)',
        marginTop: 8,
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--mf-green-dark)', lineHeight: 1.5 }}>
        {suggestie}
      </p>
    </div>
  )
}

// ─── Hoofdpagina ──────────────────────────────────────────────────────────────

export default function VandaagPage() {
  const router = useRouter()
  const [data, setData] = useState<VandaagData | null>(null)
  const [isLaden, setIsLaden] = useState(true)
  const [fout, setFout] = useState<string | null>(null)
  const laadRef = useRef(false)

  const { dag, datum } = formatDatum()

  useEffect(() => {
    if (laadRef.current) return
    laadRef.current = true

    async function laadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.replace('/login')
          return
        }

        const res = await authFetch('/api/vandaag')
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setFout(json.error ?? 'Er ging iets mis bij het laden.')
          return
        }

        const json: VandaagData = await res.json()
        setData(json)
      } catch (e) {
        setFout('Verbindingsfout. Probeer het opnieuw.')
      } finally {
        setIsLaden(false)
      }
    }

    laadData()
  }, [router])

  // ── Laden ──────────────────────────────────────────────────────────────────

  if (isLaden) {
    return (
      <>
        <Navbar />
        <main
          style={{
            minHeight: '100vh',
            background: 'var(--bg-app)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--mf-green)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Je dag wordt geladen…</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </main>
      </>
    )
  }

  // ── Fout ───────────────────────────────────────────────────────────────────

  if (fout || !data) {
    return (
      <>
        <Navbar />
        <main
          style={{
            minHeight: '100vh',
            background: 'var(--bg-app)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 28px',
              maxWidth: 400,
              textAlign: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <p style={{ fontSize: 32, margin: '0 0 12px' }}>😕</p>
            <p style={{ color: 'var(--text-2)', fontSize: 15, margin: '0 0 20px' }}>
              {fout ?? 'Kon de data niet laden.'}
            </p>
            <button
              type="button"
              onClick={() => { setFout(null); setIsLaden(true); laadRef.current = false }}
              style={{
                padding: '10px 24px',
                background: 'var(--mf-green)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-btn)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Opnieuw proberen
            </button>
          </div>
        </main>
      </>
    )
  }

  const { checklist, scores, suggestie } = data

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <main
        className="mf-mesh-bg"
        style={{
          minHeight: '100vh',
          background: 'var(--bg-app)',
          paddingBottom: 48,
        }}
      >
          <div
            style={{
              maxWidth: 900,
              margin: '0 auto',
              padding: '0 16px',
            }}
          >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <header style={{ padding: '32px 0 24px' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--mf-green)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {dag}
              </p>
              <h1
                style={{
                  margin: '4px 0 4px',
                  fontSize: 28,
                  fontWeight: 800,
                  color: 'var(--text-1)',
                  lineHeight: 1.2,
                }}
              >
                {datum}
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)' }}>
                Hier is je dag op een rij
              </p>
            </header>

            {/* ── Voltooiing banner ───────────────────────────────────────── */}
            {scores.score_pct === 100 && (
              <section
                style={{
                  background: 'linear-gradient(135deg, #052e16 0%, #14532d 60%, #166534 100%)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '20px 24px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: '0 8px 32px rgba(29,158,117,0.35)',
                }}
              >
                <span style={{ fontSize: 36, flexShrink: 0 }}>🎉</span>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                    Perfecte dag! Alle taken gedaan.
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
                    Elke dag dat je bijhoudt, investeer je in je eigen welzijn.
                  </p>
                </div>
              </section>
            )}
            {scores.score_pct >= 80 && scores.score_pct < 100 && (
              <section
                style={{
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 60%, #D1FAE5 100%)',
                  border: '1.5px solid rgba(29,158,117,0.3)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 4px 16px rgba(29,158,117,0.12)',
                }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>⭐</span>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--mf-green-dark)', marginBottom: 2 }}>
                    Bijna perfect! Je bent bijna klaar.
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--mf-green-dark)', lineHeight: 1.4 }}>
                    Nog een paar stappen en je dag is compleet.
                  </p>
                </div>
              </section>
            )}

            {/* ── 2-kolom layout ─────────────────────────────────────────── */}
            <div className="mf-home-layout" style={{ marginBottom: 48 }}>

              {/* Linker kolom: checklist + nudge */}
              <div>
                <section style={{ marginBottom: 20 }}>
                  <h2 style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    margin: '0 0 12px',
                  }}>
                    Jouw dag
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {checklist.map(taak => (
                      <TaakKaart
                        key={taak.id}
                        taak={taak}
                        onClick={() => router.push(taak.url)}
                      />
                    ))}
                  </div>
                </section>

                <MomentumNudge checklist={checklist} />
                <DagdeelSuggestie suggestie={suggestie} />
              </div>

              {/* Rechter kolom: voortgang + metrics */}
              <div>
                {/* Voortgang ring */}
                <section
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '28px 24px',
                    marginBottom: 16,
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      position: 'absolute',
                      width: 160,
                      height: 160,
                      borderRadius: '50%',
                      background: scores.score_pct >= 80
                        ? 'radial-gradient(circle, rgba(29,158,117,0.18) 0%, transparent 70%)'
                        : scores.score_pct >= 50
                        ? 'radial-gradient(circle, rgba(186,117,23,0.18) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(226,75,74,0.15) 0%, transparent 70%)',
                    }} />
                    <ProgressRing pct={scores.score_pct} />
                  </div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
                    {scores.gedaan} van {scores.totaal} gedaan
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
                    {scores.gedaan === scores.totaal
                      ? 'Je hebt alles afgerond vandaag! 🎉'
                      : `Nog ${scores.totaal - scores.gedaan} te doen`}
                  </p>
                </section>

                {/* Dag-metrics */}
                {(scores.water_ml > 0 || scores.slaap_uren || scores.stemming_waarde || scores.focus_minuten > 0) && (
                  <section>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {[
                        {
                          icoon: '💧',
                          waarde: scores.water_ml > 0 ? `${Math.round(scores.water_ml / 250)}` : '—',
                          sub: scores.water_ml > 0 ? `/${Math.round(scores.water_doel_ml / 250)} glazen` : 'glazen',
                          kleur: scores.water_ml >= scores.water_doel_ml ? 'var(--mf-blue)' : 'var(--text-3)',
                        },
                        {
                          icoon: '😴',
                          waarde: scores.slaap_uren ? `${scores.slaap_uren}u` : '—',
                          sub: 'slaap',
                          kleur: scores.slaap_uren && scores.slaap_uren >= 7 ? 'var(--mf-green)' : scores.slaap_uren ? 'var(--mf-amber)' : 'var(--text-3)',
                        },
                        {
                          icoon: ['😫','😔','😐','🙂','😄'][scores.stemming_waarde ? scores.stemming_waarde - 1 : 2],
                          waarde: scores.stemming_waarde ? `${scores.stemming_waarde}/5` : '—',
                          sub: 'stemming',
                          kleur: scores.stemming_waarde && scores.stemming_waarde >= 4 ? 'var(--mf-green)' : scores.stemming_waarde && scores.stemming_waarde <= 2 ? 'var(--mf-red)' : 'var(--text-3)',
                        },
                        {
                          icoon: '🎯',
                          waarde: scores.focus_minuten > 0 ? `${scores.focus_minuten}m` : '—',
                          sub: 'focus',
                          kleur: scores.focus_minuten >= 25 ? 'var(--mf-green)' : 'var(--text-3)',
                        },
                      ].map((m, i) => (
                        <div key={i} style={{
                          background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)', padding: '14px 12px',
                          textAlign: 'center', boxShadow: 'var(--shadow-xs)',
                        }}>
                          <div style={{ fontSize: 20, marginBottom: 6 }}>{m.icoon}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: m.kleur, lineHeight: 1 }}>{m.waarde}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.sub}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
      </main>
    </>
  )
}
