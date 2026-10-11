// Recente trainingen zoals de bron ze doorgaf.

import { formatDuur } from '@/lib/health/gezondheid-metrics'
import { bronLabel } from '@/lib/gezondheid/samenvoegen'
import { relatieveDatum } from '@/lib/gezondheid/statistiek'
import type { Workout } from '@/lib/gezondheid/types'
import type { Taalset } from '@/lib/i18n/taalset'
import { useTaalset } from './useTaalset'
import styles from './gezondheid.module.css'

interface WorkoutLijstProps {
  workouts: readonly Workout[]
  vandaag: string
  max?: number
}

/** Bron-soort → sleutel in lichaam.workout.soort.* */
const SOORTEN: Record<string, string> = {
  running: 'hardlopen', walking: 'wandelen', cycling: 'fietsen', biking: 'fietsen',
  swimming: 'zwemmen', hiking: 'wandeltocht', yoga: 'yoga', rowing: 'roeien',
  strength_training: 'kracht', weightlifting: 'kracht',
  hiit: 'interval', high_intensity_interval_training: 'interval',
  elliptical: 'crosstrainer', pilates: 'pilates', dancing: 'dansen', other: 'training',
}

/** "STRENGTH_TRAINING" of "strength-training" → "Krachttraining"; onbekend → nette hoofdletter. */
function soortLabel(soort: string, ts: Taalset): string {
  const sleutel = soort.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (SOORTEN[sleutel]) return ts.t(`lichaam.workout.soort.${SOORTEN[sleutel]}`)
  const leesbaar = soort.replace(/[_-]+/g, ' ').trim()
  return leesbaar.charAt(0).toUpperCase() + leesbaar.slice(1).toLowerCase()
}

function meta(w: Workout, vandaag: string, ts: Taalset): string {
  const delen = [relatieveDatum(w.datum, vandaag, ts)]
  if (w.afstandM !== null && w.afstandM > 0) {
    delen.push(ts.t('lichaam.workout.km', { km: (w.afstandM / 1000).toLocaleString(ts.locale, { maximumFractionDigits: 1 }) }))
  }
  if (w.kcal !== null) delen.push(ts.t('lichaam.workout.kcal', { kcal: Math.round(w.kcal).toLocaleString(ts.locale) }))
  if (w.gemHartslag !== null) delen.push(ts.t('lichaam.workout.hartslag', { bpm: Math.round(w.gemHartslag) }))
  delen.push(bronLabel(w.bron, ts))
  return delen.join(' · ')
}

export function WorkoutLijst({ workouts, vandaag, max = 10 }: WorkoutLijstProps) {
  const ts = useTaalset()
  return (
    <section aria-labelledby="kop-workouts">
      <h2 id="kop-workouts" className={styles.blokTitel}>{ts.t('lichaam.workout.titel')}</h2>
      {workouts.length === 0 ? (
        <p className={styles.kleineTekst}>{ts.t('lichaam.workout.leeg')}</p>
      ) : (
        <ul className={styles.workouts}>
          {workouts.slice(0, max).map((w) => (
            <li key={w.id}>
              <span className={styles.workoutSoort}>{soortLabel(w.soort, ts)}</span>
              <span className={styles.workoutDuur}>{formatDuur(w.minuten, ts)}</span>
              <span className={styles.workoutMeta}>{meta(w, vandaag, ts)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
