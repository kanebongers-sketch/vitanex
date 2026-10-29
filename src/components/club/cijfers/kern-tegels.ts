// De kerncijfers van een maand: welke er zijn, hoe ze worden opgemaakt en of
// hoger of lager beter is. Een plek, zodat de strook, het overzicht van 12
// maanden en de CSV dezelfde definities gebruiken.

import type { Dekking, Maandcijfers } from '@/lib/club/cijfers/maandcijfers'
import { eenDecimaal, heel, metTeken, metTekenDecimaal, metTekenProcent, procent } from '@/lib/club/cijfers/opmaak'
import { oordeel, vergelijk, type Beter, type Oordeel } from '@/lib/club/cijfers/vergelijking'
import type { Kant, Rapport } from '@/lib/club/cijfers/rapport'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { CIJFERS } from '@/lib/aiyourgym/taal/woorden/club/cijfers'

// De namen komen uit het woordenboek (bron in het Nederlands); in beeld via tegelLabel(t, taal).
const L = CIJFERS.nl.tegels

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
  { sleutel: 'bestandBegin', label: L.bestandBegin, waarde: (c) => c.bestandBegin, soort: 'aantal', beter: null, nodig: ['leden'] },
  { sleutel: 'bestandEind', label: L.bestandEind, waarde: (c) => c.bestandEind, soort: 'aantal', beter: 'hoger', nodig: ['leden'] },
  { sleutel: 'instroom', label: L.instroom, waarde: (c) => c.instroom, soort: 'aantal', beter: 'hoger', nodig: ['leden'] },
  { sleutel: 'uitstroom', label: L.uitstroom, waarde: (c) => c.uitstroom, soort: 'aantal', beter: 'lager', nodig: ['leden'] },
  { sleutel: 'groei', label: L.groei, waarde: (c) => c.groei, soort: 'teken', beter: 'hoger', nodig: ['leden'] },
  { sleutel: 'bezoek', label: L.bezoek, waarde: (c) => c.bezoek, soort: 'aantal', beter: 'hoger', nodig: ['bezoek'] },
  { sleutel: 'perLid', label: L.perLid, waarde: (c) => c.bezoekPerLidPerWeek, soort: 'decimaal', beter: 'hoger', nodig: ['bezoek', 'leden'] },
  { sleutel: 'bezetting', label: L.bezetting, waarde: (c) => c.bezetting, soort: 'procent', beter: 'hoger', nodig: ['lessen'] },
  { sleutel: 'noShow', label: L.noShow, waarde: (c) => c.noShow, soort: 'procent', beter: 'lager', nodig: ['lessen'] },
  { sleutel: 'leads', label: L.leads, waarde: (c) => c.leads, soort: 'aantal', beter: 'hoger', nodig: ['leads'] },
  { sleutel: 'conversie', label: L.conversie, waarde: (c) => c.conversie, soort: 'procent', beter: 'hoger', nodig: ['leads'] },
]

export function tegel(sleutel: string): Tegel {
  const t = TEGELS.find((x) => x.sleutel === sleutel)
  if (!t) throw new Error(`Onbekend kerncijfer: ${sleutel}`)
  return t
}

/** De naam van een kerncijfer in de gekozen taal. */
export function tegelLabel(t: Pick<Tegel, 'sleutel' | 'label'>, taal: Taal = 'nl'): string {
  return CIJFERS[taal].tegels[t.sleutel as keyof typeof L] ?? t.label
}

/** De waarde zelf, of "geen data". */
export function toon(w: number | null, soort: Soort, taal: Taal = 'nl'): string {
  if (w === null) return CIJFERS[taal].algemeen.geenData
  if (soort === 'procent') return procent(w, taal)
  if (soort === 'decimaal') return eenDecimaal(w, taal)
  if (soort === 'teken') return metTeken(w, taal)
  return heel(w, taal)
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
export function vergelijkTekst(t: Tegel, huidig: Kant, basis: Kant, taal: Taal = 'nl'): VergelijkTekst {
  const w = CIJFERS[taal].vergelijking
  const v = gedekt(t, huidig.dekking) && gedekt(t, basis.dekking) ? vergelijk(t.waarde(huidig.cijfers), t.waarde(basis.cijfers)) : null
  if (!v) return { tekst: w.geen, oordeel: null }
  if (t.soort === 'procent') return { tekst: w.procentpunt(metTeken(v.verschil * 100, taal)), oordeel: oordeel(v, t.beter, 0.0005) }
  if (t.soort === 'decimaal') return { tekst: metTekenDecimaal(v.verschil, taal), oordeel: oordeel(v, t.beter, 0.05) }
  const rel = v.relatief === null || Math.abs(v.relatief) < 0.005 ? '' : ` (${metTekenProcent(v.relatief, taal)})`
  return { tekst: `${metTeken(v.verschil, taal)}${rel}`, oordeel: oordeel(v, t.beter, 0.5) }
}

/**
 * Het verloop van een kerncijfer over de maanden van het rapport (oudste eerst),
 * voor de sparklijn. Een maand van voor de eerste data is null (een gat), zoals
 * in het overzicht van 12 maanden.
 */
export function reeksVan(t: Tegel, r: Pick<Rapport, 'trend' | 'vanaf'>): (number | null)[] {
  return r.trend.map((k) => {
    const begin = t.nodig.map((n) => r.vanaf[n])
    if (begin.some((b) => b === null || b > k.venster.tot)) return null
    return t.waarde(k.cijfers)
  })
}
