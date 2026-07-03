// ─── Interne product-analytics ────────────────────────────────────────────────
// Eén vaste allowlist van events (de vitaEvents-bus plus sessie/fout-events)
// en een meta-sanitizer. Gedeeld door de client-listener (AnalyticsListener)
// en de API-route (/api/events) zodat beide kanten exact dezelfde grens
// hanteren. Privacy: minimaal, EU-gehost (eigen Supabase), geen third parties.

// Spiegel van VitaEventType in src/lib/vita/events.ts (runtime-lijst nodig
// voor validatie) + de twee analytics-eigen events. Wijzigt VitaEventType,
// werk deze lijst dan mee bij.
export const ANALYTICS_EVENTS = [
  'check_in_completed',
  'goal_achieved',
  'streak_milestone',
  'data_logged',
  'level_up',
  'habit_completed',
  'mood_logged',
  'content_created',
  'inactivity_detected',
  'page_entered',
  'session_start',
  'client_error',
] as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]

export function isToegestaanEvent(waarde: unknown): waarde is AnalyticsEvent {
  return typeof waarde === 'string' && (ANALYTICS_EVENTS as readonly string[]).includes(waarde)
}

// Alleen deze meta-velden komen door, altijd als afgekapte string — nooit
// vrije objecten of persoonsinhoud (journal-tekst e.d.) in het event-log.
const META_VELDEN = ['kind', 'melding', 'pad'] as const
const META_MAX_LENGTE = 200

export function schoonMeta(input: unknown): Record<string, string> | null {
  if (typeof input !== 'object' || input === null) return null
  const bron = input as Record<string, unknown>
  const uit: Record<string, string> = {}
  for (const veld of META_VELDEN) {
    const waarde = bron[veld]
    if (typeof waarde === 'string' && waarde.length > 0) {
      uit[veld] = waarde.slice(0, META_MAX_LENGTE)
    }
  }
  return Object.keys(uit).length > 0 ? uit : null
}
