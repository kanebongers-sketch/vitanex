// ─── Fit Factory Club, training: alternatieven voor een oefening (PUUR) ─────
// Welke oefening kan in de plaats van een andere? Een trainer zou kijken naar
// hetzelfde bewegingspatroon en dezelfde spier waar het om draait. Daarna naar
// het materiaal dat er is en dat het lid al gebruikt. Gebruikt door:
//   - de schema-editor (knop "Vervang", de trainer kiest),
//   - de ledenapp (toestel bezet, "Andere oefening" voor alleen deze training),
//   - de server, die controleert dat een gelogde set bij de dag of bij een
//     toegestaan alternatief hoort.

import type { AppOefening, AppSchemaDag } from '@/lib/club/app/schema'
import type { OefeningBeelden } from './beeld'
import { kenmerkenVan } from './oefening-kenmerken'
import type { Oefening } from './rijen'
import type { Spier } from './spieren'
import { MATERIALEN, type Materiaal, type Niveau, type Zone } from './typen'

/** Hoe goed past een kandidaat: 2 = zelfde patroon en zelfde hoofdspier, 1 = zelfde patroon en de hoofdspier werkt mee, 0 = niet. */
export type Overeenkomst = 0 | 1 | 2

export function overeenkomst(origineel: Oefening, kandidaat: Oefening): Overeenkomst {
  if (origineel.id === kandidaat.id) return 0
  const a = kenmerkenVan(origineel)
  const b = kenmerkenVan(kandidaat)
  if (!a.primaireSpier) return 0
  // Zonder patroon is de spiergroep het enige houvast: dan alleen een exacte match.
  if (a.patroon === null || b.patroon === null) {
    return a.patroon === b.patroon && origineel.spiergroep === kandidaat.spiergroep && a.primaireSpier === b.primaireSpier ? 2 : 0
  }
  // Het fijne patroon en het grove bewegingspatroon (dragen is geen plank) moeten allebei gelijk zijn.
  if (a.patroon !== b.patroon || a.bewegingspatroon !== b.bewegingspatroon) return 0
  if (a.primaireSpier === b.primaireSpier) return 2
  return b.hoofdspieren.includes(a.primaireSpier) ? 1 : 0
}

/**
 * Materiaal in volgorde van voorkeur: eerst wat in het schema van het lid staat
 * (vaakst eerst), dan wat de sportschool het meest in de bibliotheek heeft,
 * dan de rest. Zo komt bovenaan wat er in die club echt staat.
 */
export function materiaalVolgorde(gebruikt: readonly { materiaal: Materiaal }[], bibliotheek: readonly { materiaal: Materiaal; actief?: boolean }[]): Materiaal[] {
  const tel = (lijst: readonly { materiaal: Materiaal }[]) => {
    const n = new Map<Materiaal, number>()
    for (const o of lijst) n.set(o.materiaal, (n.get(o.materiaal) ?? 0) + 1)
    return n
  }
  const schema = tel(gebruikt)
  const club = tel(bibliotheek.filter((o) => o.actief !== false))
  return [...MATERIALEN].sort((a, b) => (schema.get(b) ?? 0) - (schema.get(a) ?? 0) || (club.get(b) ?? 0) - (club.get(a) ?? 0) || MATERIALEN.indexOf(a) - MATERIALEN.indexOf(b))
}

export interface AlternatiefOpties {
  /** Volgorde van materiaal (zie materiaalVolgorde). Zonder: de vaste volgorde. */
  volgorde?: readonly Materiaal[]
  /** Niet aanbieden, bijvoorbeeld oefeningen die al op deze dag staan. */
  uitsluiten?: ReadonlySet<string>
  /**
   * Voor het lid zelf, zonder trainer erbij: nooit zwaarder dan het origineel.
   * Geen hoger niveau en geen gewricht extra belast dat het origineel spaart.
   */
  voorLid?: boolean
  /** Gewrichten die het lid moet sparen (klachten uit de intake). */
  sparen?: readonly Zone[]
  /** Hoeveel alternatieven hooguit (standaard 12). */
  max?: number
}

function veiligVoorLid(origineel: Oefening, k: Oefening): boolean {
  return k.niveau <= origineel.niveau && k.belast.every((z) => origineel.belast.includes(z))
}

/**
 * De alternatieven, best passend eerst: zelfde hoofdspier boven meewerkend,
 * dan het materiaal in de volgorde van de club, dan een niveau dat dicht bij
 * het origineel ligt, dan de naam. Alleen actieve oefeningen.
 */
export function alternatievenVoor(origineel: Oefening, oefeningen: readonly Oefening[], opties: AlternatiefOpties = {}): Oefening[] {
  const volgorde = opties.volgorde ?? MATERIALEN
  const rang = (m: Materiaal) => {
    const i = volgorde.indexOf(m)
    return i < 0 ? volgorde.length : i
  }
  const sparen = opties.sparen ?? []
  const kandidaten = oefeningen
    .filter((k) => k.actief && !opties.uitsluiten?.has(k.id))
    .filter((k) => !k.belast.some((z) => sparen.includes(z)))
    .filter((k) => !opties.voorLid || veiligVoorLid(origineel, k))
    .map((k) => ({ k, m: overeenkomst(origineel, k) }))
    .filter((x) => x.m > 0)
  kandidaten.sort(
    (a, b) =>
      b.m - a.m ||
      rang(a.k.materiaal) - rang(b.k.materiaal) ||
      Math.abs(a.k.niveau - origineel.niveau) - Math.abs(b.k.niveau - origineel.niveau) ||
      a.k.naam.localeCompare(b.k.naam, 'nl'),
  )
  return kandidaten.slice(0, opties.max ?? 12).map((x) => x.k)
}

/**
 * Welke oefeningen een lid op deze schemadag mag loggen: de oefeningen van de
 * dag plus hun alternatieven met de regels voor het lid (voorLid). De server
 * gebruikt dit, zodat een lid niet zomaar elke oefening kan loggen.
 */
export function toegestaanMetAlternatieven(dagIds: ReadonlySet<string>, oefeningen: readonly Oefening[]): Set<string> {
  const uit = new Set(dagIds)
  const perId = new Map(oefeningen.map((o) => [o.id, o]))
  for (const id of dagIds) {
    const o = perId.get(id)
    if (!o) continue
    for (const alt of alternatievenVoor(o, oefeningen, { voorLid: true, max: oefeningen.length })) uit.add(alt.id)
  }
  return uit
}

// ── Ledenapp ────────────────────────────────────────────────────────────────

/** Wat de ledenapp van een alternatief nodig heeft (geen interne velden). */
export interface AppAlternatief {
  oefeningId: string
  naam: string
  materiaal: Materiaal
  niveau: Niveau
  spiergroep: string
  spierenPrimair: Spier[]
  spierenSecundair: Spier[]
  uitleg: string | null
  aandachtspunten: string | null
  beeld: OefeningBeelden | null
  /** 2 = zelfde hoofdspier, 1 = de hoofdspier werkt mee. */
  overeenkomst: Overeenkomst
}

export function naarAppAlternatief(origineel: Oefening, o: Oefening): AppAlternatief {
  return {
    oefeningId: o.id,
    naam: o.naam,
    materiaal: o.materiaal,
    niveau: o.niveau,
    spiergroep: o.spiergroep,
    spierenPrimair: o.spierenPrimair,
    spierenSecundair: o.spierenSecundair,
    uitleg: o.uitleg,
    aandachtspunten: o.aandachtspunten,
    beeld: o.beeld,
    overeenkomst: overeenkomst(origineel, o),
  }
}

const WISSEL_NOTITIE = /^Vandaag in plaats van (.+)\.$/

function oorspronkelijkeNaam(o: AppOefening): string {
  return WISSEL_NOTITIE.exec(o.notitie ?? '')?.[1] ?? o.naam
}

/**
 * Wissel een oefening op een dag voor alleen deze training. Sets, herhalingen,
 * rust en supersets blijven; het gewicht niet (een andere oefening, ander gewicht).
 * Het regel-id blijft gelijk, zodat al ingevulde sets op hun plek blijven.
 */
export function wisselOefening(dag: AppSchemaDag, regelId: string, alt: AppAlternatief): AppSchemaDag {
  return {
    ...dag,
    oefeningen: dag.oefeningen.map((o): AppOefening =>
      o.id !== regelId
        ? o
        : {
            ...o,
            oefeningId: alt.oefeningId,
            naam: alt.naam,
            spiergroep: alt.spiergroep,
            spierenPrimair: alt.spierenPrimair,
            spierenSecundair: alt.spierenSecundair,
            uitleg: alt.uitleg,
            aandachtspunten: alt.aandachtspunten,
            beeld: alt.beeld,
            gewichtKg: null,
            // Twee keer wisselen: de notitie blijft naar de oefening uit het schema wijzen.
            notitie: `Vandaag in plaats van ${oorspronkelijkeNaam(o)}.`,
          },
    ),
  }
}
