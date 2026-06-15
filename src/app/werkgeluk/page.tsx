'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface Meting {
  week_start: string
  zingeving: number
  plezier: number
  verbinding: number
  groei: number
  werkgeluk_score: number
}

const DIMENSIES = [
  { key: 'zingeving', label: 'Zingeving', beschrijving: 'Heeft mijn werk betekenis?', kleur: '#7C3AED' },
  { key: 'plezier', label: 'Plezier', beschrijving: 'Geniet ik van wat ik doe?', kleur: '#059669' },
  { key: 'verbinding', label: 'Verbinding', beschrijving: 'Voel ik me verbonden met collega\'s?', kleur: '#185FA5' },
  { key: 'groei', label: 'Groei', beschrijving: 'Leer en ontwikkel ik mezelf?', kleur: '#B45309' },
]

export default function WerkgelukPagina() {
  const router = useRouter()
  const [metingen, setMetingen] = useState<Meting[]>([])
  const [scores, setScores] = useState<Record<string, number>>({ zingeving: 0, plezier: 0, verbinding: 0, groei: 0 })
  const [laden, setLaden] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      try {
        const res = await authFetch('/api/werkgeluk')
        if (res.ok) {
          const json = await res.json() as { metingen: Meting[] }
          setMetingen(json.metingen ?? [])
          const recent = json.metingen?.[0]
          if (recent) {
            setScores({ zingeving: recent.zingeving, plezier: recent.plezier, verbinding: recent.verbinding, groei: recent.groei })
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
      const res = await authFetch('/api/werkgeluk', { method: 'POST', body: JSON.stringify(scores) })
      if (res.ok) {
        const json = await res.json() as { meting: Meting }
        setMetingen(prev => [json.meting, ...prev.filter(m => m.week_start !== json.meting.week_start)])
        setSucces(true)
        setTimeout(() => setSucces(false), 2500)
      }
    } catch { /* stil falen */ }
    setOpslaan(false)
  }

  const gemiddeldScore = metingen.length > 0
    ? (metingen.slice(0, 4).reduce((s, m) => s + m.werkgeluk_score, 0) / Math.min(4, metingen.length)).toFixed(1)
    : null

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

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Werkgeluk
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>
            Hoe blij ben je met je werk deze week? Â· 4 dimensies Â· 1-5 schaal
          </p>
          {gemiddeldScore && (
            <p style={{ fontSize: 14, fontWeight: 700, color: '#059669', marginTop: 6 }}>
              Gemiddeld de afgelopen maand: {gemiddeldScore}/5
            </p>
          )}
        </header>

        {/* Invoer */}
        <section style={{ background: 'white', borderRadius: 20, padding: '20px', border: '1px solid #E5E7EB', marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 16 }}>
            Beoordeel deze week
          </p>

          {DIMENSIES.map(d => (
            <div key={d.key} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{d.label}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF' }}>{d.beschrijving}</p>
                </div>
                {scores[d.key] > 0 && (
                  <span style={{ fontSize: 16, fontWeight: 800, color: d.kleur }}>{scores[d.key]}/5</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setScores(prev => ({ ...prev, [d.key]: n }))}
                    style={{
                      flex: 1, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: scores[d.key] >= n ? d.kleur : '#F3F4F6',
                      color: scores[d.key] >= n ? 'white' : '#9CA3AF',
                      fontWeight: 700, fontSize: 13,
                      transition: 'background 0.15s ease, transform 0.1s ease',
                    }}
                    onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                    onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={slaOp}
            disabled={opslaan || Object.values(scores).some(v => v === 0)}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, marginTop: 4,
              background: succes ? '#1D9E75' : '#111827',
              color: 'white', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 700,
              opacity: opslaan || Object.values(scores).some(v => v === 0) ? 0.5 : 1,
              transition: 'background 0.3s ease',
            }}
          >
            {succes ? 'âœ“ Opgeslagen!' : opslaan ? 'Opslaanâ€¦' : 'Werkgeluk opslaan'}
          </button>
        </section>

        {/* Geschiedenis */}
        {metingen.length > 1 && (
          <section>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
              Geschiedenis
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {metingen.map(m => (
                <div key={m.week_start} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
                      Week van {new Date(m.week_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </p>
                    <span style={{ fontSize: 16, fontWeight: 800, color: m.werkgeluk_score >= 4 ? '#059669' : m.werkgeluk_score >= 3 ? '#F59E0B' : '#EF4444' }}>
                      {m.werkgeluk_score}/5
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {DIMENSIES.map(d => (
                      <div key={d.key} style={{ textAlign: 'center' }}>
                        <div style={{ height: 4, borderRadius: 9999, background: '#F3F4F6', marginBottom: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 9999, background: d.kleur, width: `${(m[d.key as keyof Meting] as number / 5) * 100}%` }} />
                        </div>
                        <p style={{ fontSize: 9, color: '#9CA3AF' }}>{d.label.slice(0, 6)}</p>
                      </div>
                    ))}
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

