// De kerncijfers van een maand: welke er zijn, hoe ze worden opgemaakt en of
// hoger of lager beter is. Een plek, zodat de strook, het overzicht van 12
// maanden en de CSV dezelfde definities gebruiken.

import type { Dekking, Maandcijfers } from '@/lib/club/cijfers/maandcijfers'
import { eenDecimaal, heel, metTeken, metTekenDecimaal, metTekenProcent, procent } from '@/lib/club/cijfers/opmaak'
import { oordeel, vergelijk, type Beter, type Oordeel } from '@/lib/club/cijfers/vergelijking'
import type { Kant } from '@/lib/club/cijfers/rapport'

export type Soort = 'aantal' | 'teken' | 'procent' | 'decimaal'

export interface Tegel {
  sleutel: string
  label: string
  waarde: (c: Maandcijfers) => number | null
  soort: Soort
  beter: Beter
  /** Welke bronnen er moeten zijn om eerlijk te vergelijken. */
  nodig: readonly (keyof Dekking)[]
}

export const TEGELS: readonly Tegel[] = [
  { sleutel: 'bestandBegin', label: 'Ledenbestand begin', waarde: (c) => c.bestandBegin, soort: 'aantal', beter: null, nodig: ['leden'] },
  { sleutel: 'bestandEind', label: 'Ledenbestand eind', waarde: (c) => c.bestandEind, soort: 'aantal', beter: 'hoger', nodig: ['leden'] },
  { sleutel: 'instroom', label: 'Instroom', waarde: (c) => c.instroom, soort: 'aantal', beter: 'hoger', nodig: ['leden'] },
  { sleutel: 'uitstroom', label: 'Uitstroom', waarde: (c) => c.uitstroom, soort: 'aantal', beter: 'lager', nodig: ['leden'] },
  { sleutel: 'groei', label: 'Groei', waarde: (c) => c.groei, soort: 'teken', beter: 'hoger', nodig: ['leden'] },
  { sleutel: 'bezoek', label: 'Bezoeken', waarde: (c) => c.bezoek, soort: 'aantal', beter: 'hoger', nodig: ['bezoek'] },
  { sleutel: 'perLid', label: 'Bezoek per lid per week', waarde: (c) => c.bezoekPerLidPerWeek, soort: 'decimaal', beter: 'hoger', nodig: ['bezoek', 'leden'] },
  { sleutel: 'bezetting', label: 'Bezetting lessen', waarde: (c) => c.bezetting, soort: 'procent', beter: 'hoger', nodig: ['lessen'] },
  { sleutel: 'noShow', label: 'No-show', waarde: (c) => c.noShow, soort: 'procent', beter: 'lager', nodig: ['lessen'] },
  { sleutel: 'leads', label: 'Leads', waarde: (c) => c.leads, soort: 'aantal', beter: 'hoger', nodig: ['leads'] },
  { sleutel: 'conversie', label: 'Leadconversie', waarde: (c) => c.conversie, soort: 'procent', beter: 'hoger', nodig: ['leads'] },
]

export function tegel(sleutel: string): Tegel {
  const t = TEGELS.find((x) => x.sleutel === sleutel)
  if (!t) throw new Error(`Onbekend kerncijfer: ${sleutel}`)
  return t
}

/** De waarde zelf, of "geen data". */
export function toon(w: number | null, soort: Soort): string {
  if (w === null) return 'geen data'
  if (soort === 'procent') return procent(w)
  if (soort === 'decimaal') return eenDecimaal(w)
  if (soort === 'teken') return metTeken(w)
  return heel(w)
}

/** Waarde voor CSV: procenten als getal met een decimaal (73,4). */
export function csvWaarde(w: number | null, soort: Soort): number | null {
  if (w === null) return null
  if (soort === 'procent') return Math.round(w * 1000) / 10
  if (soort === 'decimaal') return Math.round(w * 100) / 100
  return w
}

export function gedekt(t: Tegel, d: Dekking): boolean {
  return t.nodig.every((n) => d[n])
}

export interface VergelijkTekst {
  tekst: string
  oordeel: Oordeel | null
}

/** "+12 (+4%)", "+3 procentpunt" of "geen vergelijking". */
export function vergelijkTekst(t: Tegel, huidig: Kant, basis: Kant): VergelijkTekst {
  const v = gedekt(t, huidig.dekking) && gedekt(t, basis.dekking) ? vergelijk(t.waarde(huidig.cijfers), t.waarde(basis.cijfers)) : null
  if (!v) return { tekst: 'geen vergelijking', oordeel: null }
  if (t.soort === 'procent') return { tekst: `${metTeken(v.verschil * 100)} procentpunt`, oordeel: oordeel(v, t.beter, 0.0005) }
  if (t.soort === 'decimaal') return { tekst: metTekenDecimaal(v.verschil), oordeel: oordeel(v, t.beter, 0.05) }
  const rel = v.relatief === null ? '' : ` (${metTekenProcent(v.relatief)})`
  return { tekst: `${metTeken(v.verschil)}${rel}`, oordeel: oordeel(v, t.beter, 0.5) }
}
