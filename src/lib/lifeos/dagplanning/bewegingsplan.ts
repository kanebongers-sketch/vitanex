// ─── LifeOS — dagplanning: waar past je beweging? ───────────────────────────
// PUUR. Geen fetch, geen DB, geen Date.now() binnenin — de tijd komt er altijd
// ín. Kiest elke weekdag een plek voor twee vaste blokken op basis van hoe de dag
// eruitziet: sporten (90 min, incl. reistijd) het liefst 's ochtends, en een
// wandeling (60 min) erna. Leunt op de bestaande `vrijeBlokken`-logica (functie 2),
// zodat "wat is er vrij" op precies één plek wordt berekend en getest.

import { vrijeBlokken, werkVenster, type Afspraak, type Venster, type VrijBlok } from '../agenda/vrije-blokken'

/** Sporten: een uur, plus 30 min reistijd = 90 min in de agenda. */
export const SPORT_MIN = 90
/** Wandelen. */
export const WANDEL_MIN = 60

/** Vóór dit uur = "ochtend" voor de sport-voorkeur. */
const OCHTEND_GRENS_UUR = 12

/**
 * Rondt een moment OMHOOG naar het eerstvolgende hele of halve uur (:00 of :30).
 * Omhoog, niet af: een blok mag nooit vóór het vrije gat beginnen. 16:37 → 17:00,
 * 16:12 → 16:30, 16:00 blijft 16:00. Zo staan de blokken op nette tijden.
 */
function rondOpNaarHalfUur(d: Date): Date {
  const r = new Date(d)
  r.setSeconds(0, 0)
  const m = r.getMinutes()
  if (m === 0 || m === 30) return r
  if (m < 30) r.setMinutes(30)
  else {
    r.setMinutes(0)
    r.setHours(r.getHours() + 1)
  }
  return r
}

export interface Bewegingsblokken {
  /** Het gekozen sport-venster, of null als er die dag geen 90 min vrij was. */
  sport: Venster | null
  /** Het gekozen wandel-venster, of null als er geen 60 min meer vrij was. */
  wandeling: Venster | null
}

/**
 * Kiest binnen de vrije blokken een venster van `duurMin`.
 *
 * `vrijeBlokken` levert chronologisch, dus het eerste passende blok is het
 * vroegste. `voorMiddag` verschuift de voorkeur: sporten wil je 's ochtends, dus
 * pak dan het vroegste blok dat vóór 12:00 begint; is dat er niet, val terug op
 * het vroegste dat er wél is (liever later sporten dan niet). De wandeling zoekt
 * juist een blok ná de middag, zodat het niet meteen tegen de sport aan plakt.
 */
function kiesSlot(vrije: readonly VrijBlok[], duurMin: number, voorMiddag: boolean): Venster | null {
  // Per vrij blok: rond de start op naar :00/:30 en houd het alleen als het blok
  // daarná nog past. Afronden kost ruimte, dus een gat dat precies `duurMin` lang
  // is maar op :37 begint valt hier af — dat is de bedoeling: liever een net
  // tijdstip dan een strak-passend rommeltijdstip.
  const kandidaten = vrije
    .map((b) => {
      const startOp = rondOpNaarHalfUur(b.startOp)
      const eindOp = new Date(startOp.getTime() + duurMin * 60_000)
      return eindOp.getTime() <= b.eindOp.getTime() ? { startOp, eindOp } : null
    })
    .filter((v): v is Venster => v !== null)

  if (kandidaten.length === 0) return null

  let keuze = kandidaten[0]
  if (voorMiddag) {
    const ochtend = kandidaten.find((k) => k.startOp.getHours() < OCHTEND_GRENS_UUR)
    if (ochtend) keuze = ochtend
  } else {
    const naMiddag = kandidaten.find((k) => k.startOp.getHours() >= OCHTEND_GRENS_UUR)
    if (naMiddag) keuze = naMiddag
  }
  return keuze
}

/**
 * Plaatst het sport- en wandelblok in de vrije ruimte van de dag.
 *
 * Eerst de sport (die heeft de sterkste voorkeur: ochtend + de langste duur), dan
 * de wandeling in de ruimte die overblijft — de sport wordt als bezet toegevoegd
 * vóór we opnieuw naar vrije blokken kijken, zodat de twee elkaar nooit overlappen.
 *
 * `nu` (optioneel): plan niets in het verleden. Draait de cron om 09:00, dan zoekt
 * hij ruimte vanaf 09:00, niet vanaf het begin van het werkvenster.
 */
export function kiesBewegingsblokken(
  events: readonly Afspraak[],
  dag: Date,
  nu?: Date,
): Bewegingsblokken {
  const venster = werkVenster(dag)
  const opties = { minMinuten: WANDEL_MIN, nu }

  const sport = kiesSlot(vrijeBlokken(events, venster, opties), SPORT_MIN, true)

  const metSport: readonly Afspraak[] = sport
    ? [
        ...events,
        { id: 'sport-reserve', titel: 'Sport', startOp: sport.startOp, eindOp: sport.eindOp, heleDag: false, locatie: null },
      ]
    : events
  const wandeling = kiesSlot(vrijeBlokken(metSport, venster, opties), WANDEL_MIN, false)

  return { sport, wandeling }
}
