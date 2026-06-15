'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface Actie {
  actie: string
  domein: string
  termijn: string
}

interface Groeiplan {
  id: string
  periode_start: string
  doelen: string[]
  sterke_punten: string[]
  aandachtspunten: string[]
  acties: Actie[]
  aangemaakt_op: string
}

const TERMIJN_KLEUR: Record<string, string> = { week: '#1D9E75', maand: '#6366f1', kwartaal: '#F59E0B' }
const DOMEIN_EMOJI: Record<string, string> = { slaap: 'ðŸ˜´', stress: 'ðŸ§˜', energie: 'âš¡', focus: 'ðŸŽ¯', balans: 'âš–ï¸', motivatie: 'ðŸ”¥' }

export default function GroeiplanPagina() {
  const router = useRouter()
  const [groeiplan, setGroeiplan] = useState<Groeiplan | null>(null)
  const [laden, setLaden] = useState(true)
  const [genereren, setGenereren] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/groeiplan')
      if (res.ok) {
        const json = await res.json() as { groeiplan: Groeiplan | null }
        setGroeiplan(json.groeiplan)
      }
      setLaden(false)
    }
    laad()
  }, [router])

  async function genereerNieuwPlan() {
    setGenereren(true)
    try {
      const res = await authFetch('/api/groeiplan', { method: 'POST' })
      if (res.ok) {
        const json = await res.json() as { groeiplan: Groeiplan }
        setGroeiplan(json.groeiplan)
      }
    } catch { /* stil falen */ }
    setGenereren(false)
  }

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

        <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Persoonlijk groeiplan
            </h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>AI-gegenereerd op basis van jouw data</p>
          </div>
          {groeiplan && (
            <button onClick={genereerNieuwPlan} disabled={genereren} style={{
              background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10,
              padding: '8px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              color: '#374151',
            }}>
              {genereren ? 'â³' : 'â†º Nieuw'}
            </button>
          )}
        </header>

        {!groeiplan && !genereren ? (
          <div style={{
            background: 'white', borderRadius: 24, padding: '40px 24px',
            textAlign: 'center', border: '1px solid #E5E7EB',
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>ðŸŒ±</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Genereer jouw groeiplan
            </h2>
            <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 24 }}>
              Op basis van je check-ins, DISC-profiel en burnout-data<br />maakt de AI een persoonlijk groeiplan voor jou.
            </p>
            <button onClick={genereerNieuwPlan} style={{
              background: 'linear-gradient(135deg, #1D9E75, #0d7a5a)',
              color: 'white', border: 'none', borderRadius: 14,
              padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(29,158,117,0.35)',
            }}>
              Plan genereren â†’
            </button>
          </div>
        ) : genereren ? (
          <div style={{
            background: 'white', borderRadius: 24, padding: '40px 24px',
            textAlign: 'center', border: '1px solid #E5E7EB',
          }}>
            <div className="mf-spinner" style={{ margin: '0 auto 20px' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>AI analyseert jouw dataâ€¦</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>Dit duurt 5-10 seconden</p>
          </div>
        ) : groeiplan ? (
          <>
            <p style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 20, textAlign: 'right' }}>
              Gegenereerd op {new Date(groeiplan.aangemaakt_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
            </p>

            {/* Doelen */}
            <div style={{ background: 'white', borderRadius: 20, padding: '18px', border: '1px solid #E5E7EB', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
                ðŸŽ¯ Mijn doelen
              </p>
              {(groeiplan.doelen ?? []).map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: '#1D9E7515', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: '#1D9E75' }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{d}</p>
                </div>
              ))}
            </div>

            {/* Sterke punten + Aandachtspunten */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: '#F0FDF4', borderRadius: 16, padding: '16px', border: '1px solid #BBF7D0' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#15803D', marginBottom: 10 }}>
                  ðŸ’ª Sterk
                </p>
                {(groeiplan.sterke_punten ?? []).map((s, i) => (
                  <p key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 6, lineHeight: 1.4 }}>â€¢ {s}</p>
                ))}
              </div>
              <div style={{ background: '#FFF7ED', borderRadius: 16, padding: '16px', border: '1px solid #FED7AA' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C2410C', marginBottom: 10 }}>
                  ðŸŒ± Groeipunten
                </p>
                {(groeiplan.aandachtspunten ?? []).map((a, i) => (
                  <p key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 6, lineHeight: 1.4 }}>â€¢ {a}</p>
                ))}
              </div>
            </div>

            {/* Acties */}
            <div style={{ background: 'white', borderRadius: 20, padding: '18px', border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
                âœ… Concrete acties
              </p>
              {(groeiplan.acties ?? []).map((a, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, marginBottom: i < (groeiplan.acties?.length ?? 0) - 1 ? 12 : 0,
                  paddingBottom: i < (groeiplan.acties?.length ?? 0) - 1 ? 12 : 0,
                  borderBottom: i < (groeiplan.acties?.length ?? 0) - 1 ? '1px solid #F3F4F6' : 'none',
                }}>
                  <div style={{ fontSize: 18, flexShrink: 0 }}>
                    {DOMEIN_EMOJI[a.domein] ?? 'ðŸ“Œ'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4, lineHeight: 1.4 }}>{a.actie}</p>
                    <span style={{
                      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                      background: (TERMIJN_KLEUR[a.termijn] ?? '#9CA3AF') + '15',
                      color: TERMIJN_KLEUR[a.termijn] ?? '#9CA3AF',
                      padding: '2px 7px', borderRadius: 99,
                    }}>
                      {a.termijn} Â· {a.domein}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}

