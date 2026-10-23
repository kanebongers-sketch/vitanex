// ─── AI Your Gym: welke proefmail is nu aan de beurt (PUUR) ─────────────────
// Vier korte mails in de proefperiode: dag 1 (waar je begint), dag 3 (leden
// inlezen), dag 7 (de ledenapp op je eigen telefoon) en 3 dagen voor het einde
// een eerlijke herinnering met wat er dan gebeurt.
//
// Elke mail heeft een venster. Is het venster voorbij (de cron lag stil, of de
// schakelaar ging later aan), dan slaan we die mail over in plaats van alles in
// een keer te sturen. Per run hooguit een mail per sportschool.
//
// Schakelaar: AIYOURGYM_PROEFMAILS=1 in Render. UIT (standaard) = er gaat niets
// weg; Kane beslist wanneer de mails aangaan.

import { DAG_MS } from './proefperiode'

export const PROEFMAIL_SOORTEN = ['dag1', 'dag3', 'dag7', 'einde'] as const
export type ProefmailSoort = (typeof PROEFMAIL_SOORTEN)[number]

export function isProefmailSoort(v: unknown): v is ProefmailSoort {
  return (PROEFMAIL_SOORTEN as readonly unknown[]).includes(v)
}

export function proefmailsAan(env: Record<string, string | undefined> = process.env): boolean {
  return env.AIYOURGYM_PROEFMAILS === '1'
}

/** Zo lang voor het einde komt de herinnering. */
export const HERINNERING_DAGEN = 3

export interface Venster {
  soort: ProefmailSoort
  van: number
  tot: number
}

/** De vensters (in ms) voor een proefperiode van `start` tot `einde`. Een tip loopt nooit door in de herinnering. */
export function vensters(start: number, einde: number): Venster[] {
  const herinnering = einde - HERINNERING_DAGEN * DAG_MS
  const tip = (soort: ProefmailSoort, van: number, tot: number): Venster => ({ soort, van: start + van * DAG_MS, tot: Math.min(start + tot * DAG_MS, herinnering) })
  return [tip('dag1', 1, 3), tip('dag3', 3, 7), tip('dag7', 7, 10), { soort: 'einde', van: Math.max(herinnering, start), tot: einde }]
}

export interface PlanInvoer {
  /** Begin van de proefperiode (aanmelding). */
  start: Date
  /** Einde van de proefperiode, of null (dan geen mails). */
  einde: Date | null
  verstuurd: ReadonlySet<ProefmailSoort>
  nu: Date
}

/** De mail die nu verstuurd mag worden, of null. De herinnering gaat voor. */
export function planProefmail({ start, einde, verstuurd, nu }: PlanInvoer): ProefmailSoort | null {
  if (!einde) return null
  const t = nu.getTime()
  const begin = start.getTime()
  if (Number.isNaN(begin) || t >= einde.getTime() || t < begin) return null
  const open = vensters(begin, einde.getTime()).filter((v) => v.van < v.tot && t >= v.van && t < v.tot && !verstuurd.has(v.soort))
  return open.find((v) => v.soort === 'einde')?.soort ?? open[0]?.soort ?? null
}

/** Het volgnummer in de reeks ("mail 2 van 4"). */
export function volgnummer(soort: ProefmailSoort): number {
  return PROEFMAIL_SOORTEN.indexOf(soort) + 1
}
