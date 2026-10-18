import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { GERUSTSTELLING } from '@/components/aiyourgym/inhoud/conversie'
import { Knop } from './bouwstenen'
import { AANMELDEN, DEMO } from './paden'

// De oproep om te beginnen, met vlak erbij wat het risico wegneemt. Staat onder
// de held, na elke grote sectie en in de aanmeldband.

interface GeruststellingProps {
  /** Hoeveel punten (vanaf het begin van de lijst). */
  aantal?: number
}

export function Geruststelling({ aantal = GERUSTSTELLING.length }: GeruststellingProps) {
  return (
    <ul className="ayg-gerust" aria-label="Zonder risico">
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

/** Na een grote sectie: de primaire knop, de demo als rustige tweede keus en geruststelling. */
export function SectieActie({ zin }: SectieActieProps) {
  return (
    <div className="ayg-sectie-actie">
      {zin && <p className="ayg-sectie-actie-zin">{zin}</p>}
      <div className="ayg-knoppen">
        <Knop href={AANMELDEN} soort="accent" pijl>
          Probeer {PROEFDAGEN} dagen gratis
        </Knop>
        <Link href={DEMO} className="ayg-pijllink">
          Of bekijk eerst de demo <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <Geruststelling aantal={2} />
    </div>
  )
}
