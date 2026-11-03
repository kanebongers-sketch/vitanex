'use client'

import type { Bericht } from '@/lib/club/berichten/model'
import { BerichtAppKaart, type FotoBron } from '@/components/club/berichten/BerichtAppKaart'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BERICHTEN } from '@/lib/aiyourgym/taal/woorden/club/berichten'
import '@/components/club/berichten/berichten.css'

// Berichten op Home in de ledenapp (EENVOUD-10-MINUTEN.md, hoofdstuk 5): alleen
// het nieuwste bericht (vastgepind gaat voor, zie haalBerichtenVoorLid), en
// "Alle berichten" klapt de rest open. Een <details>: werkt met toetsenbord en
// zonder JavaScript. Geen berichten = niets.

interface BerichtenOpHomeProps {
  berichten: readonly Bericht[]
  nu: Date
  fotoBron: FotoBron
  /** "Alle berichten (n)". */
  alleLabel: string
}

export function BerichtenOpHome({ berichten, nu, fotoBron, alleLabel }: BerichtenOpHomeProps) {
  const t = useTekst(BERICHTEN).app
  if (berichten.length === 0) return null
  const [eerste, ...rest] = berichten
  return (
    <section className="club-bericht-app-lijst" aria-labelledby="lidapp-berichten">
      <h2 id="lidapp-berichten" className="club-bericht-app-titel">
        {t.nieuws}
      </h2>
      <BerichtAppKaart bericht={eerste} groot={eerste.vastgepind} nu={nu} fotoBron={fotoBron} />
      {rest.length > 0 && (
        <details className="club-lidapp-alleberichten">
          <summary>{alleLabel}</summary>
          <div className="club-lidapp-alleberichten-lijst">
            {rest.map((b) => (
              <BerichtAppKaart key={b.id} bericht={b} groot={false} nu={nu} fotoBron={fotoBron} />
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
