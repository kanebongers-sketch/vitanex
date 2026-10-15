// ─── Fit Factory Club: bereik van de cijfers (PUUR) ─────────────────────────
// Maand en bereik staan in de URL (?maand=2026-10&bereik=alle), zodat een
// rapport deelbaar is en terug/vooruit werkt. De maand zelf: zie maand.ts.

export type Bereik = 'vestiging' | 'alle'

export function kiesBereik(ruw: string | string[] | undefined | null): Bereik {
  const waarde = Array.isArray(ruw) ? ruw[0] : ruw
  return waarde === 'alle' ? 'alle' : 'vestiging'
}
