'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'

// Icoon-knop die bij hover of focus verschijnt: de lijst mag niet schreeuwen,
// maar de knoppen moeten er wel zijn zodra je ze zoekt.
//
// Focus maakt 'm altijd zichtbaar — een knop die je met de tab-toets bereikt
// maar niet ziet, bestaat niet. De focus-ring zelf komt uit globals.css
// (`:focus-visible`), dus die is er ook als iemand deze component vergeet.

interface IconKnopProps {
  /** Toegankelijk label. Verplicht: deze knop heeft geen zichtbare tekst. */
  label: string
  /** Tooltip als die iets anders zegt dan het label (bv. waarom hij uit staat). */
  titel?: string
  zichtbaar: boolean
  disabled?: boolean
  /** Vaste kleur, bv. cyaan voor een actieve stand. Anders volgt hij hover. */
  kleur?: string
  children: ReactNode
  onClick: () => void
  /** Meldt focus terug, zodat de rij zijn knoppen zichtbaar kan houden. */
  onFocusWissel: (aan: boolean) => void
  'aria-expanded'?: boolean
  'aria-controls'?: string
}

export function IconKnop({
  label,
  titel,
  zichtbaar,
  disabled = false,
  kleur,
  children,
  onClick,
  onFocusWissel,
  ...aria
}: IconKnopProps) {
  const [hover, setHover] = useState(false)

  return (
    <button
      type="button"
      aria-label={label}
      title={titel ?? label}
      disabled={disabled}
      onClick={onClick}
      onFocus={() => onFocusWissel(true)}
      onBlur={() => onFocusWissel(false)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...aria}
      style={{
        ...KNOP,
        opacity: zichtbaar ? (disabled ? 0.35 : 1) : 0,
        // Onzichtbaar is ook onklikbaar: anders raak je een knop die er niet is.
        pointerEvents: zichtbaar ? 'auto' : 'none',
        color: kleur ?? (hover && !disabled ? 'var(--text-1)' : 'var(--text-4)'),
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

const KNOP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  flexShrink: 0,
  padding: 0,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  // Alleen opacity en kleur: geen layout-properties animeren.
  transition: 'opacity 150ms var(--ease), color 150ms var(--ease)',
}
