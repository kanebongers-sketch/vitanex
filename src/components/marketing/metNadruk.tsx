import type { CSSProperties, ReactNode } from 'react'

interface NadrukOpties {
  className?: string
  style?: CSSProperties
}

/**
 * Zet een vertaalde tekst met *sterretjes* om in tekst met <em>-nadruk.
 * Zo houdt elke taal de nadruk op de juiste woorden, in de eigen zinsvolgorde:
 * "Train je *brein*." → Train je <em>brein</em>.
 */
export function metNadruk(tekst: string, { className, style }: NadrukOpties = {}): ReactNode[] {
  return tekst.split('*').map((deel, i) =>
    i % 2 === 1 ? (
      <em key={i} className={className} style={style}>
        {deel}
      </em>
    ) : (
      deel
    ),
  )
}
