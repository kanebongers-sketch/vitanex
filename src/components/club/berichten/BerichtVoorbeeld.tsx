'use client'

import { BellOff } from 'lucide-react'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { berichtStatus } from '@/lib/club/berichten/regels'
import { lokaalNaarDatum, vensterTekst } from '@/lib/club/berichten/tijd'
import { doelgroepTekst } from '@/lib/club/berichten/weergave'
import { BerichtAppKaart } from './BerichtAppKaart'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BERICHTEN } from '@/lib/aiyourgym/taal/woorden/club/berichten'
import type { Concept } from './concept'

// Live voorbeeld: het bericht precies zoals het in de ledenapp op Home staat,
// met daaronder voor wie en wanneer.

interface Props {
  concept: Concept
  vestigingen: readonly VestigingInfo[]
  nu: Date
}

export function BerichtVoorbeeld({ concept, vestigingen, nu }: Props) {
  const taal = useTaal()
  const t = useTekst(BERICHTEN).voorbeeld
  const van = (concept.van ? lokaalNaarDatum(concept.van) : nu) ?? nu
  const tot = concept.tot ? lokaalNaarDatum(concept.tot) : null
  const vanIso = van.toISOString()
  const totIso = tot ? tot.toISOString() : null
  const status = berichtStatus({ zichtbaarVan: vanIso, zichtbaarTot: totIso }, nu)
  const bericht = {
    titel: concept.titel.trim() || t.titel,
    tekst: concept.tekst.trim() || t.tekst,
    soort: concept.soort,
    vastgepind: concept.vastgepind,
    zichtbaarVan: status === 'gepland' ? nu.toISOString() : vanIso,
  }
  const doelgroep = { vestigingen: concept.vestigingen, statussen: concept.statussen, tag: concept.tag.trim() || null }
  return (
    <aside className="club-bericht-voorbeeld" aria-label={t.label}>
      <p className="club-label">{t.zoInDeApp}</p>
      <div className="club-bericht-scherm">
        <p className="club-bericht-scherm-kop">{t.nieuws}</p>
        <BerichtAppKaart bericht={bericht} groot={concept.vastgepind} nu={nu} />
        {!concept.vastgepind && <p className="club-hint">{t.vastgepindHint}</p>}
      </div>
      <dl className="club-bericht-feiten">
        <div>
          <dt>{t.voor}</dt>
          <dd>{doelgroepTekst(doelgroep, vestigingen, taal)}</dd>
        </div>
        <div>
          <dt>{t.zichtbaar}</dt>
          <dd>{vensterTekst(vanIso, totIso, nu, taal)}</dd>
        </div>
        <div>
          <dt>{t.push}</dt>
          <dd className="club-bericht-later">
            <BellOff aria-hidden size={14} /> {t.pushLater}
          </dd>
        </div>
      </dl>
    </aside>
  )
}
