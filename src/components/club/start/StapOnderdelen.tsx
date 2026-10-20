'use client'

import { useState } from 'react'
import { MODULES, MODULE_LABEL, type Module } from '@/lib/club/kern/organisatie'
import { onderdelenTekst } from '@/lib/club/start/soorten'
import type { HuisstijlWaarden } from '@/components/club/huisstijl/HuisstijlPortaal'
import { ModulesBlok } from '@/components/club/huisstijl/ModulesBlok'
import { bewaarOrganisatie } from './StapHuisstijl'
import { Klaargezet } from './Klaargezet'
import { StartVoet, type StartVoetProps } from './StartVoet'

// Stap 4: onderdelen aan of uit. Stonden ze al klaar (uit de soort), dan zie
// je bovenaan wat er aan staat met Klopt of Aanpassen; de schakelaars zijn
// dezelfde als in het huisstijl-portaal. "Verder" slaat eerst op als er iets
// is veranderd.

interface StapOnderdelenProps {
  organisatie: HuisstijlWaarden
  /** Waar de keuze vandaan komt ("Voor een PT-studio"), of null. */
  bron: string | null
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

export function StapOnderdelen({ organisatie, bron, voet }: StapOnderdelenProps) {
  const [uit, setUit] = useState<Module[]>(organisatie.uit)
  const [fout, setFout] = useState<string | null>(null)
  const gewijzigd = [...uit].sort().join() !== [...organisatie.uit].sort().join()

  async function voorVerder(): Promise<boolean> {
    if (!gewijzigd) return true
    const melding = await bewaarOrganisatie({ ...organisatie, uit })
    setFout(melding)
    return melding === null
  }

  const schakelaars = (
    <div className="club-start-smal">
      <ModulesBlok
        uit={uit}
        onWijzig={(nieuw) => {
          setFout(null)
          setUit(nieuw)
        }}
      />
      <p className="club-hint">Twijfel je? Laat het aan. Je zet een onderdeel later met een klik uit of aan.</p>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </div>
  )

  const aan = MODULES.filter((m) => !uit.includes(m)).map((m) => MODULE_LABEL[m].label)
  return (
    <>
      {bron ? (
        <Klaargezet
          bron={bron}
          gang={voet}
          voorVerder={voorVerder}
          regels={[
            { titel: 'Aan', tekst: aan.join(', ') },
            { titel: 'Samen', tekst: onderdelenTekst(uit) },
          ]}
        >
          {schakelaars}
        </Klaargezet>
      ) : (
        schakelaars
      )}
      <StartVoet {...voet} voorVerder={voorVerder} primair={gewijzigd ? 'Opslaan en verder' : undefined} />
    </>
  )
}
