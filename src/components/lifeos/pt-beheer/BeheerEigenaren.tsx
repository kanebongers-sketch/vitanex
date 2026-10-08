'use client'

import { useCallback, useEffect, useState } from 'react'
import { haalJson } from '@/lib/lifeos/api/http'
import { leesEigenaren, type EigenaarRij } from '@/lib/lifeos/pt-dashboard/team-overzicht'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { EigenaarToegang } from '@/components/lifeos/pt-team/EigenaarToegang'

// Container: de eigenaren en hun pincode (goedkeuren, afwijzen, resetten).

type Staat = { fase: 'laden' } | { fase: 'fout'; bericht: string } | { fase: 'ok'; eigenaren: EigenaarRij[] }

export function BeheerEigenaren() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const laad = useCallback(
    (): Promise<void> =>
      haalJson('/api/lifeos/pt-app/eigenaren', (r) => leesEigenaren(r)).then((uit) =>
        setStaat(uit.ok ? { fase: 'ok', eigenaren: uit.waarde } : { fase: 'fout', bericht: uit.fout }),
      ),
    [],
  )
  useEffect(() => {
    void laad()
  }, [laad])

  if (staat.fase === 'laden') return <p className="ptd-hint">Eigenaren laden…</p>
  if (staat.fase === 'fout') return <Foutmelding bericht={staat.bericht} opnieuw={() => void laad()} />
  return <EigenaarToegang eigenaren={staat.eigenaren} onVernieuw={laad} />
}
