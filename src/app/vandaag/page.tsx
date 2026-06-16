'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

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
  if (pct >= 40) return '#F59E0B'
  return 'var(--mf-red)'
}

function dagdeel(): 'ochtend' | 'middag' | 'avond' {
  const uur = new Date().getHours()
  if (uur < 12) return 'ochtend'
  if (uur < 18) return 'middag'
  return 'avond'
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
        background: gedaan ? '#F0FBF6' : hovered ? 'var(--bg-subtle)' : 'var(--bg-card)',
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
  const deel = dagdeel()
  const items: Array<{ label: string; actief: boolean; beschrijving: string }> = [
    {
      label: '🌅 Ochtend',
      actief: deel === 'ochtend',
      beschrijving: 'Slaap, water & stemming',
    },
    {
      label: '☀️ Middag',
      actief: deel === 'middag',
      beschrijving: 'Meditatie & focus',
    },
    {
      label: '🌙 Avond',
      actief: deel === 'avond',
      beschrijving: 'Dankbaarheid & check-in',
    },
  ]

  return (
    <section style={{ marginTop: 8 }}>
      <h2
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: '0 0 12px',
        }}
      >
        Jouw dag
      </h2>

      {/* Tijdlijn */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              flex: '1 1 0',
              minWidth: 100,
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: item.actief ? 'var(--mf-green-light)' : 'var(--bg-card)',
              border: item.actief
                ? '1px solid rgba(29, 158, 117, 0.3)'
                : '1px solid var(--border)',
              opacity: item.actief ? 1 : 0.65,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 600,
                color: item.actief ? 'var(--mf-green-dark)' : 'var(--text-2)',
              }}
            >
              {item.label}
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11,
                color: item.actief ? 'var(--mf-green)' : 'var(--text-4)',
              }}
            >
              {item.beschrijving}
            </p>
          </div>
        ))}
      </div>

      {/* Suggestie */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '12px 14px',
          background: 'var(--mf-green-light)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(29, 158, 117, 0.2)',
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--mf-green-dark)', lineHeight: 1.5 }}>
          {suggestie}
        </p>
      </div>
    </section>
  )
}

// ─── Voortgangsbalk Component ─────────────────────────────────────────────────

function VoortgangsBalk({ pct }: { pct: number }) {
  const kleur = ringKleur(pct)
  return (
    <div
      style={{
        padding: '14px 16px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>
          Je bent{' '}
          <strong style={{ color: kleur }}>{pct}%</strong> compleet met je welzijnsroutine vandaag
        </p>
        <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', marginLeft: 8 }}>
          {pct >= 70 ? 'Uitstekend!' : pct >= 40 ? 'Goed bezig' : 'Kom op!'}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: 'var(--bg-subtle)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: kleur,
            borderRadius: 99,
            transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>
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
        style={{
          minHeight: '100vh',
          background: 'var(--bg-app)',
          paddingBottom: 48,
        }}
      >
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto',
            padding: '0 16px',
          }}
        >
          {/* ── Header ───────────────────────────────────────────────────── */}
          <header style={{ padding: '32px 0 24px' }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--mf-green)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {dag}
            </p>
            <h1
              style={{
                margin: '4px 0 6px',
                fontSize: 26,
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

          {/* ── Voortgang ring + teller ───────────────────────────────────── */}
          <section
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 24px',
              marginBottom: 20,
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <ProgressRing pct={scores.score_pct} />

            <p
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-1)',
              }}
            >
              {scores.gedaan} van {scores.totaal} gedaan
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
              {scores.gedaan === scores.totaal
                ? 'Je hebt alles afgerond vandaag! 🎉'
                : `Nog ${scores.totaal - scores.gedaan} te doen`}
            </p>
          </section>

          {/* ── Checklist ────────────────────────────────────────────────── */}
          <section style={{ marginBottom: 20 }}>
            <h2
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 12px',
              }}
            >
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

          {/* ── Dagdeel suggestie ─────────────────────────────────────────── */}
          <DagdeelSuggestie suggestie={suggestie} />

          {/* ── Voortgangsbalk ────────────────────────────────────────────── */}
          <div style={{ marginTop: 20 }}>
            <VoortgangsBalk pct={scores.score_pct} />
          </div>
        </div>
      </main>
    </>
  )
}
