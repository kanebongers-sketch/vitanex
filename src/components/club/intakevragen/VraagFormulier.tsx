'use client'

import { useEffect, useId, useState } from 'react'
import { kernDef } from '@/lib/club/intakevragen/kern'
import {
  MAX_OPTIES, MAX_SECTIE, MAX_UITLEG, MAX_VRAAG, SOORT_LABEL, VRAAG_SOORTEN, heeftOpties, isVraagSoort,
  type IntakeVraag, type VraagSoort,
} from '@/lib/club/intakevragen/soorten'

interface VraagFormulierProps {
  /** De vraag die je wijzigt, of een nieuwe (id 'nieuw'). */
  vraag: IntakeVraag
  sectieNamen: readonly string[]
  bezig: boolean
  /** Elke wijziging, voor het live voorbeeld. */
  onConcept: (v: IntakeVraag) => void
  onOpslaan: (v: IntakeVraag) => void
  onAnnuleer: () => void
}

/** Een vraag toevoegen of wijzigen. Bij een vaste vraag liggen soort, opties en gezondheid vast. */
export function VraagFormulier({ vraag, sectieNamen, bezig, onConcept, onOpslaan, onAnnuleer }: VraagFormulierProps) {
  const id = useId()
  const kern = kernDef(vraag.sleutel)
  const [v, setV] = useState<IntakeVraag>(vraag)
  const [optieTekst, setOptieTekst] = useState(vraag.opties.join('\n'))
  useEffect(() => onConcept(v), [v, onConcept])
  const zet = (deel: Partial<IntakeVraag>) => setV((oud) => ({ ...oud, ...deel }))
  const zetOpties = (tekst: string) => {
    setOptieTekst(tekst)
    zet({ opties: tekst.split('\n').map((o) => o.trim()).filter(Boolean) })
  }

  function verstuur(e: React.FormEvent) {
    e.preventDefault()
    onOpslaan(v)
  }

  return (
    <form className="club-intakevragen-formulier" onSubmit={verstuur} aria-labelledby={`${id}-kop`}>
      <h3 id={`${id}-kop`}>{vraag.id === 'nieuw' ? 'Nieuwe vraag' : kern ? 'Vaste vraag aanpassen' : 'Vraag aanpassen'}</h3>
      {kern && <p className="club-hint">Een vaste vraag van Club vult een veld van de intake{kern.vast ? ' waar het schemavoorstel op draait, dus hij blijft aan' : ''}. Je past de tekst, uitleg en sectie aan.</p>}
      <label className="club-veld">
        <span>Vraag</span>
        <input className="club-invoer" value={v.vraag} maxLength={MAX_VRAAG} required onChange={(e) => zet({ vraag: e.target.value })} autoFocus />
      </label>
      <label className="club-veld">
        <span>Uitleg voor de trainer (optioneel)</span>
        <input className="club-invoer" value={v.uitleg ?? ''} maxLength={MAX_UITLEG} onChange={(e) => zet({ uitleg: e.target.value || null })} />
      </label>
      <div className="club-formrij">
        <label className="club-veld">
          <span>Sectie</span>
          <input className="club-invoer" list={`${id}-secties`} value={v.sectie} maxLength={MAX_SECTIE} required onChange={(e) => zet({ sectie: e.target.value })} />
          <datalist id={`${id}-secties`}>{sectieNamen.map((n) => <option key={n} value={n} />)}</datalist>
        </label>
        <label className="club-veld">
          <span>Soort antwoord</span>
          <select className="club-invoer" value={v.soort} disabled={!!kern} onChange={(e) => isVraagSoort(e.target.value) && zet({ soort: e.target.value as VraagSoort })}>
            {VRAAG_SOORTEN.map((s) => <option key={s} value={s}>{SOORT_LABEL[s]}</option>)}
          </select>
        </label>
      </div>
      {heeftOpties(v.soort) && (
        <label className="club-veld">
          <span>Opties, een per regel (2 tot {MAX_OPTIES})</span>
          {kern ? (
            <p className="club-hint">{v.opties.join(', ')}</p>
          ) : (
            <textarea className="club-invoer" rows={4} value={optieTekst} onChange={(e) => zetOpties(e.target.value)} />
          )}
        </label>
      )}
      <fieldset className="club-intakevragen-vinkjes">
        <legend className="club-sr">Eigenschappen</legend>
        <label><input type="checkbox" checked={v.verplicht} disabled={!!kern} onChange={(e) => zet({ verplicht: e.target.checked })} /> Verplicht</label>
        <label><input type="checkbox" checked={v.gezondheid} disabled={!!kern} onChange={(e) => zet({ gezondheid: e.target.checked })} /> Gezondheidsvraag (alleen met toestemming)</label>
        <label><input type="checkbox" checked={v.actief} disabled={kern?.vast} onChange={(e) => zet({ actief: e.target.checked })} /> Aan in het formulier</label>
      </fieldset>
      {v.gezondheid && <p className="club-hint">Een gezondheidsvraag ziet de trainer pas als het lid toestemming geeft. Zonder toestemming wordt het antwoord niet opgeslagen.</p>}
      <div className="club-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>{bezig ? 'Opslaan...' : 'Opslaan'}</button>
        <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer}>Annuleren</button>
      </div>
    </form>
  )
}
