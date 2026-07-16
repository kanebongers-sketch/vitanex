import { Children, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface MeerLadeProps {
  /** Wat erin zit, kort. Bv. "Meer van je ochtend". */
  titel: string
  children: ReactNode
}

/**
 * Het ene disclosure-mechanisme van LifeOS.
 *
 * Kane wil 23 dingen kunnen zien. Alle 23 tegelijk tonen ís de rommel die we
 * wilden vermijden. Elk moment toont daarom vier kaarten die er nú toe doen; de
 * rest zit hier — één tik weg, nul tikken in de weg.
 *
 * Bewust native `<details>` en niet een eigen uitklap-component:
 *  - toetsenbord, screenreader en `aria-expanded` zitten er gratis in;
 *  - ctrl+F vindt gesloten inhoud (browsers klappen zelf open);
 *  - het kost geen `'use client'`, dus geen JS voor een lade.
 *
 * Eén mechanisme, drie momenten, consequent. Geen menubalk met twintig items.
 */
export function MeerLade({ titel, children }: MeerLadeProps) {
  // Tellen in plaats van een prop: een handmatig aantal loopt uit de pas zodra
  // iemand een kaart toevoegt, en dan liegt de UI over zichzelf.
  const aantal = Children.count(children)

  return (
    <section aria-label={titel}>
      <details className="os-lade">
        <summary className="os-lade__knop">
          <ChevronRight className="os-lade__pijl" size={15} strokeWidth={2.4} aria-hidden="true" />
          <span>{titel}</span>
          <span className="os-lade__aantal os-cijfer">{aantal}</span>
        </summary>
        <div className="os-lade__inhoud">
          <div className="os-lade__raster">{children}</div>
        </div>
      </details>
    </section>
  )
}
