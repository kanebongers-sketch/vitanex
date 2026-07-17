// ─── Gezondheids-kaarten — gedeelde narrowing ──────────────────────────────
// De narrowing-bouwstenen wonen nu in `lib/lifeos/api/http.ts`, náást `haalJson`
// dat ze gebruikt. Ze stonden hier, in `WelzijnScoreKaart` én in `http.ts` —
// drie kopieën van dezelfde vier regels, die stilletjes uit elkaar konden
// groeien terwijl ze de systeemgrens bewaken.
//
// Ze worden hier doorgegeven zodat de bestaande imports blijven werken; nieuwe
// code haalt ze rechtstreeks uit `@/lib/lifeos/api/http`.

export { isObject, getalOfNull, tekstOfNull } from '@/lib/lifeos/api/http'

/**
 * Genereert een tijdelijke client-id voor een optimistisch toegevoegde regel.
 * `crypto.randomUUID` waar beschikbaar; anders een tijd-gebaseerde val-back —
 * uniek genoeg binnen één sessie, en de echte id vervangt 'm zodra de server
 * antwoordt.
 */
export function tijdelijkeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `temp-${crypto.randomUUID()}`
  }
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
