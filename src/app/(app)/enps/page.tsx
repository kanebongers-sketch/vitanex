'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Frown, Meh, Smile, Laugh, type LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'


interface Meting {
  maand: string
  score: number
  reden: string | null
}

// Score-band → gezichtsuitdrukking (lucide), houdt de bestaande tekstlabels intact.
const SCORE_ICON = (score: number): LucideIcon =>
  score <= 3 ? Frown : score <= 6 ? Meh : score <= 8 ? Smile : Laugh

const CATEGORIE = (score: number) => score >= 9 ? 'Promoter' : score >= 7 ? 'Passief' : 'Detractor'
const CAT_KLEUR = (score: number) => score >= 9 ? 'var(--mf-green)' : score >= 7 ? 'var(--mf-amber)' : 'var(--mf-red)'

export default function ENPSPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [metingen, setMetingen] = useState<Meting[]>([])
  const [score, setScore] = useState<number | null>(null)
  const [reden, setReden] = useState('')
  const [verzenden, setVerzenden] = useState(false)
  const [klaar, setKlaar] = useState(false)
  const [alIngevuld, setAlIngevuld] = useState(false)
  const huidigeMaand = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/enps')
      if (res.ok) {
        const data = await res.json() as { metingen: Meting[] }
        setMetingen(data.metingen)
        setAlIngevuld(data.metingen.some(m => m.maand === huidigeMaand))
      }
      setLaden(false)
    })
  }, [router, huidigeMaand])

  async function verzend() {
    if (score === null || verzenden) return
    setVerzenden(true)
    try {
      const res = await authFetch('/api/enps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, reden: reden.trim() || undefined }),
      })
      if (res.ok) {
        setKlaar(true)
        const data = await authFetch('/api/enps')
        if (data.ok) setMetingen((await data.json() as { metingen: Meting[] }).metingen)
      }
    } finally {
      setVerzenden(false)
    }
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
      <main style={{ padding: '36px 40px 72px', maxWidth: 800, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 6 }}>
            Werkbetrokkenheid (eNPS)
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Hoe waarschijnlijk is het dat je dit bedrijf aanbeveelt als werkgever aan vrienden of familie?
          </p>
        </div>

        {(alIngevuld && !klaar) ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Al ingevuld deze maand</p>
            <p style={{ fontSize: 12, color: 'var(--text-4)' }}>Je eNPS voor {new Date(huidigeMaand + '-01').toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })} is al geregistreerd. Kom volgende maand terug.</p>
          </div>
        ) : klaar ? (
          <div style={{ background: 'var(--mf-green-light)', borderRadius: 16, border: '1px solid var(--mf-green-mid)', padding: '20px 22px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: 'var(--mf-green)' }}>
              <Check size={24} aria-hidden />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mf-green)' }}>Bedankt voor je eerlijke antwoord!</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Jouw respons is volledig anoniem verwerkt.</p>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: '28px 24px', marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, lineHeight: 1.4 }}>
              Op een schaal van 0 tot 10, hoe waarschijnlijk is het dat je dit bedrijf aanbeveelt?
            </p>

            {/* Score grid */}
            <div role="group" aria-label="Kies een score van 0 tot 10" style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              {Array.from({ length: 11 }, (_, i) => i).map(n => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  aria-label={`Score ${n} van 10`}
                  aria-pressed={score === n}
                  style={{
                    width: 48, height: 48, borderRadius: 12, fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', border: 'none',
                    background: score === n
                      ? CAT_KLEUR(n)
                      : 'var(--bg-subtle)',
                    color: score === n ? 'var(--bg-app)' : 'var(--text-2)',
                    transition: 'all 0.15s ease',
                  }}
                >{n}</button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 11, color: 'var(--mf-red)', fontWeight: 600 }}>0 — Helemaal niet</span>
              <span style={{ fontSize: 11, color: 'var(--mf-green)', fontWeight: 600 }}>10 — Absoluut</span>
            </div>

            {score !== null && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: `color-mix(in srgb, ${CAT_KLEUR(score)} 8%, transparent)` }}>
                  <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
                    </div>
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, color: CAT_KLEUR(score) }}>
                      {(() => { const Icon = SCORE_ICON(score); return <Icon size={24} aria-hidden /> })()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: CAT_KLEUR(score) }}>{CATEGORIE(score)}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {score >= 9 ? 'Enthousiaste ambassadeur voor het bedrijf.' : score >= 7 ? 'Tevreden, maar niet uitgesproken positief.' : 'Zou het bedrijf niet aanbevelen.'}
                    </p>
                  </div>
                </div>

                <label htmlFor="enps-reden" style={{ display: 'block', fontSize: 12, color: 'var(--text-4)', marginBottom: 6 }}>Optionele toelichting (anoniem)</label>
                <textarea
                  id="enps-reden"
                  rows={3}
                  value={reden}
                  onChange={e => setReden(e.target.value)}
                  placeholder="Wat is de voornaamste reden voor je score?"
                  style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.5, background: 'var(--bg-card)', color: 'var(--text-2)' }}
                />
              </div>
            )}

            <button
              onClick={verzend}
              disabled={score === null || verzenden}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                color: 'var(--bg-app)', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)',
                opacity: score === null || verzenden ? 0.4 : 1,
              }}
            >
              {verzenden ? 'Verzenden...' : 'Score indienen →'}
            </button>
          </div>
        )}

        {/* Historiek */}
        {metingen.length > 0 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: 12 }}>Mijn historiek</p>

            {/* Mini trend barchart */}
            {metingen.length >= 2 && (() => {
              const recente = [...metingen].reverse().slice(-6)
              const barH = 48
              const barW = 32
              const gap = 8
              const totalW = recente.length * (barW + gap) - gap
              return (
                <div style={{ marginBottom: 16, overflowX: 'auto' }}>
                  <svg role="img" aria-label="Trend van je laatste eNPS-scores" width={totalW} height={barH + 24} viewBox={`0 0 ${totalW} ${barH + 24}`} style={{ display: 'block' }}>
                    {recente.map((m, i) => {
                      const x = i * (barW + gap)
                      const h = Math.max(6, Math.round((m.score / 10) * barH))
                      const y = barH - h
                      const kleur = m.score >= 9 ? 'var(--mf-green)' : m.score >= 7 ? 'var(--mf-amber)' : 'var(--mf-red)'
                      const maandLabel = new Date(m.maand + '-01').toLocaleDateString('nl-NL', { month: 'short' }).slice(0, 3)
                      return (
                        <g key={m.maand}>
                          <rect x={x} y={y} width={barW} height={h} rx={5} fill={kleur} fillOpacity={0.85} />
                          <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={9} fontWeight="700" fill={kleur}>
                            {m.score}
                          </text>
                          <text x={x + barW / 2} y={barH + 16} textAnchor="middle" fontSize={8} fill="var(--text-4)">
                            {maandLabel}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {metingen.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8, borderBottom: i < metingen.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `color-mix(in srgb, ${CAT_KLEUR(m.score)} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CAT_KLEUR(m.score) }}>
                    {(() => { const Icon = SCORE_ICON(m.score); return <Icon size={18} aria-hidden /> })()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                      {new Date(m.maand + '-01').toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })}
                    </p>
                    {m.reden && <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{m.reden.slice(0, 60)}{m.reden.length > 60 ? '...' : ''}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: CAT_KLEUR(m.score) }}>{m.score}/10</p>
                    <p style={{ fontSize: 10, color: CAT_KLEUR(m.score) }}>{CATEGORIE(m.score)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
