'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { Plus, TriangleAlert } from 'lucide-react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { parseBedrag, vandaagDatum, type NieuweTransactie, type TransactieSoort } from './finance'

// De compacte inline-capture: bedrag, omschrijving, datum + een omzet/kosten-
// toggle → POST naar `/finance/transacties`. Bij succes wist het de invoer en
// laat de kaart het overzicht opnieuw ophalen (`onToegevoegd`). Fail fast op de
// systeemgrens: client-validatie vóór de POST, en de servermelding (bv. niet
// ingelogd of afgekeurd bedrag) komt letterlijk terug in `fout`.

interface SnelToevoegenProps {
  /** Roept de kaart aan om het overzicht te vernieuwen na een geslaagde POST. */
  onToegevoegd: () => void
  /** In de lege staat prominenter tonen — dan is dit dé volgende stap. */
  prominent?: boolean
}

export function SnelToevoegen({ onToegevoegd, prominent = false }: SnelToevoegenProps) {
  const [soort, setSoort] = useState<TransactieSoort>('omzet')
  const [bedrag, setBedrag] = useState('')
  const [omschrijving, setOmschrijving] = useState('')
  const [datum, setDatum] = useState(() => vandaagDatum())
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return

    const bedragNum = parseBedrag(bedrag)
    const tekst = omschrijving.trim()
    if (bedragNum === null || tekst === '') {
      setFout('Vul een bedrag groter dan 0 en een omschrijving in.')
      return
    }

    setBezig(true)
    setFout(null)
    const nieuw: NieuweTransactie = { soort, bedrag: bedragNum, omschrijving: tekst, datum }
    const uitkomst = await haalJson('/api/lifeos/finance/transacties', leesNiets, {
      method: 'POST',
      body: JSON.stringify(nieuw),
    })
    setBezig(false)

    if (!uitkomst.ok) {
      setFout(uitkomst.fout)
      return
    }
    setBedrag('')
    setOmschrijving('')
    onToegevoegd()
  }

  return (
    <form
      className={`fin__form${prominent ? ' fin__form--prominent' : ''}`}
      onSubmit={(e) => void verstuur(e)}
    >
      <div className="fin__velden">
        <Veld id="fin-bedrag" label="Bedrag (€)">
          <input
            id="fin-bedrag"
            className="fin__invoer"
            value={bedrag}
            onChange={(e) => setBedrag(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            autoComplete="off"
          />
        </Veld>
        <Veld id="fin-omschrijving" label="Omschrijving">
          <input
            id="fin-omschrijving"
            className="fin__invoer"
            value={omschrijving}
            onChange={(e) => setOmschrijving(e.target.value)}
            placeholder="Waarvoor?"
            maxLength={140}
            autoComplete="off"
          />
        </Veld>
        <Veld id="fin-datum" label="Datum">
          <input
            id="fin-datum"
            className="fin__invoer"
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
          />
        </Veld>
      </div>

      <div className="fin__onderrij">
        <SoortKiezer soort={soort} onKies={setSoort} />
        <button type="submit" className="fin__verzend" disabled={bezig}>
          <Plus size={15} strokeWidth={2.4} aria-hidden="true" />
          {bezig ? 'Bezig…' : 'Vastleggen'}
        </button>
      </div>

      {fout ? (
        <p className="fin__form-fout" role="alert">
          <TriangleAlert size={14} strokeWidth={2.2} aria-hidden="true" />
          {fout}
        </p>
      ) : null}
    </form>
  )
}

interface VeldProps {
  id: string
  label: string
  children: ReactNode
}

/** Gekoppeld label + control (a11y: elke invoer heeft een echte `<label>`). */
function Veld({ id, label, children }: VeldProps) {
  return (
    <div className="fin__veld">
      <label className="fin__veld-label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

interface SoortKiezerProps {
  soort: TransactieSoort
  onKies: (soort: TransactieSoort) => void
}

/** Segmentschakelaar omzet/kosten. Toegankelijk via `aria-pressed` in een group. */
function SoortKiezer({ soort, onKies }: SoortKiezerProps) {
  return (
    <div className="fin__soort" role="group" aria-label="Soort transactie">
      <SoortKnop actief={soort === 'omzet'} onClick={() => onKies('omzet')}>
        Omzet
      </SoortKnop>
      <SoortKnop actief={soort === 'kosten'} onClick={() => onKies('kosten')}>
        Kosten
      </SoortKnop>
    </div>
  )
}

interface SoortKnopProps {
  actief: boolean
  onClick: () => void
  children: string
}

function SoortKnop({ actief, onClick, children }: SoortKnopProps) {
  return (
    <button type="button" className="fin__soort-knop" aria-pressed={actief} onClick={onClick}>
      {children}
    </button>
  )
}
