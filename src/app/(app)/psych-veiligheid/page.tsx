'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { useToast } from '@/components/ui/Toast'
import { vitaEvent } from '@/lib/vita/events'
import { Shield, Check } from 'lucide-react'


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
  const { toast } = useToast()
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
        vitaEvent('data_logged', { kind: 'psych-veiligheid' })
        setSucces(true)
        setTimeout(() => setSucces(false), 2500)
      } else {
        toast({ title: 'Meting niet opgeslagen', description: 'Probeer het opnieuw.', variant: 'error' })
      }
    } catch {
      toast({ title: 'Meting niet opgeslagen', description: 'Probeer het opnieuw.', variant: 'error' })
    }
    setOpslaan(false)
  }

  const gemiddeld = metingen.length > 0
    ? (metingen.slice(0, 4).reduce((s, m) => s + m.score, 0) / Math.min(4, metingen.length)).toFixed(1)
    : null

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" role="status" aria-label="Metingen laden" />
      </div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--mf-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                <Shield size={22} strokeWidth={2} color="var(--mf-blue)" aria-hidden="true" />
              </div>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 2 }}>
                Psychologische veiligheid
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                Hoe veilig voelt het om jezelf te zijn op je werk? · Wekelijkse meting
              </p>
            </div>
          </div>
          {gemiddeld && (
            <p style={{ fontSize: 14, fontWeight: 700, color: Number(gemiddeld) >= 4 ? 'var(--mf-green)' : Number(gemiddeld) >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)', marginTop: 6 }}>
              Gemiddeld de afgelopen maand: {gemiddeld}/5
            </p>
          )}
        </header>

        <section style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '20px', border: '1px solid var(--border)', marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 20, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
            Psychologische veiligheid is de mate waarin medewerkers zich vrij voelen om risico&apos;s te nemen zonder bang te zijn voor vernedering of afwijzing.
          </p>

          {VRAGEN.map(v => (
            <fieldset key={v.key} style={{ marginBottom: 20, border: 'none', padding: 0, margin: '0 0 20px' }}>
              <legend style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2, padding: 0 }}>{v.label}</legend>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{v.beschrijving}</p>
              <div role="radiogroup" aria-label={v.label} style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => {
                  const kleur = n >= 4 ? 'var(--mf-green)' : n === 3 ? 'var(--mf-amber)' : 'var(--mf-red)'
                  const gekozen = scores[v.key] === n
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={gekozen}
                      aria-label={`${v.label}: ${n} van 5`}
                      onClick={() => setScores(prev => ({ ...prev, [v.key]: n }))}
                      style={{
                        flex: 1, minHeight: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: gekozen ? kleur : 'var(--bg-subtle)',
                        color: gekozen ? 'var(--bg-app)' : 'var(--text-3)',
                        fontWeight: 700, fontSize: 13,
                        transition: 'background 0.15s var(--ease), transform 0.15s var(--ease)',
                        transform: gekozen ? 'scale(1)' : 'scale(0.98)',
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
            </fieldset>
          ))}

          <button
            type="button"
            onClick={slaOp}
            disabled={opslaan || Object.values(scores).some(v => v === 0)}
            aria-live="polite"
            style={{
              width: '100%', minHeight: 44, padding: '12px', borderRadius: 12,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'var(--mentaforce-primary)',
              color: 'var(--bg-app)',
              border: 'none', cursor: opslaan || Object.values(scores).some(v => v === 0) ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700,
              opacity: opslaan || Object.values(scores).some(v => v === 0) ? 0.5 : 1,
              transition: 'background 0.3s var(--ease), opacity 0.3s var(--ease)',
            }}
          >
            {succes ? (
              <>
                <Check size={16} strokeWidth={2.5} aria-hidden="true" /> Opgeslagen!
              </>
            ) : opslaan ? 'Opslaan…' : 'Meting opslaan'}
          </button>
        </section>

        {metingen.length > 1 && (
          <section>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 12 }}>
              Verloop
            </p>

            {/* Sparkline trend */}
            {(() => {
              const recente = [...metingen].reverse().slice(-8)
              if (recente.length < 2) return null
              const W = 320, H = 44, pad = 8
              const n = recente.length
              const punten = recente.map((m, i) => ({
                x: pad + (i / (n - 1)) * (W - pad * 2),
                y: H - pad - ((m.score - 1) / 4) * (H - pad * 2),
                kleur: m.score >= 4 ? 'var(--mf-green)' : m.score >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)',
                score: m.score,
              }))
              const lijn = punten.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
              return (
                <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid var(--border)' }}>
                  <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Verloop van je scores over de laatste ${recente.length} metingen, van ${recente[0].score}/5 naar ${recente[recente.length - 1].score}/5`} style={{ width: '100%', height: H, display: 'block' }}>
                    <path d={lijn} fill="none" stroke="var(--mf-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {punten.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="4" fill={p.kleur} />
                    ))}
                  </svg>
                </div>
              )
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {metingen.map(m => (
                <div key={m.week_start} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
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

