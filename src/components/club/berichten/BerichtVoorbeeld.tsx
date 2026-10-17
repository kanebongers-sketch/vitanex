'use client'

import { BellOff } from 'lucide-react'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { berichtStatus } from '@/lib/club/berichten/regels'
import { lokaalNaarDatum, vensterTekst } from '@/lib/club/berichten/tijd'
import { doelgroepTekst } from '@/lib/club/berichten/weergave'
import { BerichtAppKaart } from './BerichtAppKaart'
import type { Concept } from './concept'

// Live voorbeeld: het bericht precies zoals het in de ledenapp op Home staat,
// met daaronder voor wie en wanneer.

interface Props {
  concept: Concept
  vestigingen: readonly VestigingInfo[]
  nu: Date
}

export function BerichtVoorbeeld({ concept, vestigingen, nu }: Props) {
  const van = (concept.van ? lokaalNaarDatum(concept.van) : nu) ?? nu
  const tot = concept.tot ? lokaalNaarDatum(concept.tot) : null
  const vanIso = van.toISOString()
  const totIso = tot ? tot.toISOString() : null
  const status = berichtStatus({ zichtbaarVan: vanIso, zichtbaarTot: totIso }, nu)
  const bericht = {
    titel: concept.titel.trim() || 'Titel van je bericht',
    tekst: concept.tekst.trim() || 'Hier komt de tekst. Laat een regel leeg voor een nieuwe alinea en begin een regel met "- " voor een opsomming.',
    soort: concept.soort,
    vastgepind: concept.vastgepind,
    zichtbaarVan: status === 'gepland' ? nu.toISOString() : vanIso,
  }
  const doelgroep = { vestigingen: concept.vestigingen, statussen: concept.statussen, tag: concept.tag.trim() || null }
  return (
    <aside className="club-bericht-voorbeeld" aria-label="Voorbeeld in de ledenapp">
      <p className="club-label">Zo staat het in de app</p>
      <div className="club-bericht-scherm">
        <p className="club-bericht-scherm-kop">Nieuws</p>
        <BerichtAppKaart bericht={bericht} groot={concept.vastgepind} nu={nu} />
        {!concept.vastgepind && <p className="club-hint">Vastgepind staat het groot en open bovenaan Home.</p>}
      </div>
      <dl className="club-bericht-feiten">
        <div>
          <dt>Voor</dt>
          <dd>{doelgroepTekst(doelgroep, vestigingen)}</dd>
        </div>
        <div>
          <dt>Zichtbaar</dt>
          <dd>{vensterTekst(vanIso, totIso, nu)}</dd>
        </div>
        <div>
          <dt>Pushmeldingen</dt>
          <dd className="club-bericht-later">
            <BellOff aria-hidden size={14} /> Komt later. Het bericht staat alleen in de app, er wordt niets verstuurd.
          </dd>
        </div>
      </dl>
    </aside>
  )
}
