// Highlights als redactionele zinnen, elk met een link naar de metriek.

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { METRIEKEN } from '@/lib/health/gezondheid-metrics'
import type { Highlight } from '@/lib/gezondheid/highlights'
import styles from './gezondheid.module.css'

interface HighlightLijstProps {
  highlights: readonly Highlight[]
  /** Zonder link: op de detailpagina staat de highlight al bij zijn metriek. */
  metLink?: boolean
}

function Onderbouwing({ highlight }: { highlight: Highlight }) {
  return (
    <>
      {highlight.recentAantal} metingen, vergeleken met de mediaan van {highlight.normaalAantal} metingen daarvoor
    </>
  )
}

export function HighlightLijst({ highlights, metLink = true }: HighlightLijstProps) {
  return (
    <ul className={styles.highlights}>
      {highlights.map((h) => (
        <li key={h.sleutel}>
          {metLink ? (
            <Link href={`/gezondheid/${h.sleutel}`} className={styles.highlight}>
              <p className={styles.highlightTekst}>{h.tekst}</p>
              <span className={styles.highlightMeta}>
                {METRIEKEN[h.sleutel].label} bekijken
                <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <div className={styles.highlight}>
              <p className={styles.highlightTekst}>{h.tekst}</p>
              <span className={styles.highlightMeta}><Onderbouwing highlight={h} /></span>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
