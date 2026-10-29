'use client'

import { useState } from 'react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { useVestigingNaam } from '@/components/club/shell/VestigingenContext'
import { opvolgSnelkeuzes } from '@/lib/club/leads/regels'
import { LEADS_DAGEN } from '@/lib/aiyourgym/taal/woorden/club/leads-dagen'
import { LeadVelden, veldenUitFormulier } from './LeadVelden'
import { ZijPaneel } from './ZijPaneel'
import { stuur } from './stuur'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'

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
  const vestigingNaam = useVestigingNaam(vestiging)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const taal = useTaal()
  const t = useTekst(LEADS).nieuw
  const keuzes = [{ label: LEADS_DAGEN[taal].snelkeuze.vandaag, dag: vandaag }, ...opvolgSnelkeuzes(vandaag, taal)]

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
        <p className="club-boventitel">{vestigingNaam}</p>
        <h2 id="nieuwe-lead-titel" className="club-leads-paneelnaam">
          {t.titel}
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
          <legend className="club-label">{t.opvolgen}</legend>
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
          {bezig ? t.bezig : t.opslaan}
        </button>
      </form>
    </ZijPaneel>
  )
}
