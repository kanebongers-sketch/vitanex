'use client'

import { useCallback, useEffect, useState } from 'react'
import { authFetch } from '@/lib/auth/auth-fetch'
import { PijlerKaart } from './PijlerKaart'
import { LaadFout } from './LaadFout'
import { PIJLERS } from '@/lib/pijlers/pijlers'
import { scoreNiveau } from '@/lib/pijlers/score'
import type { PijlerOverzicht } from '@/lib/pijlers/pijlers-server'

/**
 * Zelfstandig progress-blok: de overall wellbeing-trend + de 6 pijlers met hun
 * trend deze week (grootste verbetering/terugval zie je aan de trend-chips).
 * Haalt zelf /api/pijlers op zodat het overal in te pluggen is.
 */
export function PijlerTrends() {
  const [data, setData] = useState<PijlerOverzicht | null>(null)
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(false)

  const laad = useCallback(async () => {
    setFout(false)
    try {
      const res = await authFetch('/api/pijlers')
      if (!res.ok) throw new Error('pijlers')
      setData(await res.json() as PijlerOverzicht)
    } catch {
      // Een laadfout is geen "nog niets gemeten" — zeg wat er echt misging.
      setFout(true)
    } finally {
      setLaden(false)
    }
  }, [])

  useEffect(() => { void laad() }, [laad])

  const pijlers = data?.pijlers ?? []
  const wb = data?.wellbeing
  const niveau = scoreNiveau(wb?.score ?? null)

  return (
    <section style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', margin: 0 }}>
          Je pijlers deze week
        </h2>
        {wb && wb.score !== null && (
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: niveau.kleur, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{wb.score}</span>
            {/* Niveau ook als tekst — kleur mag nooit de enige drager van
                betekenis zijn (WCAG 1.4.1). */}
            <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 500 }}>
              {niveau.label} · gemiddeld · {wb.gemeten} van {wb.totaal} gemeten
            </span>
          </span>
        )}
      </div>

      {fout ? (
        <LaadFout wat="je pijler-trends" onOpnieuw={() => { setLaden(true); void laad() }} />
      ) : (
      <div className="mf-pt-grid" aria-busy={laden && !data ? true : undefined} aria-live="polite">
        {laden && !data
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mf-skeleton" style={{ height: 116, borderRadius: 'var(--radius-card)' }} />
            ))
          : PIJLERS.map((def) => {
              const r = pijlers.find((p) => p.key === def.key)
              return (
                <PijlerKaart
                  key={def.key}
                  pijler={def}
                  score={r?.score ?? null}
                  trend={r?.trend ?? { richting: 'geen', deltaPct: null }}
                />
              )
            })}
      </div>
      )}

      <style>{`
        .mf-pt-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 560px) { .mf-pt-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
    </section>
  )
}
