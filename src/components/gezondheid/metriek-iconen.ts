import {
  Activity, BedDouble, Building2, Droplet, Dumbbell, Flame, Footprints, Gauge, HeartPulse,
  Moon, Route, Scale, Sunrise, Timer, Wind, type LucideIcon,
} from 'lucide-react'
import type { MetriekSleutel } from '@/lib/gezondheid/types'

export const METRIEK_ICONEN: Record<MetriekSleutel, LucideIcon> = {
  stappen: Footprints,
  afstand: Route,
  'actieve-kcal': Flame,
  beweegminuten: Timer,
  verdiepingen: Building2,
  workouts: Dumbbell,
  slaap: Moon,
  bedtijd: BedDouble,
  wektijd: Sunrise,
  rusthartslag: HeartPulse,
  hrv: Activity,
  vo2max: Gauge,
  gewicht: Scale,
  ademhaling: Wind,
  zuurstof: Droplet,
}
