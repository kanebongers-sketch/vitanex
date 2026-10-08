'use client'

import { useState } from 'react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { coachgesprekTitel, type PtStatus } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import type { VorigeEvaluatie } from '@/lib/lifeos/pt-gesprek/team'
import { leesAfrondResultaat } from '@/lib/lifeos/pt-coaching/pt-coaching'
import { VerslagDownload } from './VerslagDownload'
import { OpenPuntenKeuze } from './OpenPuntenKeuze'
import type { Oordeel } from '@/lib/lifeos/pt-coaching/aandachtspunten'
import { RITME_DAGEN } from '@/lib/lifeos/pt-gesprek/ritme'
import { LeadOverzicht } from './LeadOverzicht'

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
  // Het voorstel van LifeOS (een week na dit gesprek, zelfde tijd, vrij in je
  // agenda) staat al ingevuld: goedkeuren = afronden. Aanpassen mag altijd.
  const voorstel = pt.extra?.voorstelVolgende ? new Date(pt.extra.voorstelVolgende) : null
  const [scores, setScores] = useState<Record<ScoreKey, number>>({ algemeen: 3, energie: 3, voortgang: 3 })
  const [notitie, setNotitie] = useState('')
  const [aandachtspunt, setAandachtspunt] = useState('')
  const [planVolgende, setPlanVolgende] = useState(true)
  const [datum, setDatum] = useState(() => (voorstel ? dagSleutel(voorstel) : standaardDatum()))
  const [tijd, setTijd] = useState(() => (voorstel ? tijdSleutel(voorstel) : '10:00'))
  const isVoorstel = voorstel !== null && datum === dagSleutel(voorstel) && tijd === tijdSleutel(voorstel)
  const [oordelen, setOordelen] = useState<Record<string, Oordeel>>({})
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  // Opgeslagen, maar de afspraak of de mail lukte niet: die melding moet blijven
  // staan tot jij sluit. Eerder sloot het formulier meteen en zag je hem nooit.
  const [opgeslagenMelding, setOpgeslagenMelding] = useState<string | null>(null)
  // Eén sleutel per afronding: een dubbelklik of retry doet het niet twee keer.
  const [sleutel] = useState(() => crypto.randomUUID())

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
        sleutel,
        evaluatie: {
          scores,
          notitie: notitie.trim() || undefined,
          aandachtspunt: aandachtspunt.trim() || undefined,
        },
        volgendeStartOp,
        oordelen: Object.entries(oordelen).map(([id, oordeel]) => ({ id, oordeel })),
      }),
    })
    setBezig(false)

    if (!uitkomst.ok) {
      setFout(uitkomst.fout)
      return
    }
    // De evaluatie is opgeslagen; mislukte de volgende afspraak of de pdf-mail,
    // dan eerlijk melden i.p.v. doen alsof alles lukte.
    const missers = [uitkomst.waarde.afspraakFout, uitkomst.waarde.mailFout].filter((m): m is string => m !== null)
    if (missers.length > 0) {
      setOpgeslagenMelding(`Evaluatie opgeslagen. Maar: ${missers.join(' ')}`)
      return
    }
    await onKlaar()
  }

  return (
    <div style={{ display: 'grid', gap: 12, paddingTop: 10 }}>
      {pt.extra?.vorige ? <VorigeKeer vorige={pt.extra.vorige} /> : null}
      {pt.extra?.leads ? <LeadOverzicht leads={pt.extra.leads} pinActief={pt.extra.leadLink?.pinStatus === 'actief'} /> : null}
      <OpenPuntenKeuze
        punten={pt.extra?.openPunten ?? []}
        oordelen={oordelen}
        onKies={(id, oordeel) =>
          setOordelen((huidig) =>
            oordeel ? { ...huidig, [id]: oordeel } : Object.fromEntries(Object.entries(huidig).filter(([k]) => k !== id)),
          )
        }
      />
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
        {planVolgende && isVoorstel ? (
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>
            <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Voorstel:</span> {MOMENT.format(voorstel)} — een week na
            dit gesprek en vrij in je agenda. Pas aan of keur goed.
          </p>
        ) : null}
        {planVolgende ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} aria-label="Datum volgende afspraak" style={veldStijl} />
            <input type="time" value={tijd} onChange={(e) => setTijd(e.target.value)} aria-label="Tijd volgende afspraak" style={veldStijl} />
          </div>
        ) : null}
      </div>

      {opgeslagenMelding ? (
        <>
          <Foutmelding bericht={opgeslagenMelding} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Knop variant="primair" onClick={() => void onKlaar()}>Sluiten</Knop>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <Knop variant="primair" onClick={() => void afronden()} disabled={bezig}>
            {bezig ? 'Bezig…' : planVolgende ? 'Afronden + volgende inplannen' : 'Coaching afronden'}
          </Knop>
          <Knop onClick={onAnnuleer} disabled={bezig}>Annuleren</Knop>
        </div>
      )}
      {fout ? <Foutmelding bericht={fout} /> : null}
      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-4)' }}>
        Afspraak heet: “{coachgesprekTitel(pt.naam)}”. Het verslag gaat als pdf naar je mail.
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

const MOMENT = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const DAG_KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })

function dagSleutel(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function tijdSleutel(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Wat jullie vorige keer bespraken — zodat je niet blanco begint. */
function VorigeKeer({ vorige }: { vorige: VorigeEvaluatie }) {
  const { algemeen, energie, voortgang } = vorige.scores
  return (
    <div style={{ display: 'grid', gap: 4, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-raised)' }}>
      <p style={{ ...labelStijl, margin: 0 }}>
        Vorige keer · {DAG_KORT.format(new Date(vorige.op))} · algemeen {algemeen}/5 · energie {energie}/5 · voortgang {voortgang}/5
        {' · '}
        <VerslagDownload id={vorige.id} />
      </p>
      {vorige.notitie ? <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{vorige.notitie}</p> : null}
      {vorige.aandachtspunt ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>
          <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Aandachtspunt:</span> {vorige.aandachtspunt}
        </p>
      ) : null}
    </div>
  )
}

/** Standaard: over één ritme (een week), als YYYY-MM-DD (lokaal). */
function standaardDatum(): string {
  const d = new Date()
  d.setDate(d.getDate() + RITME_DAGEN)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
