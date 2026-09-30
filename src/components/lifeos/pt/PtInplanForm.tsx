'use client'

import { useState, type CSSProperties } from 'react'
import { CalendarPlus, Repeat } from 'lucide-react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { Knop } from '@/components/lifeos/os/Knop'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { LOCATIE_LABEL, ptSessieTitel, type PtWeekStatus } from '@/lib/lifeos/pt-klant/pt-klant'
import { SESSIE_MIN, type InplanVoorstel } from '@/lib/lifeos/pt-klant/voorstel'

// Een sessie inplannen voor één klant. Bovenaan de voorstellen van LifeOS (je
// gebruikelijke moment met deze klant, dan vrije momenten in je agenda): één tik
// en hij staat erin, met de juiste titel en locatie. Daaronder vrij een eigen
// moment kiezen. Presentationeel + één POST; de kaart herlaadt na succes.

export const veld: CSSProperties = {
  appearance: 'none',
  fontFamily: 'inherit',
  fontSize: 13,
  color: 'var(--text-1)',
  background: 'var(--bg-raised)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '7px 10px',
}

const MOMENT_FMT = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Europe/Amsterdam',
})

function morgen(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Props {
  klant: PtWeekStatus
  onKlaar: () => Promise<void>
  onAnnuleer: () => void
}

export function InplanForm({ klant, onKlaar, onAnnuleer }: Props) {
  const [datum, setDatum] = useState(morgen)
  const [tijd, setTijd] = useState('10:00')
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const voorstellen = klant.voorstellen ?? []
  const loc = klant.locatie ? LOCATIE_LABEL[klant.locatie] : null

  async function plan(start: Date, sleutel: string) {
    if (Number.isNaN(start.getTime())) {
      setFout('Kies een geldige datum en tijd.')
      return
    }
    setBezig(sleutel)
    setFout(null)
    const eind = new Date(start.getTime() + SESSIE_MIN * 60_000)
    const uitkomst = await haalJson('/api/lifeos/agenda/events', leesNiets, {
      method: 'POST',
      body: JSON.stringify({
        titel: ptSessieTitel(klant.naam, klant.locatie),
        startOp: start.toISOString(),
        eindOp: eind.toISOString(),
        locatie: loc ?? undefined,
      }),
    })
    setBezig(null)
    if (!uitkomst.ok) {
      setFout(uitkomst.fout)
      return
    }
    await onKlaar()
  }

  return (
    <div style={{ display: 'grid', gap: 10, paddingTop: 4 }}>
      {voorstellen.length > 0 ? (
        <div style={{ display: 'grid', gap: 6 }}>
          <p style={kop}>Voorstel{loc ? ` · ${loc}` : ''}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {voorstellen.map((v) => (
              <VoorstelKnop
                key={v.startOp}
                voorstel={v}
                bezig={bezig === v.startOp}
                uit={bezig !== null}
                onKies={() => void plan(new Date(v.startOp), v.startOp)}
              />
            ))}
          </div>
          <p style={kop}>Of kies zelf</p>
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} aria-label="Datum sessie" style={veld} />
        <input type="time" value={tijd} onChange={(e) => setTijd(e.target.value)} aria-label="Tijd sessie" style={veld} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Knop variant="primair" onClick={() => void plan(new Date(`${datum}T${tijd}`), 'eigen')} disabled={bezig !== null}>
          {bezig === 'eigen' ? 'Bezig…' : `Inplannen${loc ? ` in ${loc}` : ''}`}
        </Knop>
        <Knop onClick={onAnnuleer} disabled={bezig !== null}>
          Annuleren
        </Knop>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </div>
  )
}

const kop: CSSProperties = {
  margin: 0,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
}

interface VoorstelKnopProps {
  voorstel: InplanVoorstel
  bezig: boolean
  uit: boolean
  onKies: () => void
}

/** Eén tik = ingepland. "Zoals meestal" krijgt een herhaal-icoon, vrije momenten een agenda-icoon. */
function VoorstelKnop({ voorstel, bezig, uit, onKies }: VoorstelKnopProps) {
  const moment = MOMENT_FMT.format(new Date(voorstel.startOp))
  const gewoonte = voorstel.reden === 'gewoonte'
  const Icoon = gewoonte ? Repeat : CalendarPlus
  return (
    <Knop onClick={onKies} disabled={uit} aria-label={`Plan in op ${moment}${gewoonte ? ', zoals meestal' : ''}`}>
      <Icoon size={13} strokeWidth={2.2} aria-hidden />
      {bezig ? 'Bezig…' : moment}
      {gewoonte && !bezig ? <span style={{ color: 'var(--text-4)', fontWeight: 500 }}>· zoals meestal</span> : null}
    </Knop>
  )
}
