// ─── Iconen voor coaching-content ───────────────────────────────────────────
// Kleine, gedeelde icoon-mappings voor de content-feature (coach-beheer + klant-
// leesweergave), zodat pijler- en type-iconen op één plek staan. Lucide-only.

import { Dumbbell, Brain, Zap, FileText, ClipboardList, Headphones, Video } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Pijler, ContentType } from '@/lib/coaching/content'

/** Pijler-icoon — spiegelt de iconografie die elders in coaching wordt gebruikt. */
export const PIJLER_ICOON: Record<Pijler, LucideIcon> = {
  body: Dumbbell,
  mind: Brain,
  performance: Zap,
}

/** Icoon per content-vorm. */
export const CONTENT_TYPE_ICOON: Record<ContentType, LucideIcon> = {
  artikel:  FileText,
  opdracht: ClipboardList,
  audio:    Headphones,
  video:    Video,
}
