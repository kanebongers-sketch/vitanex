'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Angry, Frown, Meh, Smile, Laugh, type LucideIcon } from 'lucide-react'
interface GeschiedenisItem {
  datum: string
  score: number
}

interface WerkgelukData {
  vandaag: { score: number; notitie: string | null } | null
  geschiedenis: GeschiedenisItem[]
  gemiddelde: number | null
}

function scoreKleur(score: number): string {
  if (score <= 2) return 'var(--mf-red)'
  if (score <= 4) return 'var(--mf-orange)'
  if (score <= 6) return 'var(--mf-amber)'
  if (score <= 8) return 'var(--mf-green)'
  return 'var(--mf-green)'
}

// Zelfde lucide-schaal als slaap/page.tsx — geen emoji als icoon.
function scoreIcoon(score: number): LucideIcon {
  if (score <= 2) return Angry
  if (score <= 4) return Frown
  if (score <= 6) return Meh
  if (score <= 8) return Smile
  return Laugh
}

function scoreLabel(score: number): string {
  if (score <= 2) return 'Heel slecht'
  if (score <= 4) return 'Niet zo goed'
  if (score <= 6) return 'Oké'
  if (score <= 8) return 'Goed'
  return 'Super!'
}

function Sparkline({ data }: { data: GeschiedenisItem[] }) {
  if (data.length < 2) return null

  const gesorteerd = [...data].sort((a, b) => a.datum.localeCompare(b.datum))
  const breedte = 320
  const hoogte = 60
  const padding = 8
  const n = gesorteerd.length

  const punten = gesorteerd.map((item, i) => {
    const x = padding + (i / (n - 1)) * (breedte - padding * 2)
    const y = hoogte - padding - ((item.score - 1) / 9) * (hoogte - padding * 2)
    return { x, y, score: item.score, datum: item.datum }
  })

  const lijn = punten
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const vulgebied =
    `${lijn} L ${punten[punten.length - 1].x.toFixed(1)} ${hoogte} L ${punten[0].x.toFixed(1)} ${hoogte} Z`

  return (
    <svg
      viewBox={`0 0 ${breedte} ${hoogte}`}
      style={{ width: '100%', height: hoogte, display: 'block' }}
      aria-label="30-daagse werkgeluk grafiek"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mf-purple)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--mf-purple)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={vulgebied} fill="url(#sparkGrad)" />
      <path d={lijn} fill="none" stroke="var(--mf-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {punten.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={scoreKleur(p.score)} />
      ))}
    </svg>
  )
}

export default function WerkgelukPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<WerkgelukData | null>(null)
  const [score, setScore] = useState(7)
  const [notitie, setNotitie] = useState('')
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [aantalDagen, setAantalDagen] = useState(0)

  const laadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    try {
      const res = await authFetch('/api/werkgeluk')
      if (res.ok) {
        const json = await res.json() as WerkgelukData
        setData(json)
        setAantalDagen(json.geschiedenis.length)
        if (json.vandaag) {
          setScore(json.vandaag.score)
          setNotitie(json.vandaag.notitie ?? '')
        }
      }
    } catch { /* niet-kritiek */ }
    setLaden(false)
  }, [router])

  useEffect(() => { laadData() }, [laadData])

  async function slaOp() {
    setFout(null)
    setOpslaan(true)
    try {
      const res = await authFetch('/api/werkgeluk', {
        method: 'POST',
        body: JSON.stringify({ score, notitie: notitie.trim() || undefined }),
      })
      if (res.ok) {
        const json = await res.json() as { log: { score: number; notitie: string | null; datum: string } }
        setData(prev => {
          if (!prev) return prev
          const vandaagDatum = json.log.datum
          const nieuweGeschiedenis = [
            { datum: vandaagDatum, score: json.log.score },
            ...prev.geschiedenis.filter(g => g.datum !== vandaagDatum),
          ].slice(0, 31)
          const gemiddelde =
            nieuweGeschiedenis.length > 0
              ? Math.round((nieuweGeschiedenis.reduce((s, g) => s + g.score, 0) / nieuweGeschiedenis.length) * 10) / 10
              : null
          return {
            vandaag: { score: json.log.score, notitie: json.log.notitie },
            geschiedenis: nieuweGeschiedenis,
            gemiddelde,
          }
        })
        if (!data?.vandaag) {
          setAantalDagen(prev => prev + 1)
        }
        setSucces(true)
        setTimeout(() => {
          setSucces(false)
          router.push('/home')
        }, 2000)
      } else {
        const json = await res.json() as { error?: string }
        setFout(json.error ?? 'Er ging iets mis.')
      }
    } catch {
      setFout('Verbindingsfout. Probeer opnieuw.')
    }
    setOpslaan(false)
  }

  const kleur = scoreKleur(score)
  const isNieuw = !data?.vandaag

  if (laden) {
    return (
      <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div className="mf-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 96px', maxWidth: 900, margin: '0 auto' }}>

        <header style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 24, fontWeight: 800, color: 'var(--text-1)',
            letterSpacing: '-0.03em', marginBottom: 4,
          }}>
            Werkgeluk check
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-4)' }}>
            Hoe blij ben jij vandaag met je werk? Één meting per dag.
          </p>
        </header>

        <div className={data && data.geschiedenis.length > 0 ? 'mf-home-layout' : ''} style={{ alignItems: 'start' }}>
        <div>{/* form column */}

        <section style={{
          background: 'var(--bg-card)', borderRadius: 24, padding: '24px 20px',
          border: `1.5px solid color-mix(in srgb, ${kleur} 18%, transparent)`, marginBottom: 16,
          boxShadow: `0 4px 24px color-mix(in srgb, ${kleur} 10%, transparent)`,
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              width: 128, height: 128, borderRadius: '50%',
              background: `color-mix(in srgb, ${kleur} 8%, transparent)`,
              border: `2px solid color-mix(in srgb, ${kleur} 20%, transparent)`,
              boxShadow: `0 8px 40px color-mix(in srgb, ${kleur} 15%, transparent)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.25s ease, box-shadow 0.25s ease',
            }}>
              <span style={{ fontSize: 52, fontWeight: 900, color: kleur, lineHeight: 1, letterSpacing: '-0.04em', transition: 'color 0.25s ease' }}>
                {score}
              </span>
              {(() => {
                const Icoon = scoreIcoon(score)
                return <Icoon size={22} strokeWidth={1.75} aria-hidden="true" style={{ color: kleur, marginTop: 4, transition: 'color 0.25s ease' }} />
              })()}
              <span style={{ fontSize: 11, fontWeight: 700, color: kleur, marginTop: 3, transition: 'color 0.25s ease' }}>{scoreLabel(score)}</span>
            </div>
          </div>

          <div style={{ position: 'relative', paddingBottom: 8 }}>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={score}
              aria-label={`Werkgeluk score: ${score} van 10, ${scoreLabel(score)}`}
              onChange={e => setScore(Number(e.target.value))}
              style={{
                width: '100%', height: 6, appearance: 'none',
                background: `linear-gradient(to right, ${kleur} ${(score - 1) / 9 * 100}%, var(--bg-subtle) ${(score - 1) / 9 * 100}%)`,
                borderRadius: 99, outline: 'none', cursor: 'pointer',
                transition: 'background 0.25s ease', color: kleur,
              }}
            />
            <div role="group" aria-label="Kies een werkgeluk score van 1 tot 10" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  aria-label={`Score ${n} van 10`}
                  aria-pressed={score === n}
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: 'none',
                    cursor: 'pointer', fontSize: 11,
                    fontWeight: score === n ? 800 : 500,
                    background: score === n ? kleur : 'var(--bg-subtle)',
                    color: score === n ? 'var(--bg-app)' : 'var(--text-2)',
                    transition: 'background 0.15s var(--ease), color 0.15s var(--ease)', flexShrink: 0, padding: 0,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '0 2px' }}>
            {[
              { bereik: '1-2', Icoon: Angry, omschrijving: 'Heel slecht' },
              { bereik: '3-4', Icoon: Frown, omschrijving: 'Niet goed' },
              { bereik: '5-6', Icoon: Meh, omschrijving: 'Oké' },
              { bereik: '7-8', Icoon: Smile, omschrijving: 'Goed' },
              { bereik: '9-10', Icoon: Laugh, omschrijving: 'Super!' },
            ].map(item => (
              <div key={item.bereik} style={{ textAlign: 'center', flex: 1 }}>
                <item.Icoon size={16} strokeWidth={1.75} role="img" aria-label={item.omschrijving} style={{ color: 'var(--text-3)', display: 'inline-block' }} />
                <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2, fontWeight: 600 }}>
                  {item.bereik}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{
          background: 'var(--bg-card)', borderRadius: 16, padding: '14px 16px',
          border: '1px solid var(--border)', marginBottom: 16,
        }}>
          <label
            htmlFor="werkgeluk-notitie"
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 8 }}
          >
            Notitie <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(optioneel)</span>
          </label>
          <textarea
            id="werkgeluk-notitie"
            value={notitie}
            onChange={e => setNotitie(e.target.value)}
            placeholder="Wat maakt je dag goed of minder goed?"
            maxLength={500}
            rows={3}
            style={{
              width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--text-2)',
              resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </section>

        {fout && (
          <div role="alert" style={{
            background: 'var(--mf-red-light)', border: '1px solid color-mix(in srgb, var(--mf-red) 30%, transparent)', borderRadius: 12,
            padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--mf-red)',
          }}>
            {fout}
          </div>
        )}

        <button
          onClick={slaOp}
          disabled={opslaan}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            cursor: opslaan ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700,
            background: 'var(--mentaforce-primary)',
            color: 'var(--bg-app)',
            opacity: opslaan ? 0.7 : 1,
            transition: 'background 0.3s ease, opacity 0.15s ease',
            letterSpacing: '-0.01em', marginBottom: 16,
            boxShadow: '0 4px 14px color-mix(in srgb, var(--mentaforce-primary) 35%, transparent)',
          }}
        >
          {succes
            ? 'Opgeslagen!'
            : opslaan
            ? 'Opslaan...'
            : isNieuw
            ? 'Vandaag invullen'
            : 'Bijwerken'}
        </button>

        {succes && aantalDagen > 0 && (
          <div style={{
            textAlign: 'center', padding: '12px 16px', background: 'var(--mf-green-light)',
            borderRadius: 14, border: '1px solid color-mix(in srgb, var(--mf-green) 30%, transparent)', marginBottom: 24,
            fontSize: 14, color: 'var(--mf-green-dark)', fontWeight: 600,
          }}>
            Je hebt dit {aantalDagen} {aantalDagen === 1 ? 'dag' : 'dagen'} bijgehouden
          </div>
        )}

        </div>{/* end form column */}

        {data && data.geschiedenis.length > 0 && (
          <div>{/* history column */}
          <section style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: '20px',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 2,
                }}>
                  Afgelopen 30 dagen
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
                  Jouw werkgeluk trend
                </p>
              </div>
              {data.gemiddelde !== null && (
                <div style={{
                  background: `color-mix(in srgb, ${scoreKleur(Math.round(data.gemiddelde))} 15%, transparent)`,
                  border: `1.5px solid color-mix(in srgb, ${scoreKleur(Math.round(data.gemiddelde))} 45%, transparent)`,
                  borderRadius: 12, padding: '8px 14px', textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 22, fontWeight: 900,
                    color: scoreKleur(Math.round(data.gemiddelde)),
                    lineHeight: 1, letterSpacing: '-0.03em',
                  }}>
                    {data.gemiddelde}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginTop: 2 }}>
                    gemiddeld
                  </div>
                </div>
              )}
            </div>

            {/* 7-daagse strip */}
            {(() => {
              const dagMap = new Map(data.geschiedenis.map(g => [g.datum, g.score]))
              const vandaagStr = new Date().toISOString().slice(0, 10)
              const zeven = Array.from({ length: 7 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - (6 - i))
                return d.toISOString().slice(0, 10)
              })
              return (
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {zeven.map(dag => {
                    const s = dagMap.get(dag)
                    const isVandaag = dag === vandaagStr
                    const kleur = s !== undefined ? scoreKleur(s) : 'var(--bg-subtle)'
                    const dagNaam = new Date(dag + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2)
                    return (
                      <div key={dag} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: '100%', aspectRatio: '1', borderRadius: 8,
                          background: kleur,
                          border: isVandaag ? '2px solid var(--mf-purple)' : '1px solid var(--border)',
                          boxSizing: 'border-box',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: s !== undefined ? 1 : 0.3,
                        }}>
                          {s !== undefined && <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--bg-app)' }}>{s}</span>}
                        </div>
                        <span style={{ fontSize: 9, color: isVandaag ? 'var(--mf-purple)' : 'var(--text-4)', fontWeight: isVandaag ? 700 : 400 }}>{dagNaam}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            <Sparkline data={data.geschiedenis} />

            {(() => {
              const gesorteerd = [...data.geschiedenis].sort((a, b) => a.datum.localeCompare(b.datum))
              const eerste = gesorteerd[0]
              const laatste = gesorteerd[gesorteerd.length - 1]
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    {new Date(eerste.datum + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    {new Date(laatste.datum + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )
            })()}
          </section>
          </div>
        )}
        </div>{/* end mf-home-layout */}

      </main>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--text-1);
          border: 3px solid currentColor;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
        }
        input[type=range]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--text-1);
          border: 3px solid currentColor;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </div>
  )
}