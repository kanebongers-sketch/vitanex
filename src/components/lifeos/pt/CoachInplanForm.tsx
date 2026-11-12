'use client'

import { useState } from 'react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import type { PtStatus } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import { planCoachgesprek } from './coach-plannen'
import { veld } from './PtInplanForm'

// De eerste coachgesprek-afspraak zetten (zonder evaluatie): datum en tijd,
// dan een POST naar de agenda. Met een mailadres gaat er een uitnodiging mee.

interface Props {
  pt: PtStatus
  onKlaar: () => Promise<void>
  onAnnuleer: () => void
  /** Voorgestelde datum (YYYY-MM-DD), bijvoorbeeld in de week van het blokje waarop geklikt is. */
  startDatum?: string
  /** Voorgestelde tijd (HH:MM), bijvoorbeeld uit het vaste patroon van de PT'er. */
  startTijd?: string
}

/** Standaarddatum voor een eerste afspraak: overmorgen (lokaal, YYYY-MM-DD). */
function standaardDatum(): string {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CoachInplanForm({ pt, onKlaar, onAnnuleer, startDatum, startTijd }: Props) {
  const [datum, setDatum] = useState(() => startDatum ?? standaardDatum())
  const [tijd, setTijd] = useState(startTijd ?? '10:00')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function plan() {
    setBezig(true)
    setFout(null)
    const uitkomst = await planCoachgesprek(pt, datum, tijd)
    setBezig(false)
    if (!uitkomst.ok) {
      setFout(uitkomst.fout)
      return
    }
    await onKlaar()
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} aria-label={`Datum afspraak ${pt.naam}`} style={veld} />
        <input type="time" value={tijd} onChange={(e) => setTijd(e.target.value)} aria-label={`Tijd afspraak ${pt.naam}`} style={veld} />
      </div>
      <p className="ptd-hint">{pt.email ? `Uitnodiging naar ${pt.email}.` : 'Geen mailadres bekend: er gaat geen uitnodiging mee.'}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Knop variant="primair" onClick={() => void plan()} disabled={bezig}>
          {bezig ? 'Bezig…' : pt.email ? 'Inplannen en uitnodigen' : 'Inplannen'}
        </Knop>
        <Knop onClick={onAnnuleer} disabled={bezig}>Annuleren</Knop>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </div>
  )
}
