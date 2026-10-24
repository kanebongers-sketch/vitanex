import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { GERUSTSTELLING } from '@/components/aiyourgym/inhoud/conversie'
import { siteTekst, getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { Knop } from './bouwstenen'
import { SITE_PADEN } from './paden'

// De oproep om te beginnen, met vlak erbij wat het risico wegneemt. Staat onder
// de held, na elke grote sectie en in de aanmeldband. In de taal van de pagina
// (woordenboek ACTIE); de Nederlandse zinnen zijn GERUSTSTELLING.

interface GeruststellingProps {
  /** Hoeveel punten (vanaf het begin van de lijst). */
  aantal?: number
  /** Met wat ruimte erboven, direct onder een rij knoppen. */
  onder?: boolean
}

/** Onder elke aanmeldknop: minstens de eerste drie (proef, stoppen kost niets, geen opstartkosten). */
export const GERUST_BIJ_KNOP = 3

export async function Geruststelling({ aantal = GERUSTSTELLING.length, onder = false }: GeruststellingProps) {
  const t = await siteTekst(ACTIE)
  return (
    <ul className={onder ? 'ayg-gerust ayg-gerust--onder' : 'ayg-gerust'} aria-label={t.zonderRisico}>
      {t.geruststelling.slice(0, aantal).map((g) => (
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
export async function TweeRoutes() {
  const taal = await getSiteTaal()
  const t = ACTIE[taal]
  const { AANMELDEN, DEMO_AANVRAGEN } = SITE_PADEN
  return (
    <div className="ayg-knoppen">
      <Knop href={AANMELDEN} soort="accent" pijl>
        {t.probeerDagen(PROEFDAGEN)}
      </Knop>
      <Knop href={DEMO_AANVRAGEN} soort="rand">
        {t.planDemo}
      </Knop>
    </div>
  )
}

/** Na een grote sectie: gratis proberen, een demo plannen, de live demo als rustige derde keus en geruststelling. */
export async function SectieActie({ zin }: SectieActieProps) {
  const taal = await getSiteTaal()
  const { DEMO } = SITE_PADEN
  return (
    <div className="ayg-sectie-actie">
      {zin && <p className="ayg-sectie-actie-zin">{zin}</p>}
      <div className="ayg-knoppen">
        <TweeRoutes />
        <Link href={DEMO} className="ayg-pijllink">
          {ACTIE[taal].ofLiveDemo} <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <Geruststelling aantal={GERUST_BIJ_KNOP} />
    </div>
  )
}
