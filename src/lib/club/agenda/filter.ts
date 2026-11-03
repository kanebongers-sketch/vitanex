// ─── Club: welke filters de Agenda toont (PUUR) ──────────────────────────────
// Ontwerp "Club in 10 minuten" (03-11-2026): Afspraken en Agenda worden een
// Agenda met filters. "Met leden" zijn de afspraken met trainers (pakket
// Afspraken, rechtensleutel afspraken); "Team" is de agenda van de vestiging
// (kern, rechtensleutel agenda). "Alles" toont beide door elkaar en staat er
// alleen als iemand beide mag zien. De rechtensleutels blijven gescheiden.

export const AGENDA_FILTERS = ['alles', 'leden', 'team'] as const
export type AgendaFilter = (typeof AGENDA_FILTERS)[number]

/** Wat deze persoon van de agenda mag zien (recht, module en pakket al meegeteld). */
export interface AgendaZicht {
  /** De agenda van de vestiging (onderdeel agenda). */
  team: boolean
  /** De afspraken met leden (onderdeel afspraken, pakket Afspraken). */
  leden: boolean
}

export interface AgendaKeuze {
  /** De filters om uit te kiezen, in vaste volgorde. Leeg = niets te zien. */
  filters: AgendaFilter[]
  /** Het filter dat open staat, of null als er niets te zien is. */
  actief: AgendaFilter | null
}

export function isAgendaFilter(v: unknown): v is AgendaFilter {
  return typeof v === 'string' && (AGENDA_FILTERS as readonly string[]).includes(v)
}

/** De filters die iemand ziet bij deze rechten en pakketten. */
export function agendaFilters(z: AgendaZicht): AgendaFilter[] {
  return AGENDA_FILTERS.filter((f) => (f === 'alles' ? z.team && z.leden : z[f]))
}

/**
 * Het gevraagde filter (?filter=) als iemand het mag zien; anders het eerste
 * dat er is (Alles als beide mogen, anders het enige).
 */
export function agendaFilter(ruw: string | string[] | undefined, z: AgendaZicht): AgendaKeuze {
  const filters = agendaFilters(z)
  const gevraagd = Array.isArray(ruw) ? ruw[0] : ruw
  const actief = isAgendaFilter(gevraagd) && filters.includes(gevraagd) ? gevraagd : (filters[0] ?? null)
  return { filters, actief }
}
