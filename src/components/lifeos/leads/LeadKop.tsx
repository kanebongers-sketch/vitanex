/** Woordmerk + titel bovenaan de lead-pagina. */
export function LeadKop({ titel, children }: { titel: string; children?: React.ReactNode }) {
  return (
    <header style={{ display: 'grid', gap: 6 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', color: 'var(--text-3)' }}>
        MENTAFORCE<span style={{ color: 'var(--brand)' }}>.</span> · LEAD TRACKER
      </p>
      <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.15, fontWeight: 600, color: 'var(--text-1)' }}>{titel}</h1>
      {children}
    </header>
  )
}
