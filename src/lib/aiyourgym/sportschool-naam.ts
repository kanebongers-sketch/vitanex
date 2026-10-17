// ─── AI Your Gym: de naam van een nieuwe sportschool (PUUR) ─────────────────

import { MAX_NAAM } from './aanmelding'

/** Bestaat de naam al (bij een andere sportschool), dan de naam met het adres erachter. */
export function naamMetAdres(naam: string, slug: string): string {
  const achter = ` (${slug})`
  return `${naam.slice(0, MAX_NAAM - achter.length).trimEnd()}${achter}`
}
