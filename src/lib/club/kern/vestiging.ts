// ─── Club: de gekozen vestiging in de URL (PUUR) ────────────────────────────
// Elke sportschool heeft haar eigen vestigingen (zie vestigingen.ts); de
// sleutel is een vrije slug. De gekozen vestiging staat in de URL (?v=budel),
// zodat elke pagina deelbaar is en terug/vooruit werkt.

import type { VestigingSleutel } from './vestigingen'

export type Vestiging = VestigingSleutel

/** De zoekparameter waarin de vestiging staat. */
export const VESTIGING_PARAM = 'v'

/** Een pad binnen /club met de vestiging erachter: clubPad('/leden', 'budel'). */
export function clubPad(pad: string, vestiging: Vestiging, extra?: Record<string, string>): string {
  const zoek = new URLSearchParams({ [VESTIGING_PARAM]: vestiging, ...(extra ?? {}) })
  const basis = pad === '' || pad === '/' ? '/club' : `/club${pad.startsWith('/') ? pad : `/${pad}`}`
  return `${basis}?${zoek.toString()}`
}

/** De zoekparameters van een pagina (Next geeft ze als Promise). */
export type ZoekParams = Promise<Record<string, string | string[] | undefined>>
