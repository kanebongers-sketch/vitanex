// UI-binding: canonieke pijler → lucide-icoon. De pijler-lib blijft puur
// (bewaart alleen de icoonnaam); dit is de enige plek die er een component van maakt.
import type { LucideIcon } from 'lucide-react'
import { Zap, Moon, Activity, Smile, Footprints, Apple } from 'lucide-react'
import type { PijlerKey } from '@/lib/pijlers/pijlers'

export const PIJLER_ICOON: Record<PijlerKey, LucideIcon> = {
  energie: Zap,
  slaap: Moon,
  stress: Activity,
  stemming: Smile,
  beweging: Footprints,
  voeding: Apple,
}
