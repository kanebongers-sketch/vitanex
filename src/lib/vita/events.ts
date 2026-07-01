export type VitaEventType =
  | 'check_in_completed'
  | 'goal_achieved'
  | 'streak_milestone'
  | 'data_logged'
  | 'level_up'
  | 'habit_completed'
  | 'mood_logged'
  | 'content_created'
  | 'inactivity_detected'
  | 'page_entered'

export interface VitaEventPayload {
  type: VitaEventType
  data?: Record<string, unknown>
}

// Mijlpalen die een echt viering-moment verdienen (rustige glow-puls + warme
// bubbel + 'proud'-gezicht), i.p.v. een gewone status-nudge. Eén bron van
// waarheid zodat companion en eventuele andere luisteraars het gelijk zien.
const CELEBRATION_EVENTS: ReadonlySet<VitaEventType> = new Set<VitaEventType>([
  'goal_achieved',
  'streak_milestone',
  'level_up',
])

export function isCelebrationEvent(type: VitaEventType): boolean {
  return CELEBRATION_EVENTS.has(type)
}

export function vitaEvent(type: VitaEventType, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<VitaEventPayload>('vita:event', { detail: { type, data } })
  )
}
