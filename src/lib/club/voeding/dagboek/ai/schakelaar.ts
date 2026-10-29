// ─── Club, voedingsdagboek: schakelaar voor de betaalde AI (PUUR) ───────────
// Een foto van een maaltijd laten schatten en een korte omschrijving laten
// schatten kosten geld per gebruik (Anthropic). Kane beslist daarover (besluit
// 29-10-2026: inspreken eruit, foto maken blijft). Daarom staat alles standaard UIT:
//   CLUB_VOEDING_AI_ACTIEF=1   zet het aan (anders bestaat de API niet en zie je geen knop)
//   ANTHROPIC_API_KEY          nodig voor foto en schatten
//   CLUB_VOEDING_AI_MODEL      optioneel: ander Claude-model (standaard hieronder)
// Nooit een sleutel in de code; alleen de namen hier.

export type Omgeving = Readonly<Record<string, string | undefined>>

/**
 * Claude Haiku 5.5: het actuele zuinige model ($0,10 / $0,50 per miljoen tokens),
 * leest afbeeldingen en is sterk in gestructureerd uitlezen. Een verkleinde foto
 * (langste zijde 1024 px) kost zo een fractie van een cent per maaltijd.
 */
export const STANDAARD_MODEL = 'claude-haiku-5-5'

export interface AiFuncties {
  foto: boolean
  schatten: boolean
}

export const GEEN_AI: AiFuncties = { foto: false, schatten: false }

export function voedingAiAan(omgeving: Omgeving = process.env): boolean {
  return omgeving.CLUB_VOEDING_AI_ACTIEF?.trim() === '1'
}

/** Welke AI-functies echt werken: schakelaar aan en de sleutel gezet. */
export function aiFuncties(omgeving: Omgeving = process.env): AiFuncties {
  if (!voedingAiAan(omgeving) || !omgeving.ANTHROPIC_API_KEY?.trim()) return GEEN_AI
  return { foto: true, schatten: true }
}

export function aiModel(omgeving: Omgeving = process.env): string {
  const eigen = omgeving.CLUB_VOEDING_AI_MODEL?.trim()
  return eigen && /^claude-[a-z0-9.-]{3,60}$/.test(eigen) ? eigen : STANDAARD_MODEL
}
