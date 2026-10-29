'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import type { LidgeldStand } from '@/lib/club/betalen/plannen/toegang'
import { LidgeldMelding } from './LidgeldMelding'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

// Lidgeld aan of uit voor de sportschool (alleen Kane en de eigenaar zien deze
// pagina). Aan = prijs en contract bij de lidmaatschappen en kortingen worden
// zichtbaar. Schaduwmodus blijft aan: er wordt dan nog niets geincasseerd.

interface Props {
  stand: LidgeldStand
}

export function LidgeldKaart({ stand }: Props) {
  const router = useRouter()
  const [bezig, start] = useTransition()
  const [fout, setFout] = useState<string | null>(null)
  const t = useTekst(BETALEN).lidgeld

  function schakel(aan: boolean) {
    start(async () => {
      setFout(null)
      const uit = await stuur('/api/club/betalen/lidgeld', 'PATCH', { lidgeldAan: aan })
      if (!uit.ok) return setFout(uit.fout)
      router.refresh()
    })
  }

  return (
    <section className="club-lidgeld" aria-labelledby="betalen-lidgeld-kop">
      <h2 id="betalen-lidgeld-kop" className="club-betalen-kop">{t.titel}</h2>
      <div className="club-lidgeld-rij">
        <div>
          <strong>{t.kop}</strong>
          <p>{t.uitleg}</p>
        </div>
        <label className="club-lidgeld-schakel">
          <input type="checkbox" role="switch" checked={stand.lidgeldAan} disabled={bezig} onChange={(e) => schakel(e.target.checked)} aria-describedby="betalen-lidgeld-uitleg" />
          {t.aan}
        </label>
      </div>
      <p id="betalen-lidgeld-uitleg" className="club-sr">{t.alleenEigenaar}</p>
      <LidgeldMelding schaduw={stand.schaduw} incassoAan={stand.incassoAan} alleenKane={false} />
      {stand.lidgeldAan && (
        <>
          <p className="club-hint">
            {t.gaNaar} <Link href="/club/beheer/lidmaatschappen">{t.lidmaatschappen}</Link> {t.voorPlannen}{' '}
            <Link href="/club/beheer/lidmaatschappen/kortingen">{t.kortingen}</Link>.
          </p>
        </>
      )}
      <div aria-live="assertive">{fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}</div>
    </section>
  )
}
