// ─── Fit Factory Club: lessen om een proefles in te plannen (PUUR) ──────────
// Een proefles is een plek in een geplande groepsles van de komende 7 dagen
// (of een vrij tijdstip voor een rondleiding). Bezet = reserveringen die nog
// gelden (geboekt, aanwezig) plus leads die al een proefles in die les hebben.

export const PROEFLES_DAGEN = 7

export interface ProeflesLes {
  id: string
  naam: string
  startOp: string
  eindOp: string
  capaciteit: number
  bezet: number
  vrij: number
}

function alsObject(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** De naam van het lestype uit een embedded select (object of lijst met een object). */
function lestypeNaam(v: unknown): string {
  const o = alsObject(Array.isArray(v) ? v[0] : v)
  return o && typeof o.naam === 'string' && o.naam.trim() !== '' ? o.naam : 'Groepsles'
}

/** Systeemgrens: een rij uit club_lessen (met lestype) plus de bezetting, of null. */
export function lesUitRij(rij: unknown, bezet: number): ProeflesLes | null {
  const r = alsObject(rij)
  if (!r) return null
  if (typeof r.id !== 'string' || typeof r.start_op !== 'string' || typeof r.eind_op !== 'string') return null
  if (typeof r.capaciteit !== 'number' || r.status !== 'gepland') return null
  const vrij = Math.max(0, r.capaciteit - bezet)
  return { id: r.id, naam: lestypeNaam(r.lestype), startOp: r.start_op, eindOp: r.eind_op, capaciteit: r.capaciteit, bezet, vrij }
}

/** Tel hoe vaak elk les-id voorkomt. */
export function telPerLes(ids: readonly unknown[]): Map<string, number> {
  const telling = new Map<string, number>()
  for (const id of ids) if (typeof id === 'string') telling.set(id, (telling.get(id) ?? 0) + 1)
  return telling
}

/** Alleen lessen die nog moeten beginnen en waar plek is, op volgorde van tijd. */
export function kiesbareLessen(lessen: readonly ProeflesLes[], nu: Date): ProeflesLes[] {
  return lessen
    .filter((l) => l.vrij > 0 && new Date(l.startOp).getTime() > nu.getTime())
    .sort((a, b) => a.startOp.localeCompare(b.startOp))
}
