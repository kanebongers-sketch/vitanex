'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface Meting {
  week_start: string
  vrijheid_spreken: number
  fouten_ok: number
  idee_delen: number
  score: number
}

const VRAGEN = [
  { key: 'vrijheid_spreken', label: 'Vrijheid van spreken', beschrijving: 'Ik voel me vrij om mijn mening te geven, ook als dat afwijkt.' },
  { key: 'fouten_ok', label: 'Fouten zijn OK', beschrijving: 'Ik durf fouten toe te geven zonder bang te zijn voor de gevolgen.' },
  { key: 'idee_delen', label: 'Ideeën delen', beschrijving: 'Ik deel nieuwe ideeën zonder me te schamen als ze niet perfect zijn.' },
]

export default function PsychVeiligheidPagina() {
  const router = useRouter()
  const [metingen, setMetingen] = useState<Meting[]>([])
  const [scores, setScores] = useState<Record<string, number>>({ vrijheid_spreken: 0, fouten_ok: 0, idee_delen: 0 })
  const [laden, setLaden] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      try {
        const res = await authFetch('/api/psych-veiligheid')
        if (res.ok) {
          const json = await res.json() as { metingen: Meting[] }
          setMetingen(json.metingen ?? [])
          const recent = json.metingen?.[0]
          if (recent) {
            setScores({ vrijheid_spreken: recent.vrijheid_spreken, fouten_ok: recent.fouten_ok, idee_delen: recent.idee_delen })
          }
        }
      } catch { /* niet-kritiek */ }
      setLaden(false)
    }
    laad()
  }, [router])

  async function slaOp() {
    if (Object.values(scores).some(v => v === 0)) return
    setOpslaan(true)
    try {
      const res = await authFetch('/api/psych-veiligheid', { method: 'POST', body: JSON.stringify(scores) })
      if (res.ok) {
        const json = await res.json() as { meting: Meting }
        setMetingen(prev => [json.meting, ...prev.filter(m => m.week_start !== json.meting.week_start)])
        setSucces(true)
        setTimeout(() => setSucces(false), 2500)
      }
    } catch { /* stil falen */ }
    setOpslaan(false)
  }

  const gemiddeld = metingen.length > 0
    ? (metingen.slice(0, 4).reduce((s, m) => s + m.score, 0) / Math.min(4, metingen.length)).toFixed(1)
    : null

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1, #111827)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Psychologische veiligheid
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3, #9CA3AF)', lineHeight: 1.5 }}>
            Hoe veilig voelt het om jezelf te zijn op je werk? · Wekelijkse meting
          </p>
          {gemiddeld && (
            <p style={{ fontSize: 14, fontWeight: 700, color: Number(gemiddeld) >= 4 ? 'var(--mf-green)' : Number(gemiddeld) >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)', marginTop: 6 }}>
              Gemiddeld de afgelopen maand: {gemiddeld}/5
            </p>
          )}
        </header>

        <section style={{ background: 'var(--surface-1, white)', borderRadius: 20, padding: '20px', border: '1px solid var(--border, #E5E7EB)', marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text-2, #6B7280)', lineHeight: 1.5, marginBottom: 20, padding: '10px 14px', background: 'var(--surface-2, #F9FAFB)', borderRadius: 10 }}>
            Psychologische veiligheid is de mate waarin medewerkers zich vrij voelen om risico&apos;s te nemen zonder bang te zijn voor vernedering of afwijzing.
          </p>

          {VRAGEN.map(v => (
            <div key={v.key} style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1, #111827)', marginBottom: 2 }}>{v.label}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3, #9CA3AF)', marginBottom: 8 }}>{v.beschrijving}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => {
                  const kleur = n >= 4 ? 'var(--mf-green)' : n === 3 ? 'var(--mf-amber)' : 'var(--mf-red)'
                  return (
                    <button
                      key={n}
                      onClick={() => setScores(prev => ({ ...prev, [v.key]: n }))}
                      style={{
                        flex: 1, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: scores[v.key] === n ? kleur : 'var(--surface-2, #F3F4F6)',
                        color: scores[v.key] === n ? 'white' : 'var(--text-3, #9CA3AF)',
                        fontWeight: 700, fontSize: 13,
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ fontSize: 9, color: 'var(--text-3)' }}>Zelden</span>
                <span style={{ fontSize: 9, color: 'var(--text-3)' }}>Altijd</span>
              </div>
            </div>
          ))}

          <button
            onClick={slaOp}
            disabled={opslaan || Object.values(scores).some(v => v === 0)}
            style={{
              width: '100%', padding: '12px', borderRadius: 12,
              background: succes
                ? 'var(--mf-green, #1D9E75)'
                : 'linear-gradient(135deg, var(--mf-green, #1D9E75) 0%, var(--mf-green-dark, #0F6E56) 100%)',
              color: 'white',
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
              opacity: opslaan || Object.values(scores).some(v => v === 0) ? 0.5 : 1,
              transition: 'background 0.3s ease',
            }}
          >
            {succes ? '✓ Opgeslagen!' : opslaan ? 'Opslaan…' : 'Meting opslaan'}
          </button>
        </section>

        {metingen.length > 1 && (
          <section>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 12 }}>
              Verloop
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {metingen.map(m => (
                <div key={m.week_start} style={{ background: 'var(--surface-1, white)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border, #E5E7EB)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-2, #6B7280)' }}>
                    Week {new Date(m.week_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  </p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[m.vrijheid_spreken, m.fouten_ok, m.idee_delen].map((s, i) => (
                        <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: s >= 4 ? 'var(--mf-green-light)' : s >= 3 ? 'var(--mf-amber-light)' : 'var(--mf-red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: s >= 4 ? 'var(--mf-green)' : s >= 3 ? 'var(--mf-amber-dark)' : 'var(--mf-red)' }}>{s}</span>
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: m.score >= 4 ? 'var(--mf-green)' : m.score >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)' }}>
                      {m.score}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}

