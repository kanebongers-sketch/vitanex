// ─── LifeOS — PT-klanten: inplan-voorstellen (puur) ─────────────────────────
// Wie deze week nog een sessie mist, krijgt twee à drie concrete momenten om met
// één tik in te plannen. PUUR: klant + agenda in → momenten uit.
//
// Volgorde van voorstellen:
//   1. "zoals meestal": het moment waarop deze klant al vaker trainde (zelfde
//      weekdag + tijd, minstens twee keer in de historie), als dat deze week nog
//      vrij is. Dat is het moment dat het meest waarschijnlijk past.
//   2. "vrij": per dag het vrije uur dat het dichtst bij het gebruikelijke
//      tijdstip ligt: dat van deze klant, anders van al je PT-sessies, anders 17:00.
//      Zo stelt LifeOS geen 07:00 voor aan iemand die altijd 's avonds traint.
//
// EERLIJK: nooit in het verleden, nooit over een bestaande afspraak heen, nooit
// twee sessies van dezelfde klant op één dag, en geen "zoals meestal" op basis
// van één toevallige keer. Zondag slaan we over.

import { vrijeBlokken, werkVenster, type Afspraak, type Werkuren } from '../agenda/vrije-blokken'
import { woordTokens } from '../crm/agenda-match'
import { isPtTitel, matchtPtSessie } from './pt-klant'

export const SESSIE_MIN = 60
const MAX_VOORSTELLEN = 3
/** Niet voorstellen wat binnen het uur begint: dat red je niet meer. */
const MIN_VOORLOOP_MS = 60 * 60_000
/** PT loopt tot in de avond (sessies tot 21:00 zijn normaal). */
const PT_UREN: Werkuren = Object.freeze({ vanUur: 7, totUur: 21 })
const MIN_GEWOONTE = 2

export interface InplanVoorstel {
  /** ISO-start van de sessie (duur: {@link SESSIE_MIN} minuten). */
  startOp: string
  reden: 'gewoonte' | 'vrij'
}

interface Gewoonte {
  weekdag: number
  minuut: number
  aantal: number
}

/** Weekdag + tijd waarop deze klant al vaker trainde, meest voorkomend eerst. */
export function gewoonteMomenten(
  naam: string,
  afspraken: readonly Afspraak[],
  nu: Date,
  alleNamen: readonly string[] = [],
): Gewoonte[] {
  const telling = new Map<string, Gewoonte>()
  for (const a of afspraken) {
    if (a.heleDag || a.startOp.getTime() > nu.getTime()) continue
    if (!matchtPtSessie(a.titel, naam, alleNamen)) continue
    const weekdag = a.startOp.getDay()
    const minuut = a.startOp.getHours() * 60 + a.startOp.getMinutes()
    const sleutel = `${weekdag}-${minuut}`
    const bestaand = telling.get(sleutel)
    telling.set(sleutel, { weekdag, minuut, aantal: (bestaand?.aantal ?? 0) + 1 })
  }
  return [...telling.values()].filter((g) => g.aantal >= MIN_GEWOONTE).sort((a, b) => b.aantal - a.aantal)
}

/** Overlapt [start, eind) met een bestaande afspraak? Zonder eindtijd: bezet op het startmoment. */
function isBezet(start: number, eind: number, afspraken: readonly Afspraak[]): boolean {
  return afspraken.some((a) => {
    if (a.heleDag) return false
    const van = a.startOp.getTime()
    const tot = a.eindOp ? a.eindOp.getTime() : van + 1
    return van < eind && tot > start
  })
}

const HALF_UUR_MS = 30 * 60_000
const STANDAARD_MINUUT = 17 * 60

function minuutVanDag(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

function mediaan(getallen: readonly number[]): number | null {
  if (getallen.length === 0) return null
  const r = [...getallen].sort((a, b) => a - b)
  return r[Math.floor(r.length / 2)]
}

/** Het gebruikelijke tijdstip (minuut van de dag): deze klant, anders al je PT, anders 17:00. */
function doelMinuut(naam: string, verleden: readonly Afspraak[], alleNamen: readonly string[]): number {
  const eigen = verleden.filter((a) => matchtPtSessie(a.titel, naam, alleNamen)).map((a) => minuutVanDag(a.startOp))
  const pt = verleden.filter((a) => a.titel !== null && isPtTitel(woordTokens(a.titel))).map((a) => minuutVanDag(a.startOp))
  return mediaan(eigen) ?? mediaan(pt) ?? STANDAARD_MINUUT
}

/** Binnen een vrij blok: het :00/:30-moment het dichtst bij `doel` waar een sessie nog past. */
function besteInBlok(van: number, tot: number, duurMs: number, doel: number): number | null {
  let beste: number | null = null
  let afstand = Number.POSITIVE_INFINITY
  for (let s = rondOp(van); s + duurMs <= tot; s += HALF_UUR_MS) {
    const d = Math.abs(minuutVanDag(new Date(s)) - doel)
    if (d < afstand) {
      afstand = d
      beste = s
    }
  }
  return beste
}

/** Omhoog naar het eerstvolgende hele of halve uur. */
function rondOp(ms: number): number {
  const d = new Date(ms)
  d.setSeconds(0, 0)
  const m = d.getMinutes()
  if (m === 0 || m === 30) return d.getTime()
  if (m < 30) d.setMinutes(30)
  else d.setMinutes(60)
  return d.getTime()
}

function dagBegin(d: Date): Date {
  const b = new Date(d)
  b.setHours(0, 0, 0, 0)
  return b
}

/**
 * Twee à drie momenten om `naam` in te plannen, van vandaag t/m (exclusief) `tot`.
 * `afspraken` = je hele agenda in dat venster plus de historie (voor de gewoonte).
 */
export function inplanVoorstellen(
  naam: string,
  afspraken: readonly Afspraak[],
  nu: Date,
  tot: Date,
  alleNamen: readonly string[] = [],
): InplanVoorstel[] {
  const vroegst = nu.getTime() + MIN_VOORLOOP_MS
  const duurMs = SESSIE_MIN * 60_000
  const dagen: Date[] = []
  // Kalenderdagen via (jaar, maand, dag + 1): robuust over de zomertijdwissel heen.
  for (let d = dagBegin(nu); d.getTime() < tot.getTime(); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    if (d.getDay() !== 0) dagen.push(d)
  }
  // Al een sessie met deze klant op die dag? Dan geen tweede voorstellen.
  const bezetteDagen = new Set(
    afspraken.filter((a) => matchtPtSessie(a.titel, naam, alleNamen)).map((a) => dagBegin(a.startOp).getTime()),
  )
  const vrijeDagen = dagen.filter((d) => !bezetteDagen.has(d.getTime()))

  const uit: InplanVoorstel[] = []
  const gekozenDagen = new Set<number>()
  const voegToe = (start: number, reden: InplanVoorstel['reden']) => {
    uit.push({ startOp: new Date(start).toISOString(), reden })
    gekozenDagen.add(dagBegin(new Date(start)).getTime())
  }

  for (const g of gewoonteMomenten(naam, afspraken, nu, alleNamen)) {
    for (const dag of vrijeDagen) {
      if (uit.length >= MAX_VOORSTELLEN) break
      if (dag.getDay() !== g.weekdag || gekozenDagen.has(dag.getTime())) continue
      const start = new Date(dag)
      start.setHours(Math.floor(g.minuut / 60), g.minuut % 60, 0, 0)
      const s = start.getTime()
      if (s >= vroegst && !isBezet(s, s + duurMs, afspraken)) voegToe(s, 'gewoonte')
    }
  }

  const doel = doelMinuut(naam, afspraken.filter((a) => !a.heleDag && a.startOp.getTime() <= nu.getTime()), alleNamen)
  for (const dag of vrijeDagen) {
    if (uit.length >= MAX_VOORSTELLEN) break
    if (gekozenDagen.has(dag.getTime())) continue
    const blokken = vrijeBlokken(afspraken, werkVenster(dag, PT_UREN), { minMinuten: SESSIE_MIN, nu: new Date(vroegst) })
    const kandidaten = blokken
      .map((b) => besteInBlok(b.startOp.getTime(), b.eindOp.getTime(), duurMs, doel))
      .filter((s): s is number => s !== null)
      .sort((a, b) => Math.abs(minuutVanDag(new Date(a)) - doel) - Math.abs(minuutVanDag(new Date(b)) - doel))
    if (kandidaten.length > 0) voegToe(kandidaten[0], 'vrij')
  }

  return uit.sort((a, b) => (a.reden === b.reden ? a.startOp.localeCompare(b.startOp) : a.reden === 'gewoonte' ? -1 : 1))
}
