'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import type { PtKlant } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { KlantFormulier } from '@/components/lifeos/pt-dashboard/KlantFormulier'
import { KlantKaart } from '@/components/lifeos/pt-dashboard/KlantKaart'

// De klanten van het hele team, bewerkbaar voor de beheerder: toevoegen bij een
// gekozen trainer, bijwerken, naar een andere trainer verplaatsen, verwijderen.
// Na elke wijziging haalt de server de lijst (en de cijfers) opnieuw op.

interface Props {
  code: string
  vandaag: string
  items: readonly { klant: PtKlant; trainerId: string }[]
  trainers: readonly { id: string; naam: string }[]
  /** Voor een nieuwe klant: de gefilterde PT'er, anders de beheerder zelf. */
  standaardTrainer: string
  /** Trainernaam op de kaart tonen (bij "Iedereen"). */
  toonTrainer: boolean
}

export function BeheerKlantenLijst({ code, vandaag, items, trainers, standaardTrainer, toonTrainer }: Props) {
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
        <KlantFormulier
          code={code}
          vandaag={vandaag}
          standaardClub={null}
          trainers={trainers}
          trainerId={standaardTrainer}
          onOpgeslagen={klaar}
          onAnnuleer={() => setNieuw(false)}
        />
      ) : (
        <div className="ptd-acties">
          <button type="button" className="ptd-knop ptd-knop--primair" onClick={() => setNieuw(true)}>
            <Plus size={18} aria-hidden /> Klant toevoegen
          </button>
        </div>
      )}
      {items.length === 0 ? (
        <p className="ptd-leeg">Geen klanten in deze selectie.</p>
      ) : (
        <ul className="ptd-lijst">
          {items.map(({ klant, trainerId }) =>
            bewerk === klant.id ? (
              <li key={klant.id}>
                <KlantFormulier
                  code={code}
                  vandaag={vandaag}
                  standaardClub={klant.club}
                  klant={klant}
                  trainers={trainers}
                  trainerId={trainerId}
                  onOpgeslagen={klaar}
                  onVerwijderd={klaar}
                  onAnnuleer={() => setBewerk(null)}
                />
              </li>
            ) : (
              <KlantKaart
                key={klant.id}
                klant={klant}
                vandaag={vandaag}
                toonPrijs
                trainer={toonTrainer ? naamVan.get(trainerId) : undefined}
                dossierHref={`/${code}/klanten/${klant.id}`}
                onBewerk={() => setBewerk(klant.id)}
              />
            ),
          )}
        </ul>
      )}
    </>
  )
}
