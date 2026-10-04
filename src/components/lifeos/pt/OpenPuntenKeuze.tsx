'use client'

import { OORDEEL_LABEL, OORDELEN, type OpenPunt, type Oordeel } from '@/lib/lifeos/pt-coaching/aandachtspunten'

// Bovenaan het afrondformulier: de aandachtspunten die nog openstaan, met per punt
// één tik — opgelost, loopt nog, of erger. Niets aantikken mag: dan blijft het
// punt open en telt het als nog een gesprek.

const DAG = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })

interface Props {
  punten: readonly OpenPunt[]
  oordelen: Readonly<Record<string, Oordeel>>
  onKies: (id: string, oordeel: Oordeel | null) => void
}

export function OpenPuntenKeuze({ punten, oordelen, onKies }: Props) {
  if (punten.length === 0) return null
  return (
    <fieldset style={{ display: 'grid', gap: 10, margin: 0, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-raised)' }}>
      <legend style={{ padding: '0 4px', fontSize: 11.5, fontWeight: 600, color: 'var(--text-4)' }}>
        Open aandachtspunten · hoe staat het ervoor?
      </legend>
      {punten.map((p) => (
        <div key={p.id} style={{ display: 'grid', gap: 6 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-1)', lineHeight: 1.45 }}>
            {p.tekst}
            <span style={{ color: 'var(--text-4)', fontSize: 11.5 }}>
              {' '}· sinds {DAG.format(new Date(p.sinds))}
              {p.keerOpen > 0 ? ` · ${p.keerOpen}× open gebleven` : ''}
            </span>
          </p>
          <div role="group" aria-label={`Oordeel over: ${p.tekst}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {OORDELEN.map((o) => {
              const actief = oordelen[p.id] === o
              const kleur = o === 'erger' ? 'var(--status-danger)' : 'var(--brand)'
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={actief}
                  onClick={() => onKies(p.id, actief ? null : o)}
                  style={{
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                    padding: '5px 11px', borderRadius: 999,
                    border: `1px solid ${actief ? kleur : 'var(--line)'}`,
                    background: actief ? (o === 'erger' ? 'var(--status-danger-soft)' : 'var(--brand-soft)') : 'transparent',
                    color: actief ? kleur : 'var(--text-3)',
                    transition: 'color 150ms, background 150ms, border-color 150ms',
                  }}
                >
                  {OORDEEL_LABEL[o]}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </fieldset>
  )
}
