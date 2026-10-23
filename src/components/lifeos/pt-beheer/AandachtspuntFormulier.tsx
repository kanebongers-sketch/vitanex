'use client'

import { useId, useState, type FormEvent } from 'react'
import { MAX_LINK, MAX_TITEL, MAX_UITLEG, type Aandachtspunt } from '@/lib/lifeos/pt-dashboard/belangrijk'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'

// Kane: een algemeen aandachtspunt toevoegen of wijzigen (titel, korte uitleg,
// optionele link). De server controleert alles opnieuw (leesBelangrijkActie).

export interface PuntInvoer {
  titel: string
  uitleg: string
  link: string
}

interface Props {
  kop: string
  begin?: Aandachtspunt
  knop: string
  /** Geeft een foutmelding terug, of null als het gelukt is. */
  opslaan: (v: PuntInvoer) => Promise<string | null>
  annuleren?: () => void
}

export function AandachtspuntFormulier({ kop, begin, knop, opslaan, annuleren }: Props) {
  const id = useId()
  const [v, setV] = useState<PuntInvoer>({ titel: begin?.titel ?? '', uitleg: begin?.uitleg ?? '', link: begin?.link ?? '' })
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!v.titel.trim()) return setFout('Vul een titel in.')
    setBezig(true)
    setFout(null)
    const f = await opslaan(v)
    setBezig(false)
    if (f) return setFout(f)
    if (!begin) setV({ titel: '', uitleg: '', link: '' })
  }

  return (
    <form className="ptd-form" onSubmit={(e) => void verstuur(e)} aria-labelledby={`${id}-kop`} noValidate>
      <h3 id={`${id}-kop`}>{kop}</h3>
      <div className="ptd-veld">
        <label htmlFor={`${id}-titel`}>Titel *</label>
        <input
          id={`${id}-titel`}
          className="ptd-invoer"
          value={v.titel}
          onChange={(e) => setV({ ...v, titel: e.target.value })}
          maxLength={MAX_TITEL}
          placeholder="bv. Vraag om referrals"
          required
        />
      </div>
      <div className="ptd-veld">
        <label htmlFor={`${id}-uitleg`}>Korte uitleg</label>
        <textarea
          id={`${id}-uitleg`}
          className="ptd-invoer"
          rows={2}
          value={v.uitleg}
          onChange={(e) => setV({ ...v, uitleg: e.target.value })}
          maxLength={MAX_UITLEG}
          aria-describedby={`${id}-uitleg-hint`}
        />
        <p className="ptd-hint" id={`${id}-uitleg-hint`}>
          Wat de PT&apos;er doet en wanneer · {v.uitleg.length}/{MAX_UITLEG}
        </p>
      </div>
      <div className="ptd-veld">
        <label htmlFor={`${id}-link`}>Link (optioneel)</label>
        <input
          id={`${id}-link`}
          className="ptd-invoer"
          value={v.link}
          onChange={(e) => setV({ ...v, link: e.target.value })}
          maxLength={MAX_LINK}
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="https://… of /bibliotheek"
          aria-describedby={`${id}-link-hint`}
        />
        <p className="ptd-hint" id={`${id}-link-hint`}>
          Een https-link, of een pagina in de PT-app zoals /bibliotheek of /klanten (dan opent elke PT&apos;er zijn eigen pagina).
        </p>
      </div>
      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig}>
          {bezig ? 'Opslaan…' : knop}
        </button>
        {annuleren ? (
          <button type="button" className="ptd-knop" onClick={annuleren}>
            Annuleren
          </button>
        ) : null}
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
