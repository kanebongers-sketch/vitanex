// ─── LifeOS — PT-klanten: afhaak-signaal (puur) ─────────────────────────────
// Wie haakt af? Een klant met een lopend abonnement die je al een tijd niet op PT
// zag. PUUR: klanten + agenda-events in → signalen uit, geen fetch, geen DB.
//
// EERLIJK, en dat stuurt het ontwerp:
//   - We flaggen alleen klanten die ÉCHT een sessie in het venster hadden, maar
//     wiens laatste sessie te ver terugligt. Een klant zónder énige sessie in het
//     venster flaggen we NIET: dan weten we niet of hij net begon of allang weg is,
//     en liever geen signaal dan een verzonnen zorg.
//   - De drempel volgt de cadans: een weekklant valt op na ~3 weken stilte, een
//     2-wekelijkse pas na ~4 weken — anders zou "normaal ritme" al alarm geven.
//   - Op vakantie telt niet als afhaken — en ook ná de vakantie telt de stilte
//     pas vanaf de laatste vakantiedag. Anders stond een klant die net terug is
//     van drie weken weg meteen als "afgehaakt" in je lijst.

import { datumSleutel, leesDatumSleutel } from '@/lib/lifeos/datum/datum'
import { cadans, matchtPtSessie, type PtKlant, type PtEvent } from './pt-klant'

const DAG_MS = 24 * 60 * 60 * 1000

/** Eén afgehaakte klant: hoeveel hele weken geleden je hem voor het laatst zag. */
export interface Afhaak {
  id: string
  naam: string
  wekenGeleden: number
}

/**
 * De stiltedrempel in dagen: ruim voorbij de normale cadans, zodat een klant die
 * gewoon op ritme zit nooit opduikt. Weekklant (cadans 7d) → 21 dagen; 2-wekelijks
 * (cadans 14d) → 28 dagen.
 */
function drempelDagen(weken: 1 | 2): number {
  return weken === 2 ? 28 : 21
}

/** Het moment waarop de (laatste) vakantie eindigde: middernacht ná de t/m-dag. */
function vakantieEinde(vakantieTot: string | null): number {
  const dag = vakantieTot ? leesDatumSleutel(vakantieTot) : null
  return dag ? dag.getTime() + DAG_MS : Number.NEGATIVE_INFINITY
}

/**
 * Welke PT-klanten lijken afgehaakt op basis van `events` (minstens de laatste ~8
 * weken, zodat "had wél sessies, maar niet meer" te onderscheiden is van "net
 * begonnen"). `vandaag` is de nu-snapshot. Langst-niet-gezien eerst.
 */
export function bepaalAfhaak(
  klanten: readonly PtKlant[],
  events: readonly PtEvent[],
  vandaag: Date,
  /** Alle bekende namen (hele CRM) voor de naam-koppeling; standaard de klanten zelf. */
  alleNamen?: readonly string[],
): Afhaak[] {
  const nu = vandaag.getTime()
  const vandaagKey = datumSleutel(vandaag)

  const namen = alleNamen ?? klanten.map((k) => k.naam)
  const uit: Afhaak[] = []
  for (const k of klanten) {
    const opVakantie = k.vakantieTot !== null && vandaagKey <= k.vakantieTot
    if (opVakantie) continue

    // De laatste sessie tot nu (toekomstige boekingen tellen niet als "gezien").
    let laatste = Number.NEGATIVE_INFINITY
    for (const e of events) {
      if (!matchtPtSessie(e.titel, k.naam, namen)) continue
      const t = new Date(e.startOp).getTime()
      if (Number.isNaN(t) || t > nu) continue
      if (t > laatste) laatste = t
    }
    // Geen historie in het venster → niet flaggen (zie de kop: liever geen signaal).
    if (laatste === Number.NEGATIVE_INFINITY) continue

    // De stilte telt vanaf de laatste sessie óf het einde van de vakantie, wat later is.
    const dagen = Math.floor((nu - laatste) / DAG_MS)
    const stilteDagen = Math.floor((nu - Math.max(laatste, vakantieEinde(k.vakantieTot))) / DAG_MS)
    const { weken } = cadans(k.abonnement)
    if (stilteDagen >= drempelDagen(weken)) {
      uit.push({ id: k.id, naam: k.naam, wekenGeleden: Math.floor(dagen / 7) })
    }
  }

  return uit.sort((a, b) => b.wekenGeleden - a.wekenGeleden || a.naam.localeCompare(b.naam, 'nl'))
}
