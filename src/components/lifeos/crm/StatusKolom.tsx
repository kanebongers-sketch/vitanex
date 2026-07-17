'use client'

import { type DragEvent } from 'react'
import type { Groep, Persoon, StatusDef } from '@/lib/lifeos/crm/crm'
import { PersoonTegel } from './PersoonTegel'

// Eén status-kolom = één dropzone. De `tint` van de status stuurt het kopaccent:
// `actie` krijgt het cyaan-accent (dit vraagt iets van je), de rest blijft
// neutraal/gedempt — geen regenboog. De lijst scrollt verticaal binnen zichzelf.
//
// "Welke kolom is de dropzone" (`over`) woont in `GroepBord`, niet hier: zo blijft
// er nooit een highlight hangen als een drop op een tegel de kolom-drop overslaat.

interface StatusKolomProps {
  status: StatusDef
  groep: Groep
  /** Al gefilterd + gesorteerd op deze status (zie `kolomVan`). */
  personen: Persoon[]
  vandaag: Date | null
  sleepId: string | null
  over: boolean
  bordLeeg: boolean
  onOpen: (persoon: Persoon) => void
  onKies: (persoon: Persoon, status: string) => void
  onBeginSleep: (persoon: Persoon) => void
  onEindSleep: () => void
  onOver: () => void
  /** Drop op de kolom zelf: achteraan deze status zetten. */
  onDropOpKolom: (status: string) => void
  /** Drop op een tegel: vóór die tegel invoegen. */
  onDropOpTegel: (doel: Persoon) => void
}

export function StatusKolom({
  status,
  groep,
  personen,
  vandaag,
  sleepId,
  over,
  bordLeeg,
  onOpen,
  onKies,
  onBeginSleep,
  onEindSleep,
  onOver,
  onDropOpKolom,
  onDropOpTegel,
}: StatusKolomProps) {
  function opDrop(e: DragEvent) {
    e.preventDefault()
    onDropOpKolom(status.key)
  }

  // Alleen de begin-kolom draagt de bord-brede lege hint; de andere kolommen
  // krijgen een rustige "sleep hier"-tekst zodat de dropzone leesbaar blijft.
  const toonBordLeeg = bordLeeg && status.volgorde === 0

  return (
    // role="group" (geen landmark, geen kop-niveau): zo hangt de kolom niet af
    // van welke koppen de omliggende route boven het bord heeft.
    <section
      className={`os-crm__kolom os-crm__kolom--${status.tint}${over ? ' os-crm__kolom--over' : ''}`}
      role="group"
      aria-label={`${status.label}, ${personen.length} ${personen.length === 1 ? 'persoon' : 'personen'}`}
      onDragOver={(e) => {
        e.preventDefault()
        onOver()
      }}
      onDrop={opDrop}
    >
      <header className="os-crm__kolom-kop">
        <span className="os-crm__kolom-titel">{status.label}</span>
        <span className="os-crm__kolom-telling os-cijfer">{personen.length}</span>
      </header>

      <ul className="os-crm__kolom-lijst" role="list">
        {personen.map((p) => (
          <PersoonTegel
            key={p.id}
            persoon={p}
            groep={groep}
            vandaag={vandaag}
            sleept={p.id === sleepId}
            onOpen={() => onOpen(p)}
            onKies={(nieuweStatus) => onKies(p, nieuweStatus)}
            onBeginSleep={() => onBeginSleep(p)}
            onEindSleep={onEindSleep}
            onDropHier={() => onDropOpTegel(p)}
          />
        ))}

        {personen.length === 0 ? (
          <li className="os-crm__kolom-leeg">
            {toonBordLeeg
              ? 'Nog geen mensen in deze groep — voeg je eerste toe.'
              : 'Sleep of kies iemand hierheen.'}
          </li>
        ) : null}
      </ul>
    </section>
  )
}
