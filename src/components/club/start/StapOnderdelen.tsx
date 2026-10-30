'use client'

import { useState } from 'react'
import type { Module } from '@/lib/club/kern/organisatie'
import type { PakketSleutel } from '@/lib/club/kern/pakketten'
import type { HuisstijlWaarden } from '@/components/club/huisstijl/HuisstijlPortaal'
import { ModulesBlok } from '@/components/club/huisstijl/ModulesBlok'
import { bewaarOrganisatie } from './StapHuisstijl'
import { StartVoet, type StartVoetProps } from './StartVoet'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Stap Onderdelen: aan of uit, met meteen de schakelaars (dezelfde als in
// het huisstijl-portaal). Er staat alleen aan wat bij de afgenomen pakketten
// hoort; de eigenaar kiest zelf wat uit gaat (niets op basis van een soort).
// "Verder" slaat eerst op als er iets is veranderd.

interface StapOnderdelenProps {
  organisatie: HuisstijlWaarden
  /** De afgenomen pakketten: alleen die onderdelen staan in deze stap. */
  afgenomen: readonly PakketSleutel[]
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

export function StapOnderdelen({ organisatie, afgenomen, voet }: StapOnderdelenProps) {
  const [uit, setUit] = useState<Module[]>(organisatie.uit)
  const [fout, setFout] = useState<string | null>(null)
  const t = useTekst(START)
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
          afgenomen={afgenomen}
          onWijzig={(nieuw) => {
            setFout(null)
            setUit(nieuw)
          }}
        />
        <p className="club-hint">{t.onderdelen.twijfel}</p>
        {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      </div>
      <StartVoet {...voet} voorVerder={voorVerder} primair={gewijzigd ? t.voet.opslaanVerder : undefined} />
    </>
  )
}
