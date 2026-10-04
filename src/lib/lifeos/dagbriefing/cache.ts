// ─── LifeOS — dagbriefing-cache (geheugen, per proces) ──────────────────────
// De cockpit ververst elke 5 minuten. Zonder cache was elke verversing een
// nieuwe Sonnet-call voor een briefing die meestal woord voor woord hetzelfde
// zou zijn. Dit bestand beslist wanneer een opgeslagen briefing nog goed is.
//
// ─── DE REGEL ───────────────────────────────────────────────────────────────
//   1. Zelfde dag + exact dezelfde feiten → altijd hergebruiken. Een model dat
//      dezelfde feiten nog eens samenvat, levert niets nieuws op.
//   2. Feiten veranderd (taak afgevinkt, afspraak erbij) → pas opnieuw schrijven
//      als de vorige briefing ouder is dan MIN_LEEFTIJD_MS. Zo kost een ochtend
//      vol afvinken hooguit een paar calls, niet één per vink.
//   3. Handmatig verversen (de knop) → altijd opnieuw, maar begrensd door de
//      rate limit in de route.
//
// Bewust geen databasetabel: dit is een kostenrem, geen administratie. Valt het
// proces om, dan schrijft de eerstvolgende aanvraag gewoon een nieuwe briefing.

import { dagVan } from '@/lib/lifeos/blokken/tijd'

/** Hoe oud een briefing minstens moet zijn voordat gewijzigde feiten een nieuwe rechtvaardigen. */
export const MIN_LEEFTIJD_MS = 30 * 60 * 1000

export interface CacheRegel<T> {
  /** De Amsterdamse dag waarvoor de regel geldt (YYYY-MM-DD). */
  dag: string
  /** Vingerafdruk van de feiten waaruit de waarde gemaakt is. */
  sleutel: string
  waarde: T
  gemaaktOp: number
}

/**
 * De vingerafdruk van een feitentekst. De eerste regel draagt de klok ("opgebouwd
 * op 09:14") en verandert dus elke minuut — die telt niet mee, anders matcht
 * geen enkele aanvraag ooit.
 */
export function feitenSleutel(feitenTekst: string): string {
  const regels = feitenTekst.split('\n')
  return regels.slice(1).join('\n')
}

/** Mag deze cacheregel nu gebruikt worden in plaats van een nieuwe modelcall? */
export function magHergebruiken<T>(
  regel: CacheRegel<T> | undefined,
  dag: string,
  sleutel: string,
  nu: number,
  forceer: boolean,
): regel is CacheRegel<T> {
  if (regel === undefined || forceer) return false
  if (regel.dag !== dag) return false
  if (regel.sleutel === sleutel) return true
  return nu - regel.gemaaktOp < MIN_LEEFTIJD_MS
}

/** Eén regel per gebruiker. Single-tenant in de praktijk, maar per sleutel is net zo goedkoop. */
const geheugen = new Map<string, CacheRegel<unknown>>()

/**
 * Geeft de opgeslagen waarde terug als die nog goed is, anders `maak()` en onthoudt
 * het resultaat. `maak` wordt hooguit één keer aangeroepen.
 */
export async function metDagCache<T>(
  gebruiker: string,
  feitenTekst: string,
  moment: Date,
  forceer: boolean,
  maak: () => Promise<T>,
): Promise<{ waarde: T; uitCache: boolean }> {
  const dag = dagVan(moment)
  const sleutel = feitenSleutel(feitenTekst)
  const nu = moment.getTime()
  const regel = geheugen.get(gebruiker) as CacheRegel<T> | undefined

  if (magHergebruiken(regel, dag, sleutel, nu, forceer)) {
    return { waarde: regel.waarde, uitCache: true }
  }

  const waarde = await maak()
  geheugen.set(gebruiker, { dag, sleutel, waarde, gemaaktOp: nu })
  return { waarde, uitCache: false }
}

/** Alleen voor tests: begin met een leeg geheugen. */
export function legeDagCache(): void {
  geheugen.clear()
}
