'use client'

import { type DragEvent } from 'react'
import { CalendarClock, Clock, GripVertical } from 'lucide-react'
import type { Groep, Persoon } from '@/lib/lifeos/crm/crm'
import { contactVersheid, type Versheid } from '@/lib/lifeos/crm/versheid'
import { followUpLabel, type FollowUp } from '@/components/lifeos/crm/followUp'
import { StatusKiezer } from '@/components/lifeos/crm/StatusKiezer'
import { Monogram } from './Monogram'
import { ContactActies } from './ContactActies'

// De premium persoon-kaart voor het CRM-bord. Twee wegen om 'm te verplaatsen,
// exact als de oude tegel: slepen (muis, de kaart is `draggable`) of de
// StatusKiezer (toetsenbord — het verplichte a11y-alternatief). De naam-knop
// opent de detail-popup.
//
// De naam-knop, de contact-links en de StatusKiezer zijn BROERS, nooit genest:
// geen interactief element ín een ander (dat is invalide HTML en breekt de
// toetsenbordbediening).

interface PersoonKaartProps {
  persoon: Persoon
  groep: Groep
  vandaag: Date | null
  sleept: boolean
  onOpen: () => void
  onKies: (status: string) => void
  onBeginSleep: () => void
  onEindSleep: () => void
  /** Drop ván een andere kaart óp deze kaart: ervoor invoegen. */
  onDropHier: () => void
}

const CSS = `
.crm-kaart {
  position: relative;
  display: grid;
  gap: 12px;
  padding: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  cursor: grab;
  transition: transform 200ms var(--ease), border-color 200ms var(--ease),
    box-shadow 200ms var(--ease);
}
.crm-kaart:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--brand) 34%, var(--border));
  box-shadow: 0 6px 24px -12px var(--brand-glow);
}
.crm-kaart:active {
  transform: translateY(0);
}
.crm-kaart--sleept,
.crm-kaart--sleept:hover {
  opacity: 0.5;
  transform: scale(0.98);
  box-shadow: none;
  cursor: grabbing;
}
.crm-kaart__greep {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  color: var(--text-4);
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms var(--ease);
}
.crm-kaart:hover .crm-kaart__greep,
.crm-kaart:focus-within .crm-kaart__greep {
  opacity: 1;
}
.crm-kaart__kop {
  display: flex;
  align-items: center;
  gap: 11px;
  padding-right: 20px;
}
.crm-kaart__naam {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  border-radius: var(--radius-btn);
  text-align: left;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--text-1);
  cursor: pointer;
  overflow-wrap: anywhere;
  transition: color 150ms var(--ease);
}
.crm-kaart__naam:hover {
  color: var(--brand);
}
.crm-kaart__naam:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 3px;
}
.crm-kaart__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.crm-kaart__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-app);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
}
.crm-kaart__chip--dringend {
  color: var(--brand);
  border-color: color-mix(in srgb, var(--brand) 42%, transparent);
  background: var(--brand-soft);
}
.crm-kaart__versheid {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  color: var(--text-4);
}
.crm-kaart__versheid svg {
  flex-shrink: 0;
}
.crm-kaart__versheid--koud {
  color: var(--status-warning);
}
.crm-kaart__voet {
  padding-top: 11px;
  border-top: 1px solid var(--border);
}
@media (prefers-reduced-motion: reduce) {
  .crm-kaart,
  .crm-kaart__greep,
  .crm-kaart__naam {
    transition: none;
  }
  .crm-kaart:hover {
    transform: none;
  }
  .crm-kaart__greep {
    opacity: 1;
  }
}
`

interface SignalenProps {
  followUp: FollowUp | null
  versheid: Versheid
}

// De chip-rij (follow-up) en de versheid-regel. Apart gehouden zodat de kaart
// zelf compact blijft. Versheid krijgt pas een amber accent + duiding als het
// écht koud is; "nog geen contact" blijft neutraal (een verse lead is niet koud).
function KaartSignalen({ followUp, versheid }: SignalenProps) {
  return (
    <>
      {followUp ? (
        <div className="crm-kaart__chips">
          <span className={`crm-kaart__chip${followUp.dringend ? ' crm-kaart__chip--dringend' : ''}`}>
            <CalendarClock size={12} strokeWidth={2.2} aria-hidden="true" />
            {followUp.tekst}
          </span>
        </div>
      ) : null}

      <p
        className={`crm-kaart__versheid${versheid.koud ? ' crm-kaart__versheid--koud' : ''}`}
        title={versheid.koud ? 'Lang geen contact' : undefined}
        aria-label={versheid.koud ? `${versheid.tekst} — lang geen contact` : undefined}
      >
        <Clock size={12} strokeWidth={2} aria-hidden="true" />
        {versheid.tekst}
      </p>
    </>
  )
}

export function PersoonKaart({
  persoon,
  groep,
  vandaag,
  sleept,
  onOpen,
  onKies,
  onBeginSleep,
  onEindSleep,
  onDropHier,
}: PersoonKaartProps) {
  const followUp = persoon.followUpDatum ? followUpLabel(persoon.followUpDatum, vandaag) : null
  const versheid = contactVersheid(persoon.laatsteContactOp, vandaag)

  function opSleepStart(e: DragEvent) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', persoon.id)
    onBeginSleep()
  }

  function opDrop(e: DragEvent) {
    e.preventDefault()
    // Niet doorborrelen naar de kolom: een drop óp een kaart voegt vóór die kaart
    // in, een drop op de kolom zet achteraan. Zonder stop zou beide vuren.
    e.stopPropagation()
    onDropHier()
  }

  return (
    <li
      className={`crm-kaart${sleept ? ' crm-kaart--sleept' : ''}`}
      draggable
      aria-grabbed={sleept}
      onDragStart={opSleepStart}
      onDragEnd={onEindSleep}
      onDragOver={(e) => e.preventDefault()}
      onDrop={opDrop}
    >
      <style href="crm-kaart" precedence="medium">
        {CSS}
      </style>

      <GripVertical className="crm-kaart__greep" size={16} strokeWidth={2} aria-hidden="true" />

      <div className="crm-kaart__kop">
        <Monogram naam={persoon.naam} />
        <button type="button" className="crm-kaart__naam" onClick={onOpen}>
          {persoon.naam}
        </button>
      </div>

      <KaartSignalen followUp={followUp} versheid={versheid} />

      <ContactActies persoon={persoon} />

      <div className="crm-kaart__voet">
        <StatusKiezer groep={groep} status={persoon.status} naam={persoon.naam} onKies={onKies} />
      </div>
    </li>
  )
}
