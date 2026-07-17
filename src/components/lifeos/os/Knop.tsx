'use client'

import Link from 'next/link'
import { useState, type CSSProperties, type ReactNode } from 'react'

// Kleine knop-primitive. Inline styles kennen geen `:hover`, dus de hover- en
// active-staat lopen via state — dat is hier bewust: een knop zonder ontworpen
// staten voelt als een link die per ongeluk een knop werd.
//
// De focus-ring komt uit globals.css (`:focus-visible`), niet van hier. Die is
// er dus altijd, ook als iemand deze component vergeet.
//
// LET OP — hoort op termijn in `src/components/os/`. Staat hier omdat de agenda
// 'm het eerst nodig had; `taken/` gebruikt 'm hiervandaan.

/** primair = de ene actie die telt; stil = alles daarnaast. */
type Variant = 'primair' | 'stil'

interface GedeeldeProps {
  children: ReactNode
  variant?: Variant
  /** Verplicht bij een knop zonder zichtbare tekst. */
  'aria-label'?: string
}

interface KnopProps extends GedeeldeProps {
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}

/**
 * Het uiterlijk, los van het element. `Knop` en `KnopLink` moeten identiek
 * ogen — anders gaat er één schuiven zodra iemand de ander bijwerkt.
 */
function stijl(primair: boolean, actief: boolean, ingedrukt: boolean, disabled: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 14px',
    borderRadius: 999,
    border: `1px solid ${primair || actief ? 'var(--brand)' : 'var(--line-strong)'}`,
    background: primair || actief ? 'var(--brand-soft)' : 'transparent',
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
  }
}

/** De hover/actief-staat die beide varianten delen. */
function useAanwijzer() {
  const [hover, setHover] = useState(false)
  const [ingedrukt, setIngedrukt] = useState(false)

  return {
    hover,
    ingedrukt,
    handlers: {
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => {
        setHover(false)
        setIngedrukt(false)
      },
      onMouseDown: () => setIngedrukt(true),
      onMouseUp: () => setIngedrukt(false),
    },
  }
}

export function Knop({
  children,
  onClick,
  variant = 'stil',
  type = 'button',
  disabled = false,
  'aria-label': ariaLabel,
}: KnopProps) {
  const { hover, ingedrukt, handlers } = useAanwijzer()
  const primair = variant === 'primair'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...handlers}
      style={stijl(primair, hover && !disabled, ingedrukt, disabled)}
    >
      {children}
    </button>
  )
}

interface KnopLinkProps extends GedeeldeProps {
  href: string
}

/**
 * Dezelfde knop, maar als échte link.
 *
 * Bestaat omdat navigatie een `<a>` hoort te zijn: middelklik, "open in nieuw
 * tabblad" en de statusbalk werken niet op een `<button onClick={router.push}>`.
 * Stond eerder als een losse `KNOP_STIJL`-kopie in `WelzijnScoreKaart` — twee
 * kopieën van hetzelfde uiterlijk die uit elkaar zouden groeien.
 *
 * Geen `disabled`: een uitgeschakelde link bestaat niet in HTML. Valt er niets
 * te navigeren, render dan geen link.
 */
export function KnopLink({ children, href, variant = 'primair', 'aria-label': ariaLabel }: KnopLinkProps) {
  const { hover, ingedrukt, handlers } = useAanwijzer()
  const primair = variant === 'primair'

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      {...handlers}
      style={{
        ...stijl(primair, hover, ingedrukt, false),
        textDecoration: 'none',
        justifySelf: 'start',
      }}
    >
      {children}
    </Link>
  )
}
