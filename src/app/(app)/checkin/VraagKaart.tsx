'use client'

// ─── VraagKaart — presentational ─────────────────────────────────────────────
// Eén schaalvraag (1–5) binnen de check-in. Puur: props in → UI uit.
// De eerstvolgende open vraag staat op volle sterkte; een vraag die nog niet
// aan de beurt is staat visueel stil (.mf-vraag-stil) maar blijft bedienbaar.
// Interactie-states (hover/active/focus/pop) staan in de check-in-CSS op page.

import { Check } from 'lucide-react'

export interface Vraag {
  code:      string
  label:     string
  type:      'schaal'
  min?:      string
  max?:      string
  verplicht: boolean
}

interface VraagKaartProps {
  vraag:    Vraag
  waarde:   number | undefined
  kleur:    string
  licht:    string
  nummer:   number
  /** Nog niet aan de beurt: visueel stil, maar wel direct aanklikbaar. */
  stil:     boolean
  onChange: (v: number) => void
}

const SCHAAL = [1, 2, 3, 4, 5] as const

export default function VraagKaart({ vraag, waarde, kleur, licht, nummer, stil, onChange }: VraagKaartProps) {
  const beantwoord = waarde !== undefined

  return (
    <div
      className={`mf-vraag-kaart rounded-2xl p-5${stil ? ' mf-vraag-stil' : ''}`}
      style={{
        background: 'var(--bg-card)',
        // Constante borderdikte — alleen de kleur verandert, dus geen layout-shift.
        border:     `1.5px solid ${beantwoord ? `color-mix(in srgb, ${kleur} 38%, transparent)` : 'var(--border)'}`,
      }}>

      {/* Vraagnummer + label */}
      <div className="flex items-start gap-2.5 mb-4">
        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
          style={{ background: beantwoord ? kleur : licht, color: beantwoord ? 'var(--bg-app)' : kleur }}>
          {beantwoord
            ? <Check size={11} strokeWidth={3} aria-hidden="true" />
            : nummer}
        </div>
        <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-1)' }}>{vraag.label}</p>
      </div>

      {/* Schaalbuttons — rustkleuren via CSS, alleen de selectie krijgt sectiekleur */}
      <div className="flex gap-2 mb-2">
        {SCHAAL.map(n => {
          const actief = waarde === n
          return (
            <button key={n} type="button" onClick={() => onChange(n)}
              aria-label={`${vraag.label}: ${n} van 5`}
              aria-pressed={actief}
              className="mf-schaal-btn flex-1 h-12 rounded-xl text-sm font-semibold border"
              style={actief ? {
                background:  kleur,
                borderColor: kleur,
                color:       'var(--bg-app)',
                boxShadow:   `0 2px 8px color-mix(in srgb, ${kleur} 31%, transparent)`,
              } : undefined}>
              {n}
            </button>
          )
        })}
      </div>

      {(vraag.min || vraag.max) && (
        <div className="flex justify-between text-xs px-0.5 mt-1" style={{ color: 'var(--text-4)' }}>
          <span>{vraag.min}</span>
          <span>{vraag.max}</span>
        </div>
      )}
    </div>
  )
}
