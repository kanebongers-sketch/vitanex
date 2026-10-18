// ─── Fit Factory Club, rooster: de reserveerregels (PUUR) ───────────────────
// Alles wat bepaalt of een lid een les mag boeken, wanneer annuleren "te laat"
// is en hoe de wachtlijst doorschuift. Geen database, geen klok: de aanroeper
// geeft `nu` en de feiten mee, zodat elke regel los te testen is.
// De regels per vestiging staan in club_vestigingen.regels (jsonb, snake_case);
// ontbreekt een regel, dan geldt de standaard.

import { magTrainen, type LidStatus } from '@/lib/club/kern/lid'

export interface RoosterRegels {
  /** Annuleren binnen zoveel uur voor de start telt als "te laat". */
  annuleerUren: number
  /** Zoveel no-shows binnen 30 dagen geeft een blokkade. */
  noShowDrempel: number
  /** Zo lang (dagen) mag een lid dan niet boeken. */
  noShowBlokkadeDagen: number
  /** Zo ver vooruit (dagen) mag een lid boeken. */
  reserveerDagenVooruit: number
  /** Zoveel open boekingen (geboekt of wachtlijst, nog niet geweest) tegelijk. */
  maxOpenReserveringen: number
  /** Zoveel minuten voor de start mag je inchecken of aanwezig melden. */
  checkinVensterMin: number
}

export type RegelSleutel = keyof RoosterRegels

export const STANDAARD_REGELS: RoosterRegels = {
  annuleerUren: 2,
  noShowDrempel: 3,
  noShowBlokkadeDagen: 7,
  reserveerDagenVooruit: 7,
  maxOpenReserveringen: 5,
  checkinVensterMin: 15,
}

/** De kolomnaam in de jsonb en de grenzen per regel. */
export const REGEL_DEFINITIES: Record<RegelSleutel, { json: string; min: number; max: number; label: string; uitleg: string }> = {
  annuleerUren: { json: 'annuleer_uren', min: 0, max: 72, label: 'Annuleren tot (uur voor start)', uitleg: 'Later annuleren wordt gemarkeerd als te laat.' },
  noShowDrempel: { json: 'no_show_drempel', min: 1, max: 20, label: 'No-shows voor blokkade', uitleg: 'Aantal keer niet komen binnen 30 dagen.' },
  noShowBlokkadeDagen: { json: 'no_show_blokkade_dagen', min: 0, max: 60, label: 'Blokkade (dagen)', uitleg: 'Zo lang kan het lid daarna niet boeken. 0 is geen blokkade.' },
  reserveerDagenVooruit: { json: 'reserveer_dagen_vooruit', min: 1, max: 60, label: 'Vooruit boeken (dagen)', uitleg: 'Verder vooruit kan een les nog niet geboekt worden.' },
  maxOpenReserveringen: { json: 'max_open_reserveringen', min: 1, max: 50, label: 'Open boekingen per lid', uitleg: 'Geboekt of op de wachtlijst, nog niet geweest.' },
  checkinVensterMin: { json: 'checkin_venster_min', min: 0, max: 120, label: 'Check-in venster (min)', uitleg: 'Zo lang voor de start telt inchecken als aanwezig.' },
}

export const REGEL_SLEUTELS: readonly RegelSleutel[] = [
  'annuleerUren',
  'noShowDrempel',
  'noShowBlokkadeDagen',
  'reserveerDagenVooruit',
  'maxOpenReserveringen',
  'checkinVensterMin',
]

export const NO_SHOW_VENSTER_DAGEN = 30
const DAG_MS = 86_400_000
const UUR_MS = 3_600_000

function heelGetal(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : null
}

/** Systeemgrens: de jsonb uit club_vestigingen.regels naar complete regels. */
export function regelsUitJson(ruw: unknown): RoosterRegels {
  const bron = typeof ruw === 'object' && ruw !== null && !Array.isArray(ruw) ? (ruw as Record<string, unknown>) : {}
  const uit: RoosterRegels = { ...STANDAARD_REGELS }
  for (const sleutel of REGEL_SLEUTELS) {
    const def = REGEL_DEFINITIES[sleutel]
    const n = heelGetal(bron[def.json])
    if (n !== null) uit[sleutel] = Math.min(def.max, Math.max(def.min, n))
  }
  return uit
}

/** Regels terug naar de jsonb-vorm (snake_case). */
export function regelsNaarJson(regels: RoosterRegels): Record<string, number> {
  return Object.fromEntries(REGEL_SLEUTELS.map((s) => [REGEL_DEFINITIES[s].json, regels[s]]))
}

// ── Reserveren ────────────────────────────────────────────────────────────

export const RESERVERING_STATUSSEN = ['geboekt', 'wachtlijst', 'geannuleerd', 'aanwezig', 'no_show'] as const
export type ReserveringStatus = (typeof RESERVERING_STATUSSEN)[number]
export const RESERVERING_BRONNEN = ['app', 'balie', 'instructeur'] as const
export type ReserveringBron = (typeof RESERVERING_BRONNEN)[number]

/** Statussen die een plek in de les innemen. */
export const BEZETTE_STATUSSEN: readonly ReserveringStatus[] = ['geboekt', 'aanwezig', 'no_show']

export interface ReserveerFeiten {
  nu: Date
  regels: RoosterRegels
  les: { start: Date; geannuleerd: boolean; capaciteit: number }
  lidStatus: LidStatus
  /** De status van een eerdere reservering van dit lid voor deze les, of null. */
  bestaand: ReserveringStatus | null
  /** Open boekingen van het lid voor andere lessen (geboekt of wachtlijst, nog niet begonnen). */
  openElders: number
  /** Plekken die al bezet zijn in deze les. */
  bezet: number
  /** De hoogste wachtpositie nu, 0 als de wachtlijst leeg is. */
  laatsteWachtpositie: number
  /** Starttijden van lessen waar het lid een no-show had. */
  noShows: readonly Date[]
}

export type ReserveerFoutCode =
  | 'les_geannuleerd'
  | 'les_voorbij'
  | 'te_ver_vooruit'
  | 'lid_mag_niet'
  | 'al_ingeschreven'
  | 'te_veel_open'
  | 'geblokkeerd'

export type ReserveerUitkomst =
  | { ok: true; status: 'geboekt' | 'wachtlijst'; wachtpositie: number | null }
  | { ok: false; code: ReserveerFoutCode; fout: string }

const DATUM_NL = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long' })

/**
 * Tot wanneer is dit lid geblokkeerd door no-shows? Null = niet geblokkeerd.
 * Zodra er `drempel` no-shows binnen 30 dagen vallen, geldt vanaf de laatste
 * daarvan een blokkade van `blokkadeDagen` dagen.
 */
export function noShowBlokkadeTot(noShows: readonly Date[], regels: RoosterRegels): Date | null {
  const { noShowDrempel: drempel, noShowBlokkadeDagen: dagen } = regels
  if (dagen <= 0 || noShows.length < drempel) return null
  const tijden = noShows.map((d) => d.getTime()).sort((a, b) => a - b)
  let tot: number | null = null
  for (let i = drempel - 1; i < tijden.length; i++) {
    if (tijden[i] - tijden[i - drempel + 1] <= NO_SHOW_VENSTER_DAGEN * DAG_MS) {
      tot = tijden[i] + dagen * DAG_MS
    }
  }
  return tot === null ? null : new Date(tot)
}

function fout(code: ReserveerFoutCode, tekst: string): ReserveerUitkomst {
  return { ok: false, code, fout: tekst }
}

/** Mag dit lid deze les boeken, en zo ja: geboekt of op de wachtlijst? */
export function beoordeelReservering(f: ReserveerFeiten): ReserveerUitkomst {
  const nu = f.nu.getTime()
  const start = f.les.start.getTime()
  if (f.les.geannuleerd) return fout('les_geannuleerd', 'Deze les gaat niet door.')
  if (start <= nu) return fout('les_voorbij', 'Deze les is al begonnen of voorbij.')
  if (start - nu > f.regels.reserveerDagenVooruit * DAG_MS) {
    return fout('te_ver_vooruit', `Boeken kan tot ${f.regels.reserveerDagenVooruit} dagen vooruit.`)
  }
  if (!magTrainen(f.lidStatus)) return fout('lid_mag_niet', 'Dit lidmaatschap is niet actief, dus boeken kan niet.')
  if (f.bestaand !== null && f.bestaand !== 'geannuleerd') {
    return fout('al_ingeschreven', f.bestaand === 'wachtlijst' ? 'Dit lid staat al op de wachtlijst.' : 'Dit lid is al ingeschreven voor deze les.')
  }
  if (f.openElders >= f.regels.maxOpenReserveringen) {
    return fout('te_veel_open', `Dit lid heeft al ${f.regels.maxOpenReserveringen} open boekingen. Dat is het maximum.`)
  }
  const blokkade = noShowBlokkadeTot(f.noShows, f.regels)
  if (blokkade && blokkade.getTime() > nu) {
    return fout('geblokkeerd', `Te vaak niet gekomen. Boeken kan weer vanaf ${DATUM_NL.format(blokkade)}.`)
  }
  if (f.bezet < f.les.capaciteit) return { ok: true, status: 'geboekt', wachtpositie: null }
  return { ok: true, status: 'wachtlijst', wachtpositie: Math.max(0, f.laatsteWachtpositie) + 1 }
}

// ── Annuleren ─────────────────────────────────────────────────────────────

export type AnnuleerUitkomst = { ok: true; teLaat: boolean } | { ok: false; fout: string }

/**
 * Mag deze reservering geannuleerd worden, en is dat te laat?
 * Te laat = binnen `annuleerUren` voor de start, en alleen voor een echte plek
 * (wie van de wachtlijst afgaat, laat niemand zitten).
 */
export function beoordeelAnnulering(status: ReserveringStatus, start: Date, nu: Date, regels: RoosterRegels): AnnuleerUitkomst {
  if (status === 'geannuleerd') return { ok: false, fout: 'Deze reservering is al geannuleerd.' }
  if (status === 'aanwezig' || status === 'no_show') return { ok: false, fout: 'Deze les is al afgevinkt. Zet eerst de aanwezigheid terug.' }
  if (start.getTime() <= nu.getTime()) return { ok: false, fout: 'De les is al begonnen. Meld het lid dan als no-show.' }
  const teLaat = status === 'geboekt' && start.getTime() - nu.getTime() < regels.annuleerUren * UUR_MS
  return { ok: true, teLaat }
}

// ── Aanwezigheid ──────────────────────────────────────────────────────────

export const AFVINK_STATUSSEN = ['aanwezig', 'no_show', 'geboekt'] as const
export type AfvinkStatus = (typeof AFVINK_STATUSSEN)[number]

/** Mag de instructeur deze reservering op `nieuw` zetten? Null = mag, anders de reden. */
export function beoordeelAfvinken(huidig: ReserveringStatus, nieuw: AfvinkStatus, start: Date, nu: Date, regels: RoosterRegels): string | null {
  if (huidig === 'geannuleerd' || huidig === 'wachtlijst') return 'Alleen ingeschreven deelnemers kun je afvinken.'
  if (huidig === nieuw) return null
  if (nieuw !== 'geboekt' && nu.getTime() < start.getTime() - regels.checkinVensterMin * 60_000) {
    return `Afvinken kan vanaf ${regels.checkinVensterMin} minuten voor de start.`
  }
  return null
}

// ── Wachtlijst ────────────────────────────────────────────────────────────

export interface WachtRij {
  id: string
  lidId: string | null
  wachtpositie: number | null
  geboektOp: string
}

export interface DoorschuifPlan {
  /** Deze reserveringen gaan van de wachtlijst naar geboekt (in volgorde). */
  naarGeboekt: WachtRij[]
  /** De rest van de wachtlijst met hun nieuwe positie (1, 2, 3...). */
  hernummerd: Array<{ id: string; wachtpositie: number }>
}

/** Sorteer op wachtpositie, bij gelijke positie op wie eerst boekte. */
export function sorteerWachtlijst<T extends WachtRij>(rijen: readonly T[]): T[] {
  return [...rijen].sort((a, b) => {
    const pa = a.wachtpositie ?? Number.MAX_SAFE_INTEGER
    const pb = b.wachtpositie ?? Number.MAX_SAFE_INTEGER
    if (pa !== pb) return pa - pb
    if (a.geboektOp !== b.geboektOp) return a.geboektOp < b.geboektOp ? -1 : 1
    return a.id < b.id ? -1 : 1
  })
}

/** Wie schuift door bij `vrijePlekken` vrije plekken, en hoe nummert de rest. */
export function planDoorschuiven(wachtlijst: readonly WachtRij[], vrijePlekken: number): DoorschuifPlan {
  const gesorteerd = sorteerWachtlijst(wachtlijst)
  const aantal = Math.max(0, Math.min(Math.floor(vrijePlekken), gesorteerd.length))
  const naarGeboekt = gesorteerd.slice(0, aantal)
  const hernummerd = gesorteerd.slice(aantal).map((r, i) => ({ id: r.id, wachtpositie: i + 1 }))
  return { naarGeboekt, hernummerd }
}

/** Alleen de rijen waarvan de positie echt verandert (minder schrijfwerk). */
export function gewijzigdePosities(wachtlijst: readonly WachtRij[], plan: DoorschuifPlan): Array<{ id: string; wachtpositie: number }> {
  const oud = new Map(wachtlijst.map((r) => [r.id, r.wachtpositie]))
  return plan.hernummerd.filter((r) => oud.get(r.id) !== r.wachtpositie)
}
