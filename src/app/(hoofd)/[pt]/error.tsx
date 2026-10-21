'use client' // Error boundaries moeten Client Components zijn.

import Link from 'next/link'
import { useParams } from 'next/navigation'

// Onverwachte fout op een PT-pagina. De kopbalk en tabs (layout) blijven staan;
// hier een rustige NL-melding in de PT-stijl, zonder interne details (de digest
// staat in de server-logs). Next 16.3: de herstelfunctie heet `retry`.

export default function PtFout({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { pt } = useParams<{ pt: string }>()
  return (
    <section className="ptd-form ptd-smal" role="alert" aria-labelledby="pt-fout-kop">
      <h2 id="pt-fout-kop">Dit lukte even niet</h2>
      <p className="ptd-tekst">
        De pagina kon niet geladen worden. Probeer het opnieuw; blijft het misgaan, laat het Kane weten. Wat je eerder opsloeg, is niet
        verloren.
      </p>
      <div className="ptd-acties">
        <button type="button" className="ptd-knop ptd-knop--primair" onClick={() => retry()}>Opnieuw proberen</button>
        {pt ? <Link className="ptd-knop" href={`/${pt}`}>Naar het overzicht</Link> : null}
      </div>
    </section>
  )
}
