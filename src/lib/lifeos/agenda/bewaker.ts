// ─── LifeOS — agenda-bewaker: botsingen, reistijd en rust (puur) ────────────
// Kijkt vooruit in je agenda en meldt wat je vóór die dag wilt oplossen:
//   1. Botsing: twee afspraken tegelijk. Een lang blok (≥ 3 uur, zoals "Werken in
//      Budel") telt niet: daar horen afspraken ín te staan, dat is geen conflict.
//   2. Reistijd: twee afspraken op verschillende locaties (Budel/Bergeijk/Someren)
//      met minder dan 20 minuten ertussen.
//   3. Rust: vier of meer avonden op rij werk tot 20:30 of later, of een week
//      zonder één vrije avond. Persoonlijke afspraken (etentje, feest) tellen
//      niet als werk.
// PUUR: afspraken + categorie in → meldingen uit. Geen fetch, geen "nu" binnenin.

import type { Afspraak } from './vrije-blokken'
import type { AgendaCategorie } from './categorie'
import { woordTokens } from '@/lib/lifeos/crm/agenda-match'

export interface BewaakAfspraak extends Afspraak {
  categorie: AgendaCategorie
}

export interface Melding {
  soort: 'botsing' | 'reistijd' | 'rust'
  tekst: string
}

const MIN = 60_000
const LANG_BLOK_MS = 3 * 60 * MIN
const REISTIJD_MS = 20 * MIN
const LAAT_AVOND_MIN = 20 * 60 + 30
const AVOND_START_MIN = 18 * 60
const MAX_AVONDEN_OP_RIJ = 4

const LOCATIES: Record<string, string> = { budel: 'Budel', bergeijk: 'Bergeijk', someren: 'Someren' }

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })
const DAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })
const WEEKDAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', timeZone: 'Europe/Amsterdam' })

function getimed(a: BewaakAfspraak): a is BewaakAfspraak & { eindOp: Date } {
  return !a.heleDag && a.eindOp !== null && a.eindOp.getTime() > a.startOp.getTime()
}

function titel(a: Afspraak): string {
  return a.titel?.trim() || '(zonder titel)'
}

/** De locatie van een afspraak: uit het locatieveld of de titel, of null. */
export function locatieVan(a: Afspraak): string | null {
  for (const bron of [a.locatie, a.titel]) {
    const gevonden = woordTokens(bron ?? '').find((t) => t in LOCATIES)
    if (gevonden) return LOCATIES[gevonden]
  }
  return null
}

/** Twee afspraken die elkaar overlappen (lange blokken tellen niet mee). */
export function botsingen(afspraken: readonly BewaakAfspraak[]): Melding[] {
  const kort = afspraken.filter(getimed).filter((a) => a.eindOp.getTime() - a.startOp.getTime() < LANG_BLOK_MS)
  const gesorteerd = [...kort].sort((a, b) => a.startOp.getTime() - b.startOp.getTime())
  const uit: Melding[] = []
  for (let i = 0; i < gesorteerd.length; i++) {
    for (let j = i + 1; j < gesorteerd.length; j++) {
      const a = gesorteerd[i]
      const b = gesorteerd[j]
      if (b.startOp.getTime() >= a.eindOp.getTime()) break
      uit.push({
        soort: 'botsing',
        tekst: `${DAG.format(a.startOp)}: "${titel(a)}" (${TIJD.format(a.startOp)}) en "${titel(b)}" (${TIJD.format(b.startOp)}) overlappen`,
      })
    }
  }
  return uit
}

/** Opeenvolgende afspraken op verschillende locaties met te weinig tijd ertussen. */
export function reistijd(afspraken: readonly BewaakAfspraak[]): Melding[] {
  const metLocatie = afspraken
    .filter(getimed)
    .map((a) => ({ a, loc: locatieVan(a) }))
    .filter((x): x is { a: BewaakAfspraak & { eindOp: Date }; loc: string } => x.loc !== null)
    .sort((x, y) => x.a.startOp.getTime() - y.a.startOp.getTime())
  const uit: Melding[] = []
  for (let i = 1; i < metLocatie.length; i++) {
    const vorige = metLocatie[i - 1]
    const volgende = metLocatie[i]
    if (vorige.loc === volgende.loc) continue
    const tussen = volgende.a.startOp.getTime() - vorige.a.eindOp.getTime()
    if (tussen < 0 || tussen >= REISTIJD_MS) continue
    const minuten = Math.round(tussen / MIN)
    uit.push({
      soort: 'reistijd',
      tekst: `${DAG.format(volgende.a.startOp)}: ${minuten === 0 ? 'geen' : `${minuten} min`} reistijd van ${vorige.loc} (${titel(vorige.a)}, tot ${TIJD.format(vorige.a.eindOp)}) naar ${volgende.loc} (${titel(volgende.a)}, ${TIJD.format(volgende.a.startOp)})`,
    })
  }
  return uit
}

function minuutVanDag(d: Date): number {
  const [u, m] = TIJD.format(d).split(':').map(Number)
  return u * 60 + m
}

function dagSleutel(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(d)
}

/**
 * Rust: `dagen` = de dagsleutels (YYYY-MM-DD, oplopend) die je bekijkt. Werk-avond
 * = een niet-persoonlijke afspraak die eindigt om 20:30 of later; bezette avond =
 * een niet-persoonlijke afspraak na 18:00.
 */
export function rust(afspraken: readonly BewaakAfspraak[], dagen: readonly string[]): Melding[] {
  const werk = afspraken.filter(getimed).filter((a) => a.categorie !== 'persoonlijk')
  const laat = new Set(werk.filter((a) => minuutVanDag(a.eindOp) >= LAAT_AVOND_MIN).map((a) => dagSleutel(a.startOp)))
  const bezet = new Set(werk.filter((a) => minuutVanDag(a.eindOp) > AVOND_START_MIN).map((a) => dagSleutel(a.startOp)))
  const uit: Melding[] = []

  let reeks: string[] = []
  let langste: string[] = []
  for (const d of dagen) {
    reeks = laat.has(d) ? [...reeks, d] : []
    if (reeks.length > langste.length) langste = reeks
  }
  if (langste.length >= MAX_AVONDEN_OP_RIJ) {
    const van = WEEKDAG.format(new Date(`${langste[0]}T12:00:00Z`))
    const tot = WEEKDAG.format(new Date(`${langste[langste.length - 1]}T12:00:00Z`))
    uit.push({ soort: 'rust', tekst: `${langste.length} avonden op rij werk tot 20:30 of later (${van} t/m ${tot}) — plan ergens een vrije avond.` })
  }
  if (dagen.length >= 7 && dagen.every((d) => bezet.has(d))) {
    uit.push({ soort: 'rust', tekst: 'De komende 7 dagen heb je geen enkele vrije avond — houd er één vrij.' })
  }
  return uit
}

/** Alles samen, zonder dubbele regels. */
export function bewaakAgenda(afspraken: readonly BewaakAfspraak[], dagen: readonly string[]): Melding[] {
  const alle = [...botsingen(afspraken), ...reistijd(afspraken), ...rust(afspraken, dagen)]
  const gezien = new Set<string>()
  return alle.filter((m) => (gezien.has(m.tekst) ? false : (gezien.add(m.tekst), true)))
}
