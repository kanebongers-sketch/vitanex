// Recente trainingen zoals de bron ze doorgaf.

import { formatDuur } from '@/lib/health/gezondheid-metrics'
import { BRON_LABELS } from '@/lib/gezondheid/samenvoegen'
import { relatieveDatum } from '@/lib/gezondheid/statistiek'
import type { Workout } from '@/lib/gezondheid/types'
import styles from './gezondheid.module.css'

interface WorkoutLijstProps {
  workouts: readonly Workout[]
  vandaag: string
  max?: number
}

const SOORTEN: Record<string, string> = {
  running: 'Hardlopen', walking: 'Wandelen', cycling: 'Fietsen', biking: 'Fietsen',
  swimming: 'Zwemmen', hiking: 'Wandeltocht', yoga: 'Yoga', rowing: 'Roeien',
  strength_training: 'Krachttraining', weightlifting: 'Krachttraining',
  hiit: 'Intervaltraining', high_intensity_interval_training: 'Intervaltraining',
  elliptical: 'Crosstrainer', pilates: 'Pilates', dancing: 'Dansen', other: 'Training',
}

/** "STRENGTH_TRAINING" of "strength-training" → "Krachttraining"; onbekend → nette hoofdletter. */
function soortLabel(soort: string): string {
  const sleutel = soort.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (SOORTEN[sleutel]) return SOORTEN[sleutel]
  const leesbaar = soort.replace(/[_-]+/g, ' ').trim()
  return leesbaar.charAt(0).toUpperCase() + leesbaar.slice(1).toLowerCase()
}

function meta(w: Workout, vandaag: string): string {
  const delen = [relatieveDatum(w.datum, vandaag)]
  if (w.afstandM !== null && w.afstandM > 0) delen.push(`${(w.afstandM / 1000).toLocaleString('nl-NL', { maximumFractionDigits: 1 })} km`)
  if (w.kcal !== null) delen.push(`${Math.round(w.kcal).toLocaleString('nl-NL')} kcal`)
  if (w.gemHartslag !== null) delen.push(`gem. ${Math.round(w.gemHartslag)} slagen/min`)
  delen.push(BRON_LABELS[w.bron] ?? w.bron)
  return delen.join(' · ')
}

export function WorkoutLijst({ workouts, vandaag, max = 10 }: WorkoutLijstProps) {
  return (
    <section aria-labelledby="kop-workouts">
      <h2 id="kop-workouts" className={styles.blokTitel}>Recente trainingen</h2>
      {workouts.length === 0 ? (
        <p className={styles.kleineTekst}>Je bron gaf in deze periode geen trainingen door.</p>
      ) : (
        <ul className={styles.workouts}>
          {workouts.slice(0, max).map((w) => (
            <li key={w.id}>
              <span className={styles.workoutSoort}>{soortLabel(w.soort)}</span>
              <span className={styles.workoutDuur}>{formatDuur(w.minuten)}</span>
              <span className={styles.workoutMeta}>{meta(w, vandaag)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
