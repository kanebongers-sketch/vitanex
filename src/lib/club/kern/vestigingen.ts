// ─── Club: de vestigingen van een sportschool (PUUR) ────────────────────────
// Elke sportschool heeft haar eigen vestigingen in club_vestigingen (user_id =
// organisatie). De sleutel is een slug die uniek is over alle sportscholen.
// De gekozen vestiging staat in de URL (?v=...), zodat elke pagina deelbaar is.

export type VestigingSleutel = string

export interface VestigingInfo {
  sleutel: VestigingSleutel
  naam: string
  /** Gaat open als er geen (geldige) vestiging in de URL staat. */
  standaard: boolean
}

export const VESTIGING_SLUG = /^[a-z0-9][a-z0-9_-]{1,59}$/

export function isVestigingSlug(v: unknown): v is VestigingSleutel {
  return typeof v === 'string' && VESTIGING_SLUG.test(v)
}

/** Systeemgrens: rijen uit club_vestigingen (al gesorteerd op volgorde) naar VestigingInfo. */
export function vestigingenUitRijen(rijen: readonly unknown[]): VestigingInfo[] {
  return rijen.flatMap((rij) => {
    if (typeof rij !== 'object' || rij === null) return []
    const r = rij as Record<string, unknown>
    if (!isVestigingSlug(r.vestiging)) return []
    const naam = typeof r.naam === 'string' && r.naam.trim() ? r.naam : r.vestiging
    return [{ sleutel: r.vestiging, naam, standaard: r.standaard === true }]
  })
}

/** De vestiging die open gaat: de gekozen als die bij deze sportschool hoort, anders de standaard of de eerste. */
export function kiesUit(lijst: readonly VestigingInfo[], ruw: string | string[] | undefined | null): VestigingSleutel | null {
  const waarde = Array.isArray(ruw) ? ruw[0] : ruw
  const gekozen = lijst.find((v) => v.sleutel === waarde)
  return (gekozen ?? lijst.find((v) => v.standaard) ?? lijst[0])?.sleutel ?? null
}

/** De naam van een vestiging; onbekend = de sleutel zelf (nooit een lege plek). */
export function naamVan(lijst: readonly VestigingInfo[], sleutel: VestigingSleutel): string {
  return lijst.find((v) => v.sleutel === sleutel)?.naam ?? sleutel
}

export function hoortBij(lijst: readonly VestigingInfo[], sleutel: unknown): sleutel is VestigingSleutel {
  return typeof sleutel === 'string' && lijst.some((v) => v.sleutel === sleutel)
}
