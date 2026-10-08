import type { CSSProperties } from 'react'

/** Invoerveld op de lead-pagina: 16px tekst, zodat iOS niet inzoomt bij focus. */
export const veldStijl: CSSProperties = {
  appearance: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  fontSize: 16,
  color: 'var(--text-1)',
  background: 'var(--bg-raised)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '11px 12px',
}
