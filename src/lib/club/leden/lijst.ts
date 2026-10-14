// ─── Fit Factory Club: de ledenlijst (PUUR) ─────────────────────────────────
// Rijen opbouwen, filteren, sorteren en pagineren. Alle keuzes staan in de URL
// (?status=actief&risico=1&sort=-behoud&p=2), zodat een lijst deelbaar is.

import { LID_STATUSSEN, volledigeNaam, type Lid, type LidStatus } from '@/lib/club/gedeeld/lid'
import { berekenBehoud, type Behoud } from './behoud'
import { dagenGeleden, dagSleutel } from './tijd'

export const PER_PAGINA = 50

export interface LedenRij {
  lid: Lid
  laatsteBezoek: Date | null
  bezoeken30: number
  /** Alleen voor leden die horen te komen (actief, proef); anders null. */
  behoud: Behoud | null
}

export const SORTEER_SLEUTELS = ['naam', 'lidnummer', 'status', 'abonnement', 'bezoek', 'bezoeken', 'behoud'] as const
export type SorteerSleutel = (typeof SORTEER_SLEUTELS)[number]

export interface LijstParams {
  q: string
  status: LidStatus | null
  abonnement: string | null
  tag: string | null
  /** Een medewerker-id, 'geen' (zonder coach) of null (alle). */
  coach: string | null
  risico: boolean
  sort: SorteerSleutel
  oplopend: boolean
  pagina: number
}

export const STANDAARD_PARAMS: LijstParams = {
  q: '', status: null, abonnement: null, tag: null, coach: null, risico: false, sort: 'naam', oplopend: true, pagina: 1,
}

type RuweParams = Record<string, string | string[] | undefined>

function isStatus(v: string): v is LidStatus {
  return (LID_STATUSSEN as readonly string[]).includes(v)
}

function isSorteerSleutel(v: string): v is SorteerSleutel {
  return (SORTEER_SLEUTELS as readonly string[]).includes(v)
}

function een(ruw: string | string[] | undefined): string {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  return typeof w === 'string' ? w.trim().slice(0, 80) : ''
}

/** Systeemgrens: de zoekparameters van de pagina naar nette lijstkeuzes. */
export function leesLijstParams(ruw: RuweParams): LijstParams {
  const status = een(ruw.status)
  const sortRuw = een(ruw.sort)
  const sortSleutel = sortRuw.replace(/^-/, '')
  const pagina = Number.parseInt(een(ruw.p), 10)
  return {
    q: een(ruw.q),
    status: isStatus(status) ? status : null,
    abonnement: een(ruw.abonnement) || null,
    tag: een(ruw.tag) || null,
    coach: een(ruw.coach) || null,
    risico: een(ruw.risico) === '1',
    sort: isSorteerSleutel(sortSleutel) ? sortSleutel : 'naam',
    oplopend: !sortRuw.startsWith('-'),
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.min(pagina, 10_000) : 1,
  }
}

/** De zoekparameters voor een link: alleen wat afwijkt van de standaard. Wijzigen zet je terug op pagina 1. */
export function lijstZoek(p: LijstParams, wijziging: Partial<LijstParams> = {}): Record<string, string> {
  const n: LijstParams = { ...p, pagina: 1, ...wijziging }
  const uit: Record<string, string> = {}
  if (n.q) uit.q = n.q
  if (n.status) uit.status = n.status
  if (n.abonnement) uit.abonnement = n.abonnement
  if (n.tag) uit.tag = n.tag
  if (n.coach) uit.coach = n.coach
  if (n.risico) uit.risico = '1'
  if (n.sort !== 'naam' || !n.oplopend) uit.sort = `${n.oplopend ? '' : '-'}${n.sort}`
  if (n.pagina > 1) uit.p = String(n.pagina)
  return uit
}

/** Een rij per lid, met laatste bezoek, bezoeken in 30 dagen en behoud. */
export function bouwRijen(
  leden: readonly Lid[],
  bezoeken: ReadonlyMap<string, readonly Date[]>,
  noShows: ReadonlyMap<string, number>,
  nu: Date,
): LedenRij[] {
  return leden.map((lid) => {
    const eigen = bezoeken.get(lid.id) ?? []
    const laatsteBezoek = eigen.reduce<Date | null>((max, b) => (!max || b > max ? b : max), null)
    const dagen30 = new Set(eigen.filter((b) => { const d = dagenGeleden(b, nu); return d >= 0 && d < 30 }).map(dagSleutel))
    const verwacht = lid.status === 'actief' || lid.status === 'proef'
    const behoud = verwacht
      ? berekenBehoud({ bezoeken: eigen, noShows: noShows.get(lid.id) ?? 0, lidSinds: lid.lidSinds, nu })
      : null
    return { lid, laatsteBezoek, bezoeken30: dagen30.size, behoud }
  })
}

function zoekTekst(lid: Lid): string {
  return [volledigeNaam(lid), lid.lidnummer, lid.email, lid.sportivityId, lid.telefoon].filter(Boolean).join(' ').toLowerCase()
}

export function filterRijen(rijen: readonly LedenRij[], p: LijstParams): LedenRij[] {
  const termen = p.q.toLowerCase().split(/\s+/).filter(Boolean)
  return rijen.filter(({ lid, behoud }) => {
    if (p.status && lid.status !== p.status) return false
    if (p.abonnement && lid.abonnement !== p.abonnement) return false
    if (p.tag && !lid.tags.includes(p.tag)) return false
    if (p.coach === 'geen' && lid.coachId) return false
    if (p.coach && p.coach !== 'geen' && lid.coachId !== p.coach) return false
    if (p.risico && behoud?.label !== 'risico') return false
    if (termen.length) {
      const tekst = zoekTekst(lid)
      if (!termen.every((t) => tekst.includes(t))) return false
    }
    return true
  })
}

const STATUS_VOLGORDE: Record<LidStatus, number> = { actief: 0, proef: 1, opgezegd: 2, gepauzeerd: 3, gestopt: 4 }
const NL = new Intl.Collator('nl', { sensitivity: 'base', numeric: true })

function naamSleutel(l: Lid): string {
  return `${l.achternaam.replace(/^(van der|van den|van de|van|de|den|der|ter|ten|te|'t)\s+/i, '')} ${l.voornaam}`
}

/** Vergelijk twee waarden; null komt altijd achteraan. */
function vergelijk(a: string | number | null, b: string | number | null, oplopend: boolean): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  const r = typeof a === 'number' && typeof b === 'number' ? a - b : NL.compare(String(a), String(b))
  return oplopend ? r : -r
}

function waarde(r: LedenRij, s: SorteerSleutel): string | number | null {
  switch (s) {
    case 'naam': return naamSleutel(r.lid)
    case 'lidnummer': return r.lid.lidnummer
    case 'status': return STATUS_VOLGORDE[r.lid.status]
    case 'abonnement': return r.lid.abonnement
    case 'bezoek': return r.laatsteBezoek ? r.laatsteBezoek.getTime() : null
    case 'bezoeken': return r.bezoeken30
    case 'behoud': return r.behoud ? r.behoud.score : null
  }
}

export function sorteerRijen(rijen: readonly LedenRij[], s: SorteerSleutel, oplopend: boolean): LedenRij[] {
  return [...rijen].sort((a, b) => vergelijk(waarde(a, s), waarde(b, s), oplopend) || NL.compare(naamSleutel(a.lid), naamSleutel(b.lid)))
}

export interface Pagina<T> {
  rijen: T[]
  pagina: number
  paginas: number
  van: number
  tot: number
  totaal: number
}

export function pagineer<T>(rijen: readonly T[], pagina: number, per = PER_PAGINA): Pagina<T> {
  const paginas = Math.max(1, Math.ceil(rijen.length / per))
  const huidig = Math.min(Math.max(1, pagina), paginas)
  const start = (huidig - 1) * per
  const deel = rijen.slice(start, start + per)
  return { rijen: deel, pagina: huidig, paginas, van: deel.length ? start + 1 : 0, tot: start + deel.length, totaal: rijen.length }
}

export interface LedenTellingen {
  actief: number
  gepauzeerd: number
  opgezegd: number
  proef: number
  risico: number
}

export function telTegels(rijen: readonly LedenRij[]): LedenTellingen {
  const t: LedenTellingen = { actief: 0, gepauzeerd: 0, opgezegd: 0, proef: 0, risico: 0 }
  for (const { lid, behoud } of rijen) {
    if (lid.status !== 'gestopt') t[lid.status] += 1
    if (behoud?.label === 'risico') t.risico += 1
  }
  return t
}

/** De keuzes voor de filters: alle abonnementen en tags die voorkomen. */
export function filterKeuzes(rijen: readonly LedenRij[]): { abonnementen: string[]; tags: string[] } {
  const abonnementen = new Set<string>()
  const tags = new Set<string>()
  for (const { lid } of rijen) {
    if (lid.abonnement) abonnementen.add(lid.abonnement)
    for (const tag of lid.tags) tags.add(tag)
  }
  return { abonnementen: [...abonnementen].sort(NL.compare), tags: [...tags].sort(NL.compare) }
}
