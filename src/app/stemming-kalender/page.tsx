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
  0: '#F3F4F6',
  1: '#FEE2E2',
  2: '#FCA5A5',
  3: '#FDE68A',
  4: '#A7F3D0',
  5: '#1D9E75',
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
      <main style={{ padding: '24px 20px 88px', maxWidth: 680, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Stemming kalender
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>{datumRange}</p>
        </header>

        {/* Stats rij */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '14px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
              {gemiddelde ?? '—'}
            </p>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Gemiddeld
            </p>
          </div>
          <div style={{ background: 'white', borderRadius: 14, padding: '14px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
              {besteEntry ? besteEntry.stemming.toFixed(1) : '—'}
            </p>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Beste dag
            </p>
            {besteEntry && (
              <p style={{ fontSize: 10, color: '#D1D5DB', marginTop: 2 }}>
                {new Date(besteEntry.datum + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
          <div style={{ background: 'white', borderRadius: 14, padding: '14px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
              {streak}
            </p>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Langste streak
            </p>
          </div>
        </div>

        {/* Heatmap */}
        <div style={{ background: 'white', borderRadius: 20, padding: '20px', border: '1px solid #E5E7EB', marginBottom: 16, overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {/* Weekdag labels kolom */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginRight: 4 }}>
              {WEEKDAGEN.map(dag => (
                <div key={dag} style={{ height: 20, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>{dag}</span>
                </div>
              ))}
            </div>

            {/* Grid: kolommen = weken */}
            <div style={{ display: 'flex', gap: 4 }}>
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
                    const kleur = log ? stemmingNaarKleur(log.stemming) : '#F3F4F6'
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
                          border: isVandaag ? '2px solid #6366F1' : '1px solid rgba(0,0,0,0.06)',
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

          <p style={{ fontSize: 10, color: '#D1D5DB', marginTop: 4 }}>
            {logMap.size} van 90 dagen bijgehouden
          </p>
        </div>

        {/* Legenda */}
        <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>
            Legenda
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, background: '#F3F4F6', border: '1px solid rgba(0,0,0,0.08)' }} />
              <span style={{ fontSize: 11, color: '#6B7280' }}>Geen data</span>
            </div>
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: 3, background: KLEUR_MAP[n], border: '1px solid rgba(0,0,0,0.08)' }} />
                <span style={{ fontSize: 11, color: '#6B7280' }}>{n} – {STEMMING_LABEL[n]}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
