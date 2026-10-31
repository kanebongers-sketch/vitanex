// ─── Club: remmen in de database (SERVER-ONLY) ──────────────────────────────
// Een rem telt per sleutel hoe vaak iets binnen een venster gebeurde. In het
// geheugen (src/lib/utils/rate-limit.ts) begint die telling bij elke deploy
// opnieuw en telt elke instance apart; deze rem telt in de tabel club_remmen
// (migratie 483) met de atomische functie club_rem_tik, dus over alle
// instances heen en na een herstart.
//
// Sleutel: "<soort>:<HMAC>". De waarde (IP-adres, e-mailadres, lid-id) gaat
// alleen als HMAC via remSleutel naar de database, nooit in klare tekst; de
// database weigert elke andere vorm (check op de kolom).
//
// Valt de database weg (fout, time-out, migratie nog niet uitgevoerd):
//  - 'dicht': geremd. Voor alles wat geld kost (AI). Liever even geen
//    schatting dan een rekening zonder plafond.
//  - 'geheugen': de oude rem in het geheugen van deze instance telt. Voor
//    inloggen en aanmelden: helemaal open zou raden van wachtwoorden
//    toelaten, helemaal dicht zou iedereen buitensluiten zodra de database
//    hapert.
//
// Venster: vast (begint bij de eerste tik, daarna opnieuw). Een geweigerde
// poging telt niet mee, net als bij de rem in het geheugen.

import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubDatabase } from './database'
import { remSleutel } from './rem-hash'

export type BijStoring = 'dicht' | 'geheugen'

export interface DbRem {
  /** Korte naam van de rem: kleine letters, cijfers en koppeltekens (staat leesbaar in de sleutel). */
  readonly soort: string
  readonly max: number
  readonly vensterMs: number
  readonly bijStoring: BijStoring
}

/** true = toegestaan, false = geremd, null = de database gaf geen bruikbaar antwoord. */
export type RemTik = (sleutel: string, vensterSeconden: number, max: number) => Promise<boolean | null>

export interface RemDeps {
  readonly tik?: RemTik
  readonly geheugen?: (sleutel: string, max: number, vensterMs: number) => boolean
}

const SOORT = /^[a-z0-9-]{1,48}$/
/** Een rem mag de vraag niet lang ophouden; daarna telt de terugval. */
const TIMEOUT_MS = 1500
/** Hoogstens een melding per minuut als de database wegvalt (geen logstorm, geen persoonsgegevens). */
const MELD_MS = 60_000
let laatsteMelding = 0

/** De sleutel zoals hij in club_remmen staat. */
export function dbRemSleutel(soort: string, waarde: string, geheim?: string): string {
  if (!SOORT.test(soort)) throw new Error('Ongeldige soort voor een rem.')
  return `${soort}:${remSleutel(`db-rem|${soort}`, waarde, geheim)}`
}

/** Seconden voor de database: altijd minstens 1, naar boven afgerond. */
export function vensterSeconden(vensterMs: number): number {
  return Math.max(1, Math.ceil(vensterMs / 1000))
}

/** Roept club_rem_tik aan. Alleen deze functie praat met de tabel club_remmen. */
export const tikInDatabase: RemTik = async (sleutel, seconden, max) => {
  const { data, error } = await clubDatabase()
    .rpc('club_rem_tik', { p_sleutel: sleutel, p_venster_seconden: seconden, p_max: max })
    .abortSignal(AbortSignal.timeout(TIMEOUT_MS))
  if (error || typeof data !== 'boolean') return null
  return data
}

function meldStoring(soort: string): void {
  const nu = Date.now()
  if (nu - laatsteMelding < MELD_MS) return
  laatsteMelding = nu
  console.error('[club/rem] database niet bereikbaar, terugval actief voor', soort)
}

/**
 * True als de rem dicht is (of dicht blijft omdat de database wegviel bij een
 * rem met bijStoring 'dicht'). Registreert de poging meteen als hij mag.
 */
export async function isGeremd(rem: DbRem, waarde: string, deps: RemDeps = {}): Promise<boolean> {
  const sleutel = dbRemSleutel(rem.soort, waarde)
  let mag: boolean | null
  try {
    mag = await (deps.tik ?? tikInDatabase)(sleutel, vensterSeconden(rem.vensterMs), rem.max)
  } catch {
    mag = null
  }
  if (mag !== null) return !mag
  meldStoring(rem.soort)
  if (rem.bijStoring === 'dicht') return true
  return (deps.geheugen ?? isRateLimited)(`db-rem-terugval|${sleutel}`, rem.max, rem.vensterMs)
}

/** Een stand in club_remmen, voor de nabootsing in tests. */
export interface RemStand {
  readonly aantal: number
  readonly vensterTot: number
}

/**
 * Dezelfde regel als club_rem_tik, puur (voor tests en de nep-database): nieuw
 * of verlopen venster = opnieuw tellen; anders ophogen zolang onder het maximum.
 */
export function tikVenster(stand: RemStand | undefined, nu: number, vensterMs: number, max: number): { stand: RemStand; mag: boolean } {
  if (max <= 0) return { stand: stand ?? { aantal: 0, vensterTot: nu + vensterMs }, mag: false }
  if (!stand || stand.vensterTot <= nu) return { stand: { aantal: 1, vensterTot: nu + vensterMs }, mag: true }
  if (stand.aantal < max) return { stand: { aantal: stand.aantal + 1, vensterTot: stand.vensterTot }, mag: true }
  return { stand, mag: false }
}

/** Een RemTik in het geheugen met de regel van de database (alleen voor tests). */
export function nepRemTik(klok: () => number = Date.now): RemTik & { standen: Map<string, RemStand> } {
  const standen = new Map<string, RemStand>()
  const tik = async (sleutel: string, seconden: number, max: number) => {
    const uit = tikVenster(standen.get(sleutel), klok(), seconden * 1000, max)
    standen.set(sleutel, uit.stand)
    return uit.mag
  }
  return Object.assign(tik, { standen })
}
