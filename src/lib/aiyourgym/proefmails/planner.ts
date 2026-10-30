// ─── AI Your Gym: welke startmail is nu aan de beurt (PUUR) ─────────────────
// Drie korte mails in de eerste dagen na het aanmelden: dag 1 (waar je begint),
// dag 3 (leden inlezen) en dag 7 (de ledenapp op je eigen telefoon).
//
// Er is geen proefperiode meer (besluit Kane 30-10-2026): de sportschool betaalt
// bij het aanmelden meteen de eerste maand. De herinnering "je proefperiode
// loopt af" is daarom weg; de drie tips blijven nuttig om goed te starten. De
// map en de tabel heten nog "proefmails" (historisch, zie migratie 459).
//
// Elke mail heeft een venster. Is het venster voorbij (de cron lag stil, of de
// schakelaar ging later aan), dan slaan we die mail over in plaats van alles in
// een keer te sturen. Per run hooguit een mail per sportschool.
//
// Schakelaar: AIYOURGYM_PROEFMAILS=1 in Render. UIT (standaard) = er gaat niets
// weg; Kane beslist wanneer de mails aangaan.

export const DAG_MS = 24 * 60 * 60 * 1000

export const PROEFMAIL_SOORTEN = ['dag1', 'dag3', 'dag7'] as const
export type ProefmailSoort = (typeof PROEFMAIL_SOORTEN)[number]

export function isProefmailSoort(v: unknown): v is ProefmailSoort {
  return (PROEFMAIL_SOORTEN as readonly unknown[]).includes(v)
}

export function proefmailsAan(env: Record<string, string | undefined> = process.env): boolean {
  return env.AIYOURGYM_PROEFMAILS === '1'
}

export interface Venster {
  soort: ProefmailSoort
  /** Dagen na het aanmelden (van tot, niet tot en met). */
  van: number
  tot: number
}

/** De vensters in dagen na het aanmelden. */
export const VENSTERS: readonly Venster[] = [
  { soort: 'dag1', van: 1, tot: 3 },
  { soort: 'dag3', van: 3, tot: 7 },
  { soort: 'dag7', van: 7, tot: 10 },
]

/** Na zoveel dagen komt er geen startmail meer. */
export const LAATSTE_DAG = VENSTERS[VENSTERS.length - 1].tot

export interface PlanInvoer {
  /** Moment van aanmelden. */
  start: Date
  verstuurd: ReadonlySet<ProefmailSoort>
  nu: Date
}

/** De mail die nu verstuurd mag worden, of null. */
export function planProefmail({ start, verstuurd, nu }: PlanInvoer): ProefmailSoort | null {
  const begin = start.getTime()
  if (Number.isNaN(begin)) return null
  const dagen = (nu.getTime() - begin) / DAG_MS
  return VENSTERS.find((v) => dagen >= v.van && dagen < v.tot && !verstuurd.has(v.soort))?.soort ?? null
}

/** Het volgnummer in de reeks ("mail 2 van 3"). */
export function volgnummer(soort: ProefmailSoort): number {
  return PROEFMAIL_SOORTEN.indexOf(soort) + 1
}
