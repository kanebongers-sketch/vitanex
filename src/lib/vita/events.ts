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

export function vitaEvent(type: VitaEventType, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<VitaEventPayload>('vita:event', { detail: { type, data } })
  )
}
