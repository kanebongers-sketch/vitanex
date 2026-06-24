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

const TERMIJN_KLEUR: Record<string, string> = { week: 'var(--mf-green)', maand: 'var(--mf-purple)', kwartaal: 'var(--mf-amber)' }
const DOMEIN_EMOJI: Record<string, string> = { slaap: '😴', stress: '🧘', energie: '⚡', focus: '🎯', balans: '⚖️', motivatie: '🔥' }

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
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Persoonlijk groeiplan
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-4)' }}>AI-gegenereerd op basis van jouw data</p>
          </div>
          {groeiplan && (
            <button onClick={genereerNieuwPlan} disabled={genereren} style={{
              background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 10,
              padding: '8px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              color: 'var(--text-2)',
            }}>
              {genereren ? '⏳' : '↺ Nieuw'}
            </button>
          )}
        </header>

        {!groeiplan && !genereren ? (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 24, padding: '40px 24px',
            textAlign: 'center', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.18) 0%, transparent 70%)' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
              Genereer jouw groeiplan
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-4)', lineHeight: 1.6, marginBottom: 24 }}>
              Op basis van je check-ins, DISC-profiel en burnout-data<br />maakt de AI een persoonlijk groeiplan voor jou.
            </p>
            <button onClick={genereerNieuwPlan} style={{
              background: 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)',
              color: 'white', border: 'none', borderRadius: 14,
              padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(29,158,117,0.35)',
            }}>
              Plan genereren →
            </button>
          </div>
        ) : genereren ? (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 24, padding: '40px 24px',
            textAlign: 'center', border: '1px solid var(--border)',
          }}>
            <div className="mf-spinner" style={{ margin: '0 auto 20px' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>AI analyseert jouw data…</p>
            <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 6 }}>Dit duurt 5-10 seconden</p>
          </div>
        ) : groeiplan ? (
          <>
            <p style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 20, textAlign: 'right' }}>
              Gegenereerd op {new Date(groeiplan.aangemaakt_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
            </p>

            {/* Doelen */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '18px', border: '1px solid var(--border)', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 12 }}>
                🎯 Mijn doelen
              </p>
              {(groeiplan.doelen ?? []).map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--mf-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: 'var(--mf-green)' }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{d}</p>
                </div>
              ))}
            </div>

            {/* Sterke punten + Aandachtspunten */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: 'var(--mf-green-light)', borderRadius: 16, padding: '16px', border: '1px solid var(--mf-green-mid)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mf-green-dark)', marginBottom: 10 }}>
                  💪 Sterk
                </p>
                {(groeiplan.sterke_punten ?? []).map((s, i) => (
                  <p key={i} style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.4 }}>• {s}</p>
                ))}
              </div>
              <div style={{ background: 'var(--mf-orange-light)', borderRadius: 16, padding: '16px', border: '1px solid var(--mf-orange-light)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mf-orange)', marginBottom: 10 }}>
                  🌱 Groeipunten
                </p>
                {(groeiplan.aandachtspunten ?? []).map((a, i) => (
                  <p key={i} style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.4 }}>• {a}</p>
                ))}
              </div>
            </div>

            {/* Acties — gegroepeerd per termijn */}
            {(() => {
              const TERMIJN_VOLGORDE = ['week', 'maand', 'kwartaal']
              const TERMIJN_LABELS: Record<string, string> = { week: 'Deze week', maand: 'Deze maand', kwartaal: 'Dit kwartaal' }
              const TERMIJN_ICONS: Record<string, string> = { week: '⚡', maand: '📅', kwartaal: '🗓️' }
              const groups = TERMIJN_VOLGORDE
                .map(t => ({ termijn: t, acties: (groeiplan.acties ?? []).filter(a => a.termijn === t) }))
                .filter(g => g.acties.length > 0)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {groups.map(g => {
                    const kleur = TERMIJN_KLEUR[g.termijn] ?? 'var(--text-3)'
                    return (
                      <div key={g.termijn} style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '18px', border: `1px solid ${kleur}25` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: kleur + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                            {TERMIJN_ICONS[g.termijn]}
                          </div>
                          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: kleur }}>
                            {TERMIJN_LABELS[g.termijn] ?? g.termijn}
                          </p>
                        </div>
                        {g.acties.map((a, i) => (
                          <div key={i} style={{
                            display: 'flex', gap: 12,
                            marginBottom: i < g.acties.length - 1 ? 10 : 0,
                            paddingBottom: i < g.acties.length - 1 ? 10 : 0,
                            borderBottom: i < g.acties.length - 1 ? '1px solid var(--bg-subtle)' : 'none',
                          }}>
                            <div style={{ fontSize: 18, flexShrink: 0 }}>{DOMEIN_EMOJI[a.domein] ?? '📌'}</div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4, lineHeight: 1.4 }}>{a.actie}</p>
                              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: kleur + '15', color: kleur, padding: '2px 7px', borderRadius: 99 }}>
                                {a.domein}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </>
        ) : null}
      </main>
    </div>
  )
}

