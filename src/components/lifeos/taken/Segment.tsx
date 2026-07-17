'use client'

import { useState, type CSSProperties } from 'react'

// Een rij keuzes waarvan er één (of geen) aan staat. Voor impact en energie.
//
// Generiek over de waarde, want impact is een getal en energie een string —
// maar de knop is dezelfde knop, en twee kopieën ervan zouden meteen uit elkaar
// lopen.
//
// De lege stand staat er als volwaardige keuze naast, niet als kruisje in een
// hoekje: "weet ik niet" is een antwoord, geen ontbrekend antwoord.

export interface SegmentOptie<T> {
  waarde: T
  /** Wat op de knop staat. Kort — dit is een segment, geen zin. */
  kort: string
  /** De volle betekenis. Wordt het toegankelijke label. */
  titel: string
}

interface SegmentProps<T> {
  opties: readonly SegmentOptie<T>[]
  gekozen: T | null
  onKies: (waarde: T | null) => void
  /** De tekst van de lege stand, bv. 'Weet ik niet'. */
  legeTekst: string
}

export function Segment<T extends string | number>({
  opties,
  gekozen,
  onKies,
  legeTekst,
}: SegmentProps<T>) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {opties.map((optie) => (
        <SegmentKnop
          key={optie.waarde}
          label={optie.kort}
          titel={optie.titel}
          actief={gekozen === optie.waarde}
          // Nog eens op je eigen keuze klikken zet 'm terug op onbekend. Zo kom
          // je van een verkeerde klik af zonder de lege knop te zoeken.
          onClick={() => onKies(gekozen === optie.waarde ? null : optie.waarde)}
        />
      ))}
      <SegmentKnop
        label={legeTekst}
        titel={legeTekst}
        actief={gekozen === null}
        onClick={() => onKies(null)}
      />
    </div>
  )
}

interface SegmentKnopProps {
  label: string
  titel: string
  actief: boolean
  onClick: () => void
}

/**
 * `aria-pressed` en niet `role="radio"`: dit is een toggle die je uit kunt
 * zetten, en dat is precies wat een radio niet kan. De focus-ring komt uit
 * globals.css (`:focus-visible`) — die is er dus altijd.
 */
function SegmentKnop({ label, titel, actief, onClick }: SegmentKnopProps) {
  const [hover, setHover] = useState(false)
  const opvallend = actief || hover

  return (
    <button
      type="button"
      aria-pressed={actief}
      aria-label={titel}
      title={titel}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...KNOP,
        border: `1px solid ${opvallend ? 'var(--brand)' : 'var(--line-strong)'}`,
        background: actief ? 'var(--brand-soft)' : 'transparent',
        color: opvallend ? 'var(--brand)' : 'var(--text-3)',
      }}
    >
      {label}
    </button>
  )
}

const KNOP: CSSProperties = {
  padding: '5px 10px',
  borderRadius: 999,
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  // Alleen kleur: geen layout-properties animeren.
  transition: 'color 180ms var(--ease), border-color 180ms var(--ease), background 180ms var(--ease)',
}
