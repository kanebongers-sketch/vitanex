'use client' // Error boundaries moeten Client Components zijn (Next 16)

import Link from 'next/link'
import { useEffect } from 'react'
import '@/components/club/training/training.css'

// Een fout in Training (lijst, intake of editor): een rustige melding in de stijl
// van Club, zonder interne details. Next geeft afhankelijk van de versie
// unstable_retry, retry of reset mee; we gebruiken wat er is.

interface FoutProps {
  error: Error & { digest?: string }
  unstable_retry?: () => void
  retry?: () => void
  reset?: () => void
}

export default function TrainingFout({ error, unstable_retry, retry, reset }: FoutProps) {
  useEffect(() => {
    console.error('[club/training]', error.digest ?? error.message)
  }, [error])
  const opnieuw = unstable_retry ?? retry ?? reset
  return (
    <section className="club-leeg club-training-leeg" role="alert">
      <p><strong>Training kon niet worden geladen.</strong> Probeer het opnieuw. Blijft het misgaan, ververs dan de pagina.</p>
      <div className="club-acties">
        {opnieuw && <button type="button" className="club-knop club-knop--primair" onClick={() => opnieuw()}>Opnieuw proberen</button>}
        <Link className="club-knop" href="/club">Naar het overzicht</Link>
      </div>
    </section>
  )
}
