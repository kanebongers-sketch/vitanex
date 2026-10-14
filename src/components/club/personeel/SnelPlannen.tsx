'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Printer, Repeat } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { API, getalUit, stuur, useActie } from './vraag'

// Snel plannen: vorige week kopieren (aanvullen of vervangen), een vast
// patroon kiezen en de week printen voor op het prikbord.

interface Props {
  vestiging: Vestiging
  maandag: string
  patroonHref: string
}

export function SnelPlannen({ vestiging, maandag, patroonHref }: Props) {
  const { bezig, fout, voerUit } = useActie()
  const [kiezen, setKiezen] = useState(false)
  const [klaar, setKlaar] = useState<string | null>(null)

  async function kopieer(vervang: boolean) {
    setKlaar(null)
    await voerUit(
      () => stuur(`${API}/kopieer`, 'POST', { vestiging, maandag, vervang }),
      (data) => {
        const n = getalUit(data, 'toegevoegd') ?? 0
        setKlaar(n === 0 ? 'Alles van vorige week stond er al.' : `${n} diensten van vorige week gezet.`)
        setKiezen(false)
      },
    )
  }

  return (
    <div className="club-personeel-snel">
      <div className="club-acties">
        {kiezen ? (
          <span className="club-personeel-keuze" role="group" aria-label="Vorige week kopieren">
            <button type="button" className="club-knop club-knop--klein club-knop--primair" disabled={bezig} onClick={() => kopieer(false)}>
              Aanvullen
            </button>
            <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => kopieer(true)}>
              Vervangen
            </button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setKiezen(false)}>
              Annuleer
            </button>
          </span>
        ) : (
          <button type="button" className="club-knop club-knop--klein" onClick={() => setKiezen(true)}>
            <Copy aria-hidden size={14} /> Kopieer vorige week
          </button>
        )}
        <Link className="club-knop club-knop--klein" href={patroonHref} scroll={false}>
          <Repeat aria-hidden size={14} /> Vast patroon
        </Link>
        <button type="button" className="club-knop club-knop--klein" onClick={() => window.print()}>
          <Printer aria-hidden size={14} /> Printen
        </button>
      </div>
      {kiezen && <p className="club-hint">Aanvullen zet alleen wat er nog niet staat. Vervangen haalt eerst de geplande diensten van deze week weg (diensten met uren blijven staan).</p>}
      {klaar && <p className="club-hint" role="status">{klaar}</p>}
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </div>
  )
}
