'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Sluiting } from '@/lib/club/sluiting/model'
import { FeestdagenFormulier } from './FeestdagenFormulier'
import { JaarOverzicht } from './JaarOverzicht'
import { SluitingFormulier } from './SluitingFormulier'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SLUITING } from '@/lib/aiyourgym/taal/woorden/club/sluiting'

// Het werkvlak van de pagina: links het jaar per maand, rechts een losse dag
// toevoegen en de feestdagen in een keer. Na elke actie ververst de pagina.

interface Props {
  jaar: number
  vandaag: string
  sluitingen: readonly Sluiting[]
  geraakt: Readonly<Record<string, number>>
}

export function SluitingBeheer({ jaar, vandaag, sluitingen, geraakt }: Props) {
  const router = useRouter()
  const t = useTekst(SLUITING).beheer
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const klaar = (tekst: string, ok = true) => {
    setMelding({ ok, tekst })
    router.refresh()
  }
  const standaardDatum = vandaag.startsWith(String(jaar)) ? vandaag : `${jaar}-01-01`

  return (
    <>
      <div role="status" aria-live="polite" className="club-sluiting-status">
        {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
      </div>
      <div className="club-sluiting-werkvlak">
        <div className="club-sluiting-hoofd">
          <JaarOverzicht jaar={jaar} sluitingen={sluitingen} geraakt={geraakt} vandaag={vandaag} onKlaar={klaar} />
        </div>
        <aside className="club-sluiting-zij" aria-label={t.toevoegen}>
          <section className="club-kaart" aria-labelledby="sluiting-los">
            <h2 id="sluiting-los">{t.losseDag}</h2>
            <SluitingFormulier key={jaar} standaardDatum={standaardDatum} onKlaar={klaar} />
          </section>
          <section className="club-kaart" aria-labelledby="sluiting-feest">
            <h2 id="sluiting-feest">{t.feestdagen(jaar)}</h2>
            <p className="club-hint">{t.feestdagenUitleg}</p>
            <FeestdagenFormulier key={jaar} jaar={jaar} bestaande={sluitingen} onKlaar={klaar} />
          </section>
        </aside>
      </div>
    </>
  )
}
