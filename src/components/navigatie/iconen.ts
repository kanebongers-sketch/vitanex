// UI-binding: loggings-ingang → lucide-icoon. De navigatie-lib blijft puur
// (bewaart alleen de icoonnaam); dit is de enige plek die er een component van
// maakt. Zelfde patroon als `components/pijlers/iconen.ts`.
import type { LucideIcon } from 'lucide-react'
import { Smile, Dumbbell, Droplet, Moon, Wind, Heart } from 'lucide-react'
import type { ActiviteitKey } from '@/lib/navigatie/activiteiten'

export const ACTIVITEIT_ICOON: Record<ActiviteitKey, LucideIcon> = {
  stemming: Smile,
  sport: Dumbbell,
  water: Droplet,
  slaap: Moon,
  meditatie: Wind,
  dankbaarheid: Heart,
}
