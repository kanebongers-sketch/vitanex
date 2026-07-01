export type EmotionState =
  | 'calm'
  | 'focused'
  | 'proud'
  | 'concerned'
  | 'motivated'
  | 'curious'
  | 'supportive'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export type RouteContext = {
  label: string
  suggestedEmotion: EmotionState
}

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

export function emotionFromScore(score: number): EmotionState {
  if (score >= 85) return 'proud'
  if (score >= 65) return 'motivated'
  if (score >= 45) return 'calm'
  if (score >= 25) return 'supportive'
  return 'concerned'
}

const EVENT_EMOTIONS: Partial<Record<string, EmotionState>> = {
  check_in_completed: 'motivated',
  goal_achieved:      'proud',
  streak_milestone:   'proud',
  data_logged:        'motivated',
  level_up:           'proud',
  habit_completed:    'motivated',
  mood_logged:        'curious',
  content_created:    'focused',
  inactivity_detected:'concerned',
}

export function emotionFromEvent(type: string): EmotionState | null {
  return EVENT_EMOTIONS[type] ?? null
}

// Warme, eerlijke viering-teksten voor de echte mijlpalen. Bewust zonder
// emoji-spam: rustig en premium (zie animation.md / branding.md). Eén korte
// zin die de gebruiker écht ziet en waarmaakt wat er gebeurde.
const CELEBRATION_MESSAGES: Partial<Record<string, string>> = {
  goal_achieved:    'Doel bereikt. Precies zo bouw je vooruitgang op.',
  streak_milestone: 'Je streak houdt stand — consistentie die telt.',
  level_up:         'Nieuw level. Je companion groeit met je mee.',
}

export function celebrationMessage(type: string): string | null {
  return CELEBRATION_MESSAGES[type] ?? null
}

const ROUTE_MAP: Array<[string, RouteContext]> = [
  ['/content',   { label: 'Content Studio', suggestedEmotion: 'focused'   }],
  ['/check-in',  { label: 'Check-in',       suggestedEmotion: 'curious'   }],
  ['/voortgang', { label: 'Voortgang',      suggestedEmotion: 'motivated' }],
  ['/gewoontes', { label: 'Gewoontes',      suggestedEmotion: 'focused'   }],
  ['/voeding',   { label: 'Voeding',        suggestedEmotion: 'curious'   }],
  ['/slaap',     { label: 'Slaap',          suggestedEmotion: 'calm'      }],
  ['/training',  { label: 'Training',       suggestedEmotion: 'motivated' }],
  ['/home',      { label: 'Home',           suggestedEmotion: 'calm'      }],
  ['/hr',        { label: 'HR Dashboard',   suggestedEmotion: 'focused'   }],
  ['/profiel',   { label: 'Profiel',        suggestedEmotion: 'curious'   }],
]

export function contextFromPathname(pathname: string): RouteContext {
  for (const [prefix, ctx] of ROUTE_MAP) {
    if (pathname.startsWith(prefix)) return ctx
  }
  return { label: 'App', suggestedEmotion: 'calm' }
}
