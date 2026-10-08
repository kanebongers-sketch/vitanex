'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { leesEigenaren, leesTeamOverzicht, type EigenaarRij, type TeamOverzicht } from '@/lib/lifeos/pt-dashboard/team-overzicht'
import { TeamOverzichtWeergave } from './TeamOverzichtWeergave'
import { ExportKnoppen } from './ExportKnoppen'
import { EigenaarToegang } from './EigenaarToegang'

// Container: Kane's blik op het hele PT-team — wat elke PT'er in zijn eigen
// dashboard (/<naam>) invulde, naast elkaar. Alleen-lezen.

type Data = TeamOverzicht & { eigenaren: EigenaarRij[] }
type Staat = { fase: 'laden' } | { fase: 'fout'; bericht: string } | { fase: 'ok'; data: Data }

function leesAntwoord(ruw: unknown): Data | null {
  const o = leesTeamOverzicht(ruw)
  return o ? { ...o, eigenaren: leesEigenaren(ruw) } : null
}

export function PtTeamOverzicht() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const laad = useCallback(
    (): Promise<void> =>
      haalJson('/api/lifeos/pt-team', leesAntwoord).then((uit) =>
        setStaat(uit.ok ? { fase: 'ok', data: uit.waarde } : { fase: 'fout', bericht: uit.fout }),
      ),
    [],
  )
  useEffect(() => {
    void laad()
  }, [laad])

  if (staat.fase === 'laden') return <p className="ptd-hint">Laden…</p>
  if (staat.fase === 'fout') return <Foutmelding bericht={staat.bericht} opnieuw={() => void laad()} />
  return (
    <div className="ptd ptd--ingebed">
      <TeamOverzichtWeergave data={staat.data} ptHref="/lifeos/pt-team" toonPin>
        <ExportKnoppen />
        <div className="ptd-acties"><Link className="ptd-knop ptd-knop--klein" href="/lifeos/pt-team/documenten">PT-documenten beheren</Link></div>
        <p className="ptd-hint">
          Een 0 betekent: niets ingevuld in het dashboard — niet per se niets gedaan. Pincodes keur je goed op het dashboard bij
          PT-gesprekken.
        </p>
      </TeamOverzichtWeergave>
      <EigenaarToegang eigenaren={staat.data.eigenaren} onVernieuw={laad} />
    </div>
  )
}
