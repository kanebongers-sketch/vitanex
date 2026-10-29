'use client'

import { useId, useState, type FormEvent } from 'react'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_TAG, normaliseerTag } from '@/lib/club/leden/invoer'
import { MAX_OMSCHRIJVING_LABEL, type Kleur, type Label } from '@/lib/club/lidmaatschappen/model'
import { ledenTekst } from '@/lib/club/lidmaatschappen/tellen'
import { KleurKiezer } from './KleurKiezer'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LIDMAATSCHAPPEN } from '@/lib/aiyourgym/taal/woorden/club/lidmaatschappen'

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
  const taal = useTaal()
  const tekst = useTekst(LIDMAATSCHAPPEN)
  const t = tekst.label

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
    onKlaar(begin ? (geraakt > 0 ? t.aangepastHernoemd(net ?? '', ledenTekst(geraakt, taal)) : t.aangepast(net ?? '')) : t.toegevoegd(net ?? ''))
  }

  return (
    <form className="club-lidm-form" onSubmit={(e) => void bewaar(e)} aria-describedby={`${id}-uitleg${fout ? ` ${id}-fout` : ''}`}>
      <label className="club-veld">
        <span>{tekst.algemeen.naam}</span>
        <input className="club-invoer" required maxLength={MAX_TAG + 10} value={naam} onChange={(e) => setNaam(e.target.value)} placeholder={t.voorbeeld} />
      </label>
      <p id={`${id}-uitleg`} className="club-hint club-lidm-voorbeeld">
        {naam.trim() === '' ? t.regels : net ? <>{t.wordt} <span className="club-lidm-tag">{net}</span></> : t.kanNiet}
      </p>
      {hernoemt && begin && (
        <p className="club-melding club-lidm-let">{t.hernoemt(ledenTekst(begin.leden, taal), begin.naam, net ?? '')}</p>
      )}
      <label className="club-veld">
        <span>{tekst.algemeen.omschrijving}</span>
        <input className="club-invoer" maxLength={MAX_OMSCHRIJVING_LABEL} value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} placeholder={t.omschrijvingVoorbeeld} />
      </label>
      <KleurKiezer naam={`${id}-kleur`} waarde={kleur} onKies={setKleur} />
      <div id={`${id}-fout`} role="alert">
        {fout && <p className="club-melding club-melding--fout">{fout}</p>}
      </div>
      <div className="club-lidm-formacties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? tekst.algemeen.bezig : begin ? tekst.algemeen.opslaan : t.toevoegen}
        </button>
        {onAnnuleer && (
          <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer}>
            {tekst.algemeen.annuleren}
          </button>
        )}
      </div>
    </form>
  )
}
