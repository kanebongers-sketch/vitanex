// ─── Fit Factory Club: tijd in Nederlandse dagen (PUUR) ─────────────────────
// Bezoeken en lessen tellen per kalenderdag in Europe/Amsterdam, ook als de
// server in UTC draait. Een dag heet hier een "sleutel": 2026-10-14.

import { LOCALE, type Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

const DAG = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Amsterdam' })
const UUR = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })
const DATUM_KORT: Record<Taal, Intl.DateTimeFormat> = {
  nl: new Intl.DateTimeFormat(LOCALE.nl, { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }),
  en: new Intl.DateTimeFormat(LOCALE.en, { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }),
}
const DATUM_JAAR: Record<Taal, Intl.DateTimeFormat> = {
  nl: new Intl.DateTimeFormat(LOCALE.nl, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' }),
  en: new Intl.DateTimeFormat(LOCALE.en, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' }),
}
const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

const MS_DAG = 86_400_000

/** De dagsleutel (YYYY-MM-DD) van een moment in Nederlandse tijd. */
export function dagSleutel(moment: Date): string {
  return DAG.format(moment)
}

function delen(sleutel: string): [number, number, number] {
  const [j, m, d] = sleutel.split('-').map(Number)
  return [j, m, d]
}

/** Volgnummer van een dag (dagen sinds 1970), om dagen af te trekken zonder tijdzonegedoe. */
export function dagNummer(sleutel: string): number {
  const [j, m, d] = delen(sleutel)
  return Math.round(Date.UTC(j, m - 1, d) / MS_DAG)
}

/** Hoeveel kalenderdagen `eerder` voor `later` ligt (Nederlandse dagen). */
export function dagenGeleden(eerder: Date, later: Date): number {
  return dagNummer(dagSleutel(later)) - dagNummer(dagSleutel(eerder))
}

/** Middernacht (begin van de dag) in Nederland als UTC-moment. */
export function middernachtNl(sleutel: string): Date {
  const [j, m, d] = delen(sleutel)
  const utc = Date.UTC(j, m - 1, d)
  // Om 00:00 UTC is het in Nederland 01:00 (winter) of 02:00 (zomer).
  const uur = Number(UUR.format(new Date(utc)))
  return new Date(utc - uur * 3_600_000)
}

/** Begin en eind (exclusief) van de Nederlandse dag waarin `nu` valt. */
export function dagGrenzen(nu: Date): { van: Date; tot: Date } {
  const sleutel = dagSleutel(nu)
  const morgen = new Date((dagNummer(sleutel) + 1) * MS_DAG).toISOString().slice(0, 10)
  return { van: middernachtNl(sleutel), tot: middernachtNl(morgen) }
}

/** Weekdag in Nederland: 1 = maandag tot 7 = zondag. */
export function weekdagNl(moment: Date): number {
  const w = new Date(`${dagSleutel(moment)}T12:00:00Z`).getUTCDay()
  return w === 0 ? 7 : w
}

/** "Vandaag", "Gisteren", "3 dagen geleden", "12 okt" of "Nooit". */
export function laatsteBezoekTekst(op: Date | null, nu: Date, taal: Taal = 'nl'): string {
  const t = LEDEN[taal].tijd
  if (!op) return t.nooit
  const dagen = dagenGeleden(op, nu)
  if (dagen <= 0) return t.vandaag
  if (dagen === 1) return t.gisteren
  if (dagen < 7) return t.dagenGeleden(dagen)
  return datumKort(op, nu, taal)
}

/** "12 okt" binnen hetzelfde jaar, anders "12 okt 2025". */
export function datumKort(op: Date, nu: Date, taal: Taal = 'nl'): string {
  const zelfdeJaar = dagSleutel(op).slice(0, 4) === dagSleutel(nu).slice(0, 4)
  return (zelfdeJaar ? DATUM_KORT : DATUM_JAAR)[taal].format(op).replace('.', '')
}

/** "18:30" in Nederlandse tijd. */
export function tijdNl(op: Date): string {
  return TIJD.format(op)
}

/** Leeftijd in jaren op `nu`, of null bij een onbruikbare datum. */
export function leeftijd(geboortedatum: string | null, nu: Date): number | null {
  if (!geboortedatum || !/^\d{4}-\d{2}-\d{2}/.test(geboortedatum)) return null
  const [gj, gm, gd] = delen(geboortedatum.slice(0, 10))
  const [j, m, d] = delen(dagSleutel(nu))
  const jaren = j - gj - (m < gm || (m === gm && d < gd) ? 1 : 0)
  return jaren >= 0 && jaren < 130 ? jaren : null
}

/** Een datumtekst uit de database (YYYY-MM-DD) als Nederlandse datum, bv. "3 mrt 2022". */
export function datumUitSleutel(sleutel: string | null, taal: Taal = 'nl'): string | null {
  if (!sleutel || !/^\d{4}-\d{2}-\d{2}/.test(sleutel)) return null
  return DATUM_JAAR[taal].format(new Date(`${sleutel.slice(0, 10)}T12:00:00Z`)).replace('.', '')
}
