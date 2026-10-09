import { METRIEKEN } from '@/lib/health/gezondheid-metrics'
import type { MetriekSleutel } from '@/lib/gezondheid/types'
import styles from './gezondheid.module.css'

interface MetriekWaardeProps {
  sleutel: MetriekSleutel
  waarde: number
  groot?: boolean
  as?: 'p' | 'span'
}

/** Groot getal met een rustige eenheid erachter. */
export function MetriekWaarde({ sleutel, waarde, groot = false, as: Element = 'p' }: MetriekWaardeProps) {
  const cfg = METRIEKEN[sleutel]
  return (
    <Element className={`${styles.waarde}${groot ? ` ${styles.waardeHero}` : ''}`}>
      {cfg.formatteer(waarde)}
      {cfg.eenheid && <span className={styles.eenheid}>{cfg.eenheid}</span>}
    </Element>
  )
}
