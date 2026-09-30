import type { CSSProperties } from 'react'

// Gedeelde stijl voor de signaal-lijsten onder de PT-kaart (afhaak, status,
// agenda-check): één kop-, rij- en sectievorm, zodat ze als één geheel lezen.

export const SECTIE: CSSProperties = { display: 'grid', gap: 8, paddingTop: 14, borderTop: '1px solid var(--line)' }
export const KOP: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  margin: 0,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-3)',
}
export const TOELICHTING: CSSProperties = { margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-3)' }
export const LIJST: CSSProperties = { display: 'grid', gap: 6, listStyle: 'none', padding: 0, margin: 0 }
export const RIJ: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: 13.5,
  padding: '4px 0',
}
