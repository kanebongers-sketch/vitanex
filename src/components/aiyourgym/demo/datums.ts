// ─── AI Your Gym, demo: datums in de taal van de pagina (PUUR) ──────────────
// Nederlands via de vaste functies van Club (lib/club/cijfers/tijd), zoals de
// demo altijd deed; Engels via formaat.ts en nieuw.ts (en-GB, 24 October).

import { dagKort as dagKortNl, dagLang as dagLangNl, weekdagNaam, weekdagVan } from '@/lib/club/cijfers/tijd'
import { korteDatum, maandNaam } from '@/lib/aiyourgym/nieuw'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import type { Taal } from '@/lib/aiyourgym/taal/taal'

/** Een dag als jjjj-mm-dd, midden op de dag zodat de tijdzone hem niet verschuift. */
function middag(dag: string): string {
  return `${dag}T12:00:00Z`
}

/** "dinsdag 14 oktober" | "Tuesday 14 October" */
export function dagLang(dag: string, taal: Taal): string {
  return taal === 'en' ? formatDatum(middag(dag), 'en', 'dag') : dagLangNl(dag)
}

/** "14 okt" | "14 Oct" */
export function dagKort(dag: string, taal: Taal): string {
  return taal === 'en' ? korteDatum(dag, 'en') : dagKortNl(dag)
}

/** "dinsdag" | "Tuesday" */
export function weekdag(dag: string, taal: Taal): string {
  return taal === 'en' ? formatDatum(middag(dag), 'en', 'dag').split(' ')[0] : weekdagNaam(weekdagVan(dag))
}

/** "Oktober 2026" | "October 2026", uit jjjj-mm of jjjj-mm-dd. */
export function maandJaar(maand: string, taal: Taal): string {
  return maandNaam(maand.slice(0, 7), taal)
}

/** Alleen de maand: "oktober" | "October". */
export function maandAlleen(maand: string, taal: Taal): string {
  const naam = maandJaar(maand, taal).split(' ')[0]
  return taal === 'en' ? naam : naam.toLowerCase()
}

export function hoofdletter(t: string): string {
  return t ? t[0].toUpperCase() + t.slice(1) : t
}
