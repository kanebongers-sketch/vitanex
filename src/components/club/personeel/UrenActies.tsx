'use client'

import { useState } from 'react'
import { CheckCheck, Lock } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { API, getalUit, stuur, useActie } from './vraag'

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

  function doe(actie: 'goedkeuren' | 'verwerken') {
    setMelding(null)
    void voerUit(
      () => stuur(`${API}/uren`, 'POST', { vestiging, actie, van, tot }),
      (data) => {
        const n = getalUit(data, 'aantal') ?? 0
        setMelding(actie === 'goedkeuren' ? `${n} diensten goedgekeurd.` : `${n} diensten gemarkeerd als verwerkt.`)
        setZeker(false)
      },
    )
  }

  return (
    <section className="club-personeel-urenacties" aria-label="Uren afhandelen">
      <button type="button" className="club-knop club-knop--primair" disabled={bezig || klaarVoorGoedkeuren === 0} onClick={() => doe('goedkeuren')}>
        <CheckCheck aria-hidden size={16} /> Alles goedkeuren ({klaarVoorGoedkeuren})
      </button>
      {zeker ? (
        <span className="club-personeel-keuze" role="group" aria-label="Verwerken bevestigen">
          <button type="button" className="club-knop" disabled={bezig} onClick={() => doe('verwerken')}>
            Ja, {teVerwerken} verwerken
          </button>
          <button type="button" className="club-knop club-knop--stil" onClick={() => setZeker(false)}>
            Toch niet
          </button>
        </span>
      ) : (
        <button type="button" className="club-knop" disabled={bezig || teVerwerken === 0} onClick={() => setZeker(true)}>
          <Lock aria-hidden size={15} /> Markeer als verwerkt ({teVerwerken})
        </button>
      )}
      <p className="club-hint">
        {afwijkingen > 0 ? `${afwijkingen} afwijkingen tellen niet mee bij alles goedkeuren: open ze en keur ze apart goed.` : 'Geen afwijkingen: alles wat gewerkt is kan in een keer goedgekeurd worden.'}
      </p>
      {melding && <p className="club-hint" role="status">{melding}</p>}
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </section>
  )
}
