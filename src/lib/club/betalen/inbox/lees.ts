// ─── Club, lidgeld-inbox: kleine leeshulpen voor Stripe-JSON (PUUR) ─────────
// Systeemgrens: alles wat van Stripe komt is `unknown` tot het hier gelezen is.

export type Obj = Record<string, unknown>

export function obj(v: unknown): Obj | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Obj) : null
}

export function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 && v.length <= 255 ? v : null
}

/** Een id, of het id van een uitgebreid object (`expand`). */
export function idVan(v: unknown, voorvoegsel: string): string | null {
  const id = str(v) ?? str(obj(v)?.id)
  return id && id.startsWith(voorvoegsel) ? id : null
}

export function geheel(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const ACCOUNT_ID = /^acct_[A-Za-z0-9]{6,250}$/

export function uuid(v: unknown): string | null {
  const s = str(v)
  return s && UUID.test(s) ? s.toLowerCase() : null
}

/** De koppeling die wij zelf als metadata meegeven (alleen ids, geen persoonsgegevens). */
export interface Metadata {
  organisatieId: string | null
  factuurId: string | null
  betalingId: string | null
  verkoopId: string | null
  contractId: string | null
}

export function leesMetadata(v: unknown): Metadata {
  const m = obj(v)
  return {
    organisatieId: uuid(m?.organisatie_id),
    factuurId: uuid(m?.factuur_id),
    betalingId: uuid(m?.betaling_id),
    verkoopId: uuid(m?.verkoop_id),
    contractId: uuid(m?.contract_id),
  }
}
