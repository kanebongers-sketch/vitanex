'use client'

import type { SyntheticEvent } from 'react'
import { Mail, MessageCircle, Phone } from 'lucide-react'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { mailHref, telHref, whatsappHref } from '@/lib/lifeos/crm/contact'

// De contact-rij op een persoon-kaart: bellen, WhatsApp, mailen. Elke knop komt
// ALLEEN in beeld als er een bruikbare href is (de helpers geven `null` bij een
// leeg/onbruikbaar veld) — nooit een dode knop.
//
// stopPropagation op pointerdown én click: een tik op zo'n link mag NIET de
// detail-popup openen of het slepen van de kaart starten. `draggable={false}`
// voorkomt bovendien dat je per ongeluk de URL uit de kaart sleept.

interface ContactActiesProps {
  persoon: Persoon
}

interface Actie {
  sleutel: string
  href: string
  label: string
  Icoon: typeof Phone
  /** Externe http-link (WhatsApp) → nieuw tabblad; tel:/mailto: niet. */
  extern: boolean
}

const CSS = `
.crm-kaart__acties {
  display: flex;
  gap: 8px;
}
.crm-kaart__actie {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-btn);
  border: 1px solid var(--border);
  background: var(--bg-app);
  color: var(--text-2);
  transition: color 150ms var(--ease), border-color 150ms var(--ease),
    background 150ms var(--ease), transform 150ms var(--ease);
}
.crm-kaart__actie:hover {
  color: var(--brand);
  border-color: color-mix(in srgb, var(--brand) 40%, var(--border));
  background: var(--brand-soft);
}
.crm-kaart__actie:active {
  transform: scale(0.94);
}
.crm-kaart__actie:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .crm-kaart__actie {
    transition: color 150ms var(--ease), border-color 150ms var(--ease),
      background 150ms var(--ease);
  }
  .crm-kaart__actie:active {
    transform: none;
  }
}
`

function bouwActies(persoon: Persoon): Actie[] {
  const acties: Actie[] = []
  const bel = telHref(persoon.telefoon)
  if (bel) acties.push({ sleutel: 'bel', href: bel, label: `Bel ${persoon.naam}`, Icoon: Phone, extern: false })
  const wa = whatsappHref(persoon.telefoon)
  if (wa) acties.push({ sleutel: 'wa', href: wa, label: `WhatsApp ${persoon.naam}`, Icoon: MessageCircle, extern: true })
  const mail = mailHref(persoon.email)
  if (mail) acties.push({ sleutel: 'mail', href: mail, label: `Mail ${persoon.naam}`, Icoon: Mail, extern: false })
  return acties
}

export function ContactActies({ persoon }: ContactActiesProps) {
  const acties = bouwActies(persoon)
  if (acties.length === 0) return null

  function stop(e: SyntheticEvent) {
    e.stopPropagation()
  }

  return (
    <>
      <style href="crm-kaart-acties" precedence="medium">
        {CSS}
      </style>
      <div className="crm-kaart__acties">
        {acties.map(({ sleutel, href, label, Icoon, extern }) => (
          <a
            key={sleutel}
            className="crm-kaart__actie"
            href={href}
            aria-label={label}
            title={label}
            draggable={false}
            onPointerDown={stop}
            onClick={stop}
            {...(extern ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            <Icoon size={16} strokeWidth={2} aria-hidden="true" />
          </a>
        ))}
      </div>
    </>
  )
}
