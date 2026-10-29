// ─── Club, sluitingsdagen: teksten voor het scherm (PUUR) ───────────────────

import { isoWeekdag, plusDagen } from '@/lib/club/rooster/tijd'
import type { Sluiting } from './model'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { SLUITING_MELDING } from '@/lib/aiyourgym/taal/woorden/club/opvolgen'
import { dagKort as kortVanDag, weekdagNaam } from '@/lib/club/cijfers/tijd'

export const MAAND_NAAM = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'] as const
const DAG_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const
const MAAND_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const
const DAG_LANG = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'] as const

/** "2026-12-26" naar "za 26 dec". */
export function datumKort(datum: string, taal: Taal = 'nl'): string {
  if (taal === 'en') return `${weekdagNaam(isoWeekdag(datum), 'en').slice(0, 3)} ${kortVanDag(datum, 'en')}`
  const maand = MAAND_NAAM[Number(datum.slice(5, 7)) - 1].slice(0, 3)
  return `${DAG_KORT[isoWeekdag(datum) - 1]} ${Number(datum.slice(8, 10))} ${maand}`
}

/** "2026-12-26" naar "zaterdag 26 december". */
export function datumLang(datum: string, taal: Taal = 'nl'): string {
  if (taal === 'en') return `${weekdagNaam(isoWeekdag(datum), 'en')} ${Number(datum.slice(8, 10))} ${MAAND_EN[Number(datum.slice(5, 7)) - 1]}`
  return `${DAG_LANG[isoWeekdag(datum) - 1]} ${Number(datum.slice(8, 10))} ${MAAND_NAAM[Number(datum.slice(5, 7)) - 1]}`
}

/** "Vandaag", "Morgen" of de korte datum. */
export function wanneer(datum: string, vandaag: string, taal: Taal = 'nl'): string {
  const t = SLUITING_MELDING[taal]
  if (datum === vandaag) return t.vandaag
  if (datum === plusDagen(vandaag, 1)) return t.morgen
  return datumKort(datum, taal)
}

/** "Gesloten" of "Open 09:00 tot 14:00". */
export function soortTekst(s: Pick<Sluiting, 'soort' | 'van' | 'tot'>, taal: Taal = 'nl'): string {
  const t = SLUITING_MELDING[taal]
  return s.soort === 'gesloten' || !s.van || !s.tot ? t.gesloten : t.open(s.van, s.tot)
}

/** "1 les" of "3 lessen". */
export function lessenTekst(n: number): string {
  return n === 1 ? '1 les' : `${n} lessen`
}
