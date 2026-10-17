'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Regel } from '@/lib/club/automatisering/regels'
import { RegelKaart } from './RegelKaart'

// Alle zeven regels onder elkaar, met een gedeelde melding bovenaan.

interface Props {
  regels: readonly Regel[]
  medewerkers: readonly { id: string; naam: string }[]
  vestigingNaam: string
}

export function RegelsBeheer({ regels, medewerkers, vestigingNaam }: Props) {
  const router = useRouter()
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  function klaar(tekst: string, ok: boolean) {
    setMelding({ ok, tekst })
    if (ok) router.refresh()
  }

  return (
    <>
      <div role="status" aria-live="polite" className="club-opvolg-status">
        {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
      </div>
      <div className="club-auto-regels">
        {regels.map((r, i) => (
          <RegelKaart key={r.sleutel} regel={r} nummer={i + 1} medewerkers={medewerkers} vestigingNaam={vestigingNaam} onKlaar={klaar} />
        ))}
      </div>
    </>
  )
}
