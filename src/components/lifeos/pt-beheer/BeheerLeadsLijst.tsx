'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import type { Lead } from '@/lib/lifeos/leads/leads'
import { LeadFormulier } from '@/components/lifeos/pt-dashboard/LeadFormulier'
import { LeadKaart } from '@/components/lifeos/pt-dashboard/LeadKaart'

// De leads van het hele team, bewerkbaar voor de beheerder: invullen bij een
// gekozen trainer, bijwerken, naar een andere trainer verplaatsen, verwijderen.
// Na elke wijziging haalt de server de lijst opnieuw op.

interface Props {
  code: string
  vandaag: string
  items: readonly { lead: Lead; trainerId: string }[]
  trainers: readonly { id: string; naam: string }[]
  standaardTrainer: string
  toonTrainer: boolean
}

export function BeheerLeadsLijst({ code, vandaag, items, trainers, standaardTrainer, toonTrainer }: Props) {
  const router = useRouter()
  const [nieuw, setNieuw] = useState(false)
  const [bewerk, setBewerk] = useState<string | null>(null)
  const naamVan = new Map(trainers.map((t) => [t.id, t.naam]))
  const klaar = () => {
    setNieuw(false)
    setBewerk(null)
    router.refresh()
  }

  return (
    <>
      {nieuw ? (
        <LeadFormulier code={code} vandaag={vandaag} standaardClub={null} trainers={trainers} trainerId={standaardTrainer} onOpgeslagen={klaar} onAnnuleer={() => setNieuw(false)} />
      ) : (
        <div className="ptd-acties">
          <button type="button" className="ptd-knop ptd-knop--primair" onClick={() => setNieuw(true)}>
            <Plus size={18} aria-hidden /> Lead invullen
          </button>
        </div>
      )}
      {items.length === 0 ? (
        <p className="ptd-leeg">Geen leads in deze selectie.</p>
      ) : (
        <ul className="ptd-lijst">
          {items.map(({ lead, trainerId }) =>
            bewerk === lead.id ? (
              <li key={lead.id}>
                <LeadFormulier
                  code={code}
                  vandaag={vandaag}
                  standaardClub={lead.club}
                  lead={lead}
                  trainers={trainers}
                  trainerId={trainerId}
                  onOpgeslagen={klaar}
                  onVerwijderd={klaar}
                  onAnnuleer={() => setBewerk(null)}
                />
              </li>
            ) : (
              <LeadKaart
                key={lead.id}
                lead={lead}
                vandaag={vandaag}
                trainer={toonTrainer ? naamVan.get(trainerId) : undefined}
                onBewerk={() => setBewerk(lead.id)}
              />
            ),
          )}
        </ul>
      )}
    </>
  )
}
