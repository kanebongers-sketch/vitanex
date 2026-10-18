// ─── Fit Factory Club, training: de kenmerken van een oefening (PUUR) ───────
// Drie kenmerken waarop het schemavoorstel en het vervangen van oefeningen
// rekenen: het bewegingspatroon, de spier waar de oefening vooral op werkt en
// het materiaal. Een plek, zodat de rest van de code niet zelf hoeft te raden.
//
// De kenmerken komen uit kolommen van club_oefeningen die voor elke oefening
// gevuld zijn (gecontroleerd in migratie 444):
//   patroon          fijn patroon voor het voorstel (PATRONEN in typen.ts)
//   spiergroep       grove groep (SPIERGROEPEN)
//   spieren_primair  de spieren waar de oefening vooral op werkt (SPIEREN)
//   materiaal        (MATERIALEN)
// Daaruit volgt het grove bewegingspatroon zoals een trainer het indeelt
// (squat, hinge, duwen, trekken, lunge, core, carry, overig), zie
// bewegingspatroonVan. Een uitbreiding hoort in kenmerkenVan, zodat voorstel
// en alternatieven die automatisch meenemen.

import type { Oefening } from './rijen'
import { hoofdspieren, type Spier } from './spieren'
import type { Materiaal, Patroon, Spiergroep } from './typen'

/** Het grove bewegingspatroon: de indeling waarmee een trainer een oefening vervangt. */
export const BEWEGINGSPATRONEN = [
  'squat', 'hinge', 'lunge', 'duwen_horizontaal', 'duwen_verticaal', 'trekken_horizontaal', 'trekken_verticaal',
  'core', 'carry', 'overig',
] as const
export type Bewegingspatroon = (typeof BEWEGINGSPATRONEN)[number]

export const BEWEGINGSPATROON_LABEL: Record<Bewegingspatroon, string> = {
  squat: 'Squat',
  hinge: 'Heupscharnier',
  lunge: 'Lunge',
  duwen_horizontaal: 'Duwen (vooruit)',
  duwen_verticaal: 'Duwen (omhoog)',
  trekken_horizontaal: 'Trekken (naar je toe)',
  trekken_verticaal: 'Trekken (omlaag)',
  core: 'Romp',
  carry: 'Dragen',
  overig: 'Overig',
}

export interface OefeningKenmerken {
  /** Het fijne patroon uit de database (squat, heupscharnier, isolatie, ...), of null als het nog niet ingevuld is. */
  patroon: Patroon | null
  /** Het grove bewegingspatroon; isolatie, cardio en losse sprongen vallen onder overig. */
  bewegingspatroon: Bewegingspatroon
  /** De grove spiergroep (borst, rug, benen, ...). */
  spiergroep: Spiergroep
  /** De spier waar de oefening het meest op werkt; bij ontbrekende spieren een schatting uit de spiergroep. */
  primaireSpier: Spier | null
  /** Alle spieren waar de oefening vooral op werkt (of de schatting). */
  hoofdspieren: readonly Spier[]
  materiaal: Materiaal
}

export type MetKenmerken = Pick<Oefening, 'patroon' | 'spierenPrimair' | 'spiergroep' | 'materiaal'> & {
  /** Optioneel: nodig om dragen (farmer walk, suitcase carry) te herkennen. */
  naam?: string
}

/** Dragen staat in de database als patroon core; de naam maakt het verschil. */
const DRAGEN = /\b(farmer|carry|draag|draagt|dragen)\b/i

const PATROON_NAAR_BEWEGING: Readonly<Record<Patroon, Bewegingspatroon>> = {
  squat: 'squat',
  heupscharnier: 'hinge',
  lunge: 'lunge',
  duwen_horizontaal: 'duwen_horizontaal',
  duwen_verticaal: 'duwen_verticaal',
  trekken_horizontaal: 'trekken_horizontaal',
  trekken_verticaal: 'trekken_verticaal',
  core: 'core',
  isolatie: 'overig',
  cardio: 'overig',
  explosief: 'overig',
}

/** Het grove bewegingspatroon van een oefening. */
export function bewegingspatroonVan(o: Pick<MetKenmerken, 'patroon' | 'spiergroep' | 'naam'>): Bewegingspatroon {
  if (o.naam && DRAGEN.test(o.naam)) return 'carry'
  if (o.patroon === null) return 'overig'
  // Een sprong met de benen (squat jump, box jump) is een squatbeweging.
  if (o.patroon === 'explosief' && o.spiergroep === 'benen') return 'squat'
  return PATROON_NAAR_BEWEGING[o.patroon]
}

export function kenmerkenVan(o: MetKenmerken): OefeningKenmerken {
  const spieren = hoofdspieren(o)
  return {
    patroon: o.patroon,
    bewegingspatroon: bewegingspatroonVan(o),
    spiergroep: o.spiergroep,
    primaireSpier: spieren[0] ?? null,
    hoofdspieren: spieren,
    materiaal: o.materiaal,
  }
}
