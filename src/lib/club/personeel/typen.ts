// ─── Fit Factory Club, personeel: typen en databaserijen (PUUR) ─────────────
// Diensten van het fitnesspersoneel (vloer en balie, opening en afsluiten) met
// de urenregistratie erbij. Tijden zijn Nederlandse kloktijden op een datum
// ("08:00" tot "14:00"); een dienst loopt nooit over middernacht.

import { isDatum, normaliseerTijd } from '@/lib/club/rooster/tijd'

export const KLEUREN = ['amber', 'blauw', 'groen', 'roze', 'turkoois', 'geel', 'lila', 'zand'] as const
export type Kleur = (typeof KLEUREN)[number]

export const KLEUR_LABEL: Record<Kleur, string> = {
  amber: 'Amber',
  blauw: 'Blauw',
  groen: 'Groen',
  roze: 'Roze',
  turkoois: 'Turkoois',
  geel: 'Geel',
  lila: 'Lila',
  zand: 'Zand',
}

export const PERSONEEL_ROLLEN = ['trainer', 'instructeur', 'manager', 'administratie'] as const
export type PersoneelRol = (typeof PERSONEEL_ROLLEN)[number]

export const CATEGORIEEN = ['opening', 'dag', 'avond', 'afsluiten', 'weekend', 'overig'] as const
export type Categorie = (typeof CATEGORIEEN)[number]

export const DIENST_STATUSSEN = ['gepland', 'geruild', 'ziek'] as const
export type DienstStatus = (typeof DIENST_STATUSSEN)[number]

export const UURSOORTEN = ['werk', 'ziek', 'verlof'] as const
export type Uursoort = (typeof UURSOORTEN)[number]

export const UURSOORT_LABEL: Record<Uursoort, string> = { werk: 'Werk', ziek: 'Ziek', verlof: 'Verlof' }

export const UUR_STATUSSEN = ['gepland', 'gewerkt', 'goedgekeurd', 'verwerkt'] as const
export type UurStatus = (typeof UUR_STATUSSEN)[number]

export const UUR_STATUS_LABEL: Record<UurStatus, string> = {
  gepland: 'Gepland',
  gewerkt: 'Gewerkt',
  goedgekeurd: 'Goedgekeurd',
  verwerkt: 'Verwerkt',
}

export const REDENEN = ['verlof', 'vrij', 'ziek'] as const
export type Reden = (typeof REDENEN)[number]

export const REDEN_LABEL: Record<Reden, string> = { verlof: 'Verlof', vrij: 'Vrij', ziek: 'Ziek' }

export const NOTITIE_SOORTEN = ['mededeling', 'geen_afspraken'] as const
export type NotitieSoort = (typeof NOTITIE_SOORTEN)[number]

export interface PersoneelLid {
  id: string
  naam: string
  rollen: PersoneelRol[]
  contracturen: number | null
  kleur: Kleur
}

export interface DienstSoort {
  id: string
  naam: string
  categorie: Categorie
  begin: string
  eind: string
  rol: PersoneelRol | null
}

export interface Dienst {
  id: string
  datum: string
  begin: string
  eind: string
  medewerkerId: string | null
  soortId: string | null
  notitie: string | null
  status: DienstStatus
  vervangtId: string | null
  uursoort: Uursoort
  uurStatus: UurStatus
  gewerktBegin: string | null
  gewerktEind: string | null
  pauzeMin: number
  urenOpmerking: string | null
}

export interface Beschikbaarheid {
  id: string
  medewerkerId: string
  weekdag: number | null
  datum: string | null
  datumTot: string | null
  beschikbaar: boolean
  van: string | null
  tot: string | null
  reden: Reden | null
  notitie: string | null
}

export interface RoosterNotitie {
  id: string
  datum: string
  van: string | null
  tot: string | null
  soort: NotitieSoort
  medewerkerId: string | null
  tekst: string
}

export interface SjabloonDienst {
  weekdag: number
  begin: string
  eind: string
  medewerkerId: string | null
  soortId: string | null
  notitie: string | null
}

export interface Sjabloon {
  id: string
  naam: string
  diensten: SjabloonDienst[]
}

/** Een nieuwe dienst zoals hij de database in gaat (zonder id en uren). */
export interface NieuweDienst {
  datum: string
  begin: string
  eind: string
  medewerkerId: string | null
  soortId: string | null
  notitie: string | null
}

// ── Systeemgrens: databaserijen naar typen ─────────────────────────────────

type Rij = Record<string, unknown>

function alsRij(v: unknown): Rij | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rij) : null
}

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function uit<T extends string>(lijst: readonly T[], v: unknown, standaard: T): T {
  return lijst.find((x) => x === v) ?? standaard
}

function uitOfNull<T extends string>(lijst: readonly T[], v: unknown): T | null {
  return lijst.find((x) => x === v) ?? null
}

export function isKleur(v: unknown): v is Kleur {
  return typeof v === 'string' && (KLEUREN as readonly string[]).includes(v)
}

/** Een vaste kleur voor wie nog geen kleur heeft: op volgorde van de lijst. */
export function standaardKleur(index: number): Kleur {
  return KLEUREN[((index % KLEUREN.length) + KLEUREN.length) % KLEUREN.length]
}

export const MEDEWERKER_KOLOMMEN = 'id, naam, rollen, vestigingen, actief, contracturen_per_week, kleur'

export function lidUitRij(ruw: unknown, index: number): PersoneelLid | null {
  const r = alsRij(ruw)
  if (!r || typeof r.id !== 'string' || typeof r.naam !== 'string') return null
  const uren = typeof r.contracturen_per_week === 'number' ? r.contracturen_per_week : typeof r.contracturen_per_week === 'string' ? Number(r.contracturen_per_week) : null
  return {
    id: r.id,
    naam: r.naam,
    rollen: Array.isArray(r.rollen) ? r.rollen.flatMap((x) => uitOfNull(PERSONEEL_ROLLEN, x) ?? []) : [],
    contracturen: uren !== null && Number.isFinite(uren) ? uren : null,
    kleur: isKleur(r.kleur) ? r.kleur : standaardKleur(index),
  }
}

export const SOORT_KOLOMMEN = 'id, naam, categorie, begin, eind, rol'

export function soortUitRij(ruw: unknown): DienstSoort | null {
  const r = alsRij(ruw)
  const begin = normaliseerTijd(r?.begin)
  const eind = normaliseerTijd(r?.eind)
  if (!r || typeof r.id !== 'string' || typeof r.naam !== 'string' || !begin || !eind) return null
  return { id: r.id, naam: r.naam, categorie: uit(CATEGORIEEN, r.categorie, 'overig'), begin, eind, rol: uitOfNull(PERSONEEL_ROLLEN, r.rol) }
}

export const DIENST_KOLOMMEN =
  'id, datum, begin, eind, medewerker_id, soort_id, notitie, status, vervangt_id, uursoort, uur_status, gewerkt_begin, gewerkt_eind, pauze_min, uren_opmerking'

export function dienstUitRij(ruw: unknown): Dienst | null {
  const r = alsRij(ruw)
  const begin = normaliseerTijd(r?.begin)
  const eind = normaliseerTijd(r?.eind)
  if (!r || typeof r.id !== 'string' || !isDatum(r.datum) || !begin || !eind) return null
  return {
    id: r.id,
    datum: r.datum,
    begin,
    eind,
    medewerkerId: tekst(r.medewerker_id),
    soortId: tekst(r.soort_id),
    notitie: tekst(r.notitie),
    status: uit(DIENST_STATUSSEN, r.status, 'gepland'),
    vervangtId: tekst(r.vervangt_id),
    uursoort: uit(UURSOORTEN, r.uursoort, 'werk'),
    uurStatus: uit(UUR_STATUSSEN, r.uur_status, 'gepland'),
    gewerktBegin: normaliseerTijd(r.gewerkt_begin),
    gewerktEind: normaliseerTijd(r.gewerkt_eind),
    pauzeMin: typeof r.pauze_min === 'number' ? r.pauze_min : 0,
    urenOpmerking: tekst(r.uren_opmerking),
  }
}

export const BESCHIKBAAR_KOLOMMEN = 'id, medewerker_id, weekdag, datum, datum_tot, beschikbaar, van, tot, reden, notitie'

export function beschikbaarheidUitRij(ruw: unknown): Beschikbaarheid | null {
  const r = alsRij(ruw)
  if (!r || typeof r.id !== 'string' || typeof r.medewerker_id !== 'string') return null
  const weekdag = typeof r.weekdag === 'number' && r.weekdag >= 1 && r.weekdag <= 7 ? r.weekdag : null
  const datum = isDatum(r.datum) ? r.datum : null
  if ((weekdag === null) === (datum === null)) return null
  return {
    id: r.id,
    medewerkerId: r.medewerker_id,
    weekdag,
    datum,
    datumTot: isDatum(r.datum_tot) ? r.datum_tot : null,
    beschikbaar: r.beschikbaar !== false,
    van: normaliseerTijd(r.van),
    tot: normaliseerTijd(r.tot),
    reden: uitOfNull(REDENEN, r.reden),
    notitie: tekst(r.notitie),
  }
}

export const NOTITIE_KOLOMMEN = 'id, datum, van, tot, soort, medewerker_id, tekst'

export function notitieUitRij(ruw: unknown): RoosterNotitie | null {
  const r = alsRij(ruw)
  if (!r || typeof r.id !== 'string' || !isDatum(r.datum) || typeof r.tekst !== 'string') return null
  return {
    id: r.id,
    datum: r.datum,
    van: normaliseerTijd(r.van),
    tot: normaliseerTijd(r.tot),
    soort: uit(NOTITIE_SOORTEN, r.soort, 'mededeling'),
    medewerkerId: tekst(r.medewerker_id),
    tekst: r.tekst,
  }
}

export function sjabloonDienstUitJson(ruw: unknown): SjabloonDienst | null {
  const r = alsRij(ruw)
  const begin = normaliseerTijd(r?.begin)
  const eind = normaliseerTijd(r?.eind)
  if (!r || typeof r.weekdag !== 'number' || r.weekdag < 1 || r.weekdag > 7 || !begin || !eind || eind <= begin) return null
  return { weekdag: r.weekdag, begin, eind, medewerkerId: tekst(r.medewerker_id), soortId: tekst(r.soort_id), notitie: tekst(r.notitie) }
}

export function sjabloonUitRij(ruw: unknown): Sjabloon | null {
  const r = alsRij(ruw)
  if (!r || typeof r.id !== 'string' || typeof r.naam !== 'string') return null
  const lijst = Array.isArray(r.diensten) ? r.diensten : []
  return { id: r.id, naam: r.naam, diensten: lijst.map(sjabloonDienstUitJson).filter((d): d is SjabloonDienst => d !== null) }
}

export function sjabloonDienstNaarJson(d: SjabloonDienst): Record<string, unknown> {
  return { weekdag: d.weekdag, begin: d.begin, eind: d.eind, medewerker_id: d.medewerkerId, soort_id: d.soortId, notitie: d.notitie }
}

/** Rijen uit de database naar typen; onbruikbare rijen vallen weg. */
export function rijen<T>(data: unknown, naar: (r: unknown) => T | null): T[] {
  return Array.isArray(data) ? data.map(naar).filter((x): x is T => x !== null) : []
}
