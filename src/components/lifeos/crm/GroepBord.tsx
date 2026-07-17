'use client'

import { useState } from 'react'
import { statussenVoorGroep, type Groep, type Persoon } from '@/lib/lifeos/crm/crm'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { useMensen } from './useMensen'
import { kolomVan, sorteringAanEinde, sorteringVoor } from './sortering'
import { StatusKolom } from './StatusKolom'
import { NieuwePersoon } from './NieuwePersoon'
import { PersoonPopup } from './PersoonPopup'

// De kanban van één groep. Bezit het slepen (welke tegel is opgepakt) en welke
// popup open staat; de data + de mutaties komen uit `useMensen`. Het bord scrollt
// horizontaal binnen zichzelf — de pagina zelf nooit (zie `.os-crm__bord`).

export function GroepBord({ groep }: { groep: Groep }) {
  const mensen = useMensen(groep)
  const statussen = statussenVoorGroep(groep)

  const [sleepId, setSleepId] = useState<string | null>(null)
  const [overStatus, setOverStatus] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  // "Vandaag" voor de follow-up-labels. Een lazy init (geen effect) is hier veilig:
  // het bord toont bij SSR/eerste render de skeleton — tegels (en dus follow-up-
  // tekst) verschijnen pas ná de client-fetch, dus er valt niets te mismatchen.
  const [vandaag] = useState<Date | null>(() => new Date())

  const personen = mensen.staat.fase === 'ok' ? mensen.staat.personen : []
  // Verdween de open persoon (verwijderd of van groep gewisseld)? Dan is `openPersoon`
  // vanzelf null en sluit de popup — geen effect nodig om `openId` op te ruimen.
  const openPersoon = personen.find((p) => p.id === openId) ?? null

  function dropOpKolom(status: string) {
    if (sleepId === null) return
    const p = personen.find((x) => x.id === sleepId)
    if (p === undefined) return

    const huidigeKolom = kolomVan(personen, status)
    // Al onderaan deze status? Dan is er niets te verplaatsen.
    if (p.status === status && huidigeKolom[huidigeKolom.length - 1]?.id === p.id) return

    const doelKolom = huidigeKolom.filter((x) => x.id !== p.id)
    void mensen.verplaats(p, status, sorteringAanEinde(doelKolom))
  }

  function dropOpTegel(doel: Persoon) {
    if (sleepId === null || sleepId === doel.id) return
    const p = personen.find((x) => x.id === sleepId)
    if (p === undefined) return

    const sortering = sorteringVoor(kolomVan(personen, doel.status), doel.id, p.id)
    if (sortering === null) return
    void mensen.verplaats(p, doel.status, sortering)
  }

  function kiesStatus(persoon: Persoon, status: string) {
    if (persoon.status === status) return
    const doelKolom = kolomVan(personen, status).filter((x) => x.id !== persoon.id)
    void mensen.verplaats(persoon, status, sorteringAanEinde(doelKolom))
  }

  // `dragend` op de opgepakte tegel vuurt na élke drop of annulering: hier ruimen
  // we het slepen op, inclusief de kolom-highlight (ook als de drop op een tegel
  // de kolom-drop oversloeg).
  function eindSleep() {
    setSleepId(null)
    setOverStatus(null)
  }

  if (mensen.staat.fase === 'laden') return <BordSkelet aantal={statussen.length} />
  if (mensen.staat.fase === 'fout') {
    return (
      <div className="os-crm__laadfout">
        <Foutmelding bericht={mensen.staat.bericht} opnieuw={mensen.opnieuw} />
      </div>
    )
  }

  const bordLeeg = personen.length === 0

  return (
    <div className="os-crm__groep">
      <NieuwePersoon groep={groep} bezig={mensen.bezig} onToevoegen={mensen.voegToe} />

      {mensen.actieFout ? (
        <div className="os-crm__actiefout">
          <Foutmelding bericht={mensen.actieFout} />
        </div>
      ) : null}

      <div className="os-crm__bord">
        {statussen.map((status) => (
          <StatusKolom
            key={status.key}
            status={status}
            groep={groep}
            personen={kolomVan(personen, status.key)}
            vandaag={vandaag}
            sleepId={sleepId}
            over={overStatus === status.key}
            bordLeeg={bordLeeg}
            onOpen={(p) => setOpenId(p.id)}
            onKies={kiesStatus}
            onBeginSleep={(p) => setSleepId(p.id)}
            onEindSleep={eindSleep}
            onOver={() => {
              if (overStatus !== status.key) setOverStatus(status.key)
            }}
            onDropOpKolom={dropOpKolom}
            onDropOpTegel={dropOpTegel}
          />
        ))}
      </div>

      {openPersoon ? (
        <PersoonPopup
          persoon={openPersoon}
          groep={groep}
          onSluit={() => setOpenId(null)}
          onWijzig={(wijziging) => mensen.wijzig(openPersoon, wijziging)}
          onContactGelegd={() => mensen.contactGelegd(openPersoon)}
          onVerwijder={() => mensen.verwijder(openPersoon)}
        />
      ) : null}
    </div>
  )
}

/** Rustige skeleton in navy — geen spinner-spektakel. */
function BordSkelet({ aantal }: { aantal: number }) {
  return (
    <div className="os-crm__bord" aria-hidden="true">
      {Array.from({ length: aantal }, (_, i) => (
        <div key={i} className="os-crm__kolom os-crm__kolom--skelet">
          <div className="os-crm__skelet-kop" />
          <div className="os-crm__skelet-tegel" />
          <div className="os-crm__skelet-tegel" />
        </div>
      ))}
    </div>
  )
}
