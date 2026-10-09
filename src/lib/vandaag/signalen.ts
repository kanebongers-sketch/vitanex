// ─── MentaForce /1 — signalen: wat wijkt vandaag af? ────────────────────────
// Van feiten + normaal naar een handvol ja/nee-signalen, plus de feitzinnen die
// de kaart toont. De drempels staan hier bij elkaar, zodat ze met trainers
// getoetst en bijgesteld kunnen worden zonder de regels zelf te raken.
//
// Leefstijltaal, geen medische claims: "minder geslapen dan normaal", nooit
// "slaaptekort" als diagnose.

import { normaal } from './normaal'
import type { Afspraak, Feiten } from './types'

/** Zoveel minuten onder je normaal telt als een korte nacht. */
export const SLAAP_TEKORT_MIN = 60
/** Zonder normaal: onder deze grens (6 uur) telt een nacht als kort. */
export const SLAAP_ONDERGRENS_MIN = 360
/** Gisteren minder dan dit deel van je normale stappen = weinig bewogen. */
export const BEWEGEN_FRACTIE = 0.6
/** Normaal moet minstens dit zijn, anders is "weinig" geen zinnig signaal. */
export const BEWEGEN_MIN_NORMAAL = 3000

export interface Signalen {
  slaapKort: boolean
  /** Minuten onder je normaal (positief), of null als niet bekend. */
  slaapVerschil: number | null
  slaapNormaal: number | null
  energieLaag: boolean
  stressHoog: boolean
  stemmingLaag: boolean
  weinigBewogen: boolean
  stappenNormaal: number | null
  /** Hoeveel van slaap/energie/stress/stemming tegelijk laag staan. */
  aantalLaag: number
  /** De drukste afspraak vandaag (langste), of null. */
  zwaarsteAfspraak: Afspraak | null
  /** Is er überhaupt iets bekend over vandaag? */
  ietsBekend: boolean
}

/** "6u10" — kort en leesbaar. */
export function duur(minuten: number): string {
  const m = Math.max(0, Math.round(minuten))
  const u = Math.floor(m / 60)
  const rest = m % 60
  if (u === 0) return `${rest} min`
  return rest === 0 ? `${u}u` : `${u}u${String(rest).padStart(2, '0')}`
}

function afspraakDuur(a: Afspraak): number {
  if (!a.eind) return 0
  return Math.max(0, (new Date(a.eind).getTime() - new Date(a.start).getTime()) / 60_000)
}

export function bepaalSignalen(f: Feiten): Signalen {
  const slaapNormaal = normaal(f.slaapHistorie)
  const slaapVerschil = f.slaapMinuten !== null && slaapNormaal !== null ? slaapNormaal - f.slaapMinuten : null
  const slaapKort =
    f.slaapMinuten !== null &&
    (slaapVerschil !== null ? slaapVerschil >= SLAAP_TEKORT_MIN : f.slaapMinuten < SLAAP_ONDERGRENS_MIN)

  const stappenNormaal = normaal(f.stappenHistorie)
  const weinigBewogen =
    f.stappenGisteren !== null &&
    stappenNormaal !== null &&
    stappenNormaal >= BEWEGEN_MIN_NORMAAL &&
    f.stappenGisteren < stappenNormaal * BEWEGEN_FRACTIE

  const c = f.checkin
  const energieLaag = c?.energie != null && c.energie <= 2
  const stressHoog = c?.stress != null && c.stress >= 4
  const stemmingLaag = c != null && c.stemming <= 2
  const aantalLaag = [slaapKort, energieLaag, stressHoog, stemmingLaag].filter(Boolean).length

  const metDuur = (f.afspraken ?? []).filter((a) => afspraakDuur(a) >= 45)
  const zwaarsteAfspraak = metDuur.length ? metDuur.reduce((a, b) => (afspraakDuur(b) > afspraakDuur(a) ? b : a)) : null

  return {
    slaapKort,
    slaapVerschil,
    slaapNormaal,
    energieLaag,
    stressHoog,
    stemmingLaag,
    weinigBewogen,
    stappenNormaal,
    aantalLaag,
    zwaarsteAfspraak,
    ietsBekend: f.slaapMinuten !== null || c !== null || f.stappenGisteren !== null,
  }
}

/** De feiten als korte zinnen, alleen wat écht gemeten is. */
export function feitZinnen(f: Feiten, s: Signalen): string[] {
  const zinnen: string[] = []
  if (f.slaapMinuten !== null) {
    if (s.slaapVerschil !== null && Math.abs(s.slaapVerschil) >= 30) {
      const richting = s.slaapVerschil > 0 ? 'minder' : 'meer'
      zinnen.push(`Je sliep ${duur(f.slaapMinuten)}, ${duur(Math.abs(s.slaapVerschil))} ${richting} dan normaal.`)
    } else {
      zinnen.push(`Je sliep ${duur(f.slaapMinuten)}${s.slaapNormaal !== null ? ', ongeveer je normaal' : ''}.`)
    }
  }
  if (f.checkin) {
    const delen = [`stemming ${f.checkin.stemming}/5`]
    if (f.checkin.energie != null) delen.push(`energie ${f.checkin.energie}/5`)
    if (f.checkin.stress != null) delen.push(`stress ${f.checkin.stress}/5`)
    zinnen.push(`Je check-in: ${delen.join(', ')}.`)
  }
  if (s.weinigBewogen && f.stappenGisteren !== null) {
    zinnen.push(`Gisteren zette je ${f.stappenGisteren.toLocaleString('nl-NL')} stappen, minder dan je normaal.`)
  }
  if (f.afspraken && f.afspraken.length > 0) {
    zinnen.push(`Je hebt ${f.afspraken.length} ${f.afspraken.length === 1 ? 'afspraak' : 'afspraken'} vandaag.`)
  }
  return zinnen
}
