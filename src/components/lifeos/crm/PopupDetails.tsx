'use client'

import { useId, useState, type ReactNode } from 'react'
import { Mail, Phone, X } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import type { Groep, Persoon, PersoonWijziging } from '@/lib/lifeos/crm/crm'
import { StatusKiezer } from './StatusKiezer'

// De bewerkbare kant van de popup: status verzetten, contact bijwerken (met een
// klikbare tel:/mailto:-actie), de follow-up-dag zetten of wissen, en de
// bijzonderheden bewerken. Elke wijziging gaat via één callback naar de container.

interface PopupDetailsProps {
  persoon: Persoon
  groep: Groep
  onWijzig: (wijziging: PersoonWijziging) => Promise<boolean>
}

export function PopupDetails({ persoon, groep, onWijzig }: PopupDetailsProps) {
  return (
    <>
      <section className="os-crm__sectie">
        <h3 className="os-crm__sectie-kop">Status</h3>
        <StatusKiezer
          groep={groep}
          status={persoon.status}
          naam={persoon.naam}
          onKies={(s) => void onWijzig({ status: s })}
        />
      </section>

      <section className="os-crm__sectie">
        <h3 className="os-crm__sectie-kop">Contact</h3>
        <ContactVeld
          label="Telefoon"
          type="tel"
          waarde={persoon.telefoon}
          href={persoon.telefoon ? `tel:${persoon.telefoon}` : null}
          icoon={<Phone size={14} strokeWidth={2.2} aria-hidden="true" />}
          onOpslaan={(v) => onWijzig({ telefoon: v })}
        />
        <ContactVeld
          label="E-mail"
          type="email"
          waarde={persoon.email}
          href={persoon.email ? `mailto:${persoon.email}` : null}
          icoon={<Mail size={14} strokeWidth={2.2} aria-hidden="true" />}
          onOpslaan={(v) => onWijzig({ email: v })}
        />
      </section>

      <section className="os-crm__sectie">
        <h3 className="os-crm__sectie-kop">Follow-up-dag</h3>
        <div className="os-crm__followup">
          <input
            type="date"
            className="os-crm__invoer"
            style={{ colorScheme: 'dark' }}
            value={persoon.followUpDatum ?? ''}
            aria-label="Follow-up-dag"
            onChange={(e) => void onWijzig({ followUpDatum: e.target.value || null })}
          />
          {persoon.followUpDatum ? (
            <button type="button" className="os-crm__wis" onClick={() => void onWijzig({ followUpDatum: null })}>
              <X size={13} strokeWidth={2.2} aria-hidden="true" />
              Wissen
            </button>
          ) : null}
        </div>
        <p className="os-crm__hint">Geen dag = geen follow-up. Zet er een om iemand terug te zien op het bord.</p>
      </section>

      <section className="os-crm__sectie">
        <h3 className="os-crm__sectie-kop">Bijzonderheden</h3>
        <BijzonderhedenVeld waarde={persoon.bijzonderheden} onOpslaan={(v) => onWijzig({ bijzonderheden: v })} />
      </section>
    </>
  )
}

interface ContactVeldProps {
  label: string
  type: 'tel' | 'email'
  waarde: string | null
  href: string | null
  icoon: ReactNode
  onOpslaan: (v: string | null) => Promise<boolean>
}

function ContactVeld({ label, type, waarde, href, icoon, onOpslaan }: ContactVeldProps) {
  const id = useId()
  const [tekst, setTekst] = useState(waarde ?? '')
  const vuil = tekst.trim() !== (waarde ?? '')

  return (
    <div className="os-crm__veld">
      <label htmlFor={id} className="os-crm__label">
        {label}
      </label>
      <div className="os-crm__contact">
        <input
          id={id}
          type={type}
          className="os-crm__invoer"
          value={tekst}
          maxLength={type === 'email' ? 320 : 40}
          onChange={(e) => setTekst(e.target.value)}
          onBlur={() => {
            if (vuil) void onOpslaan(tekst.trim() || null)
          }}
        />
        {href ? (
          <a className="os-crm__contact-link" href={href} aria-label={`${label} openen`}>
            {icoon}
          </a>
        ) : null}
      </div>
    </div>
  )
}

function BijzonderhedenVeld({
  waarde,
  onOpslaan,
}: {
  waarde: string | null
  onOpslaan: (v: string | null) => Promise<boolean>
}) {
  const id = useId()
  const [tekst, setTekst] = useState(waarde ?? '')
  const [bezig, setBezig] = useState(false)
  const vuil = tekst.trim() !== (waarde ?? '')

  async function bewaar() {
    setBezig(true)
    await onOpslaan(tekst.trim() || null)
    setBezig(false)
  }

  return (
    <div className="os-crm__veld">
      <label htmlFor={id} className="sr-only">
        Bijzonderheden
      </label>
      <textarea
        id={id}
        className="os-crm__invoer os-crm__textarea"
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        maxLength={5000}
        rows={3}
        placeholder="Wat is belangrijk om te onthouden over deze persoon?"
      />
      {vuil ? (
        <div className="os-crm__notitie-actie">
          <Knop variant="primair" onClick={() => void bewaar()} disabled={bezig}>
            {bezig ? 'Bezig…' : 'Bijzonderheden opslaan'}
          </Knop>
        </div>
      ) : null}
    </div>
  )
}
