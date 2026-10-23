'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import type { LidgeldStand } from '@/lib/club/betalen/plannen/toegang'
import { LidgeldMelding } from './LidgeldMelding'

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
      <h2 id="betalen-lidgeld-kop" className="club-betalen-kop">Lidgeld</h2>
      <div className="club-lidgeld-rij">
        <div>
          <strong>Lidmaatschappen met prijs en contract</strong>
          <p>
            Met lidgeld aan stel je per lidmaatschapsvorm plannen in, met prijs, looptijd en opzegtermijn, plus kortingen en acties. Leden afrekenen en
            incasso komen in volgende stappen.
          </p>
        </div>
        <label className="club-lidgeld-schakel">
          <input type="checkbox" role="switch" checked={stand.lidgeldAan} disabled={bezig} onChange={(e) => schakel(e.target.checked)} aria-describedby="betalen-lidgeld-uitleg" />
          Lidgeld aan
        </label>
      </div>
      <p id="betalen-lidgeld-uitleg" className="club-sr">Alleen de eigenaar kan lidgeld aan of uit zetten.</p>
      <LidgeldMelding schaduw={stand.schaduw} incassoAan={stand.incassoAan} alleenKane={false} />
      {stand.lidgeldAan && (
        <>
          <p className="club-hint">
            Ga naar <Link href="/club/beheer/lidmaatschappen">Lidmaatschappen</Link> voor de plannen of naar{' '}
            <Link href="/club/beheer/lidmaatschappen/kortingen">Kortingen en acties</Link>.
          </p>
        </>
      )}
      <div aria-live="assertive">{fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}</div>
    </section>
  )
}
