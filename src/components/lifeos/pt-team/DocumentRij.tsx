'use client'

import { useState, type FormEvent } from 'react'
import { EyeOff } from 'lucide-react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { leesbareGrootte, soortVanMime } from '@/lib/lifeos/pt-dashboard/documenten'
import { leesDocument, type PtDocument } from '@/lib/lifeos/pt-dashboard/documenten-lezers'
import { DocumentVelden, conceptVan, metaVan, type DocConcept } from './DocumentVelden'

// Eén document in Kane's lijst: bekijken, bewerken (titel, beschrijving,
// categorie, volgorde, zichtbaar) en verwijderen — dat laatste pas na bevestigen,
// want het bestand gaat ook echt uit de opslag.

type Modus = 'kijken' | 'bewerken' | 'bevestigen'

interface Props {
  doc: PtDocument
  onGewijzigd: (d: PtDocument) => void
  onVerwijderd: (id: string) => void
}

export function DocumentRij({ doc, onGewijzigd, onVerwijderd }: Props) {
  const [modus, setModus] = useState<Modus>('kijken')
  const [concept, setConcept] = useState<DocConcept>(() => conceptVan(doc))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const pad = `/api/lifeos/pt-documenten/${doc.id}`

  function naar(m: Modus): void {
    setFout(null)
    if (m === 'bewerken') setConcept(conceptVan(doc))
    setModus(m)
  }

  async function bewaar(e: FormEvent): Promise<void> {
    e.preventDefault()
    setBezig(true)
    const uit = await haalJson(pad, leesDocument, { method: 'PATCH', body: JSON.stringify(metaVan(concept)) })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onGewijzigd(uit.waarde)
    setModus('kijken')
  }

  async function verwijder(): Promise<void> {
    setBezig(true)
    const uit = await haalJson(pad, leesNiets, { method: 'DELETE' })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onVerwijderd(doc.id)
  }

  const foutMelding = fout ? (
    <p className="ffdoc-fout" role="alert">
      {fout}
    </p>
  ) : null

  if (modus === 'bewerken') {
    return (
      <li>
        <form className="ptd-form" onSubmit={(e) => void bewaar(e)} aria-label={`${doc.titel} bewerken`}>
          <DocumentVelden id={`doc-${doc.id}`} waarde={concept} onWijzig={setConcept} uit={bezig} />
          {foutMelding}
          <div className="ptd-acties">
            <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig} aria-busy={bezig}>
              {bezig ? 'Opslaan…' : 'Opslaan'}
            </button>
            <button type="button" className="ptd-knop" onClick={() => naar('kijken')} disabled={bezig}>
              Annuleren
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="ptd-rij">
      <div className="ptd-rij-kop">
        <span className="ptd-naam">{doc.titel}</span>
        {doc.zichtbaar ? null : (
          <span className="ptd-badge ptd-badge--stil">
            <EyeOff size={13} aria-hidden="true" />
            Verborgen
          </span>
        )}
      </div>
      {doc.beschrijving ? <p className="ptd-tekst">{doc.beschrijving}</p> : null}
      <div className="ptd-meta">
        <span className="ptd-badge">{soortVanMime(doc.mime)?.label ?? 'Bestand'}</span>
        <span>{leesbareGrootte(doc.grootte)}</span>
        <span>volgorde {doc.volgorde}</span>
      </div>
      {modus === 'bevestigen' ? (
        <div className="ptd-acties ptd-acties--rij" role="group" aria-label="Verwijderen bevestigen">
          <span className="ptd-hint">Verwijderen? Het bestand gaat ook uit de opslag; PT&apos;ers zien het niet meer.</span>
          <button type="button" className="ptd-knop ptd-knop--klein ptd-knop--gevaar" onClick={() => void verwijder()} disabled={bezig} aria-busy={bezig}>
            {bezig ? 'Verwijderen…' : 'Ja, verwijderen'}
          </button>
          <button type="button" className="ptd-knop ptd-knop--klein" onClick={() => naar('kijken')} disabled={bezig} autoFocus>
            Annuleren
          </button>
        </div>
      ) : (
        <div className="ptd-acties ptd-acties--rij">
          <button type="button" className="ptd-knop ptd-knop--klein" onClick={() => naar('bewerken')} aria-label={`${doc.titel} bewerken`}>
            Bewerken
          </button>
          <button type="button" className="ptd-knop ptd-knop--klein ptd-knop--gevaar" onClick={() => naar('bevestigen')} aria-label={`${doc.titel} verwijderen`}>
            Verwijderen
          </button>
        </div>
      )}
      {foutMelding}
    </li>
  )
}
