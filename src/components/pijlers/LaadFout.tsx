'use client'

interface LaadFoutProps {
  /** Wat er niet geladen kon worden, in de woorden van de gebruiker. */
  wat?: string
  onOpnieuw: () => void
}

/**
 * Foutstaat bij het laden van pijlerdata.
 *
 * Bestaat omdat "we konden het niet laden" en "jij hebt niets gemeten" nooit
 * dezelfde zin mogen zijn: wie drie weken trouw logt en bij een netwerkfout
 * "Nog niet gemeten" leest, verliest terecht het vertrouwen in élk ander getal
 * in de app. `role="alert"` zodat screenreaders de statuswijziging horen
 * (WCAG 4.1.3).
 */
export function LaadFout({ wat = 'je overzicht', onOpnieuw }: LaadFoutProps) {
  return (
    <div
      role="alert"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '24px 22px',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55 }}>
        We konden {wat} niet laden. Controleer je verbinding en probeer het opnieuw —
        je gegevens zijn niet kwijt.
      </p>
      <button
        onClick={onOpnieuw}
        className="mf-fout-knop"
        style={{
          background: 'var(--brand)',
          color: 'var(--bg-app)',
          border: 'none',
          borderRadius: 'var(--radius-btn)',
          padding: '10px 18px',
          fontSize: 13.5,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          cursor: 'pointer',
        }}
      >
        Opnieuw proberen
      </button>
      <style>{`
        .mf-fout-knop:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
      `}</style>
    </div>
  )
}
