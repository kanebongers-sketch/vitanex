// ─── Club, lidmaatschappen: koppeling met check-in en reserveren (PUUR) ─────
// Wat er gebeurt als een lid volgens zijn vorm iets niet mag:
// - Check-in: nooit blokkeren. De balie ziet een waarschuwing en kan "Toch
//   inchecken"; dat wordt gelogd.
// - Reserveren in de ledenapp: weigeren met een vriendelijke melding.
// - Reserveren aan de balie (of door de instructeur): waarschuwen, en met
//   "Toch boeken" gaat het door (ook gelogd).
// Een lid zonder (bekende) vorm heeft geen beperkingen.

import { maandagVan, nlDelen, weekBereik } from '@/lib/club/rooster/tijd'
import { magBinnen, momentVan, type LesAanvraag, type ToegangRegel, type ToegangUitslag, type Weigering } from './regels'

/** Check-in: de waarschuwing voor de balie als de vorm dit lid hier of nu niet toelaat, anders null. */
export function checkinWaarschuwing(vorm: ToegangRegel | null, vestiging: string, nu: Date): string | null {
  const uitslag = magBinnen(vorm, vestiging, momentVan(nu))
  return uitslag.mag ? null : uitslag.reden
}

export type BoekBron = 'app' | 'balie' | 'instructeur'

export type BoekBesluit =
  /** Boeken mag. `ondanks` = de balie boekt bewust tegen de vorm in (loggen). */
  | { soort: 'door'; ondanks: string | null }
  /** Ledenapp: niet boeken, deze melding tonen. */
  | { soort: 'weiger'; melding: string }
  /** Balie: eerst bevestigen met "Toch boeken". */
  | { soort: 'waarschuw'; reden: string }

/** Wat er met een boeking gebeurt, gegeven de uitslag van magLesBoeken. */
export function besluitBoeking(uitslag: ToegangUitslag, bron: BoekBron, toch: boolean): BoekBesluit {
  if (uitslag.mag) return { soort: 'door', ondanks: null }
  if (bron === 'app') return { soort: 'weiger', melding: appMelding(uitslag.waarom, uitslag.reden) }
  return toch ? { soort: 'door', ondanks: uitslag.reden } : { soort: 'waarschuw', reden: uitslag.reden }
}

const APP_MELDING: Record<Weigering, string> = {
  groepslessen: 'Groepslessen zitten niet in je lidmaatschap. Vraag aan de balie wat er mogelijk is.',
  maximum: 'Je hebt deze week al het maximum aantal lessen van je lidmaatschap geboekt. Volgende week kun je weer boeken.',
  vestiging: 'Met je lidmaatschap kun je niet in deze vestiging sporten. Kies een les in je eigen club.',
  daluren: 'Deze les valt buiten de uren van je lidmaatschap.',
}

/** Een vriendelijke zin voor het lid, met de details uit de regel waar dat helpt. */
export function appMelding(waarom: Weigering, reden: string): string {
  if (waarom !== 'daluren') return APP_MELDING[waarom]
  const uren = /van (\d{2}:\d{2}) tot (\d{2}:\d{2})/.exec(reden)
  return uren ? `${APP_MELDING.daluren} Je kunt lessen boeken tussen ${uren[1]} en ${uren[2]}.` : APP_MELDING.daluren
}

/** Statussen die meetellen voor het maximum per week (wachtlijst ook: die kan doorschuiven). */
export const TELT_VOOR_MAXIMUM: readonly string[] = ['geboekt', 'wachtlijst', 'aanwezig', 'no_show']

export interface WeekBoeking {
  lesId: string
  status: string
  start: Date
}

/** Het tijdvak (maandag tot maandag, Nederlandse tijd) van de week waarin de les valt. */
export function weekVanLes(start: Date): { van: Date; tot: Date } {
  return weekBereik(maandagVan(nlDelen(start).datum))
}

/** Hoeveel lessen het lid al heeft in de week van deze les, deze les niet meegeteld. */
export function telLessenInWeek(boekingen: readonly WeekBoeking[], lesId: string, lesStart: Date): number {
  const { van, tot } = weekVanLes(lesStart)
  return boekingen.filter((b) => b.lesId !== lesId && TELT_VOOR_MAXIMUM.includes(b.status) && b.start >= van && b.start < tot).length
}

const DAG_MIN = 24 * 60

/** De aanvraag voor magLesBoeken. Loopt een les over middernacht, dan telt het einde van de dag. */
export function lesAanvraag(les: { vestiging: string; start: Date; eind: Date }, lessenDezeWeek: number): LesAanvraag {
  const start = nlDelen(les.start)
  const eind = nlDelen(les.eind)
  const eindMinuten = eind.datum === start.datum ? Math.max(eind.minuten, start.minuten) : DAG_MIN
  return { vestiging: les.vestiging, start: { weekdag: start.weekdag, minuten: start.minuten }, eindMinuten, lessenDezeWeek }
}
