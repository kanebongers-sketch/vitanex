// ─── Club, voortgang: tijdlijn per meetwaarde (PUUR) ─────────────────────────
// Voegt de metingen uit intakes en de losse metingen samen tot een reeks per
// meetwaarde, met het verschil sinds de start en sinds de vorige meting.

import { berekenBmi } from '@/lib/club/training/intake'
import type { Intake } from '@/lib/club/training/intake-rij'
import { MEETWAARDEN, type MeetSleutel, type MeetWaarden, type Meting } from './meting'

export type Bron = 'intake' | 'meting'

export interface MeetPunt {
  id: string
  bron: Bron
  datum: string
  waarden: MeetWaarden
}

export type ReeksSleutel = MeetSleutel | 'bmi'

export interface ReeksInfo {
  sleutel: ReeksSleutel
  label: string
  kort: string
  eenheid: string
}

export interface ReeksPunt {
  datum: string
  waarde: number
  bron: Bron
}

export interface Verschillen {
  laatste: ReeksPunt
  start: ReeksPunt
  vorige: ReeksPunt | null
  /** Laatste min start, op een decimaal. null als er maar een meting is. */
  sindsStart: number | null
  /** Laatste min vorige, op een decimaal. */
  sindsVorige: number | null
}

export const BMI_INFO: ReeksInfo = { sleutel: 'bmi', label: 'BMI', kort: 'BMI', eenheid: '' }

/** Eerlijke kanttekening die altijd bij de BMI hoort. */
export const BMI_KANTTEKENING =
  'BMI rekent alleen met gewicht en lengte. Bij veel spiermassa zegt het weinig: spieren wegen zwaar. Kijk daarom ook naar omtrek en vetpercentage.'

/** De volgorde in de wissel. Lengte staat er niet in: die verandert bij volwassenen nauwelijks. */
const VOLGORDE: readonly ReeksSleutel[] = ['gewicht_kg', 'bmi', 'vetpercentage', 'spiermassa_kg', 'buikomtrek_cm', 'heupomtrek_cm', 'rusthartslag']

export function reeksInfo(sleutel: ReeksSleutel): ReeksInfo {
  if (sleutel === 'bmi') return BMI_INFO
  const m = MEETWAARDEN.find((x) => x.sleutel === sleutel)
  return m ? { sleutel, label: m.label, kort: m.kort, eenheid: m.eenheid } : { sleutel, label: sleutel, kort: sleutel, eenheid: '' }
}

/** Een intake als meetpunt (alleen de metingen die de intake mocht bewaren). */
export function puntUitIntake(intake: Pick<Intake, 'id' | 'datum' | 'metingen'>): MeetPunt {
  return { id: intake.id, bron: 'intake', datum: intake.datum, waarden: { ...intake.metingen } }
}

export function puntUitMeting(meting: Meting): MeetPunt {
  return { id: meting.id, bron: 'meting', datum: meting.datum, waarden: meting.waarden }
}

/** Oudste eerst; op dezelfde dag eerst de intake. Geeft een nieuwe lijst. */
export function sorteerPunten(punten: readonly MeetPunt[]): MeetPunt[] {
  return [...punten].sort((a, b) => a.datum.localeCompare(b.datum) || (a.bron === b.bron ? 0 : a.bron === 'intake' ? -1 : 1))
}

/** De lengte die op `datum` gold: de laatste bekende op of voor die dag, anders de eerste bekende. */
function lengteOp(gesorteerd: readonly MeetPunt[], datum: string): number | undefined {
  let lengte: number | undefined
  for (const p of gesorteerd) {
    if (p.datum > datum) break
    if (p.waarden.lengte_cm !== undefined) lengte = p.waarden.lengte_cm
  }
  return lengte ?? gesorteerd.find((p) => p.waarden.lengte_cm !== undefined)?.waarden.lengte_cm
}

/** De reeks voor een meetwaarde, oudste eerst. BMI wordt uit gewicht en lengte berekend. */
export function reeksVoor(punten: readonly MeetPunt[], sleutel: ReeksSleutel): ReeksPunt[] {
  const gesorteerd = sorteerPunten(punten)
  return gesorteerd.flatMap((p) => {
    const waarde = sleutel === 'bmi' ? berekenBmi(p.waarden.gewicht_kg, lengteOp(gesorteerd, p.datum)) : p.waarden[sleutel]
    return waarde === undefined || waarde === null ? [] : [{ datum: p.datum, waarde, bron: p.bron }]
  })
}

/** De meetwaarden waarvan minstens een meting is, in vaste volgorde. */
export function beschikbareReeksen(punten: readonly MeetPunt[]): ReeksInfo[] {
  return VOLGORDE.filter((s) => reeksVoor(punten, s).length > 0).map(reeksInfo)
}

const rond = (n: number): number => Math.round(n * 10) / 10

export function verschillen(reeks: readonly ReeksPunt[]): Verschillen | null {
  if (reeks.length === 0) return null
  const laatste = reeks[reeks.length - 1]
  const start = reeks[0]
  const vorige = reeks.length > 1 ? reeks[reeks.length - 2] : null
  return {
    laatste,
    start,
    vorige,
    sindsStart: reeks.length > 1 ? rond(laatste.waarde - start.waarde) : null,
    sindsVorige: vorige ? rond(laatste.waarde - vorige.waarde) : null,
  }
}

/** Verschil met teken voor op het scherm: "+1,5", "-2" of "0". */
export function toonVerschilGetal(v: number): string {
  if (v === 0) return '0'
  const tekst = Math.abs(v).toLocaleString('nl-NL', { maximumFractionDigits: 1 })
  return v > 0 ? `+${tekst}` : `-${tekst}`
}

/** De laatst gemeten bloeddruk met datum, of null. */
export function laatsteBloeddruk(punten: readonly MeetPunt[]): { datum: string; waarde: string } | null {
  const met = sorteerPunten(punten).filter((p) => p.waarden.bloeddruk)
  const laatste = met[met.length - 1]
  return laatste?.waarden.bloeddruk ? { datum: laatste.datum, waarde: laatste.waarden.bloeddruk } : null
}
