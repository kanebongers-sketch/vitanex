// Het formulier van een bericht: begintoestand en wat er naar de API gaat (CLIENT).

import type { LidStatus } from '@/lib/club/kern/lid'
import type { Bericht, BerichtSoort } from '@/lib/club/berichten/model'
import { datumNaarLokaal } from '@/lib/club/berichten/tijd'

export interface Concept {
  titel: string
  tekst: string
  soort: BerichtSoort
  /** Leeg = alle vestigingen. */
  vestigingen: string[]
  statussen: LidStatus[]
  tag: string
  van: string
  tot: string
  vastgepind: boolean
}

export function nieuwConcept(nu: Date): Concept {
  return { titel: '', tekst: '', soort: 'nieuws', vestigingen: [], statussen: [], tag: '', van: datumNaarLokaal(nu), tot: '', vastgepind: false }
}

export function conceptVan(b: Bericht): Concept {
  return {
    titel: b.titel,
    tekst: b.tekst,
    soort: b.soort,
    vestigingen: b.vestigingen,
    statussen: b.statussen,
    tag: b.tag ?? '',
    van: datumNaarLokaal(new Date(b.zichtbaarVan)),
    tot: b.zichtbaarTot ? datumNaarLokaal(new Date(b.zichtbaarTot)) : '',
    vastgepind: b.vastgepind,
  }
}

/** Een waarde in een lijst aan of uit zetten (nieuwe lijst). */
export function wissel<T>(lijst: readonly T[], waarde: T): T[] {
  return lijst.includes(waarde) ? lijst.filter((x) => x !== waarde) : [...lijst, waarde]
}
