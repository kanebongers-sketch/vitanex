import { METRIEKEN, metriekEenheid } from '@/lib/health/gezondheid-metrics'
import type { MetriekSleutel } from '@/lib/gezondheid/types'
import { useTaalset } from './useTaalset'
import styles from './gezondheid.module.css'

interface MetriekWaardeProps {
  sleutel: MetriekSleutel
  waarde: number
  groot?: boolean
  as?: 'p' | 'span'
}

/** Groot getal met een rustige eenheid erachter. */
export function MetriekWaarde({ sleutel, waarde, groot = false, as: Element = 'p' }: MetriekWaardeProps) {
  const ts = useTaalset()
  const eenheid = metriekEenheid(sleutel, ts)
  return (
    <Element className={`${styles.waarde}${groot ? ` ${styles.waardeHero}` : ''}`}>
      {METRIEKEN[sleutel].formatteer(waarde, ts)}
      {eenheid && <span className={styles.eenheid}>{eenheid}</span>}
    </Element>
  )
}
