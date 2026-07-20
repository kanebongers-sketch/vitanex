'use client'

import { Mail, MessageCircle, Phone } from 'lucide-react'
import { mailHref, telHref, whatsappHref } from '@/lib/lifeos/crm/contact'
import type { Persoon } from '@/lib/lifeos/crm/crm'

// De snelle "bereik deze persoon"-acties bovenin de drawer: bellen, WhatsApp,
// mailen. Elke actie is een échte link (tel:/wa.me/mailto:) en verschijnt alleen
// als het bijhorende veld een bruikbare bestemming oplevert — nooit een dode
// knop. De helpers (contact.ts) doen de normalisatie en geven `null` bij twijfel.

interface ContactActiesProps {
  persoon: Persoon
}

export function ContactActies({ persoon }: ContactActiesProps) {
  const bel = telHref(persoon.telefoon)
  const app = whatsappHref(persoon.telefoon)
  const mail = mailHref(persoon.email)

  // Geen enkele bestemming? Toon niets — een lege actiebalk is ruis.
  if (bel === null && app === null && mail === null) return null

  return (
    <div className="crm-drawer__acties">
      {bel !== null ? (
        <a className="crm-drawer__actie" href={bel} aria-label={`Bel ${persoon.naam}`}>
          <Phone size={15} strokeWidth={2.2} aria-hidden="true" className="crm-drawer__actie-icoon" />
          Bellen
        </a>
      ) : null}
      {app !== null ? (
        <a
          className="crm-drawer__actie"
          href={app}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Stuur ${persoon.naam} een WhatsApp-bericht`}
        >
          <MessageCircle size={15} strokeWidth={2.2} aria-hidden="true" className="crm-drawer__actie-icoon" />
          WhatsApp
        </a>
      ) : null}
      {mail !== null ? (
        <a className="crm-drawer__actie" href={mail} aria-label={`Mail ${persoon.naam}`}>
          <Mail size={15} strokeWidth={2.2} aria-hidden="true" className="crm-drawer__actie-icoon" />
          E-mail
        </a>
      ) : null}
    </div>
  )
}
