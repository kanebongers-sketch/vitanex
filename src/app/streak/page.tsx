'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { supabase } from '@/lib/supabase'
import nextDynamic from 'next/dynamic'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

interface KalenderDag {
  datum: string
  actief: boolean
}

interface StreakData {
  streak: number
  totaal_actief: number
  maand_pct: number
  kalender: KalenderDag[]
  actief_vandaag: boolean
}

function motivatieTekst(streak: number, totaalActief: number): { tekst: string; subtekst: string } {
  if (streak === 0 && totaalActief > 0)
    return {
      tekst: 'Nieuwe start 💪',
      subtekst: `Je hebt al ${totaalActief} actieve dagen opgebouwd. Die tellen altijd.`,
    }
  if (streak === 0)
    return {
      tekst: 'Dag 1 begint nu',
      subtekst: 'Elke grote gewoonte begint met één beslissing.',
    }
  if (streak < 7)
    return {
      tekst: 'Goed bezig!',
      subtekst: `${7 - streak} dag${7 - streak !== 1 ? 'en' : ''} te gaan voor je eerste badge.`,
    }
  if (streak < 30)
    return {
      tekst: 'Indrukwekkend!',
      subtekst: 'Je bent een echte gewoonte aan het opbouwen.',
    }
  return {
    tekst: 'Legende!',
    subtekst: 'Discipline die de meeste mensen niet bereiken.',
  }
}

interface Badge {
  doel: number
  label: string
  emoji: string
  kleur: string
  achtergrond: string
  rand: string
}

const BADGES: Badge[] = [
  {
    doel: 7,
    label: '7 dagen',
    emoji: '🌱',
    kleur: 'var(--mf-green)',
    achtergrond: 'var(--mf-green-light)',
    rand: 'rgba(29,158,117,0.3)',
  },
  {
    doel: 30,
    label: '30 dagen',
    emoji: '⚡',
    kleur: 'var(--mf-purple)',
    achtergrond: 'var(--mf-purple-light)',
    rand: 'rgba(139,92,246,0.3)',
  },
  {
    doel: 90,
    label: '90 dagen',
    emoji: '🏆',
    kleur: 'var(--mf-amber)',
    achtergrond: 'var(--mf-amber-light)',
    rand: 'rgba(186,117,23,0.3)',
  },
]

function vandaagStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function StreakPage() {
  const router = useRouter()
  const [data, setData] = useState<StreakData | null>(null)
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      try {
        const res = await authFetch('/api/streak')
        if (!res.ok) throw new Error('Kon streak niet ophalen.')
        const json: StreakData = await res.json()
        setData(json)
      } catch {
        setFout('Er ging iets mis bij het ophalen van je streak.')
      } finally {
        setLaden(false)
      }
    }

    void init()
  }, [router])

  const vandaag = vandaagStr()

  return (
    <>
      <style>{`
        @keyframes vlamSchommelen {
          0%, 100% { transform: rotate(-6deg) scale(1); }
          50%       { transform: rotate(6deg) scale(1.1); }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .streak-section {
          animation: fadein 0.4s var(--ease, cubic-bezier(0.16,1,0.3,1)) both;
        }
        .streak-section:nth-child(2) { animation-delay: 0.06s; }
        .streak-section:nth-child(3) { animation-delay: 0.12s; }
        .streak-section:nth-child(4) { animation-delay: 0.18s; }
        .streak-section:nth-child(5) { animation-delay: 0.24s; }
        .streak-section:nth-child(6) { animation-delay: 0.30s; }

        .dot-cell {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          box-sizing: border-box;
          cursor: default;
          transition: transform 0.12s ease;
        }
        .dot-cell:hover { transform: scale(1.35); }

        .badge-card {
          border-radius: var(--radius-md, 14px);
          border: 1.5px solid;
          padding: 16px 10px;
          text-align: center;
          transition: transform 0.15s var(--ease, ease), box-shadow 0.15s ease;
        }
        .badge-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .badge-card.locked { opacity: 0.42; filter: grayscale(0.6); }
      `}</style>

      <Navbar />

      <main
        className="mf-mesh-bg"
        style={{
          minHeight: '100vh',
          paddingBottom: 80,
        }}
      >
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto',
            padding: '24px 20px 0',
          }}
        >
          {/* Header */}
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--text-1, #0D1117)',
              margin: '0 0 20px',
              letterSpacing: '-0.5px',
            }}
          >
            Jouw streak
          </h1>

          {laden && (
            <p
              style={{
                color: 'var(--text-3, #6B7280)',
                textAlign: 'center',
                marginTop: 60,
              }}
            >
              Laden…
            </p>
          )}

          {fout && (
            <p
              style={{
                color: 'var(--mf-red, #E24B4A)',
                textAlign: 'center',
                marginTop: 40,
              }}
            >
              {fout}
            </p>
          )}

          {data && (
            <>
              {/* ── Streak Hero ──────────────────────────────── */}
              <div
                className="streak-section"
                style={{
                  background: 'linear-gradient(135deg, var(--mf-orange-light, #FFF7ED) 0%, var(--mf-orange-soft, #FFEDD5) 100%)',
                  border: '1.5px solid var(--mf-orange-border, #FED7AA)',
                  borderRadius: 'var(--radius-xl, 24px)',
                  padding: '32px 24px 28px',
                  textAlign: 'center',
                  marginBottom: 16,
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                  {/* 3D gloed achter de vlam */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 0 }}>
                    <GlowOrb
                      color={[0.949, 0.388, 0.047]}
                      intensity={Math.min(1, (data.streak || 1) / 30)}
                      size={120}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 64,
                      display: 'inline-block',
                      animation: 'vlamSchommelen 1.6s ease-in-out infinite',
                      position: 'relative',
                      zIndex: 1,
                    }}
                    aria-hidden="true"
                  >
                    🔥
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 96,
                    fontWeight: 900,
                    color: 'var(--mf-orange, #EA580C)',
                    lineHeight: 1,
                    marginBottom: 4,
                    letterSpacing: '-3px',
                    textShadow: '0 4px 20px rgba(234,88,12,0.25)',
                  }}
                >
                  {data.streak}
                </div>

                <div
                  style={{
                    fontSize: 16,
                    color: 'var(--mf-orange-dark, #9A3412)',
                    fontWeight: 700,
                    marginBottom: 14,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  dagen op rij
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.65)',
                    borderRadius: 'var(--radius-md, 14px)',
                    padding: '12px 16px',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.8)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--mf-orange-mid, #C2410C)',
                      marginBottom: 3,
                    }}
                  >
                    {motivatieTekst(data.streak, data.totaal_actief).tekst}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--mf-orange-dark, #9A3412)',
                    }}
                  >
                    {motivatieTekst(data.streak, data.totaal_actief).subtekst}
                  </div>
                </div>
              </div>

              {/* ── Stat kaartjes ──────────────────────────── */}
              <div
                className="streak-section"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {[
                  {
                    label: 'Huidige streak',
                    waarde: `${data.streak}d`,
                    kleur: 'var(--mf-orange, #EA580C)',
                  },
                  {
                    label: 'Deze maand',
                    waarde: `${data.maand_pct}%`,
                    kleur: 'var(--mf-purple, #8B5CF6)',
                  },
                  {
                    label: 'Totaal actief',
                    waarde: `${data.totaal_actief}d`,
                    kleur: 'var(--mf-green, #1D9E75)',
                  },
                ].map(({ label, waarde, kleur }) => (
                  <div
                    key={label}
                    style={{
                      background: 'var(--bg-card, #fff)',
                      border: '1px solid var(--border, rgba(0,0,0,0.07))',
                      borderRadius: 'var(--radius-md, 14px)',
                      padding: '14px 8px',
                      textAlign: 'center',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: kleur,
                        lineHeight: 1.1,
                      }}
                    >
                      {waarde}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-3, #6B7280)',
                        marginTop: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 90-dag heatmap ─────────────────────────── */}
              <div
                className="streak-section"
                style={{
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--border, rgba(0,0,0,0.07))',
                  borderRadius: 'var(--radius-card, 16px)',
                  padding: '20px 18px 16px',
                  marginBottom: 16,
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <h2
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-2, #374151)',
                    margin: '0 0 14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}
                >
                  Afgelopen 90 dagen
                </h2>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: 'repeat(7, 13px)',
                    gridAutoFlow: 'column',
                    gridAutoColumns: '13px',
                    gap: 4,
                    overflowX: 'auto',
                    paddingBottom: 4,
                  }}
                >
                  {data.kalender.map(({ datum, actief }) => {
                    const isVandaag = datum === vandaag
                    return (
                      <div
                        key={datum}
                        className="dot-cell"
                        title={datum}
                        style={{
                          background: actief
                            ? 'var(--mf-green, #1D9E75)'
                            : 'rgba(0,0,0,0.06)',
                          border: isVandaag
                            ? '2px solid var(--text-1, #0D1117)'
                            : '1.5px solid transparent',
                          boxShadow: actief
                            ? '0 0 0 1.5px rgba(29,158,117,0.18)'
                            : 'none',
                        }}
                      />
                    )
                  })}
                </div>

                {/* Legenda */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 12,
                    fontSize: 11,
                    color: 'var(--text-4, #9CA3AF)',
                  }}
                >
                  <div
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.08)',
                    }}
                  />
                  <span>Niet actief</span>
                  <div
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      background: 'var(--mf-green, #1D9E75)',
                      marginLeft: 8,
                    }}
                  />
                  <span>Actief</span>
                  <div
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.06)',
                      border: '2px solid var(--text-1, #0D1117)',
                      marginLeft: 8,
                      boxSizing: 'border-box',
                    }}
                  />
                  <span>Vandaag</span>
                </div>
              </div>

              {/* ── Streakdoelen / badges ──────────────────── */}
              <div
                className="streak-section"
                style={{
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--border, rgba(0,0,0,0.07))',
                  borderRadius: 'var(--radius-card, 16px)',
                  padding: '20px 18px',
                  marginBottom: 16,
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <h2
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-2, #374151)',
                    margin: '0 0 14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}
                >
                  Streakdoelen
                </h2>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 10,
                  }}
                >
                  {BADGES.map((badge) => {
                    const bereikt = data.streak >= badge.doel
                    return (
                      <div
                        key={badge.doel}
                        className={`badge-card${bereikt ? '' : ' locked'}`}
                        style={{
                          background: bereikt ? badge.achtergrond : 'var(--bg-subtle, #F9FAFB)',
                          borderColor: bereikt ? badge.rand : 'var(--border, rgba(0,0,0,0.07))',
                        }}
                      >
                        <div style={{ fontSize: 30, marginBottom: 6 }}>
                          {bereikt ? badge.emoji : '🔒'}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: bereikt ? badge.kleur : 'var(--text-3, #6B7280)',
                            lineHeight: 1.2,
                          }}
                        >
                          {badge.label}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: bereikt ? badge.kleur : 'var(--text-4, #9CA3AF)',
                            marginTop: 3,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {bereikt ? 'Behaald!' : `nog ${badge.doel - data.streak}d`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Jouw patronen link ────────────────────── */}
              <a
                href="/patronen"
                className="streak-section"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  marginBottom: 12,
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>🔬</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                      Wat werkt voor jou?
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      Bekijk je persoonlijke patronen en correlaties
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 18, color: 'var(--text-4)' }}>→</span>
              </a>

              {/* ── Vandaag sectie ─────────────────────────── */}
              {data.actief_vandaag ? (
                <div
                  className="streak-section"
                  style={{
                    background: 'var(--mf-green-light)',
                    border: '1.5px solid rgba(29,158,117,0.25)',
                    borderRadius: 'var(--radius-md, 14px)',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <span style={{ fontSize: 30 }}>✅</span>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--mf-green-dark, #0F6E56)',
                      }}
                    >
                      Streak veilig!
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--mf-green-mid, #15785A)',
                        marginTop: 2,
                      }}
                    >
                      Je hebt vandaag al iets geregistreerd. Goed bezig!
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="streak-section"
                  style={{
                    background: 'var(--mf-orange-light, #FFF7ED)',
                    border: '1.5px solid var(--mf-orange-border, #FED7AA)',
                    borderRadius: 'var(--radius-md, 14px)',
                    padding: '18px 20px',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--mf-orange-darker, #92400E)',
                      marginBottom: 14,
                    }}
                  >
                    Je hebt vandaag nog niets geregistreerd — houd je streak in stand!
                  </div>
                  <a
                    href="/vandaag"
                    style={{
                      display: 'block',
                      background: 'var(--mf-orange, #EA580C)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 15,
                      textAlign: 'center',
                      padding: '14px 24px',
                      borderRadius: 'var(--radius-btn, 10px)',
                      textDecoration: 'none',
                      boxShadow: '0 4px 16px rgba(234,88,12,0.35)',
                    }}
                  >
                    Houd je streak in stand →
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}
