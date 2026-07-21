import { TrendingUp } from 'lucide-react'
import type { NieuweKlanten } from '@/lib/lifeos/analyse/analyse-data'
import { maandLabel } from './analyse-format'

// Groei — nieuwe klanten per startmaand als kleine staafjes. De staaf is
// decoratief (aria-hidden), het aantal en de maand staan als tekst in de lijst.
// Hoogte is statisch berekend t.o.v. de drukste maand; er wordt niets aan height
// geanimeerd.

interface GroeiStaafjesProps {
  rijen: readonly NieuweKlanten[]
}

export function GroeiStaafjes({ rijen }: GroeiStaafjesProps) {
  const max = rijen.reduce((hoogste, rij) => Math.max(hoogste, rij.aantal), 0)

  return (
    <section className="anl-sectie" aria-label="Nieuwe klanten per maand">
      <div className="anl-sectie-kop">
        <h2 className="anl-sectie-titel">
          <TrendingUp size={17} strokeWidth={2} aria-hidden="true" />
          Groei — nieuwe klanten per maand
        </h2>
        <p className="anl-sectie-bij">Op startdatum van het traject, uit de import.</p>
      </div>

      <ul className="anl-groei">
        {rijen.map((rij) => (
          <li key={rij.maand}>
            <span className="anl-groei-getal">{rij.aantal}</span>
            <div className="anl-groei-kolom" aria-hidden="true">
              <div
                className="anl-groei-staaf"
                style={{ height: max > 0 ? `${(rij.aantal / max) * 100}%` : '0%' }}
              />
            </div>
            <span className="anl-groei-maand">{maandLabel(rij.maand)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
