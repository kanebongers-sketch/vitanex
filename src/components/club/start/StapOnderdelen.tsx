'use client'

import { useState } from 'react'
import type { Module } from '@/lib/club/kern/organisatie'
import type { HuisstijlWaarden } from '@/components/club/huisstijl/HuisstijlPortaal'
import { ModulesBlok } from '@/components/club/huisstijl/ModulesBlok'
import { bewaarOrganisatie } from './StapHuisstijl'
import { StartVoet, type StartVoetProps } from './StartVoet'

// Stap 4: onderdelen aan of uit, met dezelfde schakelaars als het
// huisstijl-portaal. "Verder" slaat eerst op als er iets is veranderd.

interface StapOnderdelenProps {
  organisatie: HuisstijlWaarden
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

export function StapOnderdelen({ organisatie, voet }: StapOnderdelenProps) {
  const [uit, setUit] = useState<Module[]>(organisatie.uit)
  const [fout, setFout] = useState<string | null>(null)
  const gewijzigd = [...uit].sort().join() !== [...organisatie.uit].sort().join()

  async function voorVerder(): Promise<boolean> {
    if (!gewijzigd) return true
    const melding = await bewaarOrganisatie({ ...organisatie, uit })
    setFout(melding)
    return melding === null
  }

  return (
    <>
      <div className="club-start-smal">
        <ModulesBlok
          uit={uit}
          onWijzig={(nieuw) => {
            setFout(null)
            setUit(nieuw)
          }}
        />
        <p className="club-hint">Twijfel je? Laat het aan. Je zet een onderdeel later met een klik uit of aan in Huisstijl.</p>
        {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      </div>
      <StartVoet {...voet} voorVerder={voorVerder} primair={gewijzigd ? 'Opslaan en verder' : undefined} />
    </>
  )
}
