// ─── LifeOS — journal & reflectie ───────────────────────────────────────────
// Vervangt je journal-app. Voor het Avond-moment: "Hoe ging het?" Twee minuten.
// Wat ging goed, wat schuurde.
//
// Een journal is een view op `notities` met `soort = 'journal'` — zie de
// onderbouwing bovenin migratie 050. Dit bestand voegt daar het toe wat écht
// alleen voor de journal geldt: één per dag, auto-save, en de terugblik naar
// gisteren.
//
// Puur bestand: geen fetch, geen DB, geen React, geen verborgen `Date.now()`.
// De klok komt er altijd ín (zie `lib/focus/focus.ts`), zodat dit testbaar is
// zonder de tijd te mocken.

import { datumSleutel, leesDatumSleutel, tijdLabel } from '@/lib/lifeos/datum/datum'
import { leesDatum, leesTekst, MAX_TEKST_LENGTE, leesNotitieJson, type Notitie, type Validatie } from '@/lib/lifeos/notities/notities'

export { MAX_TEKST_LENGTE }

/**
 * De dag vóór deze dagsleutel, of null als de sleutel geen datum is.
 *
 * Via `setDate()` op een lokale Date en niet via "min 86.400.000 ms": op de dag
 * dat de zomertijd ingaat duurt een dag 23 uur, en dan geeft die aftreksom je
 * 23:00 van de dag ervóór — of dezelfde dag terug. `setDate` is kalender-bewust.
 */
export function vorigeDagSleutel(sleutel: string): string | null {
  const dag = leesDatumSleutel(sleutel)
  if (dag === null) return null

  const vorige = new Date(dag)
  vorige.setDate(vorige.getDate() - 1)
  return datumSleutel(vorige)
}

// ─── Opslaan ────────────────────────────────────────────────────────────────

export interface JournalOpslaan {
  /** Leeg = de journal van die dag wissen. Zie hieronder. */
  tekst: string
  datum: string
}

/**
 * Wat er opgeslagen moet worden, uit een request-body.
 *
 * Anders dan bij een brain dump is lege tekst hier GELDIG: auto-save vuurt ook
 * als je je hele reflectie weer weghaalt, en dan moet de rij weg. De alternatieven
 * zijn allebei slechter: een 400 teruggeven laat de indicator op "mislukt"
 * staan terwijl er niets mis is, en een lege rij bewaren mag niet van de
 * check-constraint in 050. Wissen is wat de gebruiker bedoelde.
 */
export function leesJournalOpslaan(body: unknown): Validatie<JournalOpslaan> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, fout: 'Ongeldige invoer.' }
  }
  const b = body as Record<string, unknown>

  if (typeof b.tekst !== 'string') return { ok: false, fout: 'Tekst ontbreekt.' }

  const datum = leesDatum(b.datum)
  if (!datum.ok) return datum

  const leeg = b.tekst.trim().length === 0
  if (leeg) return { ok: true, waarde: { tekst: '', datum: datum.waarde } }

  // Niet-leeg: door dezelfde poort als elke andere notitie (trimt + lengte).
  const tekst = leesTekst(b.tekst)
  if (!tekst.ok) return tekst

  return { ok: true, waarde: { tekst: tekst.waarde, datum: datum.waarde } }
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────

export interface JournalDag {
  /** De journal van deze dag, of null als je nog niets schreef. */
  journal: Notitie | null
  /**
   * Schreef je gisteren? Puur informatief.
   *
   * NADRUKKELIJK GEEN STREAK. Geen teller, geen vlammetje, geen "je verliest
   * je reeks". Verliesangst in een reflectie-tool zorgt dat je schrijft om de
   * teller te redden in plaats van omdat je iets te verwerken hebt — en dat is
   * precies het dark pattern dat in MentaForce is opgeruimd. Dit veld mag nooit
   * uitgroeien tot een `streakLengte`.
   */
  gisterenGeschreven: boolean
}

/** Het antwoord van `GET /api/journal`. */
export function leesJournalDagAntwoord(ruw: unknown): JournalDag | null {
  if (typeof ruw !== 'object' || ruw === null || Array.isArray(ruw)) return null
  const o = ruw as Record<string, unknown>

  if (typeof o.gisterenGeschreven !== 'boolean') return null

  // `journal: null` is geldig (je schreef nog niets) — maar een object dat er
  // wél is en niet klopt, is een fout. Die twee mogen niet op één hoop.
  if (o.journal === null) {
    return { journal: null, gisterenGeschreven: o.gisterenGeschreven }
  }
  const journal = leesNotitieJson(o.journal)
  if (journal === null || journal.soort !== 'journal') return null

  return { journal, gisterenGeschreven: o.gisterenGeschreven }
}

/** Het antwoord van `PUT /api/journal`. `journal: null` = gewist. */
export function leesJournalAntwoord(ruw: unknown): { journal: Notitie | null } | null {
  if (typeof ruw !== 'object' || ruw === null || Array.isArray(ruw)) return null
  const o = ruw as Record<string, unknown>

  if (!('journal' in o)) return null
  if (o.journal === null) return { journal: null }

  const journal = leesNotitieJson(o.journal)
  if (journal === null || journal.soort !== 'journal') return null
  return { journal }
}

// ─── Auto-save: de staat ────────────────────────────────────────────────────
// Een journal die stil niet opslaat is erger dan geen journal. Daarom is de
// opslagstaat een expliciet type en geen `bezig`-boolean: "er staat iets open"
// en "het is mislukt" zijn verschillende dingen, en de laatste moet je zíén.

export type OpslagStatus =
  /** Niets veranderd sinds de laatste opslag. Geen indicator nodig. */
  | { fase: 'rustig' }
  /** Getypt; de debounce loopt nog. */
  | { fase: 'wacht' }
  | { fase: 'bezig' }
  /** `op` = ms sinds epoch. De klok komt erín, niet uit een Date.now() hierbinnen. */
  | { fase: 'opgeslagen'; op: number }
  | { fase: 'mislukt'; bericht: string }

export const RUSTIG: OpslagStatus = Object.freeze({ fase: 'rustig' })

/** Hoe lang we wachten na de laatste toetsaanslag. */
export const DEBOUNCE_MS = 1_500

/**
 * Wat er onder het tekstveld staat, of null als er niets te melden valt.
 *
 * `mislukt` staat hier bewust NIET tussen: dat rendert als een echte
 * foutmelding met een weg terug, niet als een grijs regeltje dat je over het
 * hoofd ziet. Deze functie geeft daarom null — de component toont dan
 * `Foutmelding`.
 */
export function opslagLabel(status: OpslagStatus): string | null {
  if (status.fase === 'wacht') return 'Nog niet opgeslagen'
  if (status.fase === 'bezig') return 'Opslaan…'
  if (status.fase === 'opgeslagen') return `Opgeslagen om ${tijdLabel(new Date(status.op))}`
  return null
}

/**
 * Moet er nu opgeslagen worden?
 *
 * De vergelijking is op getrimde tekst: spaties aan het eind zijn geen wijziging
 * die een request waard is, en de server trimt ze toch weg. Zonder dit slaat
 * elke spatiebalk-aanslag opnieuw op.
 */
export function moetOpslaan(bewerkt: string, opgeslagen: string): boolean {
  return bewerkt.trim() !== opgeslagen.trim()
}

/**
 * De regel over gisteren. Eén zin, geen teller.
 *
 * "Geeft niet" is niet vriendelijkheid voor de vorm: zonder die woorden leest
 * "gisteren schreef je niet" als een verwijt, en dan heb je alsnog een streak
 * gebouwd — alleen zonder het cijfer erbij.
 */
export function gisterenTekst(geschreven: boolean): string {
  return geschreven ? 'Gisteren schreef je ook.' : 'Gisteren schreef je niet. Geeft niet.'
}
