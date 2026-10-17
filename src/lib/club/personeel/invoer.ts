// ─── Fit Factory Club, personeel: invoer van de API controleren (PUUR) ──────
// Elke body komt als unknown binnen en gaat er alleen getypt en gecontroleerd
// uit, met een Nederlandse foutzin voor het scherm.

import type { Vestiging } from '@/lib/club/kern/vestiging'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { isDatum, isoWeekdag, normaliseerTijd } from '@/lib/club/rooster/tijd'
import { isKleur, NOTITIE_SOORTEN, REDENEN, UURSOORTEN, type Kleur, type NotitieSoort, type Reden, type Uursoort } from './typen'

export type Invoer<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

function mis<T>(fout: string): Invoer<T> {
  return { ok: false, fout }
}

function goed<T>(waarde: T): Invoer<T> {
  return { ok: true, waarde }
}

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** Optionele tekst: leeg = null, te lang = fout (undefined). */
function optTekst(v: unknown, max: number): string | null | undefined {
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  if (t === '') return null
  return t.length <= max ? t : undefined
}

function optId(v: unknown): string | null | undefined {
  if (v === undefined || v === null || v === '') return null
  return isUuid(v) ? v : undefined
}

function isMaandag(v: unknown): v is string {
  return isDatum(v) && isoWeekdag(v) === 1
}

export interface DienstInvoer {
  vestiging: Vestiging
  datum: string
  begin: string
  eind: string
  medewerkerId: string | null
  soortId: string | null
  notitie: string | null
  uursoort: Uursoort
}

export function leesDienst(ruw: unknown): Invoer<DienstInvoer> {
  const b = object(ruw)
  if (!b) return mis('Ongeldige invoer.')
  if (!isVestigingSlug(b.vestiging)) return mis('Kies een vestiging.')
  if (!isDatum(b.datum)) return mis('Kies een geldige datum.')
  const begin = normaliseerTijd(b.begin)
  const eind = normaliseerTijd(b.eind)
  if (!begin || !eind) return mis('Vul een begin- en eindtijd in.')
  if (eind <= begin) return mis('De eindtijd moet na de begintijd liggen (een dienst loopt niet over middernacht).')
  const medewerkerId = optId(b.medewerkerId)
  const soortId = optId(b.soortId)
  const notitie = optTekst(b.notitie, 300)
  if (medewerkerId === undefined) return mis('Kies een geldige medewerker.')
  if (soortId === undefined) return mis('Kies een geldige soort dienst.')
  if (notitie === undefined) return mis('De notitie is te lang (maximaal 300 tekens).')
  const uursoort = UURSOORTEN.find((u) => u === (b.uursoort ?? 'werk'))
  if (!uursoort) return mis('Kies werk, ziek of verlof.')
  if (uursoort !== 'werk' && medewerkerId === null) return mis('Ziek of verlof hoort bij een medewerker.')
  return goed({ vestiging: b.vestiging, datum: b.datum, begin, eind, medewerkerId, soortId, notitie, uursoort })
}

export const UREN_ACTIES = ['opslaan', 'bevestig', 'goedkeuren', 'terug'] as const
export type UrenActie = (typeof UREN_ACTIES)[number]

export interface UrenInvoer {
  actie: UrenActie
  gewerktBegin: string | null
  gewerktEind: string | null
  pauzeMin: number
  opmerking: string | null
}

export function leesUren(ruw: unknown): Invoer<UrenInvoer> {
  const b = object(ruw)
  if (!b) return mis('Ongeldige invoer.')
  const actie = UREN_ACTIES.find((a) => a === b.actie)
  if (!actie) return mis('Onbekende actie.')
  const gewerktBegin = b.gewerktBegin ? normaliseerTijd(b.gewerktBegin) : null
  const gewerktEind = b.gewerktEind ? normaliseerTijd(b.gewerktEind) : null
  if ((b.gewerktBegin && !gewerktBegin) || (b.gewerktEind && !gewerktEind)) return mis('Vul geldige tijden in.')
  if (gewerktBegin && gewerktEind && gewerktEind <= gewerktBegin) return mis('Het gewerkte einde moet na het begin liggen.')
  const pauze = b.pauzeMin ?? 0
  if (typeof pauze !== 'number' || !Number.isInteger(pauze) || pauze < 0 || pauze > 240) return mis('Pauze is 0 tot 240 minuten.')
  const opmerking = optTekst(b.opmerking, 300)
  if (opmerking === undefined) return mis('De opmerking is te lang (maximaal 300 tekens).')
  return goed({ actie, gewerktBegin, gewerktEind, pauzeMin: pauze, opmerking })
}

export function leesRuil(ruw: unknown): Invoer<{ a: string; b: string }> {
  const b = object(ruw)
  if (!b || !isUuid(b.a) || !isUuid(b.b)) return mis('Kies twee diensten om te ruilen.')
  if (b.a === b.b) return mis('Kies een andere dienst om mee te ruilen.')
  return goed({ a: b.a, b: b.b })
}

export interface WeekInvoer {
  vestiging: Vestiging
  maandag: string
}

function leesWeek(b: Record<string, unknown> | null): Invoer<WeekInvoer> {
  if (!b || !isVestigingSlug(b.vestiging)) return mis('Kies een vestiging.')
  if (!isMaandag(b.maandag)) return mis('Kies een geldige week.')
  return goed({ vestiging: b.vestiging, maandag: b.maandag })
}

export function leesKopie(ruw: unknown): Invoer<WeekInvoer & { vervang: boolean }> {
  const b = object(ruw)
  const w = leesWeek(b)
  return w.ok ? goed({ ...w.waarde, vervang: b?.vervang === true }) : w
}

export function leesSjabloon(ruw: unknown): Invoer<WeekInvoer & { naam: string }> {
  const b = object(ruw)
  const w = leesWeek(b)
  if (!w.ok) return w
  const naam = optTekst(b?.naam, 60)
  if (!naam) return mis('Geef het patroon een naam (maximaal 60 tekens).')
  return goed({ ...w.waarde, naam })
}

export function leesToepassen(ruw: unknown): Invoer<WeekInvoer & { weken: number; vervang: boolean }> {
  const b = object(ruw)
  const w = leesWeek(b)
  if (!w.ok) return w
  const weken = b?.weken
  if (typeof weken !== 'number' || !Number.isInteger(weken) || weken < 1 || weken > 12) return mis('Kies 1 tot 12 weken.')
  return goed({ ...w.waarde, weken, vervang: b?.vervang === true })
}

export interface BeschikbaarInvoer {
  medewerkerId: string
  datum: string
  datumTot: string | null
  beschikbaar: boolean
  van: string | null
  tot: string | null
  reden: Reden | null
  notitie: string | null
}

export function leesBeschikbaar(ruw: unknown): Invoer<BeschikbaarInvoer> {
  const b = object(ruw)
  if (!b || !isUuid(b.medewerkerId)) return mis('Kies een medewerker.')
  if (!isDatum(b.datum)) return mis('Kies een datum.')
  const datumTot = b.datumTot ? (isDatum(b.datumTot) ? b.datumTot : undefined) : null
  if (datumTot === undefined || (datumTot !== null && datumTot < b.datum)) return mis('De einddatum moet op of na de begindatum liggen.')
  const van = b.van ? normaliseerTijd(b.van) : null
  const tot = b.tot ? normaliseerTijd(b.tot) : null
  if (van && tot && tot <= van) return mis('De eindtijd moet na de begintijd liggen.')
  const reden = b.reden ? (REDENEN.find((r) => r === b.reden) ?? undefined) : null
  if (reden === undefined) return mis('Kies verlof, vrij of ziek.')
  const notitie = optTekst(b.notitie, 200)
  if (notitie === undefined) return mis('De notitie is te lang (maximaal 200 tekens).')
  return goed({ medewerkerId: b.medewerkerId, datum: b.datum, datumTot, beschikbaar: b.beschikbaar === true, van, tot, reden, notitie })
}

export interface VasteDag {
  /** null = geen vaste regel voor deze dag. */
  beschikbaar: boolean | null
  van: string | null
  tot: string | null
}

export function leesVast(ruw: unknown): Invoer<{ medewerkerId: string; dagen: VasteDag[] }> {
  const b = object(ruw)
  if (!b || !isUuid(b.medewerkerId)) return mis('Kies een medewerker.')
  if (!Array.isArray(b.dagen) || b.dagen.length !== 7) return mis('Geef voor elke dag de beschikbaarheid.')
  const dagen: VasteDag[] = []
  for (const ruweDag of b.dagen) {
    const d = object(ruweDag)
    const beschikbaar = d?.beschikbaar === true ? true : d?.beschikbaar === false ? false : null
    const van = d?.van ? normaliseerTijd(d.van) : null
    const tot = d?.tot ? normaliseerTijd(d.tot) : null
    if (van && tot && tot <= van) return mis('Een eindtijd ligt voor de begintijd.')
    dagen.push({ beschikbaar, van: beschikbaar ? van : null, tot: beschikbaar ? tot : null })
  }
  return goed({ medewerkerId: b.medewerkerId, dagen })
}

export function leesMedewerkerInstelling(ruw: unknown): Invoer<{ contracturen?: number | null; kleur?: Kleur }> {
  const b = object(ruw)
  if (!b) return mis('Ongeldige invoer.')
  const uit: { contracturen?: number | null; kleur?: Kleur } = {}
  if ('contracturen' in b) {
    const c = b.contracturen
    if (c === null || c === '') uit.contracturen = null
    else if (typeof c === 'number' && Number.isFinite(c) && c >= 0 && c <= 60) uit.contracturen = Math.round(c * 2) / 2
    else return mis('Contracturen zijn 0 tot 60 per week.')
  }
  if ('kleur' in b) {
    if (!isKleur(b.kleur)) return mis('Kies een kleur uit de lijst.')
    uit.kleur = b.kleur
  }
  if (Object.keys(uit).length === 0) return mis('Er is niets om op te slaan.')
  return goed(uit)
}

export interface NotitieInvoer {
  vestiging: Vestiging
  datum: string
  van: string | null
  tot: string | null
  soort: NotitieSoort
  medewerkerId: string | null
  tekst: string
}

export function leesNotitie(ruw: unknown): Invoer<NotitieInvoer> {
  const b = object(ruw)
  if (!b || !isVestigingSlug(b.vestiging)) return mis('Kies een vestiging.')
  if (!isDatum(b.datum)) return mis('Kies een datum.')
  const van = b.van ? normaliseerTijd(b.van) : null
  const tot = b.tot ? normaliseerTijd(b.tot) : null
  if ((b.van && !van) || (b.tot && !tot)) return mis('Vul geldige tijden in.')
  if (van && tot && tot <= van) return mis('De eindtijd moet na de begintijd liggen.')
  const soort = NOTITIE_SOORTEN.find((s) => s === (b.soort ?? 'mededeling'))
  if (!soort) return mis('Onbekende soort mededeling.')
  const medewerkerId = optId(b.medewerkerId)
  if (medewerkerId === undefined) return mis('Kies een geldige medewerker.')
  const tekst = optTekst(b.tekst, 200)
  if (!tekst) return mis('Schrijf een korte tekst (maximaal 200 tekens).')
  return goed({ vestiging: b.vestiging, datum: b.datum, van, tot, soort, medewerkerId, tekst })
}

export interface UrenBulkInvoer {
  vestiging: Vestiging
  actie: 'goedkeuren' | 'verwerken'
  van: string
  tot: string
}

export function leesUrenBulk(ruw: unknown): Invoer<UrenBulkInvoer> {
  const b = object(ruw)
  if (!b || !isVestigingSlug(b.vestiging)) return mis('Kies een vestiging.')
  if (b.actie !== 'goedkeuren' && b.actie !== 'verwerken') return mis('Onbekende actie.')
  if (!isDatum(b.van) || !isDatum(b.tot) || b.tot <= b.van) return mis('Kies een geldige periode.')
  return goed({ vestiging: b.vestiging, actie: b.actie, van: b.van, tot: b.tot })
}
