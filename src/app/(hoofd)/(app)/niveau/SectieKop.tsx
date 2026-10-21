import type { ReactNode } from 'react'

/** Rustige, uniforme sectiekop voor de voortgangspagina. */
export default function SectieKop({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: 'var(--text-4)', margin: '0 0 14px',
      ...style,
    }}>
      {children}
    </h2>
  )
}
