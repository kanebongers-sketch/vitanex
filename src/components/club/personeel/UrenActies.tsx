'use client'

import { useState } from 'react'
import { CheckCheck, Lock } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { API, getalUit, stuur, useActie } from './vraag'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

// Alles goedkeuren (alleen gewerkte diensten zonder afwijking) en goedgekeurde
// uren als verwerkt markeren. Verwerken vraagt een tweede klik: daarna zit de
// dienst op slot.

interface Props {
  vestiging: Vestiging
  van: string
  tot: string
  klaarVoorGoedkeuren: number
  afwijkingen: number
  teVerwerken: number
}

export function UrenActies({ vestiging, van, tot, klaarVoorGoedkeuren, afwijkingen, teVerwerken }: Props) {
  const { bezig, fout, voerUit } = useActie()
  const [melding, setMelding] = useState<string | null>(null)
  const [zeker, setZeker] = useState(false)
  const alles = useTekst(PERSONEEL)
  const tk = alles.urenActies

  function doe(actie: 'goedkeuren' | 'verwerken') {
    setMelding(null)
    void voerUit(
      () => stuur(`${API}/uren`, 'POST', { vestiging, actie, van, tot }),
      (data) => {
        const n = getalUit(data, 'aantal') ?? 0
        setMelding(actie === 'goedkeuren' ? tk.goedgekeurd(n) : tk.verwerkt(n))
        setZeker(false)
      },
    )
  }

  return (
    <section className="club-personeel-urenacties" aria-label={tk.label}>
      <button type="button" className="club-knop club-knop--primair" disabled={bezig || klaarVoorGoedkeuren === 0} onClick={() => doe('goedkeuren')}>
        <CheckCheck aria-hidden size={16} /> {tk.alles(klaarVoorGoedkeuren)}
      </button>
      {zeker ? (
        <span className="club-personeel-keuze" role="group" aria-label={tk.bevestigen}>
          <button type="button" className="club-knop" disabled={bezig} onClick={() => doe('verwerken')}>
            {tk.jaVerwerken(teVerwerken)}
          </button>
          <button type="button" className="club-knop club-knop--stil" onClick={() => setZeker(false)}>
            {alles.algemeen.tochNiet}
          </button>
        </span>
      ) : (
        <button type="button" className="club-knop" disabled={bezig || teVerwerken === 0} onClick={() => setZeker(true)}>
          <Lock aria-hidden size={15} /> {tk.markeer(teVerwerken)}
        </button>
      )}
      <p className="club-hint">
        {afwijkingen > 0 ? tk.metAfwijkingen(afwijkingen) : tk.zonderAfwijkingen}
      </p>
      {melding && <p className="club-hint" role="status">{melding}</p>}
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </section>
  )
}
