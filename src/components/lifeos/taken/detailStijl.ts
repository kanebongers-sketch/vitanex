import type { CSSProperties } from 'react'

// De stijl van één veld in het taak-detail. Gedeeld door `TaakDetail` en
// `FeitVelden`: één bron, anders staat het label van "impact" straks 1px anders
// dan dat van "deadline" en ziet niemand waarom.
//
// Alleen tokens uit `.lifeos-root` (globals.css) — geen hardcoded kleuren.

export const VELD: CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 0,
  margin: 0,
  border: 'none',
  minWidth: 0,
}

export const LABEL: CSSProperties = {
  padding: 0,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-3)',
}

/** De uitleg onder een veld. Klein, rustig — het staat er om te helpen, niet om op te vallen. */
export const HINT: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.4,
  color: 'var(--text-4)',
}

export const INVOER: CSSProperties = {
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
}
