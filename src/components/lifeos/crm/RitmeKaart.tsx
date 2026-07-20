'use client'

import { CheckCircle2, Clock } from 'lucide-react'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { contactVersheid, type Versheid } from '@/lib/lifeos/crm/versheid'
import { Monogram } from './kaart/Monogram'
import { ContactActies } from './kaart/ContactActies'
import { PlanGesprek } from './PlanGesprek'

// De persoon-kaart voor de wekelijkse-contact-weergave (het contact-ritme). GEEN
// slepen, GEEN status-kiezer: dit gaat niet over "in welke pipeline-fase zit
// iemand", maar over "wie moet ik deze week spreken". De naam-knop opent de
// detail-popup; "Gesproken" markeert dat je 'm net sprak (waarna 'ie naar de
// "gesproken"-emmer schuift).
//
// De naam-knop, de contact-links, "Gesproken" en PlanGesprek zijn BROERS, nooit
// genest: geen interactief element ín een ander (dat is invalide HTML en breekt
// de toetsenbordbediening). De voet-`div` is enkel een layout-omhulsel.

interface RitmeKaartProps {
  persoon: Persoon
  vandaag: Date | null
  onOpen: () => void
  onGesproken: () => void
}

// De versheid-regel: bij een écht contactmoment "Laatst gesproken: …", bij een
// nog-niet-gesproken persoon de kale, neutrale tekst ("nog geen contact"). Een
// verse lead hoort daar geen "laatst gesproken" te lezen.
function versheidRegel(versheid: Versheid): string {
  return versheid.dagen === null ? versheid.tekst : `Laatst gesproken: ${versheid.tekst}`
}

const CSS = `
.crm-ritme__kaart {
  position: relative;
  display: grid;
  gap: 12px;
  padding: 14px;
  background: var(--bg-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  transition: transform 200ms var(--ease), border-color 200ms var(--ease),
    box-shadow 200ms var(--ease);
}
.crm-ritme__kaart:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--brand) 34%, var(--line));
  box-shadow: 0 6px 24px -12px var(--brand-glow);
}
.crm-ritme__kop {
  display: flex;
  align-items: center;
  gap: 11px;
}
.crm-ritme__naam {
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
.crm-ritme__naam:hover {
  color: var(--brand);
}
.crm-ritme__naam:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 3px;
}
.crm-ritme__versheid {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  color: var(--text-4);
}
.crm-ritme__versheid svg {
  flex-shrink: 0;
}
.crm-ritme__versheid--koud {
  color: var(--status-warning);
}
.crm-ritme__voet {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 11px;
  border-top: 1px solid var(--line);
}
.crm-ritme__gesproken {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  background: var(--brand-soft);
  color: var(--brand);
  border: 1px solid color-mix(in srgb, var(--brand) 34%, transparent);
  border-radius: var(--radius-btn);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 160ms var(--ease), transform 160ms var(--ease);
}
.crm-ritme__gesproken:hover {
  background: color-mix(in srgb, var(--brand) 22%, transparent);
  transform: translateY(-1px);
}
.crm-ritme__gesproken:active {
  transform: translateY(0);
}
.crm-ritme__gesproken:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .crm-ritme__kaart,
  .crm-ritme__naam,
  .crm-ritme__gesproken {
    transition: none;
  }
  .crm-ritme__kaart:hover,
  .crm-ritme__gesproken:hover {
    transform: none;
  }
}
`

export function RitmeKaart({ persoon, vandaag, onOpen, onGesproken }: RitmeKaartProps) {
  const versheid = contactVersheid(persoon.laatsteContactOp, vandaag)

  return (
    <li className="crm-ritme__kaart">
      <style href="crm-ritme-kaart" precedence="medium">
        {CSS}
      </style>

      <div className="crm-ritme__kop">
        <Monogram naam={persoon.naam} />
        <button type="button" className="crm-ritme__naam" onClick={onOpen}>
          {persoon.naam}
        </button>
      </div>

      <p
        className={`crm-ritme__versheid${versheid.koud ? ' crm-ritme__versheid--koud' : ''}`}
        title={versheid.koud ? 'Lang niet gesproken' : undefined}
        aria-label={versheid.koud ? `${versheidRegel(versheid)} — lang niet gesproken` : undefined}
      >
        <Clock size={12} strokeWidth={2} aria-hidden="true" />
        {versheidRegel(versheid)}
      </p>

      <ContactActies persoon={persoon} />

      <div className="crm-ritme__voet">
        <button type="button" className="crm-ritme__gesproken" onClick={onGesproken}>
          <CheckCircle2 size={15} strokeWidth={2.2} aria-hidden="true" />
          Gesproken
        </button>
        <PlanGesprek naam={persoon.naam} compact />
      </div>
    </li>
  )
}
