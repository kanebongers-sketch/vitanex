// ─── Fit Factory clubsoftware: vestigingen (PUUR) ───────────────────────────
// Dezelfde acht sleutels als de PT-app (clubs.ts). De gekozen vestiging staat in
// de URL (?v=budel), zodat elke pagina deelbaar is en terug/vooruit werkt.
// Budel is de pilotvestiging en dus de standaard.

import { CLUBS, CLUB_LABEL, isClub, type Club } from '@/lib/lifeos/pt-dashboard/clubs'

export type Vestiging = Club
export const VESTIGINGEN = CLUBS
export const VESTIGING_LABEL = CLUB_LABEL
export const PILOT_VESTIGING: Vestiging = 'budel'

/** De zoekparameter waarin de vestiging staat. */
export const VESTIGING_PARAM = 'v'

export const isVestiging = isClub

/** Uit een ruwe zoekparameter de vestiging; onbekend of leeg = de pilot (Budel). */
export function kiesVestiging(ruw: string | string[] | undefined | null): Vestiging {
  const waarde = Array.isArray(ruw) ? ruw[0] : ruw
  return isClub(waarde) ? waarde : PILOT_VESTIGING
}

/** Een pad binnen /clubkane met de vestiging erachter: clubPad('/leden', 'budel'). */
export function clubPad(pad: string, vestiging: Vestiging, extra?: Record<string, string>): string {
  const zoek = new URLSearchParams({ [VESTIGING_PARAM]: vestiging, ...(extra ?? {}) })
  const basis = pad === '' || pad === '/' ? '/clubkane' : `/clubkane${pad.startsWith('/') ? pad : `/${pad}`}`
  return `${basis}?${zoek.toString()}`
}

/** De zoekparameters van een pagina (Next geeft ze als Promise). */
export type ZoekParams = Promise<Record<string, string | string[] | undefined>>
