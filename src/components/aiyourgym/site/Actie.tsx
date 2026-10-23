import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { GERUSTSTELLING } from '@/components/aiyourgym/inhoud/conversie'
import { Knop } from './bouwstenen'
import { AANMELDEN, DEMO, DEMO_AANVRAGEN } from './paden'

// De oproep om te beginnen, met vlak erbij wat het risico wegneemt. Staat onder
// de held, na elke grote sectie en in de aanmeldband.

interface GeruststellingProps {
  /** Hoeveel punten (vanaf het begin van de lijst). */
  aantal?: number
  /** Met wat ruimte erboven, direct onder een rij knoppen. */
  onder?: boolean
}

/** Onder elke aanmeldknop: minstens de eerste drie (proef, stoppen kost niets, geen opstartkosten). */
export const GERUST_BIJ_KNOP = 3

export function Geruststelling({ aantal = GERUSTSTELLING.length, onder = false }: GeruststellingProps) {
  return (
    <ul className={onder ? 'ayg-gerust ayg-gerust--onder' : 'ayg-gerust'} aria-label="Zonder risico">
      {GERUSTSTELLING.slice(0, aantal).map((g) => (
        <li key={g}>
          <Check size={15} strokeWidth={2.6} aria-hidden />
          {g}
        </li>
      ))}
    </ul>
  )
}

interface SectieActieProps {
  /** Een korte zin die de sectie afrondt, boven de knop. */
  zin?: string
}

/** De twee routes naast elkaar: zelf proberen, of een persoonlijke demo plannen. */
export function TweeRoutes() {
  return (
    <div className="ayg-knoppen">
      <Knop href={AANMELDEN} soort="accent" pijl>
        Probeer {PROEFDAGEN} dagen gratis
      </Knop>
      <Knop href={DEMO_AANVRAGEN} soort="rand">
        Plan een gratis demo
      </Knop>
    </div>
  )
}

/** Na een grote sectie: gratis proberen, een demo plannen, de live demo als rustige derde keus en geruststelling. */
export function SectieActie({ zin }: SectieActieProps) {
  return (
    <div className="ayg-sectie-actie">
      {zin && <p className="ayg-sectie-actie-zin">{zin}</p>}
      <div className="ayg-knoppen">
        <TweeRoutes />
        <Link href={DEMO} className="ayg-pijllink">
          Of bekijk de live demo <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <Geruststelling aantal={GERUST_BIJ_KNOP} />
    </div>
  )
}
