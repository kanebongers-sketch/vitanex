// ─── LifeOS — CRM: de follow-up-dag als label ───────────────────────────────
// Puur: dagsleutel + "vandaag" erin, een leesbaar label eruit. Zo zie je op de
// tegel wie je moet benaderen zonder de popup te openen.
//
// `null` ≠ 0: geen follow-up geeft `null` terug (geen label), niet "vandaag".
// Wie geen dag heeft gezet, moet ook geen dag te zien krijgen.

import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

export interface FollowUp {
  tekst: string
  /** Vandaag of verlopen → cyaan accent: dit vraagt nú iets van je. */
  dringend: boolean
}

const DAG_MS = 86_400_000

/**
 * Het label voor een follow-up-dag, of `null` als de sleutel geen geldige datum
 * is. `vandaag` mag `null` zijn (nog niet bepaald ná mount): dan tonen we de
 * absolute datum zonder "vandaag"/"morgen" — dat voorkomt een hydration-mismatch
 * op tekst die van de klok afhangt.
 */
export function followUpLabel(sleutel: string, vandaag: Date | null): FollowUp | null {
  const doel = leesDatumSleutel(sleutel)
  if (doel === null) return null
  if (vandaag === null) return { tekst: datumKort(doel), dringend: false }

  const nu = new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate())
  const dagen = Math.round((doel.getTime() - nu.getTime()) / DAG_MS)

  if (dagen < 0) return { tekst: 'te laat', dringend: true }
  if (dagen === 0) return { tekst: 'vandaag', dringend: true }
  if (dagen === 1) return { tekst: 'morgen', dringend: false }
  return { tekst: datumKort(doel), dringend: false }
}

/** 'vr 18 jul'. Kort, want dit staat als chip op een tegel. */
function datumKort(d: Date): string {
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}
