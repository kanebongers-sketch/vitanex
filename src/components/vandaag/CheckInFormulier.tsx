'use client'

// De ochtend-check-in: drie vragen, elk vijf knoppen. Bewust knoppen in plaats van
// een schuif: één tik, duidelijk op toetsenbord en schermlezer, geen "half" antwoord.

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

export function CheckInFormulier({ bezig, onVerstuur }: CheckInFormulierProps) {
  const [antwoord, setAntwoord] = useState<Partial<Record<keyof CheckIn, number>>>({})
  const compleet = VRAGEN.every((v) => typeof antwoord[v.sleutel] === 'number')

  function verstuur() {
    if (!compleet) return
    onVerstuur({
      stemming: antwoord.stemming as number,
      energie: antwoord.energie as number,
      stress: antwoord.stress as number,
    })
  }

  return (
    <section id="checkin" aria-labelledby="checkin-kop" style={{ display: 'grid', gap: 22 }}>
      <h2 id="checkin-kop" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: 0 }}>
        Check in — tien seconden
      </h2>
      {VRAGEN.map((v) => (
        <fieldset key={v.sleutel} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          <legend style={{ fontSize: 17, color: 'var(--text-1)', marginBottom: 10, padding: 0 }}>{v.vraag}</legend>
          <div role="radiogroup" aria-label={v.vraag} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {SCHAAL.map((n) => {
              const gekozen = antwoord[v.sleutel] === n
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={gekozen}
                  aria-label={`${n} van 5${n === 1 ? ` (${v.laag.toLowerCase()})` : n === 5 ? ` (${v.hoog.toLowerCase()})` : ''}`}
                  onClick={() => setAntwoord((a) => ({ ...a, [v.sleutel]: n }))}
                  className="mf-pressable mf-vandaag-keuze"
                  style={{
                    height: 48,
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    color: gekozen ? 'var(--bg-app)' : 'var(--text-1)',
                    background: gekozen ? 'var(--brand)' : 'var(--bg-subtle)',
                    border: `1px solid ${gekozen ? 'var(--brand)' : 'var(--border-strong)'}`,
                    transition: 'background-color 160ms ease, color 160ms ease, transform 160ms ease',
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <div aria-hidden style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
            <span>{v.laag}</span>
            <span>{v.hoog}</span>
          </div>
        </fieldset>
      ))}
      <Button size="lg" onClick={verstuur} disabled={!compleet} loading={bezig}>
        Maak mijn dag
      </Button>
    </section>
  )
}
