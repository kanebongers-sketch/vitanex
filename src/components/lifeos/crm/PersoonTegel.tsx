'use client'

import { type DragEvent } from 'react'
import { CalendarClock, Phone } from 'lucide-react'
import type { Groep, Persoon } from '@/lib/lifeos/crm/crm'
import { followUpLabel } from './followUp'
import { StatusKiezer } from './StatusKiezer'

// Eén persoon-tegel. Twee wegen om 'm te verplaatsen:
//   • slepen (muis) — de tegel is `draggable`; de kolom is de dropzone.
//   • de statuskiezer (toetsenbord) — het verplichte a11y-alternatief.
// Klikken op de naam opent de popup met geschiedenis + bijzonderheden.
//
// De naam-knop en de kiezer zijn broers, niet genest: geen interactief element
// ín een ander (dat is invalide en breekt toetsenbordbediening).

interface PersoonTegelProps {
  persoon: Persoon
  groep: Groep
  vandaag: Date | null
  sleept: boolean
  onOpen: () => void
  onKies: (status: string) => void
  onBeginSleep: () => void
  onEindSleep: () => void
  /** Drop ván een andere tegel óp deze tegel: ervoor invoegen. */
  onDropHier: () => void
}

export function PersoonTegel({
  persoon,
  groep,
  vandaag,
  sleept,
  onOpen,
  onKies,
  onBeginSleep,
  onEindSleep,
  onDropHier,
}: PersoonTegelProps) {
  const followUp = persoon.followUpDatum ? followUpLabel(persoon.followUpDatum, vandaag) : null

  function opSleepStart(e: DragEvent) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', persoon.id)
    onBeginSleep()
  }

  function opDrop(e: DragEvent) {
    e.preventDefault()
    // Niet doorborrelen naar de kolom: een drop óp een tegel voegt vóór die tegel
    // in, een drop op de kolom zet achteraan. Zonder stop zou beide vuren.
    e.stopPropagation()
    onDropHier()
  }

  return (
    <li
      className={`os-crm__tegel${sleept ? ' os-crm__tegel--sleept' : ''}`}
      draggable
      aria-grabbed={sleept}
      onDragStart={opSleepStart}
      onDragEnd={onEindSleep}
      onDragOver={(e) => e.preventDefault()}
      onDrop={opDrop}
    >
      <button type="button" className="os-crm__tegel-open" onClick={onOpen}>
        <span className="os-crm__tegel-naam">{persoon.naam}</span>
        <span className="os-crm__tegel-chips">
          {followUp ? (
            <span className={`os-crm__chip${followUp.dringend ? ' os-crm__chip--dringend' : ''}`}>
              <CalendarClock size={12} strokeWidth={2.2} aria-hidden="true" />
              {followUp.tekst}
            </span>
          ) : null}
          {persoon.telefoon ? (
            <span className="os-crm__chip os-crm__chip--stil" aria-hidden="true">
              <Phone size={12} strokeWidth={2.2} />
            </span>
          ) : null}
        </span>
      </button>

      <div className="os-crm__tegel-voet">
        <StatusKiezer groep={groep} status={persoon.status} naam={persoon.naam} onKies={onKies} />
      </div>
    </li>
  )
}
