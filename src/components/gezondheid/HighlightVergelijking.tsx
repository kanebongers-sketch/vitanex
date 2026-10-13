// Afgelopen week naast je normaal, onder een highlight. De waarden staan als
// tekst in een <dl>; de staven zijn alleen visueel (aria-hidden).

import { formatMetWaarde } from '@/lib/health/gezondheid-metrics'
import type { Highlight } from '@/lib/gezondheid/highlights'
import { heeftStaven, staafAandelen } from '@/lib/gezondheid/vergelijking'
import styles from './gezondheid.module.css'

interface HighlightVergelijkingProps {
  highlight: Highlight
}

export function HighlightVergelijking({ highlight }: HighlightVergelijkingProps) {
  const { sleutel, recentGemiddelde, normaal } = highlight
  const aandelen = heeftStaven(sleutel) ? staafAandelen(recentGemiddelde, normaal) : null
  const rijen = [
    { label: 'Afgelopen 7 dagen', waarde: recentGemiddelde, aandeel: aandelen?.recent, recent: true },
    { label: 'Je normaal', waarde: normaal, aandeel: aandelen?.normaal, recent: false },
  ]

  return (
    <dl className={styles.vergelijking}>
      {rijen.map((r) => (
        <div key={r.label} className={styles.vergelijkingRij}>
          <dt className={styles.vergelijkingLabel}>{r.label}</dt>
          <dd className={styles.vergelijkingWaarde}>{formatMetWaarde(sleutel, r.waarde)}</dd>
          {r.aandeel !== undefined && (
            <span className={styles.vergelijkingBaan} aria-hidden="true">
              <span
                className={r.recent ? styles.vergelijkingStaafRecent : styles.vergelijkingStaaf}
                style={{ transform: `scaleX(${r.aandeel})` }}
              />
            </span>
          )}
        </div>
      ))}
    </dl>
  )
}
