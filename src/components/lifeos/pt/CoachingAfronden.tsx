'use client'

import { useState } from 'react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { coachgesprekTitel, type PtStatus } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import { leesAfrondResultaat } from '@/lib/lifeos/pt-coaching/pt-coaching'

// Het formulier dat je invult wanneer je een coaching hebt gehad: drie korte
// scores + een notitie, en meteen de volgende afspraak. Eén "Afronden" slaat de
// evaluatie op, logt 'm in de tijdlijn en plant de volgende in (flexibel — jij
// kiest datum/tijd). Zie POST /api/lifeos/pt-gesprekken/afronden.

interface Props {
  pt: PtStatus
  /** Refetch + sluiten na een geslaagde afronding. */
  onKlaar: () => Promise<void>
  onAnnuleer: () => void
}

const SCORE_LABELS = [
  { key: 'algemeen', label: 'Algemeen gevoel' },
  { key: 'energie', label: 'Energie / motivatie' },
  { key: 'voortgang', label: 'Voortgang richting doel' },
] as const

type ScoreKey = (typeof SCORE_LABELS)[number]['key']

export function CoachingAfronden({ pt, onKlaar, onAnnuleer }: Props) {
  const [scores, setScores] = useState<Record<ScoreKey, number>>({ algemeen: 3, energie: 3, voortgang: 3 })
  const [notitie, setNotitie] = useState('')
  const [aandachtspunt, setAandachtspunt] = useState('')
  const [planVolgende, setPlanVolgende] = useState(true)
  const [datum, setDatum] = useState(standaardDatum)
  const [tijd, setTijd] = useState('10:00')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function afronden() {
    let volgendeStartOp: string | undefined
    if (planVolgende) {
      const start = new Date(`${datum}T${tijd}`)
      if (Number.isNaN(start.getTime())) {
        setFout('Kies een geldige datum en tijd voor de volgende afspraak.')
        return
      }
      volgendeStartOp = start.toISOString()
    }

    setBezig(true)
    setFout(null)
    const uitkomst = await haalJson('/api/lifeos/pt-gesprekken/afronden', leesAfrondResultaat, {
      method: 'POST',
      body: JSON.stringify({
        persoonId: pt.id,
        evaluatie: {
          scores,
          notitie: notitie.trim() || undefined,
          aandachtspunt: aandachtspunt.trim() || undefined,
        },
        volgendeStartOp,
      }),
    })
    setBezig(false)

    if (!uitkomst.ok) {
      setFout(uitkomst.fout)
      return
    }
    if (uitkomst.waarde.afspraakFout) {
      // De evaluatie is opgeslagen; alleen de volgende afspraak miste. Eerlijk
      // melden i.p.v. doen alsof alles lukte — de kaart herlaadt zodat je 'm
      // handmatig kunt inplannen.
      setFout(`Evaluatie opgeslagen. Maar: ${uitkomst.waarde.afspraakFout}`)
      await onKlaar()
      return
    }
    await onKlaar()
  }

  return (
    <div style={{ display: 'grid', gap: 12, paddingTop: 10 }}>
      {SCORE_LABELS.map(({ key, label }) => (
        <ScoreKiezer
          key={key}
          label={label}
          waarde={scores[key]}
          onKies={(n) => setScores((s) => ({ ...s, [key]: n }))}
        />
      ))}

      <label style={{ display: 'grid', gap: 4 }}>
        <span style={labelStijl}>Wat besproken (optioneel)</span>
        <textarea
          value={notitie}
          onChange={(e) => setNotitie(e.target.value)}
          rows={2}
          style={{ ...veldStijl, resize: 'vertical' }}
          placeholder="Kort verslag van de sessie"
        />
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        <span style={labelStijl}>Aandachtspunt / rode vlag (optioneel)</span>
        <input
          value={aandachtspunt}
          onChange={(e) => setAandachtspunt(e.target.value)}
          style={veldStijl}
          placeholder="Iets om in de gaten te houden"
        />
      </label>

      <div style={{ display: 'grid', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
          <input type="checkbox" checked={planVolgende} onChange={(e) => setPlanVolgende(e.target.checked)} />
          Volgende afspraak nu inplannen{pt.email ? ' + uitnodigen' : ''}
        </label>
        {planVolgende ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} aria-label="Datum volgende afspraak" style={veldStijl} />
            <input type="time" value={tijd} onChange={(e) => setTijd(e.target.value)} aria-label="Tijd volgende afspraak" style={veldStijl} />
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Knop variant="primair" onClick={() => void afronden()} disabled={bezig}>
          {bezig ? 'Bezig…' : 'Coaching afronden'}
        </Knop>
        <Knop onClick={onAnnuleer} disabled={bezig}>Annuleren</Knop>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-4)' }}>
        Afspraak heet: “{coachgesprekTitel(pt.naam)}”.
      </p>
    </div>
  )
}

function ScoreKiezer({ label, waarde, onKies }: { label: string; waarde: number; onKies: (n: number) => void }) {
  return (
    <div style={{ display: 'grid', gap: 5 }}>
      <span style={labelStijl}>{label}</span>
      <div role="group" aria-label={label} style={{ display: 'inline-flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const actief = n === waarde
          return (
            <button
              key={n}
              type="button"
              aria-pressed={actief}
              onClick={() => onKies(n)}
              style={{
                width: 34, height: 32, cursor: 'pointer',
                borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                border: `1px solid ${actief ? 'var(--brand)' : 'var(--line)'}`,
                background: actief ? 'var(--brand-soft)' : 'transparent',
                color: actief ? 'var(--brand)' : 'var(--text-3)',
                transition: 'color 150ms, background 150ms, border-color 150ms',
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const labelStijl: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: 'var(--text-4)' }

const veldStijl: React.CSSProperties = {
  appearance: 'none',
  fontFamily: 'inherit',
  fontSize: 13,
  color: 'var(--text-1)',
  background: 'var(--bg-raised)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '7px 10px',
}

/** Standaard: over 2 weken, als YYYY-MM-DD (lokaal). De cadans is ~2-wekelijks. */
function standaardDatum(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
