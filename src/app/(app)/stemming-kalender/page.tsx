'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'


interface DagLog {
  datum: string
  stemming: number
  count: number
}

const KLEUR_MAP: Record<number, string> = {
  0: 'var(--bg-subtle)',
  1: 'var(--mf-red)',
  2: 'var(--mf-red-light)',
  3: 'var(--mf-amber-light)',
  4: 'var(--mf-green-light)',
  5: 'var(--mf-green)',
}

const STEMMING_LABEL: Record<number, string> = {
  1: 'Slecht',
  2: 'Matig',
  3: 'Neutraal',
  4: 'Goed',
  5: 'Super!',
}

function stemmingNaarKleur(stemming: number): string {
  const afgerond = Math.round(stemming)
  return KLEUR_MAP[afgerond] ?? KLEUR_MAP[0]
}

function datumLabel(datum: string): string {
  const d = new Date(datum + 'T12:00:00')
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function berekenStreak(logMap: Map<string, DagLog>): number {
  let streak = 0
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)

  for (let i = 0; i < 90; i++) {
    const dag = new Date(vandaag)
    dag.setDate(dag.getDate() - i)
    const sleutel = dag.toISOString().slice(0, 10)
    if (logMap.has(sleutel)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function bouwKalenderDagen(): string[] {
  const dagen: string[] = []
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)
  for (let i = 89; i >= 0; i--) {
    const dag = new Date(vandaag)
    dag.setDate(dag.getDate() - i)
    dagen.push(dag.toISOString().slice(0, 10))
  }
  return dagen
}

export default function StemmingKalenderPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [logMap, setLogMap] = useState<Map<string, DagLog>>(new Map())

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/stemming-kalender')
      if (res.ok) {
        const json = await res.json() as { logs: DagLog[] }
        const map = new Map<string, DagLog>()
        for (const log of json.logs ?? []) {
          map.set(log.datum, log)
        }
        setLogMap(map)
      }
      setLaden(false)
    }
    laad()
  }, [router])

  const kalenderDagen = bouwKalenderDagen()

  // Bepaal startdag van de week (maandag = 0)
  const eerstedag = new Date(kalenderDagen[0] + 'T12:00:00')
  const dagVanDeWeek = (eerstedag.getDay() + 6) % 7 // 0=ma, 6=zo
  const opvulling = Array(dagVanDeWeek).fill(null) as (null)[]
  const rasterItems = [...opvulling, ...kalenderDagen]

  // Stats berekenen
  const alleWaarden = Array.from(logMap.values()).map(l => l.stemming)
  const gemiddelde = alleWaarden.length > 0
    ? (alleWaarden.reduce((a, b) => a + b, 0) / alleWaarden.length).toFixed(1)
    : null

  const besteEntry = Array.from(logMap.entries()).reduce<{ datum: string; stemming: number } | null>(
    (best, [datum, log]) => (!best || log.stemming > best.stemming ? { datum, stemming: log.stemming } : best),
    null
  )

  const streak = berekenStreak(logMap)

  const vandaag = new Date()
  const negentigGeleden = new Date()
  negentigGeleden.setDate(negentigGeleden.getDate() - 89)

  const datumRange = `${negentigGeleden.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${vandaag.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`

  // Weekdag labels
  const WEEKDAGEN = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

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
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Stemming kalender
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{datumRange}</p>
        </header>

        {/* Stats rij */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '14px', border: '1px solid var(--border)', textAlign: 'center', position: 'relative' }}>
            {gemiddelde && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, pointerEvents: 'none' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
              </div>
            )}
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 2, position: 'relative', zIndex: 1 }}>
              {gemiddelde ?? '—'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', position: 'relative', zIndex: 1 }}>
              Gemiddeld
            </p>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '14px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 2 }}>
              {besteEntry ? besteEntry.stemming.toFixed(1) : '—'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Beste dag
            </p>
            {besteEntry && (
              <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>
                {new Date(besteEntry.datum + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '14px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 2 }}>
              {streak}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Langste streak
            </p>
          </div>
        </div>

        {/* Heatmap */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '20px', border: '1px solid var(--border)', marginBottom: 16, overflowX: 'auto' }}>
          <div
            role="img"
            aria-label={`Stemmingsheatmap van de afgelopen 90 dagen: ${logMap.size} ${logMap.size === 1 ? 'dag' : 'dagen'} gelogd${gemiddelde ? `, gemiddelde stemming ${gemiddelde} van 5` : ''}`}
            style={{ display: 'flex', gap: 4, marginBottom: 8 }}
          >
            {/* Weekdag labels kolom */}
            <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 4, marginRight: 4 }}>
              {WEEKDAGEN.map(dag => (
                <div key={dag} style={{ height: 20, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600 }}>{dag}</span>
                </div>
              ))}
            </div>

            {/* Grid: kolommen = weken (decoratief binnen de role="img" wrapper) */}
            <div aria-hidden="true" style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: Math.ceil(rasterItems.length / 7) }).map((_, weekIdx) => (
                <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {Array.from({ length: 7 }).map((_, dagIdx) => {
                    const item = rasterItems[weekIdx * 7 + dagIdx]
                    if (!item) {
                      return (
                        <div key={dagIdx} style={{ width: 20, height: 20 }} />
                      )
                    }
                    const log = logMap.get(item)
                    const kleur = log ? stemmingNaarKleur(log.stemming) : 'var(--bg-subtle)'
                    const tooltip = log
                      ? `${datumLabel(item)}\nStemming: ${log.stemming.toFixed(1)} (${STEMMING_LABEL[Math.round(log.stemming)] ?? ''}) — ${log.count}x ingevoerd`
                      : datumLabel(item)
                    const isVandaag = item === vandaag.toISOString().slice(0, 10)
                    return (
                      <div
                        key={dagIdx}
                        title={tooltip}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          background: kleur,
                          border: isVandaag ? '2px solid var(--mentaforce-primary)' : '1px solid var(--border)',
                          boxSizing: 'border-box',
                          cursor: log ? 'pointer' : 'default',
                          transition: 'transform 0.1s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.2)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 4 }}>
            {logMap.size} van 90 dagen bijgehouden
          </p>
        </div>

        {/* Legenda */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>
            Legenda
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Geen data</span>
            </div>
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: 3, background: KLEUR_MAP[n], border: '1px solid var(--border)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{n} – {STEMMING_LABEL[n]}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
