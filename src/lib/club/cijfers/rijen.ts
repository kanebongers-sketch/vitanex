// ─── Fit Factory Club: databaserijen naar typen (PUUR, systeemgrens) ────────
// Alles wat uit de database komt is `unknown` tot het hier is nagekeken.

import { LID_STATUSSEN, type LidStatus } from '@/lib/club/kern/lid'
import { isVestiging, type Vestiging } from '@/lib/club/kern/vestiging'
import type { BezoekTelling } from './bezoek'
import type { LidCijferRij } from './leden'
import type { LesDag } from './lesdagen'
import { isLeadBron, isLeadStatus, type LeadCijferRij } from './leads'
import { isReserveringStatus, type LesBasis, type LesTelling, type ReserveringStatus } from './lessen'
import { dagSleutel } from './tijd'

export type Rij = Record<string, unknown>

export function alsRij(v: unknown): Rij | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rij) : null
}

export function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

export function getal(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

export function datum(v: unknown): Date | null {
  if (typeof v !== 'string') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Datumkolom (date) als "YYYY-MM-DD". */
export function dag(v: unknown): string | null {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null
}

export function isLidStatus(v: unknown): v is LidStatus {
  return typeof v === 'string' && (LID_STATUSSEN as readonly string[]).includes(v)
}

/** Naam uit een ingesloten relatie: { naam: "Spinning" } of [{ naam }]. */
export function ingeslotenNaam(v: unknown): string | null {
  const r = alsRij(Array.isArray(v) ? v[0] : v)
  return r ? tekst(r.naam) : null
}

export function lidCijferUitRij(v: unknown): LidCijferRij | null {
  const r = alsRij(v)
  const id = r ? tekst(r.id) : null
  if (!r || !id || !isVestiging(r.vestiging) || !isLidStatus(r.status)) return null
  const geslacht = r.geslacht === 'man' || r.geslacht === 'vrouw' || r.geslacht === 'anders' ? r.geslacht : null
  return {
    id,
    vestiging: r.vestiging,
    status: r.status,
    lidSinds: dag(r.lid_sinds),
    einddatum: dag(r.einddatum),
    geboortedatum: dag(r.geboortedatum),
    geslacht,
  }
}

export function bezoekTellingUitRij(v: unknown): BezoekTelling | null {
  const r = alsRij(v)
  const sleutel = r ? tekst(r.sleutel) : null
  const aantal = r ? getal(r.aantal) : null
  if (!r || !sleutel || aantal === null || !isVestiging(r.vestiging)) return null
  if (r.soort !== 'dag' && r.soort !== 'uur') return null
  return { vestiging: r.vestiging, soort: r.soort, sleutel, aantal }
}

/** Een les met ingesloten lestype (club_lessen + club_lestypen(naam)). */
export function lesBasisUitRij(v: unknown): LesBasis | null {
  const r = alsRij(v)
  const id = r ? tekst(r.id) : null
  const start = r ? datum(r.start_op) : null
  const capaciteit = r ? getal(r.capaciteit) : null
  if (!r || !id || !start || capaciteit === null || !isVestiging(r.vestiging)) return null
  return {
    id,
    vestiging: r.vestiging,
    lestype: ingeslotenNaam(r.club_lestypen) ?? tekst(r.lestype) ?? 'Les',
    start,
    capaciteit,
    geannuleerd: r.status === 'geannuleerd' || r.geannuleerd === true,
  }
}

/** Een rij uit de databasefunctie club_cijfers_lessen. */
export function lesTellingUitRij(v: unknown): LesTelling | null {
  const basis = lesBasisUitRij(v)
  const r = alsRij(v)
  if (!basis || !r) return null
  return {
    ...basis,
    bezet: getal(r.bezet) ?? 0,
    aanwezig: getal(r.aanwezig) ?? 0,
    noShow: getal(r.no_show) ?? 0,
    wachtlijst: getal(r.wachtlijst) ?? 0,
  }
}

export function reserveringUitRij(v: unknown): { lesId: string; status: ReserveringStatus } | null {
  const r = alsRij(v)
  const lesId = r ? tekst(r.les_id) : null
  if (!r || !lesId || !isReserveringStatus(r.status)) return null
  return { lesId, status: r.status }
}

export function leadCijferUitRij(v: unknown): LeadCijferRij | null {
  const r = alsRij(v)
  if (!r || !isVestiging(r.vestiging) || !isLeadBron(r.bron) || !isLeadStatus(r.status)) return null
  const aangemaakt = datum(r.aangemaakt_op)
  return { vestiging: r.vestiging, bron: r.bron, status: r.status, proeflesOp: tekst(r.proefles_op), aangemaakt: aangemaakt ? dagSleutel(aangemaakt) : null }
}

/** Alleen de bruikbare rijen. */
export function rijenVan<T>(data: readonly unknown[], fn: (v: unknown) => T | null): T[] {
  const uit: T[] = []
  for (const v of data) {
    const t = fn(v)
    if (t !== null) uit.push(t)
  }
  return uit
}

/** Een rij uit de databasefunctie club_cijfers_lessen_dag (migratie 396). */
export function lesDagUitRij(v: unknown): LesDag | null {
  const r = alsRij(v)
  const d = r ? dag(r.dag) : null
  if (!r || !d || !isVestiging(r.vestiging)) return null
  return {
    vestiging: r.vestiging,
    dag: d,
    lessen: getal(r.lessen) ?? 0,
    capaciteit: getal(r.capaciteit) ?? 0,
    bezet: getal(r.bezet) ?? 0,
    aanwezig: getal(r.aanwezig) ?? 0,
    noShow: getal(r.no_show) ?? 0,
  }
}

export type BeginBron = 'bezoek' | 'lessen' | 'leads'

/** Vanaf welke dag er data is, per vestiging en bron. */
export interface BeginRij {
  vestiging: Vestiging
  bron: BeginBron
  dag: string
}

/** Een rij uit club_cijfers_begin (migratie 396): { vestiging, bron, eerste }. */
export function beginUitRij(v: unknown): BeginRij | null {
  const r = alsRij(v)
  const eerste = r ? datum(r.eerste) : null
  if (!r || !eerste || !isVestiging(r.vestiging)) return null
  if (r.bron !== 'bezoek' && r.bron !== 'lessen' && r.bron !== 'leads') return null
  return { vestiging: r.vestiging, bron: r.bron, dag: dagSleutel(eerste) }
}
