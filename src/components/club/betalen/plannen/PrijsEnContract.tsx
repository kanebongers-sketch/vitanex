'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { PlanWeergave } from '@/lib/club/betalen/plannen/weergave'
import { PlanFormulier } from './PlanFormulier'
import { PlanKaart } from './PlanKaart'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

// Het blok "Prijs en contract" onder een lidmaatschapsvorm: de plannen
// (bijvoorbeeld "12 maanden" en "Flex") met prijs, contract en voorbeeld, en
// meteen een plan toevoegen. Alleen zichtbaar als lidgeld aan staat.

interface Props {
  vormId: string
  vormNaam: string
  plannen: readonly PlanWeergave[]
  vandaag: string
  onKlaar: (tekst: string, ok?: boolean) => void
}

export function PrijsEnContract({ vormId, vormNaam, plannen, vandaag, onKlaar }: Props) {
  const [nieuw, setNieuw] = useState(false)
  const kopId = `plannen-${vormId}`
  const t = useTekst(BETALEN).prijsContract
  return (
    <section className="club-plannen" aria-labelledby={kopId}>
      <div className="club-plannen-kop">
        <h4 id={kopId}>{t.titel}</h4>
        {!nieuw && (
          <button type="button" className="club-knop club-knop--klein" onClick={() => setNieuw(true)}>
            <Plus size={15} aria-hidden /> {t.toevoegen}<span className="club-sr">{t.bij(vormNaam)}</span>
          </button>
        )}
      </div>
      {plannen.length === 0 && !nieuw && (
        <p className="club-plannen-leeg">{t.leeg}</p>
      )}
      {plannen.length > 0 && (
        <ul className="club-plannen-lijst">
          {plannen.map((p) => <PlanKaart key={p.id} plan={p} vormId={vormId} vandaag={vandaag} onKlaar={onKlaar} />)}
        </ul>
      )}
      {nieuw && (
        <div className="club-plan is-bewerken">
          <PlanFormulier vormId={vormId} vandaag={vandaag} onAnnuleer={() => setNieuw(false)} onKlaar={(t) => { setNieuw(false); onKlaar(t) }} />
        </div>
      )}
    </section>
  )
}
