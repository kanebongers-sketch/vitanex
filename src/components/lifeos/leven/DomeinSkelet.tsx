// Het skelet van een domein-overzicht: een rij lege statistieken.
//
// Statisch, net als de kaart-skeletten in de cockpit. Een pulserend vlak is
// beweging zonder betekenis, en `prefers-reduced-motion` zou 'm meteen weer
// moeten uitzetten — dan kun je 'm net zo goed niet bouwen.

export function DomeinSkelet({ statistieken = 2 }: { statistieken?: number }) {
  return (
    <div aria-hidden="true" className="os-statrij">
      {Array.from({ length: statistieken }, (_, i) => (
        <div key={i} style={{ display: 'grid', gap: 6 }}>
          <div style={{ height: 24, width: 56, borderRadius: 6, background: 'var(--bg-raised)' }} />
          <div style={{ height: 10, width: 82, borderRadius: 4, background: 'var(--bg-raised)' }} />
        </div>
      ))}
    </div>
  )
}
