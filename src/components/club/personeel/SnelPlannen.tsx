'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Printer, Repeat } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { API, getalUit, stuur, useActie } from './vraag'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

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
  const alles = useTekst(PERSONEEL)
  const tk = alles.snel

  async function kopieer(vervang: boolean) {
    setKlaar(null)
    await voerUit(
      () => stuur(`${API}/kopieer`, 'POST', { vestiging, maandag, vervang }),
      (data) => {
        const n = getalUit(data, 'toegevoegd') ?? 0
        setKlaar(n === 0 ? tk.alStond : tk.gezet(n))
        setKiezen(false)
      },
    )
  }

  return (
    <div className="club-personeel-snel">
      <div className="club-acties">
        {kiezen ? (
          <span className="club-personeel-keuze" role="group" aria-label={tk.kopieerVorige}>
            <button type="button" className="club-knop club-knop--klein club-knop--primair" disabled={bezig} onClick={() => kopieer(false)}>
              {tk.aanvullen}
            </button>
            <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => kopieer(true)}>
              {tk.vervangen}
            </button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setKiezen(false)}>
              {tk.annuleer}
            </button>
          </span>
        ) : (
          <button type="button" className="club-knop club-knop--klein" onClick={() => setKiezen(true)}>
            <Copy aria-hidden size={14} /> {tk.kopieer}
          </button>
        )}
        <Link className="club-knop club-knop--klein" href={patroonHref} scroll={false}>
          <Repeat aria-hidden size={14} /> {tk.vastPatroon}
        </Link>
        <button type="button" className="club-knop club-knop--klein" onClick={() => window.print()}>
          <Printer aria-hidden size={14} /> {alles.algemeen.printen}
        </button>
      </div>
      {kiezen && <p className="club-hint">{tk.uitleg}</p>}
      {klaar && <p className="club-hint" role="status">{klaar}</p>}
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </div>
  )
}
