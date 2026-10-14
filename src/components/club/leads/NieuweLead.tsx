'use client'

import { useState } from 'react'
import type { Vestiging } from '@/lib/club/gedeeld/vestiging'
import { VESTIGING_LABEL } from '@/lib/club/gedeeld/vestiging'
import { opvolgSnelkeuzes } from '@/lib/club/leads/regels'
import { LeadVelden, veldenUitFormulier } from './LeadVelden'
import { ZijPaneel } from './ZijPaneel'
import { stuur } from './stuur'

interface NieuweLeadProps {
  vestiging: Vestiging
  medewerkers: { id: string; naam: string }[]
  vandaag: string
  onSluit: () => void
  onAangemaakt: (id: string) => void
}

// Snel een lead invoeren aan de balie of tijdens een telefoontje. Standaard
// opvolgen: vandaag, zodat hij meteen in "Vandaag opvolgen" staat.
export function NieuweLead({ vestiging, medewerkers, vandaag, onSluit, onAangemaakt }: NieuweLeadProps) {
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const keuzes = [{ label: 'Vandaag', dag: vandaag }, ...opvolgSnelkeuzes(vandaag)]

  async function bewaar(form: HTMLFormElement) {
    setBezig(true)
    setFout(null)
    const opvolgenOp = new FormData(form).get('opvolgenOp')
    const uit = await stuur('/api/club/leads', 'POST', { ...veldenUitFormulier(form), vestiging, opvolgenOp: typeof opvolgenOp === 'string' ? opvolgenOp : null })
    setBezig(false)
    if (!uit.ok) {
      setFout(uit.fout)
      return
    }
    const lead = uit.data.lead
    const id = typeof lead === 'object' && lead !== null && 'id' in lead && typeof lead.id === 'string' ? lead.id : null
    if (id) onAangemaakt(id)
    else onSluit()
  }

  return (
    <ZijPaneel titelId="nieuwe-lead-titel" onSluit={onSluit}>
      <header>
        <p className="club-boventitel">{VESTIGING_LABEL[vestiging]}</p>
        <h2 id="nieuwe-lead-titel" className="club-leads-paneelnaam">
          Nieuwe lead
        </h2>
      </header>
      <form
        className="club-leads-formulier"
        onSubmit={(e) => {
          e.preventDefault()
          void bewaar(e.currentTarget)
        }}
      >
        <LeadVelden lead={null} medewerkers={medewerkers} />
        <fieldset className="club-leads-keuzeset">
          <legend className="club-label">Opvolgen</legend>
          {keuzes.map((k, i) => (
            <label key={k.label} className="club-leads-radio">
              <input type="radio" name="opvolgenOp" value={k.dag} defaultChecked={i === 0} />
              <span>{k.label}</span>
            </label>
          ))}
        </fieldset>
        {fout && (
          <p className="club-melding club-melding--fout" role="alert">
            {fout}
          </p>
        )}
        <button type="submit" className="club-knop club-knop--primair club-knop--groot" disabled={bezig}>
          {bezig ? 'Opslaan' : 'Lead opslaan'}
        </button>
      </form>
    </ZijPaneel>
  )
}
