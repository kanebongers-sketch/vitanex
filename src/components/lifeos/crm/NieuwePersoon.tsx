'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { ChevronDown, UserPlus } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import {
  beginStatus,
  statussenVoorGroep,
  MAX_NAAM,
  MAX_TELEFOON,
  MAX_EMAIL,
  MAX_BIJZONDERHEDEN,
  type Groep,
} from '@/lib/lifeos/crm/crm'
import type { NieuwePersoonInvoer } from './useMensen'

// Iemand toevoegen aan de groep. Presentationeel: velden erin, één callback
// eruit. Naam + status staan altijd zichtbaar; de rest (contact, follow-up,
// bijzonderheden) zit onder een "meer velden"-schakelaar, zodat de balk rustig
// blijft. De optimistische POST + rollback horen bij `useMensen`, niet hier.

interface NieuwePersoonProps {
  groep: Groep
  bezig: boolean
  onToevoegen: (invoer: NieuwePersoonInvoer) => Promise<boolean>
}

export function NieuwePersoon({ groep, bezig, onToevoegen }: NieuwePersoonProps) {
  const statussen = statussenVoorGroep(groep)
  const [naam, setNaam] = useState('')
  const [status, setStatus] = useState(() => beginStatus(groep))
  const [telefoon, setTelefoon] = useState('')
  const [email, setEmail] = useState('')
  const [followUpDatum, setFollowUpDatum] = useState('')
  const [bijzonderheden, setBijzonderheden] = useState('')
  const [meer, setMeer] = useState(false)

  const kanVersturen = naam.trim().length > 0 && !bezig

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!kanVersturen) return

    // Mislukt de POST, dan zet `useMensen` de (specifieke) foutmelding en toont
    // `GroepBord` 'm onder dit formulier. Hier geen tweede, generieke melding:
    // dat gaf de fout dubbel.
    const gelukt = await onToevoegen({
      naam: naam.trim(),
      status,
      telefoon: telefoon.trim() || null,
      email: email.trim() || null,
      followUpDatum: followUpDatum || null,
      bijzonderheden: bijzonderheden.trim() || null,
    })

    if (!gelukt) return
    // Gelukt: velden leeg, status laten staan voor de volgende.
    setNaam('')
    setTelefoon('')
    setEmail('')
    setFollowUpDatum('')
    setBijzonderheden('')
  }

  return (
    <form className="os-crm__nieuw" onSubmit={(e) => void verstuur(e)}>
      <div className="os-crm__nieuw-rij">
        <label htmlFor="crm-naam" className="sr-only">
          Naam van de nieuwe persoon
        </label>
        <input
          id="crm-naam"
          className="os-crm__invoer os-crm__nieuw-naam"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="Naam toevoegen…"
          maxLength={MAX_NAAM}
        />
        <label htmlFor="crm-status" className="sr-only">
          Startstatus
        </label>
        <select
          id="crm-status"
          className="os-crm__invoer os-crm__nieuw-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statussen.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <Knop type="submit" variant="primair" disabled={!kanVersturen}>
          <UserPlus size={14} strokeWidth={2.2} aria-hidden="true" />
          {bezig ? 'Bezig…' : 'Toevoegen'}
        </Knop>
      </div>

      <button
        type="button"
        className="os-crm__meer"
        aria-expanded={meer}
        onClick={() => setMeer((v) => !v)}
      >
        <ChevronDown
          size={13}
          strokeWidth={2.2}
          aria-hidden="true"
          style={{ transform: meer ? 'rotate(180deg)' : 'none', transition: 'transform 180ms var(--ease)' }}
        />
        {meer ? 'Minder velden' : 'Meer velden'}
      </button>

      {meer ? (
        <div className="os-crm__nieuw-meer">
          <Veld label="Telefoon" htmlFor="crm-tel">
            <input
              id="crm-tel"
              type="tel"
              className="os-crm__invoer"
              value={telefoon}
              onChange={(e) => setTelefoon(e.target.value)}
              maxLength={MAX_TELEFOON}
            />
          </Veld>
          <Veld label="E-mail" htmlFor="crm-email">
            <input
              id="crm-email"
              type="email"
              className="os-crm__invoer"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={MAX_EMAIL}
            />
          </Veld>
          <Veld label="Follow-up-dag" htmlFor="crm-followup">
            <input
              id="crm-followup"
              type="date"
              className="os-crm__invoer"
              style={{ colorScheme: 'dark' }}
              value={followUpDatum}
              onChange={(e) => setFollowUpDatum(e.target.value)}
            />
          </Veld>
          <div className="os-crm__nieuw-breed">
            <Veld label="Bijzonderheden" htmlFor="crm-bijz">
              <textarea
                id="crm-bijz"
                className="os-crm__invoer os-crm__textarea"
                value={bijzonderheden}
                onChange={(e) => setBijzonderheden(e.target.value)}
                maxLength={MAX_BIJZONDERHEDEN}
                rows={2}
              />
            </Veld>
          </div>
        </div>
      ) : null}
    </form>
  )
}

function Veld({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="os-crm__veld">
      <label htmlFor={htmlFor} className="os-crm__label">
        {label}
      </label>
      {children}
    </div>
  )
}
