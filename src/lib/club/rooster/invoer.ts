// ─── Fit Factory Club, rooster: invoer van de API controleren (PUUR) ────────
// Systeemgrens: wat er binnenkomt is `unknown`. Elke functie geeft een nette
// waarde of een Nederlandse foutmelding terug.

import { isVestiging, type Vestiging } from '@/lib/club/gedeeld/vestiging'
import { AFVINK_STATUSSEN, RESERVERING_BRONNEN, type AfvinkStatus, type ReserveringBron } from './regels'
import { MAX_WEKEN_VOORUIT } from './genereren'

export type Invoer<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_BEREIK_MS = 62 * 86_400_000

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

export interface ReserveerInvoer {
  lesId: string
  lidId: string
  bron: ReserveringBron
}

export function leesReserveerInvoer(ruw: unknown): Invoer<ReserveerInvoer> {
  const b = object(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  if (!isUuid(b.lesId)) return mis('Kies een les.')
  if (!isUuid(b.lidId)) return mis('Kies een lid.')
  const bron = b.bron ?? 'balie'
  if (typeof bron !== 'string' || !(RESERVERING_BRONNEN as readonly string[]).includes(bron)) return mis('Onbekende bron van de boeking.')
  const nette = RESERVERING_BRONNEN.find((x) => x === bron) ?? 'balie'
  return goed({ lesId: b.lesId, lidId: b.lidId, bron: nette })
}

export function leesAfvinkInvoer(ruw: unknown): Invoer<AfvinkStatus> {
  const b = object(ruw)
  const status = AFVINK_STATUSSEN.find((s) => s === b?.status)
  return status ? goed(status) : mis('Kies aanwezig, no-show of geboekt.')
}

export interface LesWijziging {
  capaciteit?: number
  instructeurId?: string | null
  zaalId?: string | null
}

function idOfNull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  return isUuid(v) ? v : undefined
}

export function leesLesWijziging(ruw: unknown): Invoer<LesWijziging> {
  const b = object(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  let uit: LesWijziging = {}
  if (b.capaciteit !== undefined) {
    const n = Number(b.capaciteit)
    if (!Number.isInteger(n) || n < 1 || n > 500) return mis('Capaciteit moet tussen 1 en 500 liggen.')
    uit = { ...uit, capaciteit: n }
  }
  for (const veld of ['instructeurId', 'zaalId'] as const) {
    if (b[veld] === undefined) continue
    const id = idOfNull(b[veld])
    if (id === undefined) return mis(veld === 'zaalId' ? 'Onbekende zaal.' : 'Onbekende instructeur.')
    uit = { ...uit, [veld]: id }
  }
  if (Object.keys(uit).length === 0) return mis('Er is niets om te wijzigen.')
  return goed(uit)
}

export function leesAnnuleerReden(ruw: unknown): Invoer<string> {
  const b = object(ruw)
  const reden = typeof b?.reden === 'string' ? b.reden.trim() : ''
  if (reden.length < 2) return mis('Geef een reden op, die zien de leden.')
  if (reden.length > 200) return mis('De reden is te lang (maximaal 200 tekens).')
  return goed(reden)
}

export function leesGenereerInvoer(ruw: unknown): Invoer<{ vestiging: Vestiging; weken: number }> {
  const b = object(ruw)
  if (!b || !isVestiging(b.vestiging)) return mis('Kies een vestiging.')
  const weken = b.weken === undefined ? 6 : Number(b.weken)
  if (!Number.isInteger(weken) || weken < 1 || weken > MAX_WEKEN_VOORUIT) return mis(`Kies 1 tot ${MAX_WEKEN_VOORUIT} weken.`)
  return goed({ vestiging: b.vestiging, weken })
}

export interface LessenVraag {
  vestiging: Vestiging
  van: Date
  tot: Date
}

/** De zoekparameters van GET /lessen: v, van, tot (ISO). Maximaal 62 dagen. */
export function leesLessenVraag(zoek: URLSearchParams): Invoer<LessenVraag> {
  const v = zoek.get('v')
  if (!isVestiging(v)) return mis('Kies een geldige vestiging (?v=).')
  const van = new Date(zoek.get('van') ?? '')
  const tot = new Date(zoek.get('tot') ?? '')
  if (Number.isNaN(van.getTime()) || Number.isNaN(tot.getTime())) return mis('Geef van en tot als ISO-datum.')
  if (tot.getTime() <= van.getTime()) return mis('Tot moet na van liggen.')
  if (tot.getTime() - van.getTime() > MAX_BEREIK_MS) return mis('Vraag maximaal 62 dagen tegelijk op.')
  return goed({ vestiging: v, van, tot })
}
