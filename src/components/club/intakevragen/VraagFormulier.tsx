'use client'

import { useEffect, useId, useState } from 'react'
import { kernDef } from '@/lib/club/intakevragen/kern'
import {
  MAX_OPTIES, MAX_SECTIE, MAX_UITLEG, MAX_VRAAG, VRAAG_SOORTEN, heeftOpties, isVraagSoort,
  type IntakeVraag, type VraagSoort,
} from '@/lib/club/intakevragen/soorten'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { INTAKE } from '@/lib/aiyourgym/taal/woorden/club/intake'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'

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
  const t = useTekst(INTAKE).vraagFormulier
  const l = useTekst(TRAINING_LABELS)
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
      <h3 id={`${id}-kop`}>{vraag.id === 'nieuw' ? t.nieuw : kern ? t.vastAanpassen : t.aanpassen}</h3>
      {kern && <p className="club-hint">{t.vastUitleg(kern.vast)}</p>}
      <label className="club-veld">
        <span>{t.vraag}</span>
        <input className="club-invoer" value={v.vraag} maxLength={MAX_VRAAG} required onChange={(e) => zet({ vraag: e.target.value })} autoFocus />
      </label>
      <label className="club-veld">
        <span>{t.uitleg}</span>
        <input className="club-invoer" value={v.uitleg ?? ''} maxLength={MAX_UITLEG} onChange={(e) => zet({ uitleg: e.target.value || null })} />
      </label>
      <div className="club-formrij">
        <label className="club-veld">
          <span>{t.sectie}</span>
          <input className="club-invoer" list={`${id}-secties`} value={v.sectie} maxLength={MAX_SECTIE} required onChange={(e) => zet({ sectie: e.target.value })} />
          <datalist id={`${id}-secties`}>{sectieNamen.map((n) => <option key={n} value={n} />)}</datalist>
        </label>
        <label className="club-veld">
          <span>{t.soort}</span>
          <select className="club-invoer" value={v.soort} disabled={!!kern} onChange={(e) => isVraagSoort(e.target.value) && zet({ soort: e.target.value as VraagSoort })}>
            {VRAAG_SOORTEN.map((s) => <option key={s} value={s}>{l.vraagSoort[s]}</option>)}
          </select>
        </label>
      </div>
      {heeftOpties(v.soort) && (
        <label className="club-veld">
          <span>{t.opties(MAX_OPTIES)}</span>
          {kern ? (
            <p className="club-hint">{v.opties.join(', ')}</p>
          ) : (
            <textarea className="club-invoer" rows={4} value={optieTekst} onChange={(e) => zetOpties(e.target.value)} />
          )}
        </label>
      )}
      <fieldset className="club-intakevragen-vinkjes">
        <legend className="club-sr">{t.eigenschappen}</legend>
        <label><input type="checkbox" checked={v.verplicht} disabled={!!kern} onChange={(e) => zet({ verplicht: e.target.checked })} /> {t.verplicht}</label>
        <label><input type="checkbox" checked={v.gezondheid} disabled={!!kern} onChange={(e) => zet({ gezondheid: e.target.checked })} /> {t.gezondheid}</label>
        <label><input type="checkbox" checked={v.actief} disabled={kern?.vast} onChange={(e) => zet({ actief: e.target.checked })} /> {t.actief}</label>
      </fieldset>
      {v.gezondheid && <p className="club-hint">{t.gezondheidUitleg}</p>}
      <div className="club-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>{bezig ? t.opslaanBezig : t.opslaan}</button>
        <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer}>{t.annuleren}</button>
      </div>
    </form>
  )
}
