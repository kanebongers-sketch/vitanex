// ─── Club, betalen: factuurperiodes, pro rata en pauzes (PUUR) ──────────────
// Een periode loopt van `van` tot `tot`, waarbij `tot` niet meer meetelt (de
// volgende periode begint op `tot`). Zo sluiten periodes zonder gat en zonder
// overlap op elkaar aan.
//
// Maandschema's rekenen altijd vanaf het anker: anker 31 januari geeft 28 (of
// 29) februari, 31 maart, 30 april. Nooit van uitkomst naar uitkomst, anders
// zakt de dag na februari blijvend naar de 28e.
//
// Pro rata gaat per kalenderdag en met de grootste-restmethode, zodat de delen
// van een periode samen precies het periodebedrag zijn.
//
// Pauzes (bevriezen):
// - schuiftContract true: het lid betaalt niets tijdens de pauze, de lopende
//   periode wordt onderbroken en loopt na de pauze verder met de resterende
//   dagen, het schema en de einddatum schuiven op met de lengte van de pauze.
// - schuiftContract false: het schema en de einddatum blijven staan; de dagen
//   van de pauze tellen mee in de periode maar worden niet betaald.

import { NUL, type Cent } from '../geld/cent'
import { verdeel } from '../geld/verdelen'
import { dagenTussen, delen, plusDagen, plusMaanden, vroegste, type Datum } from './datum'

export const INTERVALLEN = ['week', 'vier_weken', 'maand', 'kwartaal', 'jaar'] as const
export type Interval = (typeof INTERVALLEN)[number]

type Stap = { soort: 'dagen'; aantal: number } | { soort: 'maanden'; aantal: number }

const STAP: Record<Interval, Stap> = {
  week: { soort: 'dagen', aantal: 7 },
  vier_weken: { soort: 'dagen', aantal: 28 },
  maand: { soort: 'maanden', aantal: 1 },
  kwartaal: { soort: 'maanden', aantal: 3 },
  jaar: { soort: 'maanden', aantal: 12 },
}

export interface Periode {
  van: Datum
  /** Eerste dag die niet meer bij deze periode hoort. */
  tot: Datum
}

/** Begin van periode nummer k (k = 0 is het anker). */
export function periodeStart(anker: Datum, interval: Interval, k: number): Datum {
  const stap = STAP[interval]
  return stap.soort === 'dagen' ? plusDagen(anker, stap.aantal * k) : plusMaanden(anker, stap.aantal * k)
}

/** De periode waarin `d` valt, voor een schema vanaf `anker` (d op of na het anker). */
export function periodeVoor(anker: Datum, interval: Interval, d: Datum): Periode {
  if (d < anker) throw new RangeError(`Datum ${d} ligt voor het begin van het schema ${anker}`)
  const stap = STAP[interval]
  let k: number
  if (stap.soort === 'dagen') {
    k = Math.floor(dagenTussen(anker, d) / stap.aantal)
  } else {
    const a = delen(anker)
    const b = delen(d)
    k = Math.floor((b.jaar * 12 + b.maand - (a.jaar * 12 + a.maand)) / stap.aantal)
    while (k > 0 && periodeStart(anker, interval, k) > d) k--
    while (periodeStart(anker, interval, k + 1) <= d) k++
  }
  return { van: periodeStart(anker, interval, k), tot: periodeStart(anker, interval, k + 1) }
}

/** Begin van de periode na de periode waarin `d` valt. */
export function volgendePeriodeStart(anker: Datum, interval: Interval, d: Datum): Datum {
  return periodeVoor(anker, interval, d).tot
}

export function dagenIn(p: Periode): number {
  return dagenTussen(p.van, p.tot)
}

function eisBinnen(p: Periode, d: Datum): void {
  if (d < p.van || d > p.tot) throw new RangeError(`Datum ${d} ligt buiten de periode ${p.van} tot ${p.tot}`)
}

/**
 * Splits het periodebedrag op `wissel` in het deel ervoor en het deel vanaf
 * `wissel`. Samen altijd precies `bedrag`. Het eerste deel is gelijk aan
 * proRata(bedrag, p, { van: p.van, tot: wissel }).
 */
export function splitsOpDatum(bedrag: Cent, p: Periode, wissel: Datum): [Cent, Cent] {
  eisBinnen(p, wissel)
  const [voor, na] = verdeel(bedrag, [dagenTussen(p.van, wissel), dagenTussen(wissel, p.tot)])
  return [voor, na]
}

/** Het deel van het periodebedrag voor de dagen van `deel` (binnen de periode), afgerond half van nul af. */
export function proRata(bedrag: Cent, p: Periode, deel: Periode): Cent {
  eisBinnen(p, deel.van)
  eisBinnen(p, deel.tot)
  if (deel.tot < deel.van) throw new RangeError('Deelperiode eindigt voor hij begint')
  const totaal = dagenIn(p)
  const dagen = dagenTussen(deel.van, deel.tot)
  if (dagen === totaal) return bedrag
  if (dagen === 0) return NUL
  // Twee delen met de grootste rest: gelijk aan afronden half van nul af.
  const [eerste] = verdeel(bedrag, [dagen, totaal - dagen])
  return eerste
}

// ─── Pauzes en het volledige schema ─────────────────────────────────────────

export interface Pauze {
  van: Datum
  /** Eerste dag na de pauze. */
  tot: Datum
  schuiftContract: boolean
}

export type SegmentSoort = 'periode' | 'pauze'

export interface Segment {
  soort: SegmentSoort
  van: Datum
  tot: Datum
  /** Volgnummer van de factuurperiode waar dit stuk bij hoort (0, 1, 2, ...). */
  periodeNummer: number
  /** true als deze dagen meetellen voor de lengte van de periode (pro rata). Een schuivende pauze telt niet. */
  teltMee: boolean
  /** Lengte in dagen van de volle periode waar dit stuk bij hoort (zonder schuivende pauzes, voor afkappen op het einde). */
  periodeDagen: number
}

/** Controleer pauzes: elk begint voor hij eindigt, niet voor het anker, op volgorde en zonder overlap. */
export function controleerPauzes(anker: Datum, pauzes: readonly Pauze[]): string | null {
  let vorigeTot: Datum = anker
  for (const p of pauzes) {
    if (p.tot <= p.van) return `Pauze ${p.van} eindigt niet na het begin`
    if (p.van < vorigeTot) return `Pauze ${p.van} begint voor het anker of overlapt een eerdere pauze`
    vorigeTot = p.tot
  }
  return null
}

/** De einddatum na schuivende pauzes die voor die (opgeschoven) einddatum beginnen. */
export function verschovenEinde(einde: Datum, pauzes: readonly Pauze[]): Datum {
  let e = einde
  for (const p of pauzes) {
    if (p.schuiftContract && p.van < e) e = plusDagen(e, dagenTussen(p.van, p.tot))
  }
  return e
}

export interface SchemaInvoer {
  anker: Datum
  interval: Interval
  /** Op volgorde en zonder overlap (zie controleerPauzes). */
  pauzes: readonly Pauze[]
  /** Maak periodes tot deze datum (de laatste periode mag erover heen lopen). */
  tot: Datum
  /** Contracteinde voor pauzes (eerste dag zonder contract), of null bij onbepaalde tijd. */
  einde: Datum | null
}

/**
 * Het hele schema als aansluitende stukken: periodes en pauzes, zonder gat en
 * zonder overlap, vanaf het anker tot `tot` of het (opgeschoven) einde.
 */
export function schema(invoer: SchemaInvoer): Segment[] {
  const fout = controleerPauzes(invoer.anker, invoer.pauzes)
  if (fout) throw new RangeError(fout)
  const uit: Segment[] = []
  let anker = invoer.anker
  let k = 0
  let nummer = 0
  let pi = 0
  let einde = invoer.einde
  let stukken: Omit<Segment, 'periodeDagen'>[] = []
  const voeg = (soort: SegmentSoort, van: Datum, tot: Datum, teltMee: boolean): void => {
    const eind = einde === null ? tot : vroegste(tot, einde)
    if (eind > van) stukken = [...stukken, { soort, van, tot: eind, periodeNummer: nummer, teltMee }]
  }

  for (;;) {
    const van = periodeStart(anker, invoer.interval, k)
    if (van >= invoer.tot || (einde !== null && van >= einde)) break
    let periodeTot = periodeStart(anker, invoer.interval, k + 1)
    const periodeDagen = dagenTussen(van, periodeTot)
    let cursor = van
    let verschoven = false
    while (pi < invoer.pauzes.length && invoer.pauzes[pi].van < periodeTot) {
      const p = invoer.pauzes[pi]
      const pVan = p.van < cursor ? cursor : p.van
      voeg('periode', cursor, pVan, true)
      if (p.schuiftContract) {
        const lengte = dagenTussen(p.van, p.tot)
        if (einde !== null && p.van < einde) einde = plusDagen(einde, lengte)
        voeg('pauze', pVan, p.tot, false)
        periodeTot = plusDagen(periodeTot, lengte)
        cursor = p.tot
        verschoven = true
        pi++
      } else {
        const pTot = vroegste(p.tot, periodeTot)
        voeg('pauze', pVan, pTot, true)
        cursor = pTot
        if (p.tot <= periodeTot) pi++
        else break
      }
    }
    voeg('periode', cursor, periodeTot, true)
    uit.push(...stukken.map((st) => ({ ...st, periodeDagen })))
    stukken = []
    nummer++
    if (verschoven) {
      anker = periodeTot
      k = 0
    } else {
      k++
    }
  }
  return uit
}

/**
 * Wat het lid per stuk betaalt bij een vast bedrag per volle periode. Per
 * periodenummer wordt het bedrag verdeeld over de meetellende dagen plus de
 * dagen die door het contracteinde zijn afgekapt; pauzes en afgekapte dagen
 * kosten niets. Een periode zonder pauze en zonder einde kost het volle bedrag.
 */
export function bedragenPerSegment(bedrag: Cent, segmenten: readonly Segment[]): Cent[] {
  const uit: Cent[] = segmenten.map(() => NUL)
  const groepen = new Map<number, number[]>()
  segmenten.forEach((s, i) => groepen.set(s.periodeNummer, [...(groepen.get(s.periodeNummer) ?? []), i]))
  for (const indexen of groepen.values()) {
    const tellend = indexen.filter((i) => segmenten[i].teltMee)
    const dagen = tellend.map((i) => dagenTussen(segmenten[i].van, segmenten[i].tot))
    const gebruikt = dagen.reduce((t, d) => t + d, 0)
    const vol = segmenten[indexen[0]].periodeDagen
    if (vol < gebruikt) throw new RangeError(`Periode ${segmenten[indexen[0]].periodeNummer} heeft meer dagen dan een volle periode`)
    const delenBedrag = verdeel(bedrag, [...dagen, vol - gebruikt])
    tellend.forEach((i, j) => {
      uit[i] = segmenten[i].soort === 'periode' ? delenBedrag[j] : NUL
    })
  }
  return uit
}
