// ─── LifeOS — dagplanning: waar past je beweging? ───────────────────────────
// PUUR. Geen fetch, geen DB, geen Date.now() binnenin — de tijd komt er altijd
// ín. Kiest elke weekdag een plek voor twee vaste blokken op basis van hoe de dag
// eruitziet: sporten (90 min, incl. reistijd) het liefst 's ochtends, en een
// wandeling (60 min) in een ánder dagdeel — bij voorkeur tijdens een coachgesprek.
// Leunt op de bestaande `vrijeBlokken`-logica (functie 2), zodat "wat is er vrij"
// op precies één plek wordt berekend en getest.

import { vrijeBlokken, werkVenster, type Afspraak, type Venster, type VrijBlok } from '../agenda/vrije-blokken'
import { isEigenTraining } from '../agenda/training'
import { woordTokens } from '../crm/agenda-match'

/** Sporten: een uur, plus 30 min reistijd = 90 min in de agenda. */
export const SPORT_MIN = 90
/** Wandelen. */
export const WANDEL_MIN = 60

/** Vóór dit uur = "ochtend" voor de sport-voorkeur. */
const OCHTEND_GRENS_UUR = 12
/** Vanaf dit uur = "avond" (dagdelen: sport en wandeling nooit in hetzelfde). */
const AVOND_GRENS_UUR = 18

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
 * Alle vensters van `duurMin` binnen de vrije blokken, chronologisch (want
 * `vrijeBlokken` levert chronologisch). Sport en wandeling kiezen daaruit elk
 * volgens hun eigen voorkeur (zie hieronder).
 */
function kandidatenIn(vrije: readonly VrijBlok[], duurMin: number): Venster[] {
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
  return kandidaten
}

/** Sport: het vroegste venster dat vóór 12:00 begint; anders het vroegste dat er is. */
function kiesSportSlot(vrije: readonly VrijBlok[]): Venster | null {
  const kandidaten = kandidatenIn(vrije, SPORT_MIN)
  return kandidaten.find((k) => k.startOp.getHours() < OCHTEND_GRENS_UUR) ?? kandidaten[0] ?? null
}

/**
 * Álle :00/:30-starts binnen de vrije blokken waar `duurMin` nog past — niet alleen
 * het begin van elk blok. Zo kan de wandeling 's avonds vallen in een blok dat al
 * 's middags begint (15:00–20:00 → ook 18:00).
 */
function alleKandidatenIn(vrije: readonly VrijBlok[], duurMin: number): Venster[] {
  const duurMs = duurMin * 60_000
  const uit: Venster[] = []
  for (const b of vrije) {
    for (let t = rondOpNaarHalfUur(b.startOp).getTime(); t + duurMs <= b.eindOp.getTime(); t += 30 * 60_000) {
      uit.push({ startOp: new Date(t), eindOp: new Date(t + duurMs) })
    }
  }
  return uit
}

type Dagdeel = 'ochtend' | 'middag' | 'avond'

/** Ochtend vóór 12:00, middag tot 18:00, avond daarna. */
function dagdeel(d: Date): Dagdeel {
  const u = d.getHours()
  return u < OCHTEND_GRENS_UUR ? 'ochtend' : u < AVOND_GRENS_UUR ? 'middag' : 'avond'
}

/**
 * Walk & talk: staat er vandaag een coachgesprek in een ánder dagdeel dan je
 * sport, dan wordt dat je wandeling — het uur vanaf de start van het gesprek,
 * als dat verder vrij is. Twee vliegen in één klap.
 */
function wandelMetCoachgesprek(
  events: readonly Afspraak[],
  venster: Venster,
  anker: Venster | null,
  nu?: Date,
): Venster | null {
  const gesprekken = events
    .filter((e) => !e.heleDag && woordTokens(e.titel ?? '').includes('coachgesprek'))
    .sort((a, b) => a.startOp.getTime() - b.startOp.getTime())
  for (const g of gesprekken) {
    const startOp = g.startOp
    const eindOp = new Date(startOp.getTime() + WANDEL_MIN * 60_000)
    if (nu && startOp.getTime() < nu.getTime()) continue
    if (startOp.getTime() < venster.startOp.getTime() || eindOp.getTime() > venster.eindOp.getTime()) continue
    if (anker && dagdeel(startOp) === dagdeel(anker.startOp)) continue
    const botst = events.some(
      (e) => e !== g && !e.heleDag && e.eindOp !== null && e.startOp.getTime() < eindOp.getTime() && e.eindOp.getTime() > startOp.getTime(),
    )
    const botstMetAnker = anker !== null && anker.startOp.getTime() < eindOp.getTime() && anker.eindOp.getTime() > startOp.getTime()
    if (!botst && !botstMetAnker) return { startOp, eindOp }
  }
  return null
}

/**
 * Wandeling: in een ánder dagdeel dan de sport (ochtend / middag / avond) — niet
 * er vlak tegenaan. Voorkeur: een coachgesprek als walk & talk; dan ná de sport in
 * een ander dagdeel; dan vóór de sport in een ander dagdeel. Lukt dat die dag niet,
 * dan het vrije uur het verst van de sport af.
 */
function kiesWandelSlot(
  vrije: readonly VrijBlok[],
  anker: Venster | null,
  events: readonly Afspraak[],
  venster: Venster,
  nu?: Date,
): Venster | null {
  const metGesprek = wandelMetCoachgesprek(events, venster, anker, nu)
  if (metGesprek) return metGesprek

  const kandidaten = alleKandidatenIn(vrije, WANDEL_MIN)
  if (anker === null) return kandidaten.find((k) => k.startOp.getHours() >= OCHTEND_GRENS_UUR) ?? kandidaten[0] ?? null
  const anderDeel = (k: Venster) => dagdeel(k.startOp) !== dagdeel(anker.startOp)
  const naSport = (k: Venster) => k.startOp.getTime() >= anker.eindOp.getTime()
  const afstand = (k: Venster) =>
    Math.min(Math.abs(k.startOp.getTime() - anker.eindOp.getTime()), Math.abs(anker.startOp.getTime() - k.eindOp.getTime()))
  return (
    kandidaten.find((k) => anderDeel(k) && naSport(k)) ??
    kandidaten.find(anderDeel) ??
    [...kandidaten].sort((a, b) => afstand(b) - afstand(a))[0] ??
    null
  )
}

/** De eerste eigen training van de dag (met tijden), of `null`. */
function eersteEigenTraining(events: readonly Afspraak[]): Venster | null {
  const training = events
    .filter((e) => !e.heleDag && isEigenTraining(e.titel))
    .sort((a, b) => a.startOp.getTime() - b.startOp.getTime())[0]
  // Onbekende eindtijd: we verzinnen geen duur — "na de training" = na de start.
  return training ? { startOp: training.startOp, eindOp: training.eindOp ?? training.startOp } : null
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
 *
 * Staat er al een eigen training in je agenda ("Rick gym", "Sporten"), dan plannen
 * we géén extra sportblok — je sport die dag al (25-09: "Sporten 14:00" naast
 * "Rick gym 17:00"). De wandeling komt dan ná die training. Een PT-sessie met een
 * klant telt niet als jouw training (zie `isEigenTraining`).
 */
export function kiesBewegingsblokken(
  events: readonly Afspraak[],
  dag: Date,
  nu?: Date,
): Bewegingsblokken {
  const venster = werkVenster(dag)
  const opties = { minMinuten: WANDEL_MIN, nu }

  const eigen = eersteEigenTraining(events)
  const sport = eigen ? null : kiesSportSlot(vrijeBlokken(events, venster, opties))

  const metSport: readonly Afspraak[] = sport
    ? [
        ...events,
        { id: 'sport-reserve', titel: 'Sport', startOp: sport.startOp, eindOp: sport.eindOp, heleDag: false, locatie: null },
      ]
    : events
  const wandeling = kiesWandelSlot(vrijeBlokken(metSport, venster, opties), sport ?? eigen, events, venster, nu)

  return { sport, wandeling }
}
