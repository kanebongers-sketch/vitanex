// ─── Club, health: toestemming van het lid (PUUR) ───────────────────────────
// Gezondheidsgegevens zijn bijzondere persoonsgegevens (art. 9 AVG). Het lid
// kiest daarom zelf, per soort:
//   1. wat Club van een app of apparaat mag ophalen en bewaren (delen), en
//   2. wat de trainers van de sportschool daarvan mogen zien (trainerZien).
// Twee aparte schakelaars: een lid kan gegevens voor zichzelf bijhouden zonder
// dat de sportschool ze ziet. trainerZien is altijd een deel van delen.
// Sommige leveranciers eisen meer (Strava: alleen voor de sporter zelf). Voor zo'n
// bron (regels.trainer 'apart' in providers.ts) is er een eigen schakelaar:
// trainerBronnen. Zonder die bron daarin zien trainers niets van die bron.
//
// Elke keuze wordt een nieuwe rij met tijdstip en tekstversie (bewijs van de
// toestemming). Intrekken kan altijd: dan zijn beide lijsten leeg. Een nieuwe
// tekstversie = opnieuw vragen (de oude toestemming telt niet voor de nieuwe tekst).

import { BRONNEN, DATA_SOORTEN, isBronId, isDataSoort, type BronId, type DataSoort, type Meting } from './typen'
import { PROVIDERS } from './providers'

/** Verhoog bij elke inhoudelijke wijziging van de tekst hieronder. */
export const TOESTEMMING_VERSIE = '2026-10-23.1'

export const TOESTEMMING_TEKST = [
  'Je kiest zelf welke gegevens uit je apps en apparaten de sportschool mag ophalen en bewaren. Het gaat om gezondheidsgegevens; zonder jouw toestemming halen we niets op.',
  'Apart kies je wat de trainers van de sportschool mogen zien. Wat je niet aanvinkt, zie alleen jij. Voor Strava is er nog een eigen schakelaar: zonder die zien trainers je Strava-trainingen niet.',
  'De gegevens staan versleuteld bij de sportschool in Club (servers in de EU) en worden niet gedeeld met anderen of gebruikt voor reclame.',
  'Je kunt je toestemming altijd intrekken. Dan halen we niets meer op, en je kiest of de gegevens die al binnen zijn ook worden gewist.',
] as const

export interface Toestemming {
  delen: readonly DataSoort[]
  trainerZien: readonly DataSoort[]
  /** Bronnen met een eigen trainerschakelaar die het lid aanzette (bijv. strava). */
  trainerBronnen: readonly BronId[]
  versie: string
  gegevenOp: string | null
  ingetrokkenOp: string | null
}

export const GEEN_TOESTEMMING: Toestemming = { delen: [], trainerZien: [], trainerBronnen: [], versie: TOESTEMMING_VERSIE, gegevenOp: null, ingetrokkenOp: null }

function lijst(v: unknown): DataSoort[] {
  if (!Array.isArray(v)) return []
  const set = new Set(v.filter(isDataSoort))
  return DATA_SOORTEN.filter((s) => set.has(s))
}

/** Een keuze uit een JSON-body. trainerZien wordt altijd ingeperkt tot delen. */
/** Alleen bronnen die echt een eigen trainerschakelaar hebben. */
function apartBronnen(v: unknown): BronId[] {
  if (!Array.isArray(v)) return []
  const set = new Set(v.filter(isBronId))
  return BRONNEN.filter((b) => set.has(b) && PROVIDERS[b].regels.trainer === 'apart')
}

export function leesKeuze(body: unknown): { ok: true; delen: DataSoort[]; trainerZien: DataSoort[]; trainerBronnen: BronId[] } | { ok: false; fout: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, fout: 'Ongeldig verzoek.' }
  const r = body as Record<string, unknown>
  if (r.akkoord !== true) return { ok: false, fout: 'Lees de uitleg en vink aan dat je akkoord bent.' }
  if (r.versie !== TOESTEMMING_VERSIE) return { ok: false, fout: 'De uitleg is net gewijzigd. Ververs de pagina en lees hem opnieuw.' }
  const delen = lijst(r.delen)
  const trainerZien = lijst(r.trainerZien).filter((s) => delen.includes(s))
  return { ok: true, delen, trainerZien, trainerBronnen: apartBronnen(r.trainerBronnen) }
}

/** Een rij uit club_health_toestemmingen, of geen toestemming. Een oude tekstversie telt niet. */
export function toestemmingUitRij(rij: Record<string, unknown> | null | undefined): Toestemming {
  if (!rij) return GEEN_TOESTEMMING
  if (rij.tekst_versie !== TOESTEMMING_VERSIE) return GEEN_TOESTEMMING
  const delen = lijst(rij.delen)
  return {
    delen,
    trainerZien: lijst(rij.trainer_zien).filter((s) => delen.includes(s)),
    trainerBronnen: apartBronnen(rij.trainer_bronnen),
    versie: TOESTEMMING_VERSIE,
    gegevenOp: typeof rij.gegeven_op === 'string' ? rij.gegeven_op : null,
    ingetrokkenOp: typeof rij.ingetrokken_op === 'string' ? rij.ingetrokken_op : null,
  }
}

export function magDelen(t: Toestemming, soort: DataSoort): boolean {
  return t.ingetrokkenOp === null && t.delen.includes(soort)
}

/** Mag een trainer deze meting zien? De soort moet aan staan, en bij een bron met eigen regels ook de bron. */
export function magTrainerZien(t: Toestemming, soort: DataSoort, bron: BronId): boolean {
  if (!magDelen(t, soort) || !t.trainerZien.includes(soort)) return false
  return PROVIDERS[bron].regels.trainer !== 'apart' || t.trainerBronnen.includes(bron)
}

/** Alleen wat het lid laat ophalen. Wordt toegepast VOOR er iets in de database komt. */
export function filterOpDelen<T extends Pick<Meting, 'soort'>>(metingen: readonly T[], t: Toestemming): T[] {
  return metingen.filter((m) => magDelen(t, m.soort))
}

/** Alleen wat trainers mogen zien. */
export function filterVoorTrainer<T extends Pick<Meting, 'soort' | 'bron'>>(metingen: readonly T[], t: Toestemming): T[] {
  return metingen.filter((m) => magTrainerZien(t, m.soort, m.bron))
}

/** Welke soorten een trainer in principe kan zien (voor de query; de bronregel volgt per meting). */
export function trainerSoorten(t: Toestemming): DataSoort[] {
  return t.ingetrokkenOp === null ? t.trainerZien.filter((s) => t.delen.includes(s)) : []
}

/** Heeft het lid voor minstens een soort van deze bron toestemming gegeven? Anders niet koppelen. */
export function heeftToestemmingVoor(t: Toestemming, soorten: readonly DataSoort[]): boolean {
  return soorten.some((s) => magDelen(t, s))
}
