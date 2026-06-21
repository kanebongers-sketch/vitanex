'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

const STEMMING_OPTIES = [
  { waarde: 1, emoji: '😫', label: 'Slecht',   kleur: 'var(--mf-red)',    achtergrond: 'var(--mf-red-light)'    },
  { waarde: 2, emoji: '😔', label: 'Matig',    kleur: 'var(--mf-orange)',          achtergrond: 'var(--mf-amber-light)'  },
  { waarde: 3, emoji: '😐', label: 'Neutraal', kleur: 'var(--text-3)',    achtergrond: 'var(--bg-subtle)'       },
  { waarde: 4, emoji: '🙂', label: 'Goed',     kleur: 'var(--mf-green)',  achtergrond: 'var(--mf-green-light)'  },
  { waarde: 5, emoji: '😄', label: 'Super!',   kleur: 'var(--mf-green-dark)', achtergrond: 'var(--mf-green-light)' },
]

const ENERGIE_OPTIES = [
  { waarde: 1, emoji: '🔋', label: 'Leeg'   },
  { waarde: 2, emoji: '🔋', label: 'Laag'   },
  { waarde: 3, emoji: '⚡', label: 'Normaal' },
  { waarde: 4, emoji: '⚡', label: 'Goed'    },
  { waarde: 5, emoji: '🚀', label: 'Vol!'    },
]

interface StemmingLog {
  id: string
  stemming: number
  energie: number | null
  emoji: string | null
  notitie: string | null
  aangemaakt_op: string
}

function stemmingKleur(s: number): string {
  if (s >= 4) return 'var(--mf-green)'
  if (s >= 3) return 'var(--mf-orange)'
  return 'var(--mf-red)'
}

export default function StemmingPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [logs, setLogs] = useState<StemmingLog[]>([])
  const [stemming, setStemming] = useState<number>(3)
  const [energie, setEnergie] = useState<number>(3)
  const [notitie, setNotitie] = useState('')
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/stemming?limit=10')
      if (res.ok) {
        const json = await res.json() as { logs: StemmingLog[] }
        setLogs(json.logs ?? [])
      }
      setLaden(false)
    }
    laad()
  }, [router])

  async function verstuur() {
    setOpslaan(true)
    try {
      const res = await authFetch('/api/stemming', {
        method: 'POST',
        body: JSON.stringify({
          stemming,
          energie,
          emoji: STEMMING_OPTIES.find(o => o.waarde === stemming)?.emoji,
          notitie: notitie || undefined,
        }),
      })
      if (res.ok) {
        const json = await res.json() as { log: StemmingLog }
        setLogs(prev => [json.log, ...prev.slice(0, 9)])
        setNotitie('')
        setSucces(true)
        setTimeout(() => router.push('/vandaag'), 1500)
      }
    } catch { /* stil falen */ }
    setOpslaan(false)
  }

  const geselecteerd = STEMMING_OPTIES.find(o => o.waarde === stemming)!

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        <header style={{ marginBottom: 28 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', margin: '0 0 4px' }}>
            {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
            Dagelijkse stemming
          </h1>
        </header>

        {succes && (
          <div style={{
            background: 'var(--mf-green-light)', border: '1px solid rgba(29,158,117,0.25)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: 'var(--mf-green-dark)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>✓</span> Stemming opgeslagen — goed bezig!
          </div>
        )}

        {/* Stemming hero card */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          padding: '24px 20px',
          marginBottom: 14,
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 18px' }}>
            Hoe voel je je nu?
          </p>

          {/* Grote emoji kiezer */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
            {STEMMING_OPTIES.map(o => (
              <button
                key={o.waarde}
                onClick={() => setStemming(o.waarde)}
                style={{
                  flex: 1,
                  height: 68,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: stemming === o.waarde ? o.achtergrond : 'var(--bg-subtle)',
                  border: stemming === o.waarde ? `2px solid ${o.kleur}` : '2px solid transparent',
                  fontSize: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  transition: 'all var(--transition-fast)',
                  transform: stemming === o.waarde ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                {o.emoji}
              </button>
            ))}
          </div>

          {/* Geselecteerd label */}
          <div style={{
            textAlign: 'center',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            background: geselecteerd.achtergrond,
          }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: geselecteerd.kleur }}>
              {geselecteerd.emoji} {geselecteerd.label}
            </p>
          </div>
        </section>

        {/* Energie */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          padding: '16px 20px',
          marginBottom: 14,
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 12px' }}>
            Energieniveau
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {ENERGIE_OPTIES.map(o => (
              <button
                key={o.waarde}
                onClick={() => setEnergie(o.waarde)}
                style={{
                  flex: 1,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '10px 4px 8px',
                  background: energie === o.waarde ? 'var(--mf-green)' : 'var(--bg-subtle)',
                  color: energie === o.waarde ? 'white' : 'var(--text-3)',
                  fontWeight: 600,
                  fontSize: 11,
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 18 }}>{o.emoji}</span>
                <span style={{ fontSize: 9, letterSpacing: '0.01em' }}>{o.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Notitie */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          padding: '14px 20px',
          marginBottom: 20,
        }}>
          <textarea
            value={notitie}
            onChange={e => setNotitie(e.target.value)}
            placeholder="Wat speelt er vandaag? (optioneel)"
            maxLength={150}
            rows={2}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 13,
              color: 'var(--text-2)',
              fontFamily: 'inherit',
              background: 'transparent',
              boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
          />
          {notitie.length > 100 && (
            <p style={{ fontSize: 10, color: 'var(--text-4)', textAlign: 'right', margin: '4px 0 0' }}>
              {notitie.length}/150
            </p>
          )}
        </section>

        <button
          onClick={verstuur}
          disabled={opslaan}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 32,
            background: opslaan ? 'var(--text-4)' : 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)',
            boxShadow: opslaan ? 'none' : '0 4px 16px rgba(29,158,117,0.35)',
            color: 'white',
            border: 'none',
            cursor: opslaan ? 'not-allowed' : 'pointer',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            transition: 'opacity var(--transition-fast)',
          }}
        >
          {opslaan ? 'Opslaan…' : 'Stemming loggen →'}
        </button>

        {/* Recente stemming */}
        {logs.length > 0 && (
          <>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', margin: '0 0 12px' }}>
              Recente check-ins
            </p>

            {/* Mini stemmingsgrafiek */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              padding: '16px 20px',
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 48 }}>
                {[...logs].reverse().map(log => {
                  const h = (log.stemming / 5) * 44
                  return (
                    <div key={log.id} title={STEMMING_OPTIES.find(o => o.waarde === log.stemming)?.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <div style={{
                        width: '60%',
                        borderRadius: 4,
                        height: h,
                        background: stemmingKleur(log.stemming),
                        opacity: 0.8,
                        transition: 'height 0.3s',
                      }} />
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 9, color: 'var(--text-4)' }}>Oudste</span>
                <span style={{ fontSize: 9, color: 'var(--text-4)' }}>Vandaag</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.slice(0, 7).map(log => (
                <div key={log.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xs)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>
                    {STEMMING_OPTIES.find(o => o.waarde === log.stemming)?.emoji ?? '😐'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: stemmingKleur(log.stemming), margin: 0 }}>
                      {STEMMING_OPTIES.find(o => o.waarde === log.stemming)?.label}
                      {log.energie ? <span style={{ fontWeight: 400, color: 'var(--text-4)', fontSize: 11 }}> · energie {log.energie}/5</span> : null}
                    </p>
                    {log.notitie && <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '2px 0 0' }}>{log.notitie}</p>}
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-4)', flexShrink: 0, margin: 0 }}>
                    {new Date(log.aangemaakt_op).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
