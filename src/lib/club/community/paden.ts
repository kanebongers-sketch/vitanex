// ─── Club, community: paden in de ledenapp (PUUR) ───────────────────────────
// De community staat op /mijn/community. Kijkt Kane mee, dan blijft ?lid= in
// elke link staan; voor een lid nooit.

export const COMMUNITY_PAD = '/mijn/community'

/** Het basispad: met ?lid= alleen in de voorvertoning. */
export function communityBasis(voorvertoningLid: string | null): string {
  return voorvertoningLid ? `${COMMUNITY_PAD}?lid=${encodeURIComponent(voorvertoningLid)}` : COMMUNITY_PAD
}

/** Een groep binnen de community. */
export function groepHref(basis: string, groepId: string): string {
  return `${basis}${basis.includes('?') ? '&' : '?'}groep=${encodeURIComponent(groepId)}`
}
