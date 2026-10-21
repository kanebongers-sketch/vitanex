import type { CSSProperties, ReactNode } from 'react'

// Een rustig scherm zonder merknaam, voor het laden, een fout en de 404 zolang de
// site dicht is. Zonder hooks, zodat het in server- en clientcomponenten werkt.

const VLAK: CSSProperties = {
  minHeight: '100dvh',
  display: 'grid',
  placeItems: 'center',
  padding: '48px 20px',
  fontFamily: 'var(--ayg-f-tekst), system-ui, -apple-system, "Segoe UI", sans-serif',
  textAlign: 'center',
}

const INHOUD: CSSProperties = {
  display: 'grid',
  justifyItems: 'center',
  gap: 14,
  maxWidth: 420,
}

const KOP: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--ayg-f-kop), "Arial Narrow", Arial, sans-serif',
  fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
  fontWeight: 700,
  letterSpacing: '-0.03em',
  lineHeight: 1.05,
}

const TEKST: CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  lineHeight: 1.55,
  opacity: 0.72,
}

interface NeutraalProps {
  titel: string
  tekst?: string
  children?: ReactNode
}

export function Neutraal({ titel, tekst, children }: NeutraalProps) {
  return (
    <main style={VLAK}>
      <div style={INHOUD}>
        <h1 style={KOP}>{titel}</h1>
        {tekst && <p style={TEKST}>{tekst}</p>}
        {children}
      </div>
    </main>
  )
}

export const NEUTRALE_KNOP: CSSProperties = {
  marginTop: 10,
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
  padding: '0 22px',
  borderRadius: 999,
  border: '1.5px solid currentColor',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
}
