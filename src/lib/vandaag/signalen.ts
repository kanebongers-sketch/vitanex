// ─── MentaForce Vandaag-kaart — signalen: wat wijkt vandaag af? ────────────────────────
// Van feiten + normaal naar een handvol ja/nee-signalen, plus de feitzinnen die
// de kaart toont. De drempels staan hier bij elkaar, zodat ze met trainers
// getoetst en bijgesteld kunnen worden zonder de regels zelf te raken.
//
// Leefstijltaal, geen medische claims: "minder geslapen dan normaal", nooit
// "slaaptekort" als diagnose.

import { normaal } from './normaal'
import type { Afspraak, Feiten } from './types'
import { NL, type Taalset } from '@/lib/i18n/taalset'

/** Zoveel minuten onder je normaal telt als een korte nacht. */
export const SLAAP_TEKORT_MIN = 60
/** Zonder normaal: onder deze grens (6 uur) telt een nacht als kort. */
export const SLAAP_ONDERGRENS_MIN = 360
/** Gisteren minder dan dit deel van je normale stappen = weinig bewogen. */
export const BEWEGEN_FRACTIE = 0.6
/** Normaal moet minstens dit zijn, anders is "weinig" geen zinnig signaal. */
export const BEWEGEN_MIN_NORMAAL = 3000
/** Zoveel slagen per minuut boven je normale rusthartslag telt als minder hersteld. */
export const HARTSLAG_HOGER_BPM = 5
/** HRV onder dit deel van je normaal telt als minder hersteld. */
export const HRV_LAGER_FRACTIE = 0.8

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
  /** Rusthartslag duidelijk boven of HRV duidelijk onder je eigen normaal. */
  herstelLaag: boolean
  /** Slagen per minuut boven je normale rusthartslag (positief = hoger), of null. */
  hartslagVerschil: number | null
  /** HRV als deel van je normaal (0.8 = 20% lager), of null. */
  hrvFractie: number | null
  /** Hoeveel van slaap/energie/stress/stemming tegelijk laag staan. */
  aantalLaag: number
  /** De drukste afspraak vandaag (langste), of null. */
  zwaarsteAfspraak: Afspraak | null
  /** Is er überhaupt iets bekend over vandaag? */
  ietsBekend: boolean
}

/** "6u10" — kort en leesbaar (in het Nederlands; andere talen via het woordenboek). */
export function duur(minuten: number, ts: Taalset = NL): string {
  const m = Math.max(0, Math.round(minuten))
  const u = Math.floor(m / 60)
  const rest = m % 60
  if (u === 0) return ts.t('duur.min', { m: rest })
  return rest === 0 ? ts.t('duur.uur', { u }) : ts.t('duur.uurMin', { u, mm: String(rest).padStart(2, '0') })
}

function afspraakDuur(a: Afspraak): number {
  if (!a.eind) return 0
  return Math.max(0, (new Date(a.eind).getTime() - new Date(a.start).getTime()) / 60_000)
}

function herstelSignaal(f: Feiten): Pick<Signalen, 'herstelLaag' | 'hartslagVerschil' | 'hrvFractie'> {
  const h = f.herstel
  const hartslagNormaal = h ? normaal(h.rustHartslagHistorie) : null
  const hrvNormaal = h ? normaal(h.hrvHistorie) : null
  const hartslagVerschil = h?.rustHartslag != null && hartslagNormaal !== null ? h.rustHartslag - hartslagNormaal : null
  const hrvFractie = h?.hrv != null && hrvNormaal !== null && hrvNormaal > 0 ? h.hrv / hrvNormaal : null
  const herstelLaag =
    (hartslagVerschil !== null && hartslagVerschil >= HARTSLAG_HOGER_BPM) ||
    (hrvFractie !== null && hrvFractie <= HRV_LAGER_FRACTIE)
  return { herstelLaag, hartslagVerschil, hrvFractie }
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
  const herstel = herstelSignaal(f)
  const aantalLaag = [slaapKort, energieLaag, stressHoog, stemmingLaag, herstel.herstelLaag].filter(Boolean).length

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
    ...herstel,
    aantalLaag,
    zwaarsteAfspraak,
    ietsBekend: f.slaapMinuten !== null || c !== null || f.stappenGisteren !== null || herstel.hartslagVerschil !== null || herstel.hrvFractie !== null,
  }
}

/** "Je rusthartslag is 6 slagen hoger dan normaal en je HRV 25% lager." */
export function herstelZin(s: Signalen, ts: Taalset = NL): string {
  const delen: string[] = []
  if (s.hartslagVerschil !== null && s.hartslagVerschil >= HARTSLAG_HOGER_BPM) {
    delen.push(ts.t('kaart.feit.hartslag', { n: Math.round(s.hartslagVerschil) }))
  }
  if (s.hrvFractie !== null && s.hrvFractie <= HRV_LAGER_FRACTIE) {
    delen.push(ts.t('kaart.feit.hrv', { n: Math.round((1 - s.hrvFractie) * 100) }))
  }
  const zin = delen.join(ts.t('kaart.feit.en'))
  return `${zin.charAt(0).toLocaleUpperCase(ts.locale)}${zin.slice(1)}.`
}

/** De feiten als korte zinnen, alleen wat écht gemeten is. */
export function feitZinnen(f: Feiten, s: Signalen, ts: Taalset = NL): string[] {
  const zinnen: string[] = []
  if (f.slaapMinuten !== null) {
    const slaap = duur(f.slaapMinuten, ts)
    if (s.slaapVerschil !== null && Math.abs(s.slaapVerschil) >= 30) {
      const richting = ts.t(s.slaapVerschil > 0 ? 'kaart.feit.minder' : 'kaart.feit.meer')
      zinnen.push(ts.t('kaart.feit.slaapAfwijking', { slaap, verschil: duur(Math.abs(s.slaapVerschil), ts), richting }))
    } else {
      zinnen.push(ts.t(s.slaapNormaal !== null ? 'kaart.feit.slaapNormaal' : 'kaart.feit.slaap', { slaap }))
    }
  }
  if (s.herstelLaag) zinnen.push(herstelZin(s, ts))
  if (f.checkin) {
    const delen = [ts.t('kaart.feit.deelStemming', { n: f.checkin.stemming })]
    if (f.checkin.energie != null) delen.push(ts.t('kaart.feit.deelEnergie', { n: f.checkin.energie }))
    if (f.checkin.stress != null) delen.push(ts.t('kaart.feit.deelStress', { n: f.checkin.stress }))
    zinnen.push(ts.t('kaart.feit.checkin', { delen: delen.join(', ') }))
  }
  if (s.weinigBewogen && f.stappenGisteren !== null) {
    zinnen.push(ts.t('kaart.feit.weinigBewogen', { stappen: f.stappenGisteren.toLocaleString(ts.locale) }))
  }
  if (f.afspraken && f.afspraken.length > 0) {
    const n = f.afspraken.length
    zinnen.push(n === 1 ? ts.t('kaart.feit.afspraak') : ts.t('kaart.feit.afspraken', { n }))
  }
  return zinnen
}
