'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { supabase } from '@/lib/supabase'

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

function motivatieTekst(streak: number): string {
  if (streak === 0) return 'Begin vandaag — elke grote reis start met één stap.'
  if (streak < 3) return 'Goed begin! Houd dit vast.'
  if (streak < 7) return 'Je bouwt momentum op. Zo doe je dat!'
  if (streak < 14) return 'Een week of meer — indrukwekkend!'
  if (streak < 30) return 'Je bent een gewoonte aan het vormen. Echt gaaf!'
  if (streak < 60) return 'Een maand of langer — je bent een doorzetteraar!'
  if (streak < 100) return 'Bijna 100 dagen. Legendair bezig!'
  return 'Je bent een absolute kampioen. Geen woorden voor.'
}

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
      const { data: { session } } = await supabase.auth.getSession()
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
      <Navbar />
      <main
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: '20px 20px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#111827',
            margin: '0 0 24px',
          }}
        >
          Jouw streak
        </h1>

        {laden && (
          <p style={{ color: '#6B7280', textAlign: 'center', marginTop: 60 }}>
            Laden…
          </p>
        )}

        {fout && (
          <p style={{ color: '#DC2626', textAlign: 'center', marginTop: 40 }}>
            {fout}
          </p>
        )}

        {data && (
          <>
            {/* Streak Hero */}
            <div
              style={{
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                border: '2px solid #FED7AA',
                borderRadius: 20,
                padding: '32px 24px',
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              <style>{`
                @keyframes vlamSchommelen {
                  0%, 100% { transform: rotate(-6deg) scale(1); }
                  50% { transform: rotate(6deg) scale(1.1); }
                }
              `}</style>
              <div
                style={{
                  fontSize: 64,
                  display: 'inline-block',
                  animation: 'vlamSchommelen 1.6s ease-in-out infinite',
                  marginBottom: 12,
                }}
                aria-hidden="true"
              >
                🔥
              </div>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 800,
                  color: '#EA580C',
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {data.streak}
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: '#9A3412',
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                dagen op rij
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: '#C2410C',
                  fontStyle: 'italic',
                }}
              >
                {motivatieTekst(data.streak)}
              </div>
            </div>

            {/* Drie stat kaartjes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 10,
                marginBottom: 24,
              }}
            >
              {[
                { label: 'Huidige streak', waarde: `${data.streak}d`, kleur: '#EA580C' },
                { label: 'Deze maand', waarde: `${data.maand_pct}%`, kleur: '#7C3AED' },
                { label: 'Totaal actief', waarde: `${data.totaal_actief}d`, kleur: '#1D9E75' },
              ].map(({ label, waarde, kleur }) => (
                <div
                  key={label}
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: '14px 8px',
                    textAlign: 'center',
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
                      color: '#6B7280',
                      marginTop: 4,
                      lineHeight: 1.3,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* 90-dag heatmap */}
            <div
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                padding: '20px 16px',
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#374151',
                  margin: '0 0 12px',
                }}
              >
                Afgelopen 90 dagen
              </h2>

              {/* Dag-van-week labels */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: 'repeat(7, 15px)',
                  gridAutoFlow: 'column',
                  gridAutoColumns: '15px',
                  gap: 3,
                  overflowX: 'auto',
                }}
              >
                {data.kalender.map(({ datum, actief }) => {
                  const isVandaag = datum === vandaag
                  return (
                    <div
                      key={datum}
                      title={datum}
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: 3,
                        background: actief ? '#1D9E75' : '#F3F4F6',
                        border: isVandaag ? '2px solid #111827' : '1px solid transparent',
                        boxSizing: 'border-box',
                        cursor: 'default',
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
                  marginTop: 10,
                  fontSize: 11,
                  color: '#9CA3AF',
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                  }}
                />
                <span>Niet actief</span>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: '#1D9E75',
                    marginLeft: 8,
                  }}
                />
                <span>Actief</span>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: '#F3F4F6',
                    border: '2px solid #111827',
                    marginLeft: 8,
                    boxSizing: 'border-box',
                  }}
                />
                <span>Vandaag</span>
              </div>
            </div>

            {/* Vandaag sectie */}
            {data.actief_vandaag ? (
              <div
                style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: 14,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 28 }}>✅</span>
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#065F46',
                    }}
                  >
                    Streak veilig!
                  </div>
                  <div style={{ fontSize: 13, color: '#047857', marginTop: 2 }}>
                    Je hebt vandaag al iets geregistreerd. Goed bezig!
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  borderRadius: 14,
                  padding: '16px 20px',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#92400E',
                    marginBottom: 12,
                  }}
                >
                  Je hebt vandaag nog niets geregistreerd — houd je streak in stand!
                </div>
                <a
                  href="/vandaag"
                  style={{
                    display: 'block',
                    background: '#EA580C',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    textAlign: 'center',
                    padding: '14px 24px',
                    borderRadius: 10,
                    textDecoration: 'none',
                  }}
                >
                  Houd je streak in stand →
                </a>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
