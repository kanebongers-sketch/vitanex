'use client'

import { useId, useState } from 'react'
import { RPE_WAARDEN, type Rpe } from '@/lib/lifeos/training/training'

// De RPE-kiezer. Het belangrijkste veld van functie 6: Vita gebruikt 'm
// ("houd je training vandaag op RPE 7"), en RPE is het enige cijfer in dit
// hele domein dat een sensor niet kan leveren. Alleen jij weet hoe zwaar het was.
//
// ─── NOOIT VERPLICHT ────────────────────────────────────────────────────────
// Dat is hier geen afspraak maar de vorm: "—" is een echte optie en staat
// standaard aan. Je kunt dus niet per ongeluk een RPE meesturen, en je kunt er
// altijd weer uit. Een verzonnen RPE is erger dan geen RPE — als het formulier
// je dwingt te kiezen, verzin je iets.
//
// ─── WAAROM ECHTE RADIO'S ───────────────────────────────────────────────────
// Elf `<input type="radio">` in één fieldset: pijltjestoetsen, screenreader-
// aankondiging ("3 van 11") en formuliersemantiek krijg je dan gratis en
// correct. Een rij `<button>`'s met aria-checked zou dat allemaal met de hand
// moeten nabouwen, en dat gaat een keer stuk.
//
// De inputs zijn visueel verborgen en het label is de knop. Gevolg: de native
// focus-ring is onzichtbaar, dus die tekenen we zelf op basis van focus-state —
// dezelfde reden waarom `Knop` zijn hover in state bijhoudt (inline styles
// kennen geen :focus-visible).

interface RpeKiezerProps {
  waarde: Rpe | null
  onKies: (rpe: Rpe | null) => void
  /** Zichtbare vraag boven de rij. */
  legenda: string
  /** In een rij tussen andere tekst: kleiner, zonder eigen kop. */
  compact?: boolean
  disabled?: boolean
}

/** null = de "—"-optie. Een echte keuze, geen ontbrekende. */
type Optie = Rpe | null

const OPTIES: readonly Optie[] = [null, ...RPE_WAARDEN]

export function RpeKiezer({
  waarde,
  onKies,
  legenda,
  compact = false,
  disabled = false,
}: RpeKiezerProps) {
  const groep = useId()
  const [focus, setFocus] = useState<Optie | undefined>(undefined)

  const hoogte = compact ? 26 : 32

  return (
    <fieldset
      disabled={disabled}
      style={{
        border: 0,
        padding: 0,
        margin: 0,
        minWidth: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <legend
        style={{
          padding: 0,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          marginBottom: 6,
        }}
      >
        {legenda}
      </legend>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {OPTIES.map((optie) => {
          const gekozen = waarde === optie
          const heeftFocus = focus === optie
          const leeg = optie === null

          return (
            <label
              key={optie ?? 'geen'}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: leeg ? hoogte + 6 : hoogte,
                height: hoogte,
                padding: '0 4px',
                borderRadius: 8,
                border: `1px solid ${gekozen || heeftFocus ? 'var(--brand)' : 'var(--line)'}`,
                background: gekozen ? 'var(--brand-soft)' : 'transparent',
                color: gekozen ? 'var(--brand)' : 'var(--text-3)',
                fontFamily: leeg ? 'inherit' : 'var(--font-mono)',
                fontSize: compact ? 11 : 12,
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                // De zelfgetekende focus-ring: de echte input is onzichtbaar.
                boxShadow: heeftFocus ? '0 0 0 2px var(--brand-glow)' : 'none',
                // Alleen kleur en transform — nooit layout animeren.
                transition:
                  'color 150ms var(--ease), border-color 150ms var(--ease), background 150ms var(--ease), box-shadow 150ms var(--ease)',
              }}
            >
              <input
                type="radio"
                name={groep}
                checked={gekozen}
                onChange={() => onKies(optie)}
                onFocus={() => setFocus(optie)}
                onBlur={() => setFocus(undefined)}
                style={VERBORGEN_INPUT}
              />
              {/* Het streepje is de vorm van "niet ingevuld". Voor een
                  screenreader is het ruis — die krijgt de tekst hieronder. */}
              <span aria-hidden="true">{leeg ? '—' : optie}</span>
              <span style={ALLEEN_SCREENREADER}>
                {leeg ? 'RPE niet ingevuld' : `RPE ${optie}`}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * De input ligt over het hele label maar is onzichtbaar. Niet `display: none`
 * en niet `clip`: dan valt hij uit de tab-volgorde of verliest hij zijn
 * klikvlak, en dan werkt de pijltjes-navigatie van de radiogroep niet meer.
 */
const VERBORGEN_INPUT: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  opacity: 0,
  cursor: 'inherit',
}

const ALLEEN_SCREENREADER: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}
