// ─── Fit Factory Club, ledenapp: regels en rekenwerk (PUUR) ─────────────────
// Wat een lid in de app ziet: de reserveerregels in gewone taal, of een les nog
// te boeken is, hoe vaak hij deze maand kwam en hoeveel weken op rij.
// De regels zelf (en de controle bij boeken) zijn van het rooster; hier lezen
// we ze alleen om ze te tonen. Ontbreekt een regel, dan geldt de standaard.

import { dagenTussen, dagSleutel, maandagVan, nlMoment, plusDagen, weekdagVan } from '@/lib/club/cijfers/tijd'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'

export interface AppRegels {
  annuleerUren: number
  noShowDrempel: number
  noShowBlokkadeDagen: number
  reserveerDagenVooruit: number
  maxOpenReserveringen: number
}

export const STANDAARD_APP_REGELS: AppRegels = {
  annuleerUren: 2,
  noShowDrempel: 3,
  noShowBlokkadeDagen: 7,
  reserveerDagenVooruit: 7,
  maxOpenReserveringen: 5,
}

function heel(v: unknown, standaard: number, min: number, max: number): number {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max ? n : standaard
}

/** Systeemgrens: club_vestigingen.regels (jsonb, snake_case) naar AppRegels. */
export function appRegelsUitJson(ruw: unknown): AppRegels {
  const r = typeof ruw === 'object' && ruw !== null && !Array.isArray(ruw) ? (ruw as Record<string, unknown>) : {}
  const s = STANDAARD_APP_REGELS
  return {
    annuleerUren: heel(r.annuleer_uren, s.annuleerUren, 0, 72),
    noShowDrempel: heel(r.no_show_drempel, s.noShowDrempel, 1, 20),
    noShowBlokkadeDagen: heel(r.no_show_blokkade_dagen, s.noShowBlokkadeDagen, 0, 60),
    reserveerDagenVooruit: heel(r.reserveer_dagen_vooruit, s.reserveerDagenVooruit, 1, 60),
    maxOpenReserveringen: heel(r.max_open_reserveringen, s.maxOpenReserveringen, 1, 50),
  }
}

/** De regels zoals het lid ze leest, in de gekozen taal. */
export function regelTeksten(r: AppRegels, taal: Taal = 'nl'): string[] {
  const t = LEDENAPP[taal].regels
  const teksten = [
    r.annuleerUren === 0 ? t.annulerenTotBegin : t.annulerenTot(r.annuleerUren),
    t.vooruit(r.reserveerDagenVooruit, r.maxOpenReserveringen),
    t.wachtlijst,
  ]
  if (r.noShowBlokkadeDagen > 0) teksten.push(t.noShow(r.noShowDrempel, r.noShowBlokkadeDagen))
  return teksten
}

/** Kan dit lid nog gratis annuleren? */
export function magGratisAnnuleren(start: Date, nu: Date, r: AppRegels): boolean {
  return start.getTime() - nu.getTime() >= r.annuleerUren * 3_600_000
}

export type MijnStatus = 'geboekt' | 'wachtlijst' | 'aanwezig' | 'no_show' | 'geannuleerd'

export type LesKeuze = 'geboekt' | 'wachtlijst' | 'vrij' | 'vol' | 'voorbij' | 'geannuleerd' | 'aanwezig'

/**
 * Wat de knop bij een les moet doen of zeggen, vanuit het lid gezien. Een les
 * die al begon kan niet meer geannuleerd worden (het rooster weigert dat), en
 * wie al is afgevinkt als aanwezig ook niet: dan geen knop maar een label.
 */
export function lesKeuze(les: { start: Date; capaciteit: number; bezet: number; geannuleerd: boolean }, mijn: MijnStatus | null, nu: Date): LesKeuze {
  if (les.geannuleerd) return 'geannuleerd'
  if (mijn === 'aanwezig') return 'aanwezig'
  if (les.start.getTime() <= nu.getTime()) return 'voorbij'
  if (mijn === 'geboekt') return 'geboekt'
  if (mijn === 'wachtlijst') return 'wachtlijst'
  return les.bezet >= les.capaciteit ? 'vol' : 'vrij'
}

/**
 * Kan dit lid deze les nog gratis annuleren? Van de wachtlijst afgaan telt
 * nooit als te laat (zie beoordeelAnnulering in het rooster); een boeking wel
 * binnen de annuleertermijn.
 */
export function annulerenZonderGevolg(keuze: LesKeuze, start: Date, nu: Date, r: AppRegels): boolean {
  return keuze === 'wachtlijst' || magGratisAnnuleren(start, nu, r)
}

export function vrijePlekken(capaciteit: number, bezet: number): number {
  return Math.max(0, capaciteit - bezet)
}

/** Bezoeken in de kalendermaand van `nu` (Nederlandse tijd). */
export function bezoekenDezeMaand(bezoeken: readonly Date[], nu: Date): number {
  const maand = dagSleutel(nu).slice(0, 7)
  return bezoeken.filter((d) => dagSleutel(d).slice(0, 7) === maand).length
}

/**
 * Weken op rij met minstens een bezoek. De lopende week telt mee als er al een
 * bezoek is; anders begint de telling bij vorige week (de week is nog niet om).
 */
export function wekenOpRij(bezoeken: readonly Date[], nu: Date): number {
  const weken = new Set(bezoeken.map((d) => maandagVan(dagSleutel(d))))
  let week = maandagVan(dagSleutel(nu))
  if (!weken.has(week)) week = plusDagen(week, -7)
  let n = 0
  while (weken.has(week)) {
    n += 1
    week = plusDagen(week, -7)
  }
  return n
}

/** "Goedemorgen", "Goedemiddag" of "Goedenavond" op Nederlandse tijd, in de gekozen taal. */
export function groet(nu: Date, taal: Taal = 'nl'): string {
  const uur = nlMoment(nu).uur
  const t = LEDENAPP[taal].groet
  if (uur >= 6 && uur < 12) return t.ochtend
  if (uur >= 12 && uur < 18) return t.middag
  return t.avond
}

/** "Vandaag", "Morgen" of de weekdag, voor een lesdag. */
export function dagNaamKort(dag: string, vandaag: string, taal: Taal = 'nl'): string {
  const t = LEDENAPP[taal].dagen
  const verschil = dagenTussen(vandaag, dag)
  if (verschil === 0) return t.vandaag
  if (verschil === 1) return t.morgen
  return t.weekdag[weekdagVan(dag) - 1]
}

/** "14 okt" of "14 Oct" voor een dagsleutel (YYYY-MM-DD). */
export function dagKortIn(dag: string, taal: Taal = 'nl'): string {
  const [, m, d] = dag.split('-').map(Number)
  return `${d} ${LEDENAPP[taal].dagen.maandKort[m - 1]}`
}
