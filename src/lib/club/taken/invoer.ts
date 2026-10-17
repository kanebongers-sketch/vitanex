// ─── Fit Factory Club, taken: invoer van de API controleren (PUUR) ──────────
// Systeemgrens: wat binnenkomt is `unknown`. Elke functie geeft een nette
// waarde of een Nederlandse foutmelding terug.

import type { Vestiging } from '@/lib/club/kern/vestiging'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { isDatum, plusDagen } from '@/lib/club/rooster/tijd'
import { isFrequentie, isMoment, type Frequentie, type Moment } from './typen'

export type Invoer<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Zo ver terug mag je nog afvinken (vergeten op papier te zetten). */
export const MAX_DAGEN_TERUG = 62

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function goed<T>(waarde: T): Invoer<T> {
  return { ok: true, waarde }
}

function mis<T>(fout: string): Invoer<T> {
  return { ok: false, fout }
}

/** Tekst bijgesneden en zonder dubbele spaties; leeg of te lang = null. */
export function netteTekst(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  return t.length >= 1 && t.length <= max ? t : null
}

export interface Persoon {
  medewerkerId: string | null
  wie: string
}

function leesPersoon(b: Record<string, unknown>): Invoer<Persoon> {
  const medewerkerId = b.medewerkerId === null || b.medewerkerId === undefined ? null : b.medewerkerId
  if (medewerkerId !== null && !isUuid(medewerkerId)) return mis('Onbekende medewerker.')
  const wie = netteTekst(b.wie, 80)
  if (!wie) return mis('Kies wie het gedaan heeft, of vul je initialen in.')
  return goed({ medewerkerId, wie })
}

/** Mag op deze dag afgevinkt worden? Niet in de toekomst en niet langer dan twee maanden terug. */
export function magAfvinkenOp(datum: string, vandaag: string): boolean {
  return datum <= vandaag && datum >= plusDagen(vandaag, -MAX_DAGEN_TERUG)
}

export interface AfvinkInvoer extends Persoon {
  taakId: string
  datum: string
}

export function leesAfvinkInvoer(ruw: unknown, vandaag: string): Invoer<AfvinkInvoer> {
  const b = object(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  if (!isUuid(b.taakId)) return mis('Onbekende taak.')
  if (!isDatum(b.datum)) return mis('Ongeldige datum.')
  if (!magAfvinkenOp(b.datum, vandaag)) return mis('Op deze dag kun je niet afvinken.')
  const p = leesPersoon(b)
  if (!p.ok) return p
  return goed({ taakId: b.taakId, datum: b.datum, ...p.waarde })
}

export function leesVakInvoer(taak: unknown, datum: unknown, vandaag: string): Invoer<{ taakId: string; datum: string }> {
  if (!isUuid(taak)) return mis('Onbekende taak.')
  if (!isDatum(datum)) return mis('Ongeldige datum.')
  if (!magAfvinkenOp(datum, vandaag)) return mis('Op deze dag kun je niets meer wijzigen.')
  return goed({ taakId: taak, datum })
}

export interface NotitieInvoer extends Persoon {
  vestiging: Vestiging
  datum: string
  tekst: string
}

export function leesNotitieInvoer(ruw: unknown, vandaag: string): Invoer<NotitieInvoer> {
  const b = object(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  if (!isVestigingSlug(b.vestiging)) return mis('Onbekende vestiging.')
  if (!isDatum(b.datum) || !magAfvinkenOp(b.datum, vandaag)) return mis('Op deze dag kun je geen notitie zetten.')
  const tekst = netteTekst(b.tekst, 1000)
  if (!tekst) return mis('Schrijf kort op wat je gedaan hebt (maximaal 1000 tekens).')
  const p = leesPersoon(b)
  if (!p.ok) return p
  return goed({ vestiging: b.vestiging, datum: b.datum, tekst, ...p.waarde })
}

export interface AfsluitInvoer extends Persoon {
  vestiging: Vestiging
}

export function leesAfsluitInvoer(ruw: unknown): Invoer<AfsluitInvoer> {
  const b = object(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  if (!isVestigingSlug(b.vestiging)) return mis('Onbekende vestiging.')
  const p = leesPersoon(b)
  if (!p.ok) return p
  return goed({ vestiging: b.vestiging, ...p.waarde })
}

export interface TaakVelden {
  naam: string
  groep: string | null
  frequentie: Frequentie
  perWeekMin: number | null
  moment: Moment
}

function leesMinimum(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 7 ? n : null
}

/** Alle velden van een taak (nieuw of gewijzigd). */
export function leesTaakVelden(b: Record<string, unknown>): Invoer<TaakVelden> {
  const naam = netteTekst(b.naam, 120)
  if (!naam) return mis('Geef de taak een naam (maximaal 120 tekens).')
  const groep = b.groep === null || b.groep === undefined || b.groep === '' ? null : netteTekst(b.groep, 60)
  if (b.groep && !groep) return mis('Het kopje mag maximaal 60 tekens zijn.')
  if (!isFrequentie(b.frequentie)) return mis('Kies hoe vaak de taak moet.')
  if (!isMoment(b.moment)) return mis('Kies het moment van de dag.')
  const perWeekMin = b.frequentie === 'per_week' ? leesMinimum(b.perWeekMin) : null
  if (b.frequentie === 'per_week' && perWeekMin === null) return mis('Kies hoe vaak per week (1 tot 7).')
  return goed({ naam, groep, frequentie: b.frequentie, perWeekMin, moment: b.moment })
}

export function leesNieuweTaak(ruw: unknown): Invoer<TaakVelden & { lijstId: string }> {
  const b = object(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  if (!isUuid(b.lijstId)) return mis('Kies een lijst.')
  const v = leesTaakVelden(b)
  if (!v.ok) return v
  return goed({ ...v.waarde, lijstId: b.lijstId })
}

export type TaakWijziging = { soort: 'velden'; velden: TaakVelden } | { soort: 'actief'; actief: boolean } | { soort: 'verplaats'; richting: Richting }

export type Richting = 'omhoog' | 'omlaag'

function isRichting(v: unknown): v is Richting {
  return v === 'omhoog' || v === 'omlaag'
}

/** Een wijziging van een taak of lijst: velden, aan/uit of verplaatsen. */
export function leesTaakWijziging(ruw: unknown): Invoer<TaakWijziging> {
  const b = object(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  if (isRichting(b.verplaats)) return goed({ soort: 'verplaats', richting: b.verplaats })
  if (typeof b.actief === 'boolean' && b.naam === undefined) return goed({ soort: 'actief', actief: b.actief })
  const v = leesTaakVelden(b)
  return v.ok ? goed({ soort: 'velden', velden: v.waarde }) : v
}

export type LijstWijziging = { soort: 'naam'; naam: string } | { soort: 'actief'; actief: boolean } | { soort: 'verplaats'; richting: Richting }

export function leesLijstWijziging(ruw: unknown): Invoer<LijstWijziging> {
  const b = object(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  if (isRichting(b.verplaats)) return goed({ soort: 'verplaats', richting: b.verplaats })
  if (typeof b.actief === 'boolean') return goed({ soort: 'actief', actief: b.actief })
  const naam = netteTekst(b.naam, 60)
  return naam ? goed({ soort: 'naam', naam }) : mis('Geef de lijst een naam (maximaal 60 tekens).')
}

export function leesNieuweLijst(ruw: unknown): Invoer<{ vestiging: Vestiging; naam: string }> {
  const b = object(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  if (!isVestigingSlug(b.vestiging)) return mis('Onbekende vestiging.')
  const naam = netteTekst(b.naam, 60)
  if (!naam) return mis('Geef de lijst een naam (maximaal 60 tekens).')
  return goed({ vestiging: b.vestiging, naam })
}

export function leesKopieerInvoer(ruw: unknown): Invoer<{ van: Vestiging; naar: Vestiging }> {
  const b = object(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  if (!isVestigingSlug(b.van) || !isVestigingSlug(b.naar)) return mis('Kies twee vestigingen.')
  if (b.van === b.naar) return mis('Kies een andere vestiging om naartoe te kopieren.')
  return goed({ van: b.van, naar: b.naar })
}
