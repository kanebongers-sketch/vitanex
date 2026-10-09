'use client'

// De ochtend-check-in: drie vragen, elk vijf keuzes. Echte radio-knoppen in een
// fieldset: één tabstop per vraag, pijltjes om te kiezen, en een schermlezer
// hoort precies wat het is. Visueel blijven het grote, tikbare vakken.

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { CheckIn } from '@/lib/vandaag/types'

interface Vraag {
  sleutel: keyof CheckIn
  vraag: string
  laag: string
  hoog: string
}

const VRAGEN: readonly Vraag[] = [
  { sleutel: 'stemming', vraag: 'Hoe voel je je?', laag: 'Slecht', hoog: 'Top' },
  { sleutel: 'energie', vraag: 'Hoeveel energie heb je?', laag: 'Leeg', hoog: 'Vol' },
  { sleutel: 'stress', vraag: 'Hoeveel spanning voel je?', laag: 'Geen', hoog: 'Veel' },
]

const SCHAAL = [1, 2, 3, 4, 5] as const

interface CheckInFormulierProps {
  bezig: boolean
  onVerstuur: (checkin: CheckIn) => void
}

function uitleg(n: number, v: Vraag): string {
  if (n === 1) return ` (${v.laag.toLowerCase()})`
  if (n === 5) return ` (${v.hoog.toLowerCase()})`
  return ''
}

export function CheckInFormulier({ bezig, onVerstuur }: CheckInFormulierProps) {
  const [antwoord, setAntwoord] = useState<Partial<Record<keyof CheckIn, number>>>({})
  const [toonHint, setToonHint] = useState(false)
  const compleet = VRAGEN.every((v) => typeof antwoord[v.sleutel] === 'number')

  function verstuur(e: React.FormEvent) {
    e.preventDefault()
    if (!compleet) { setToonHint(true); return }
    onVerstuur({
      stemming: antwoord.stemming as number,
      energie: antwoord.energie as number,
      stress: antwoord.stress as number,
    })
  }

  return (
    <section id="checkin" aria-labelledby="checkin-kop">
      <form onSubmit={verstuur} style={{ display: 'grid', gap: 22 }}>
        <h2 id="checkin-kop" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: 0 }}>
          Check in — tien seconden
        </h2>
        {VRAGEN.map((v) => (
          <fieldset key={v.sleutel} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            <legend style={{ fontSize: 17, color: 'var(--text-1)', marginBottom: 10, padding: 0 }}>{v.vraag}</legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {SCHAAL.map((n) => {
                const gekozen = antwoord[v.sleutel] === n
                return (
                  <label
                    key={n}
                    className="mf-pressable mf-vandaag-keuze"
                    style={{
                      height: 48,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: gekozen ? 'var(--bg-app)' : 'var(--text-1)',
                      background: gekozen ? 'var(--brand)' : 'var(--bg-subtle)',
                      border: `1px solid ${gekozen ? 'var(--brand)' : 'var(--border-strong)'}`,
                      transition: 'background-color 160ms ease, color 160ms ease, transform 160ms ease',
                    }}
                  >
                    <input
                      type="radio"
                      name={v.sleutel}
                      value={n}
                      checked={gekozen}
                      onChange={() => { setAntwoord((a) => ({ ...a, [v.sleutel]: n })); setToonHint(false) }}
                      className="sr-only"
                    />
                    <span aria-hidden>{n}</span>
                    <span className="sr-only">{n} van 5{uitleg(n, v)}</span>
                  </label>
                )
              })}
            </div>
            <div aria-hidden style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
              <span>{v.laag}</span>
              <span>{v.hoog}</span>
            </div>
          </fieldset>
        ))}
        <p id="checkin-hint" role="status" style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', minHeight: 20 }}>
          {toonHint ? 'Beantwoord alle drie de vragen om je dag te maken.' : ''}
        </p>
        <Button type="submit" size="lg" loading={bezig} aria-disabled={!compleet || undefined} aria-describedby="checkin-hint">
          Maak mijn dag
        </Button>
      </form>
    </section>
  )
}
