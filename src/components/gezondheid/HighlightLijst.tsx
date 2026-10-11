// Highlights als redactionele zinnen, elk met een link naar de metriek.

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { metriekLabel } from '@/lib/health/gezondheid-metrics'
import type { Highlight } from '@/lib/gezondheid/highlights'
import { useTaalset } from './useTaalset'
import styles from './gezondheid.module.css'

interface HighlightLijstProps {
  highlights: readonly Highlight[]
  /** Zonder link: op de detailpagina staat de highlight al bij zijn metriek. */
  metLink?: boolean
}

export function HighlightLijst({ highlights, metLink = true }: HighlightLijstProps) {
  const ts = useTaalset()
  return (
    <ul className={styles.highlights}>
      {highlights.map((h) => (
        <li key={h.sleutel}>
          {metLink ? (
            <Link href={`/gezondheid/${h.sleutel}`} className={styles.highlight}>
              <p className={styles.highlightTekst}>{h.tekst}</p>
              <span className={styles.highlightMeta}>
                {ts.t('lichaam.highlight.bekijken', { label: metriekLabel(h.sleutel, ts) })}
                <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <div className={styles.highlight}>
              <p className={styles.highlightTekst}>{h.tekst}</p>
              <span className={styles.highlightMeta}>
                {ts.t('lichaam.highlight.onderbouwing', { recent: h.recentAantal, normaal: h.normaalAantal })}
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
