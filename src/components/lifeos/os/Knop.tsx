'use client'

import { useState, type ReactNode } from 'react'

// Kleine knop-primitive. Inline styles kennen geen `:hover`, dus de hover- en
// active-staat lopen via state — dat is hier bewust: een knop zonder ontworpen
// staten voelt als een link die per ongeluk een knop werd.
//
// De focus-ring komt uit globals.css (`:focus-visible`), niet van hier. Die is
// er dus altijd, ook als iemand deze component vergeet.
//
// LET OP — hoort op termijn in `src/components/os/`. Staat hier omdat de agenda
// 'm het eerst nodig had; `taken/` gebruikt 'm hiervandaan.

interface KnopProps {
  children: ReactNode
  onClick?: () => void
  /** primair = de ene actie die telt; stil = alles daarnaast. */
  variant?: 'primair' | 'stil'
  type?: 'button' | 'submit'
  disabled?: boolean
  /** Verplicht bij een knop zonder zichtbare tekst. */
  'aria-label'?: string
}

export function Knop({
  children,
  onClick,
  variant = 'stil',
  type = 'button',
  disabled = false,
  'aria-label': ariaLabel,
}: KnopProps) {
  const [hover, setHover] = useState(false)
  const [ingedrukt, setIngedrukt] = useState(false)

  const primair = variant === 'primair'
  const actief = hover && !disabled

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false)
        setIngedrukt(false)
      }}
      onMouseDown={() => setIngedrukt(true)}
      onMouseUp={() => setIngedrukt(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '8px 14px',
        borderRadius: 999,
        border: `1px solid ${primair || actief ? 'var(--brand)' : 'var(--line-strong)'}`,
        background: primair ? 'var(--brand-soft)' : actief ? 'var(--brand-soft)' : 'transparent',
        color: primair || actief ? 'var(--brand)' : 'var(--text-2)',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        // Alleen transform en kleur: geen layout-properties animeren.
        transform: ingedrukt && !disabled ? 'scale(0.98)' : 'scale(1)',
        transition:
          'color 180ms var(--ease), border-color 180ms var(--ease), background 180ms var(--ease), transform 120ms var(--ease)',
      }}
    >
      {children}
    </button>
  )
}
