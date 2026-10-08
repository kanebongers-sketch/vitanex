'use client'

import { RefreshProvider } from '@/components/lifeos/os/RefreshContext'
import { PtKlantenKaart } from '@/components/lifeos/pt/PtKlantenKaart'
import { DocumentenBeheer } from '@/components/lifeos/pt-team/DocumentenBeheer'
import { ExportKnoppen } from '@/components/lifeos/pt-team/ExportKnoppen'
import { BeheerEigenaren } from './BeheerEigenaren'

// /<beheerder>/beheer — wat alleen Kane doet: zijn eigen PT-klanten inplannen,
// eigenaren toegang geven, de documenten voor het team en de export. Alles loopt
// via de LifeOS-API's achter de founder-gate (zijn hoofdaccount).

export function BeheerPaneel() {
  return (
    <RefreshProvider>
      <section className="ptd-sectie" aria-labelledby="beheer-klanten-kop">
        <div className="ptd-sectiekop">
          <h2 id="beheer-klanten-kop">Mijn PT-klanten</h2>
          <span>wie je deze week nog moet inplannen · klanten wijzig je onder Klanten, de planning loopt mee</span>
        </div>
        <PtKlantenKaart />
      </section>
      <BeheerEigenaren />
      <section className="ptd-sectie" aria-labelledby="beheer-docs-kop">
        <div className="ptd-sectiekop">
          <h2 id="beheer-docs-kop">Documenten voor het team</h2>
          <span>zichtbaar onder Kennis</span>
        </div>
        <DocumentenBeheer />
      </section>
      <section className="ptd-sectie" aria-labelledby="beheer-export-kop">
        <div className="ptd-sectiekop">
          <h2 id="beheer-export-kop">Export</h2>
          <span>leads en klanten als CSV</span>
        </div>
        <ExportKnoppen />
      </section>
    </RefreshProvider>
  )
}
