'use client'

import { useId, useState, type ReactNode } from 'react'
import { Mail, Phone, X } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { mailHref, telHref } from '@/lib/lifeos/crm/contact'
import {
  MAX_BIJZONDERHEDEN,
  MAX_EMAIL,
  MAX_NAAM,
  MAX_TELEFOON,
  type Groep,
  type Persoon,
  type PersoonWijziging,
} from '@/lib/lifeos/crm/crm'
import { StatusKiezer } from './StatusKiezer'
import { PlanGesprek } from './PlanGesprek'

// De bewerkbare kant van de drawer: status verzetten, de gegevens (naam, telefoon,
// e-mail) inline bijwerken met een klikbare contact-actie, de follow-up-dag zetten
// (drie snelknoppen + vrije datumkeuze) of wissen, en de bijzonderheden bewerken.
// Elke wijziging gaat via één callback naar de container.

interface PopupDetailsProps {
  persoon: Persoon
  groep: Groep
  /** "Nu"-snapshot uit de drawer: basis voor de follow-up-snelknoppen. */
  vandaag: Date
  onWijzig: (wijziging: PersoonWijziging) => Promise<boolean>
}

export function PopupDetails({ persoon, groep, vandaag, onWijzig }: PopupDetailsProps) {
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
        <h3 className="os-crm__sectie-kop">Gegevens</h3>
        <InlineTekstVeld
          label="Naam"
          waarde={persoon.naam}
          maxLength={MAX_NAAM}
          verplicht
          onOpslaan={(v) => onWijzig({ naam: v ?? persoon.naam })}
        />
        <InlineTekstVeld
          label="Telefoon"
          type="tel"
          waarde={persoon.telefoon}
          maxLength={MAX_TELEFOON}
          href={telHref(persoon.telefoon)}
          linkLabel={`Bel ${persoon.naam}`}
          icoon={<Phone size={14} strokeWidth={2.2} aria-hidden="true" />}
          onOpslaan={(v) => onWijzig({ telefoon: v })}
        />
        <InlineTekstVeld
          label="E-mail"
          type="email"
          waarde={persoon.email}
          maxLength={MAX_EMAIL}
          href={mailHref(persoon.email)}
          linkLabel={`Mail ${persoon.naam}`}
          icoon={<Mail size={14} strokeWidth={2.2} aria-hidden="true" />}
          onOpslaan={(v) => onWijzig({ email: v })}
        />
      </section>

      <section className="os-crm__sectie">
        <h3 className="os-crm__sectie-kop">Plan gesprek</h3>
        <PlanGesprek naam={persoon.naam} />
      </section>

      <section className="os-crm__sectie">
        <h3 className="os-crm__sectie-kop">Follow-up-dag</h3>
        <FollowUpVeld persoon={persoon} vandaag={vandaag} onWijzig={onWijzig} />
      </section>

      <section className="os-crm__sectie">
        <h3 className="os-crm__sectie-kop">Bijzonderheden</h3>
        <BijzonderhedenVeld waarde={persoon.bijzonderheden} onOpslaan={(v) => onWijzig({ bijzonderheden: v })} />
      </section>
    </>
  )
}

/**
 * Opslaan-op-blur met terugval. Mislukt de schrijf, dan valt het veld terug op de
 * serverwaarde i.p.v. de niet-opgeslagen invoer te blijven tonen ("lijkt
 * opgeslagen maar was het niet"). Een `verplicht` veld dat leeggemaakt wordt slaat
 * niet op (de server weigert dat) maar keert stil terug naar de serverwaarde.
 */
function useOpslagVeld(
  waarde: string | null,
  onOpslaan: (v: string | null) => Promise<boolean>,
  verplicht: boolean,
) {
  const [tekst, setTekst] = useState(waarde ?? '')
  const vuil = tekst.trim() !== (waarde ?? '')

  async function bewaar() {
    const schoon = tekst.trim()
    if (verplicht && schoon === '') {
      setTekst(waarde ?? '')
      return
    }
    const gelukt = await onOpslaan(schoon || null)
    if (!gelukt) setTekst(waarde ?? '')
  }

  return { tekst, setTekst, vuil, bewaar }
}

interface InlineTekstVeldProps {
  label: string
  type?: 'text' | 'tel' | 'email'
  waarde: string | null
  maxLength: number
  verplicht?: boolean
  /** Klikbare contact-actie naast het veld (tel:/mailto:), of null. */
  href?: string | null
  linkLabel?: string
  icoon?: ReactNode
  onOpslaan: (v: string | null) => Promise<boolean>
}

function InlineTekstVeld({
  label,
  type = 'text',
  waarde,
  maxLength,
  verplicht = false,
  href = null,
  linkLabel,
  icoon,
  onOpslaan,
}: InlineTekstVeldProps) {
  const id = useId()
  const { tekst, setTekst, vuil, bewaar } = useOpslagVeld(waarde, onOpslaan, verplicht)

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
          maxLength={maxLength}
          onChange={(e) => setTekst(e.target.value)}
          onBlur={() => {
            if (vuil) void bewaar()
          }}
        />
        {href !== null ? (
          <a className="os-crm__contact-link" href={href} aria-label={linkLabel ?? `${label} openen`}>
            {icoon}
          </a>
        ) : null}
      </div>
    </div>
  )
}

interface FollowUpVeldProps {
  persoon: Persoon
  vandaag: Date
  onWijzig: (wijziging: PersoonWijziging) => Promise<boolean>
}

function FollowUpVeld({ persoon, vandaag, onWijzig }: FollowUpVeldProps) {
  const opties = snelOpties(vandaag)

  return (
    <>
      <div className="crm-drawer__snel" role="group" aria-label="Snel een follow-up-dag kiezen">
        {opties.map((o) => (
          <button
            key={o.label}
            type="button"
            className="crm-drawer__snelknop"
            aria-pressed={persoon.followUpDatum === o.sleutel}
            onClick={() => {
              // Al gekozen? Niet opnieuw schrijven — dat zou een dubbel historie-item
              // opleveren voor dezelfde dag.
              if (persoon.followUpDatum !== o.sleutel) void onWijzig({ followUpDatum: o.sleutel })
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="os-crm__followup">
        <input
          type="date"
          className="os-crm__invoer"
          style={{ colorScheme: 'dark' }}
          value={persoon.followUpDatum ?? ''}
          aria-label="Follow-up-dag (kies zelf een datum)"
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
    </>
  )
}

interface SnelOptie {
  label: string
  sleutel: string
}

/** Vandaag / over 3 dagen / volgende week als lokale YYYY-MM-DD-sleutels. */
function snelOpties(vandaag: Date): SnelOptie[] {
  const opDag = (dagen: number): string =>
    datumSleutel(new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate() + dagen))
  return [
    { label: 'Vandaag', sleutel: opDag(0) },
    { label: 'Over 3 dagen', sleutel: opDag(3) },
    { label: 'Volgende week', sleutel: opDag(7) },
  ]
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
    const gelukt = await onOpslaan(tekst.trim() || null)
    setBezig(false)
    // Mislukt? Terug naar de serverwaarde — nooit de niet-opgeslagen tekst laten
    // staan alsof hij bewaard is. De fout toont de drawer.
    if (!gelukt) setTekst(waarde ?? '')
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
        maxLength={MAX_BIJZONDERHEDEN}
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
