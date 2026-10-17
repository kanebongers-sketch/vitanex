'use client'

import { useId, useState, type FormEvent } from 'react'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_TAG, normaliseerTag } from '@/lib/club/leden/invoer'
import { MAX_OMSCHRIJVING_LABEL, type Kleur, type Label } from '@/lib/club/lidmaatschappen/model'
import { ledenTekst } from '@/lib/club/lidmaatschappen/tellen'
import { KleurKiezer } from './KleurKiezer'

// Een label toevoegen of wijzigen. De naam wordt net als een tag geschreven
// ("PT interesse" wordt "pt-interesse"); bij hernoemen gaat de nieuwe naam ook
// mee bij alle leden die het label hebben.

interface Props {
  begin?: Label & { leden: number }
  onKlaar: (tekst: string) => void
  onAnnuleer?: () => void
}

export function LabelFormulier({ begin, onKlaar, onAnnuleer }: Props) {
  const id = useId()
  const [naam, setNaam] = useState(begin?.naam ?? '')
  const [omschrijving, setOmschrijving] = useState(begin?.omschrijving ?? '')
  const [kleur, setKleur] = useState<Kleur>(begin?.kleur ?? 'blauw')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const net = normaliseerTag(naam)
  const hernoemt = Boolean(begin && net && net !== begin.naam && begin.leden > 0)

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    const body = { naam, omschrijving, kleur }
    const uit = begin ? await stuur(`/api/club/lidmaatschappen/labels/${begin.id}`, 'PATCH', body) : await stuur('/api/club/lidmaatschappen/labels', 'POST', body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    const geraakt = (uit.data as { geraakt?: number } | null)?.geraakt ?? 0
    if (!begin) {
      setNaam('')
      setOmschrijving('')
    }
    onKlaar(begin ? `Label ${net} is aangepast${geraakt > 0 ? ` en bij ${ledenTekst(geraakt)} hernoemd` : ''}.` : `Label ${net} is toegevoegd.`)
  }

  return (
    <form className="club-lidm-form" onSubmit={(e) => void bewaar(e)} aria-describedby={`${id}-uitleg${fout ? ` ${id}-fout` : ''}`}>
      <label className="club-veld">
        <span>Naam</span>
        <input className="club-invoer" required maxLength={MAX_TAG + 10} value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="pt-interesse" />
      </label>
      <p id={`${id}-uitleg`} className="club-hint club-lidm-voorbeeld">
        {naam.trim() === '' ? 'Kleine letters, cijfers en koppeltekens.' : net ? <>Wordt opgeslagen als <span className="club-lidm-tag">{net}</span></> : 'Deze naam kan niet: gebruik letters of cijfers, maximaal 30 tekens.'}
      </p>
      {hernoemt && begin && (
        <p className="club-melding club-lidm-let">
          Bij {ledenTekst(begin.leden)} wordt de tag {begin.naam} dan {net}.
        </p>
      )}
      <label className="club-veld">
        <span>Omschrijving</span>
        <input className="club-invoer" maxLength={MAX_OMSCHRIJVING_LABEL} value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} placeholder="Waar is dit label voor?" />
      </label>
      <KleurKiezer naam={`${id}-kleur`} waarde={kleur} onKies={setKleur} />
      <div id={`${id}-fout`} role="alert">
        {fout && <p className="club-melding club-melding--fout">{fout}</p>}
      </div>
      <div className="club-lidm-formacties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? 'Bezig...' : begin ? 'Opslaan' : 'Label toevoegen'}
        </button>
        {onAnnuleer && (
          <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer}>
            Annuleren
          </button>
        )}
      </div>
    </form>
  )
}
