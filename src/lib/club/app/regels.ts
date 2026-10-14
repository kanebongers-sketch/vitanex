// ─── Fit Factory Club, ledenapp: regels en rekenwerk (PUUR) ─────────────────
// Wat een lid in de app ziet: de reserveerregels in gewone taal, of een les nog
// te boeken is, hoe vaak hij deze maand kwam en hoeveel weken op rij.
// De regels zelf (en de controle bij boeken) zijn van het rooster; hier lezen
// we ze alleen om ze te tonen. Ontbreekt een regel, dan geldt de standaard.

import { dagenTussen, dagSleutel, maandagVan, nlMoment, plusDagen, weekdagVan } from '@/lib/club/cijfers/tijd'

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

function uren(n: number): string {
  return n === 1 ? '1 uur' : `${n} uur`
}

/** De regels zoals het lid ze leest. */
export function regelTeksten(r: AppRegels): string[] {
  const teksten = [
    r.annuleerUren === 0 ? 'Gratis annuleren kan tot de les begint.' : `Gratis annuleren tot ${uren(r.annuleerUren)} voor de les. Later annuleren telt als te laat.`,
    `Je kunt tot ${r.reserveerDagenVooruit} dagen vooruit boeken, met maximaal ${r.maxOpenReserveringen} open boekingen tegelijk.`,
    'Is een les vol, dan kun je op de wachtlijst. Komt er een plek vrij, dan schuif je automatisch door.',
  ]
  if (r.noShowBlokkadeDagen > 0) {
    teksten.push(`Ben je ${r.noShowDrempel} keer niet gekomen binnen 30 dagen, dan kun je ${r.noShowBlokkadeDagen} dagen niet boeken.`)
  }
  return teksten
}

/** Kan dit lid nog gratis annuleren? */
export function magGratisAnnuleren(start: Date, nu: Date, r: AppRegels): boolean {
  return start.getTime() - nu.getTime() >= r.annuleerUren * 3_600_000
}

export type MijnStatus = 'geboekt' | 'wachtlijst' | 'aanwezig' | 'no_show' | 'geannuleerd'

export type LesKeuze = 'geboekt' | 'wachtlijst' | 'vrij' | 'vol' | 'voorbij' | 'geannuleerd'

/** Wat de knop bij een les moet doen of zeggen, vanuit het lid gezien. */
export function lesKeuze(les: { start: Date; capaciteit: number; bezet: number; geannuleerd: boolean }, mijn: MijnStatus | null, nu: Date): LesKeuze {
  if (les.geannuleerd) return 'geannuleerd'
  if (mijn === 'geboekt' || mijn === 'aanwezig') return 'geboekt'
  if (mijn === 'wachtlijst') return 'wachtlijst'
  if (les.start.getTime() <= nu.getTime()) return 'voorbij'
  return les.bezet >= les.capaciteit ? 'vol' : 'vrij'
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

/** "Goedemorgen", "Goedemiddag" of "Goedenavond" op Nederlandse tijd. */
export function groet(nu: Date): string {
  const uur = nlMoment(nu).uur
  if (uur >= 6 && uur < 12) return 'Goedemorgen'
  if (uur >= 12 && uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

/** "Vandaag", "Morgen" of de weekdag, voor een lesdag. */
export function dagNaamKort(dag: string, vandaag: string): string {
  const verschil = dagenTussen(vandaag, dag)
  if (verschil === 0) return 'Vandaag'
  if (verschil === 1) return 'Morgen'
  return ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'][weekdagVan(dag) - 1]
}
