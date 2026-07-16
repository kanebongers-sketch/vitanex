// ─── LifeOS — vrije blokken ─────────────────────────────────────────────────
// Je agenda vertelt je wat je MOET. Dit bestand vertelt je wat er OVER is —
// en dat is het hele punt van functie 2. Vita kan pas "zet je training op
// vanavond, RPE 7" zeggen als iemand weet dat er tussen 16:15 en 18:00 niets
// staat.
//
// Puur bestand: geen fetch, geen DB, geen Date.now() binnenin. De tijd komt er
// altijd ín (venster, `nu`), zodat dit volledig testbaar is zonder een
// Google-account en zonder dat een test om 23:59 anders uitvalt dan om 09:00.
// Dezelfde regel als in `momenten.ts` en `herstel.ts`.

/** Eén afspraak, bron-agnostisch. Google, Outlook of Apple — hier hetzelfde. */
export interface Afspraak {
  id: string
  titel: string | null
  startOp: Date
  /** Google levert dit altijd; `null` = duur onbekend, en dat verzinnen we niet. */
  eindOp: Date | null
  /** Hele-dag-event: heeft een datum, geen tijd. */
  heleDag: boolean
  locatie: string | null
}

/** Een tijdvenster. Absolute momenten, geen uren — dus tijdzone-neutraal. */
export interface Venster {
  startOp: Date
  eindOp: Date
}

export interface VrijBlok {
  startOp: Date
  eindOp: Date
  minuten: number
}

export interface Werkuren {
  readonly vanUur: number
  readonly totUur: number
}

/**
 * Binnen deze uren zoeken we ruimte. Niet omdat je daarbuiten niets doet, maar
 * omdat een "vrij blok" om 03:00 een belediging is, geen suggestie.
 */
export const WERKUREN: Werkuren = Object.freeze({ vanUur: 8, totUur: 20 })

/**
 * Onder de 45 minuten is het geen blok maar een gaatje: je kunt er geen
 * training of deep work in kwijt, dus het aanbieden is ruis.
 */
export const MIN_BLOK_MINUTEN = 45

const MS_PER_MINUUT = 60_000

interface Interval {
  readonly van: number
  readonly tot: number
}

/**
 * Het werkvenster van een dag: `dag` op vanUur tot `dag` op totUur.
 *
 * Gebruikt lokale tijd (`setHours`) — de tijdzone van de runtime is dus
 * leidend. Zet op de server `TZ=Europe/Amsterdam`; anders draait Node in UTC en
 * loopt "vandaag" 's zomers twee uur uit de pas. Zie `.env.example`.
 */
export function werkVenster(dag: Date, werkuren: Werkuren = WERKUREN): Venster {
  const startOp = new Date(dag)
  startOp.setHours(werkuren.vanUur, 0, 0, 0)
  const eindOp = new Date(dag)
  eindOp.setHours(werkuren.totUur, 0, 0, 0)
  return { startOp, eindOp }
}

/**
 * De afspraken omgezet naar bezette intervallen binnen het venster, samengevoegd
 * waar ze overlappen.
 *
 * Wat hier bewust NIET meetelt:
 * - **Hele-dag-events.** Die hebben geen tijd. Ze als 00:00-24:00 lezen zou van
 *   één verjaardag in je agenda een dag zonder ruimte maken — en dan zegt LifeOS
 *   "geen tijd om te trainen" omdat je zwager jarig is. Dat is onwaar.
 * - **Afspraken zonder eindtijd.** Duur onbekend. Er 60 minuten van maken is een
 *   verzonnen getal; er 0 van maken ook. Ze begrenzen dus geen gat.
 */
function bezetteIntervallen(events: readonly Afspraak[], venster: Venster): Interval[] {
  const vensterVan = venster.startOp.getTime()
  const vensterTot = venster.eindOp.getTime()

  const ruw = events
    .filter((e) => !e.heleDag && e.eindOp !== null)
    .map((e): Interval => ({ van: e.startOp.getTime(), tot: (e.eindOp as Date).getTime() }))
    .filter((iv) => Number.isFinite(iv.van) && Number.isFinite(iv.tot) && iv.tot > iv.van)
    // Klem op het venster: een meeting van 07:00-09:00 bezet alleen 08:00-09:00.
    .map((iv): Interval => ({
      van: Math.max(iv.van, vensterVan),
      tot: Math.min(iv.tot, vensterTot),
    }))
    // Volledig buiten werkuren (die borrel om 21:00) → telt niet mee.
    .filter((iv) => iv.tot > iv.van)
    .sort((a, b) => a.van - b.van)

  // Samenvoegen: twee overlappende meetings zijn één bezet blok, geen twee.
  return ruw.reduce<Interval[]>((samen, iv) => {
    const laatste = samen[samen.length - 1]
    if (!laatste || iv.van > laatste.tot) return [...samen, iv]
    return [...samen.slice(0, -1), { van: laatste.van, tot: Math.max(laatste.tot, iv.tot) }]
  }, [])
}

export interface VrijeBlokkenOpties {
  /** Kleinste bruikbare blok in minuten. Default {@link MIN_BLOK_MINUTEN}. */
  minMinuten?: number
  /** Nu. Meegeven = geen blokken in het verleden aanbieden. */
  nu?: Date
}

/**
 * De gaten van minstens `minMinuten` binnen het venster.
 *
 * Geen afspraken → het hele venster is één blok. Dat is geen fout en geen lege
 * staat: dat is een vrije dag.
 */
export function vrijeBlokken(
  events: readonly Afspraak[],
  venster: Venster,
  opties: VrijeBlokkenOpties = {},
): VrijBlok[] {
  const minMs = (opties.minMinuten ?? MIN_BLOK_MINUTEN) * MS_PER_MINUUT
  const eind = venster.eindOp.getTime()
  const start = opties.nu
    ? Math.max(venster.startOp.getTime(), opties.nu.getTime())
    : venster.startOp.getTime()

  if (!Number.isFinite(start) || !Number.isFinite(eind) || eind <= start) return []

  const bezet = bezetteIntervallen(events, { startOp: new Date(start), eindOp: venster.eindOp })

  const blokken: VrijBlok[] = []
  let cursor = start
  for (const iv of bezet) {
    if (iv.van - cursor >= minMs) blokken.push(maakBlok(cursor, iv.van))
    cursor = Math.max(cursor, iv.tot)
  }
  if (eind - cursor >= minMs) blokken.push(maakBlok(cursor, eind))

  return blokken
}

function maakBlok(van: number, tot: number): VrijBlok {
  return {
    startOp: new Date(van),
    eindOp: new Date(tot),
    minuten: Math.round((tot - van) / MS_PER_MINUUT),
  }
}

/**
 * De eerstvolgende afspraak: die nu loopt, of anders die als eerste begint.
 *
 * Een lopende meeting wint van een latere — "je zit tot 11:00 in de standup" is
 * relevanter dan "om 14:00 heb je een call". Hele-dag-events tellen niet mee:
 * "Vakantie" is geen afspraak waar je heen moet.
 */
export function eerstvolgendeAfspraak(
  events: readonly Afspraak[],
  nu: Date,
): Afspraak | null {
  const nuMs = nu.getTime()

  const kandidaten = events
    .filter((e) => !e.heleDag)
    .filter((e) => {
      const eind = e.eindOp?.getTime()
      return eind !== undefined && Number.isFinite(eind)
        ? eind > nuMs
        : e.startOp.getTime() >= nuMs
    })
    .sort((a, b) => a.startOp.getTime() - b.startOp.getTime())

  return kandidaten[0] ?? null
}

/** Loopt deze afspraak nu? Puur afgeleid — nooit apart opgeslagen. */
export function looptNu(afspraak: Afspraak, nu: Date): boolean {
  const nuMs = nu.getTime()
  const eind = afspraak.eindOp?.getTime()
  if (afspraak.heleDag) return false
  if (afspraak.startOp.getTime() > nuMs) return false
  return eind !== undefined ? eind > nuMs : false
}
