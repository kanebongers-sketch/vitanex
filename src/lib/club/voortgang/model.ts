// ─── Club, voortgang: wat de server aan de schermen geeft (PUUR) ────────────
// Alles is gewone JSON, zodat het van een servercomponent naar een
// clientcomponent kan en uit de API terugkomt na opslaan.

import type { Meting } from './meting'
import type { MeetPunt } from './tijdlijn'

export interface VoortgangData {
  lidId: string
  /** Intakes en losse metingen samen, als meetpunten. */
  punten: MeetPunt[]
  /** Alleen de losse metingen (die kun je wijzigen en verwijderen). Nieuwste eerst. */
  metingen: Meting[]
  /** Tijdstippen van afgevinkte trainingen (laatste 26 weken), nieuwste eerst. */
  trainingen: string[]
  /** Alle afgevinkte trainingen ooit, voor de mijlpalen. */
  totaalTrainingen: number
  /** Wat niet geladen kon worden, voor een nette melding. */
  fouten: string[]
}

export function isVoortgangData(v: unknown): v is VoortgangData {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  return typeof r.lidId === 'string' && Array.isArray(r.punten) && Array.isArray(r.metingen) && Array.isArray(r.trainingen) && typeof r.totaalTrainingen === 'number'
}
