import { VOORBEELD_NAAM } from './voorbeeld'

// Het verzonnen woordmerk van Kernhal in de productbeelden: een eigen teken (een K
// van een staande balk en een punthaak) plus de naam in kapitalen. Kleuren komen uit
// --brand en --brand-inkt (mockups.css), zodat de huisstijl-demo het teken meekleurt.
// Puur, zonder hooks: bruikbaar in server- en clientcomponenten.

interface Props {
  className: string
}

export function KernhalMerk({ className }: Props) {
  return (
    <span className={className}>
      <svg viewBox="0 0 24 24" className="aygm-merk-teken" aria-hidden focusable="false">
        <rect width="24" height="24" rx="6" />
        <path d="M6.5 5.5h3.2v13H6.5z" />
        <path d="M10.6 12l4.9-6.5h3.8L14.4 12l4.9 6.5h-3.8z" />
      </svg>
      <span className="aygm-merk-woord">{VOORBEELD_NAAM}</span>
    </span>
  )
}
