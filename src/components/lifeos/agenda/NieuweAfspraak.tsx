'use client'

import { useState, type CSSProperties, type FormEvent } from 'react'
import { CalendarPlus } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { datumSleutel } from '@/lib/lifeos/datum/datum'

// Presentationeel: velden erin, één callback eruit. De optimistische update,
// de POST en de rollback horen bij de container (AgendaKaart) — dit component
// weet daar niets van. Het bouwt alleen de invoer en toont het formulier.
//
// Vervangt Google Calendar openen om iets in te plannen: titel, dag, begin- en
// eindtijd, optioneel een locatie. Meer niet — dit is geen agenda-editor.

export interface NieuwEventInvoer {
  titel: string
  /** ISO-moment (lokaal → UTC). */
  startOp: string
  eindOp: string
  locatie?: string
}

interface NieuweAfspraakProps {
  /** Voegt toe. Geeft een nette fout terug i.p.v. te gooien, zodat het formulier 'm kan tonen. */
  onToevoegen: (invoer: NieuwEventInvoer) => Promise<{ ok: true } | { ok: false; fout: string }>
}

/** Datum + tijd (beide lokaal) → een Date, of null als de combinatie onzin is. */
function bouwMoment(datum: string, tijd: string): Date | null {
  if (!datum || !tijd) return null
  const d = new Date(`${datum}T${tijd}`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function NieuweAfspraak({ onToevoegen }: NieuweAfspraakProps) {
  // De dag pas ná mount bepalen (dit component rendert alleen client-side, ná de
  // fetch): `new Date()` tijdens SSR geeft de servertijd, niet de jouwe.
  const [datum, setDatum] = useState(() => datumSleutel(new Date()))
  const [titel, setTitel] = useState('')
  const [begin, setBegin] = useState('09:00')
  const [eind, setEind] = useState('10:00')
  const [locatie, setLocatie] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  const kanVersturen = titel.trim().length > 0 && !bezig

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!kanVersturen) return

    const start = bouwMoment(datum, begin)
    const einde = bouwMoment(datum, eind)
    if (!start || !einde) {
      setFout('Vul een geldige dag, begin- en eindtijd in.')
      return
    }
    if (einde.getTime() < start.getTime()) {
      setFout('De eindtijd ligt vóór de begintijd.')
      return
    }

    setBezig(true)
    setFout(null)
    const uitkomst = await onToevoegen({
      titel: titel.trim(),
      startOp: start.toISOString(),
      eindOp: einde.toISOString(),
      ...(locatie.trim() ? { locatie: locatie.trim() } : {}),
    })
    setBezig(false)

    if (!uitkomst.ok) {
      setFout(uitkomst.fout)
      return
    }
    // Gelukt: titel en locatie leeg, dag en tijden laten staan voor de volgende.
    setTitel('')
    setLocatie('')
  }

  return (
    <form onSubmit={(e) => void verstuur(e)} style={FORM}>
      <div style={{ display: 'grid', gap: 4 }}>
        <label htmlFor="afspraak-titel" style={LABEL}>
          Nieuwe afspraak
        </label>
        <input
          id="afspraak-titel"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Waar gaat het over?"
          maxLength={1024}
          style={INVOER}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Veld label="Dag" htmlFor="afspraak-datum">
          <input
            id="afspraak-datum"
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            style={{ ...INVOER, colorScheme: 'dark' }}
          />
        </Veld>
        <Veld label="Van" htmlFor="afspraak-begin">
          <input
            id="afspraak-begin"
            type="time"
            value={begin}
            onChange={(e) => setBegin(e.target.value)}
            style={{ ...INVOER, colorScheme: 'dark' }}
          />
        </Veld>
        <Veld label="Tot" htmlFor="afspraak-eind">
          <input
            id="afspraak-eind"
            type="time"
            value={eind}
            onChange={(e) => setEind(e.target.value)}
            style={{ ...INVOER, colorScheme: 'dark' }}
          />
        </Veld>
      </div>

      <div style={{ display: 'grid', gap: 4 }}>
        <label htmlFor="afspraak-locatie" style={LABEL}>
          Locatie <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(optioneel)</span>
        </label>
        <input
          id="afspraak-locatie"
          value={locatie}
          onChange={(e) => setLocatie(e.target.value)}
          placeholder="Waar?"
          maxLength={1024}
          style={INVOER}
        />
      </div>

      <div>
        <Knop type="submit" variant="primair" disabled={!kanVersturen}>
          <CalendarPlus size={14} strokeWidth={2.2} aria-hidden="true" />
          {bezig ? 'Bezig…' : 'Zet in agenda'}
        </Knop>
      </div>

      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}

function Veld({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <label htmlFor={htmlFor} style={LABEL}>
        {label}
      </label>
      {children}
    </div>
  )
}

const FORM: CSSProperties = {
  display: 'grid',
  gap: 12,
  paddingTop: 16,
  marginTop: 4,
  borderTop: '1px solid var(--line)',
}

const LABEL: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
}

const INVOER: CSSProperties = {
  minWidth: 0,
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
}
