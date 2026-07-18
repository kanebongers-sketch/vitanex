// ─── LifeOS — dag-rooster: pure layout-logica ───────────────────────────────
// De agenda-kaart tekent een tijdrooster à la Google Calendar: uur-rijen met
// gekleurde blokken op de plek waar ze in de dag vallen. Dit bestand rekent dat
// uit — puur, geen React, geen DOM, geen `new Date()` binnenin (op de parser na,
// die een ISO-string ontleedt). Zo is de kern testbaar zonder een browser.
//
// AANNAME: we werken in minuten sinds middernacht in de LOKALE tijd van de
// gebruiker. `startOp`/`eindOp` zijn ISO-strings met offset; `new Date(iso)`
// geeft het juiste moment, en `getHours()`/`getMinutes()` leest dat terug in de
// tijdzone van de runtime (de browser). Op de server draait dit niet — het
// rooster is een client-eiland (zie AgendaRooster.tsx).

import type { AfspraakJson } from './agenda'

/** Standaard-venster: 07:00–22:00. Verruimt als afspraken erbuiten vallen. */
export const VENSTER_START_STANDAARD_MIN = 7 * 60
export const VENSTER_EIND_STANDAARD_MIN = 22 * 60

/**
 * Ondergrens voor de hoogte van een blok, in minuten. Een afspraak van 10
 * minuten (of zonder eindtijd) zou anders een streepje worden waar geen tijd én
 * titel in past. 30 min houdt 'm leesbaar zonder de dag op te blazen.
 */
export const MIN_BLOK_DUUR_MIN = 30

const MINUTEN_PER_DAG = 24 * 60

/** Eén afspraak met een tijd, klaar om als blok getekend te worden. */
export interface RoosterBlok {
  id: string
  titel: string | null
  locatie: string | null
  /** Starttijd in lokale minuten sinds middernacht. */
  startMin: number
  /** Echte eindtijd in lokale minuten, of null als de duur onbekend is. */
  eindMin: number | null
  /** Positie t.o.v. de vensterbovenkant, in minuten. */
  topMin: number
  /** Hoogte in minuten — minstens {@link MIN_BLOK_DUUR_MIN}. */
  duurMin: number
  /** Kolom binnen het overlap-cluster (0-gebaseerd). */
  laneIndex: number
  /** Aantal kolommen in het overlap-cluster; bepaalt de breedte. */
  laneCount: number
}

/** Een hele-dag-afspraak: heeft geen tijd, hoort niet in het tijdraster. */
export interface HeleDagAfspraak {
  id: string
  titel: string | null
  locatie: string | null
}

export interface Rooster {
  /** Bovenkant van het rooster in lokale minuten (heel uur). */
  vensterStartMin: number
  /** Onderkant van het rooster in lokale minuten (heel uur). */
  vensterEindMin: number
  /** De getimede afspraken als blokken, gesorteerd op starttijd. */
  blokken: RoosterBlok[]
  /** De hele-dag-afspraken, voor de strook bovenaan. */
  heleDag: HeleDagAfspraak[]
}

/** Minuten sinds lokale middernacht. Voor de "nu"-lijn en de scroll-positie. */
export function minutenSindsMiddernacht(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

/** '07:00' uit minuten sinds middernacht. Altijd 24-uurs — Nederlandse app. */
export function tijdLabelVanMinuten(min: number): string {
  // Normaliseer naar [0, 1440): een eindtijd na middernacht (23:30–00:30) leest
  // dan als '00:30' i.p.v. '24:30', en een negatieve waarde rolt netjes terug.
  const genormaliseerd = ((Math.floor(min) % MINUTEN_PER_DAG) + MINUTEN_PER_DAG) % MINUTEN_PER_DAG
  const uur = Math.floor(genormaliseerd / 60)
  const rest = genormaliseerd % 60
  return `${String(uur).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

/**
 * De hele uren binnen het venster (inclusief begin en eind), voor de uur-as en
 * de horizontale lijnen. Het venster is altijd op het hele uur uitgelijnd.
 */
export function uurLijnen(vensterStartMin: number, vensterEindMin: number): number[] {
  const lijnen: number[] = []
  for (let m = vensterStartMin; m <= vensterEindMin; m += 60) lijnen.push(m)
  return lijnen
}

/** ISO-string → lokale minuten sinds middernacht, of null als de datum onzin is. */
function lokaleMinuten(iso: string): number | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.getHours() * 60 + d.getMinutes()
}

/** Interne vorm: een afspraak met tijd, inclusief de getekende (afgeronde) duur. */
interface TijdAfspraak {
  id: string
  titel: string | null
  locatie: string | null
  startMin: number
  eindMin: number | null
  duurMin: number
  eindDisplayMin: number
}

/**
 * Splitst de afspraken in getimede blokken en hele-dag-events, en gooit
 * onleesbare rijen weg (systeemgrens: een Invalid Date hoort niet stil door de
 * layout te lekken).
 */
function splits(afspraken: readonly AfspraakJson[]): {
  tijd: TijdAfspraak[]
  heleDag: HeleDagAfspraak[]
} {
  const tijd: TijdAfspraak[] = []
  const heleDag: HeleDagAfspraak[] = []

  for (const a of afspraken) {
    if (a.heleDag) {
      heleDag.push({ id: a.id, titel: a.titel, locatie: a.locatie })
      continue
    }

    const startMin = lokaleMinuten(a.startOp)
    if (startMin === null) continue

    const rawEind = a.eindOp ? lokaleMinuten(a.eindOp) : null
    // Alleen een eind dat ná de start ligt begrenst de duur; een eind vóór de
    // start (over middernacht) of een ontbrekend eind valt terug op de ondergrens.
    const echteDuur = rawEind !== null && rawEind > startMin ? rawEind - startMin : 0
    const duurMin = Math.max(MIN_BLOK_DUUR_MIN, echteDuur)

    tijd.push({
      id: a.id,
      titel: a.titel,
      locatie: a.locatie,
      startMin,
      eindMin: rawEind,
      duurMin,
      eindDisplayMin: startMin + duurMin,
    })
  }

  return { tijd, heleDag }
}

/**
 * Het tijdvenster: standaard 07:00–22:00, verruimd zodat elke afspraak past.
 * Vroegste start naar beneden afgerond op het hele uur, laatste (getekende) eind
 * naar boven. Geklemd op 00:00–24:00.
 */
function bepaalVenster(tijd: readonly TijdAfspraak[]): { start: number; eind: number } {
  let start = VENSTER_START_STANDAARD_MIN
  let eind = VENSTER_EIND_STANDAARD_MIN

  for (const a of tijd) {
    if (a.startMin < start) start = Math.floor(a.startMin / 60) * 60
    if (a.eindDisplayMin > eind) eind = Math.ceil(a.eindDisplayMin / 60) * 60
  }

  start = Math.max(0, start)
  eind = Math.min(MINUTEN_PER_DAG, eind)
  // Vangnet: houd het venster minstens één uur hoog, mocht clampen het dichtknijpen.
  if (eind <= start) eind = Math.min(MINUTEN_PER_DAG, start + 60)

  return { start, eind }
}

/**
 * Kent elk blok een kolom (lane) toe, zodat overlappende afspraken naast elkaar
 * staan i.p.v. over elkaar — zoals Google.
 *
 * Aanpak: sorteer op starttijd; loop erdoorheen en houd "clusters" bij van
 * afspraken waarvan de bezette tijd aaneengesloten is. Binnen een cluster gaat
 * elke afspraak in de eerste vrije lane (greedy). Het aantal lanes van het
 * cluster is de breedte-deler voor álle blokken erin.
 *
 * Aanliggend maar niet overlappend (10:00 eindigt, 10:00 begint) valt buiten
 * hetzelfde cluster en deelt dus geen breedte — beide krijgen de volle kolom.
 * Overlap wordt gemeten op de GETEKENDE duur (met ondergrens), want visueel is
 * dát wat ruimte inneemt.
 */
function positioneer(tijd: readonly TijdAfspraak[], vensterStartMin: number): RoosterBlok[] {
  const gesorteerd = [...tijd].sort(
    (a, b) => a.startMin - b.startMin || a.eindDisplayMin - b.eindDisplayMin,
  )

  const uit: RoosterBlok[] = []
  let cluster: RoosterBlok[] = []
  let laneEinden: number[] = []
  let clusterEind = Number.NEGATIVE_INFINITY

  const sluitCluster = () => {
    if (cluster.length === 0) return
    const count = laneEinden.length
    for (const blok of cluster) blok.laneCount = count
    uit.push(...cluster)
    cluster = []
    laneEinden = []
    clusterEind = Number.NEGATIVE_INFINITY
  }

  for (const a of gesorteerd) {
    // Begint deze afspraak op of ná het einde van het huidige cluster? Dan is
    // het cluster af (geen overlap meer) en start er een nieuw.
    if (a.startMin >= clusterEind) sluitCluster()

    // Eerste lane die vrij is (waar de vorige afspraak op of vóór onze start eindigt).
    let lane = laneEinden.findIndex((eind) => eind <= a.startMin)
    if (lane === -1) {
      lane = laneEinden.length
      laneEinden.push(a.eindDisplayMin)
    } else {
      laneEinden[lane] = a.eindDisplayMin
    }

    cluster.push({
      id: a.id,
      titel: a.titel,
      locatie: a.locatie,
      startMin: a.startMin,
      eindMin: a.eindMin,
      topMin: a.startMin - vensterStartMin,
      duurMin: a.duurMin,
      laneIndex: lane,
      laneCount: 1,
    })
    clusterEind = Math.max(clusterEind, a.eindDisplayMin)
  }
  sluitCluster()

  return uit
}

/**
 * Bouwt het rooster uit de afspraken van één dag: het venster, de blokken (met
 * positie en lane-verdeling) en de hele-dag-events apart. Muteert de invoer niet.
 */
export function bouwRooster(afspraken: readonly AfspraakJson[]): Rooster {
  const { tijd, heleDag } = splits(afspraken)
  const { start, eind } = bepaalVenster(tijd)
  const blokken = positioneer(tijd, start)

  return {
    vensterStartMin: start,
    vensterEindMin: eind,
    blokken,
    heleDag,
  }
}
