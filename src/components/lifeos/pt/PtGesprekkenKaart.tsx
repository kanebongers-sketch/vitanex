'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarPlus, Check, ChevronDown, Mail, MailX } from 'lucide-react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { Knop } from '@/components/lifeos/os/Knop'
import { useRefreshSignaal } from '@/components/lifeos/os/RefreshContext'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import {
  coachgesprekTitel,
  leesPtGesprekken,
  type PtGesprekkenAntwoord,
  type PtStatus,
} from '@/lib/lifeos/pt-gesprek/pt-gesprek'

// Container: het 2-wekelijkse PT-coachgesprek. Per PT-klant of er binnen 14 dagen
// een "Coachgesprek PT - Kane (Naam)" in je agenda staat. Zo niet: één knop plant
// 'm in en nodigt de klant uit via mail (uit je CRM). Zie /api/lifeos/pt-gesprekken.
//
// SUPER OVERZICHTELIJK: het draait om wie er NOG moet. Die staan vooraan met de
// inplan-knop; wie al geregeld is, zit ingeklapt achter één regel — zo verdringt
// het afgevinkte het openstaande niet.

const GESPREK_DUUR_MIN = 30

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; data: PtGesprekkenAntwoord }

export function PtGesprekkenKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const signaal = useRefreshSignaal()

  // Generatieteller: een trage oudere vlucht mag een verse stand niet overschrijven.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/pt-gesprekken', leesPtGesprekken).then((uitkomst) => {
      if (mijn !== generatie.current) return
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', data: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  useEffect(() => {
    void laad()
    return () => {
      generatie.current++
    }
  }, [laad, signaal])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  return (
    <Kaart titel="PT-gesprekken" vervangt="Je hoofd">
      {staat.fase === 'laden' ? <Skelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' && !staat.data.gekoppeld ? (
        <NogNiets
          wat="Agenda niet gekoppeld"
          waarom="Koppel je Google Agenda, dan zie je hier per PT-klant of het 2-wekelijkse coachgesprek al gepland staat — en plan je 'm met één knop in."
        />
      ) : null}
      {staat.fase === 'ok' && staat.data.gekoppeld ? (
        <Overzicht pts={staat.data.pts} onGepland={laad} />
      ) : null}
    </Kaart>
  )
}

function Overzicht({ pts, onGepland }: { pts: PtStatus[]; onGepland: () => Promise<void> }) {
  const [toonGeregeld, setToonGeregeld] = useState(false)

  if (pts.length === 0) {
    return (
      <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
        Nog geen PT-klanten in je mensen-bord. Voeg ze toe (groep PT-klant), dan verschijnen ze hier.
      </p>
    )
  }

  const teDoen = pts.filter((p) => !p.ingepland)
  const geregeld = pts.filter((p) => p.ingepland)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <p className="os-cijfer" style={{ fontSize: 34, lineHeight: 1, margin: '0 0 4px', color: 'var(--brand)' }}>
          {teDoen.length}
        </p>
        <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: 0, fontWeight: 600 }}>
          {teDoen.length === 1 ? 'PT wacht nog op een gesprek' : 'PT’s wachten nog op een gesprek'}
        </p>
      </div>

      {teDoen.length > 0 ? (
        <ul style={{ display: 'grid', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
          {teDoen.map((pt) => (
            <li key={pt.id}>
              <TeDoenRij pt={pt} onGepland={onGepland} />
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>
          <Check size={15} strokeWidth={2.2} aria-hidden style={{ color: 'var(--brand)' }} />
          Alle PT-gesprekken staan gepland.
        </p>
      )}

      {geregeld.length > 0 ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <button
            type="button"
            onClick={() => setToonGeregeld((v) => !v)}
            aria-expanded={toonGeregeld}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, justifySelf: 'start',
              fontSize: 12, fontWeight: 600, color: 'var(--text-3)',
              background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer',
            }}
          >
            <ChevronDown
              size={14} strokeWidth={2.2} aria-hidden
              style={{ transform: toonGeregeld ? 'rotate(180deg)' : 'none', transition: 'transform 180ms var(--ease)' }}
            />
            {toonGeregeld ? 'Verberg' : 'Toon'} geplande gesprekken · {geregeld.length}
          </button>
          {toonGeregeld ? (
            <ul style={{ display: 'grid', gap: 6, listStyle: 'none', padding: 0, margin: 0 }}>
              {geregeld.map((pt) => (
                <li
                  key={pt.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-3)' }}
                >
                  <Check size={14} strokeWidth={2.2} aria-hidden style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{pt.naam}</span>
                  {pt.wanneer ? <span style={{ color: 'var(--text-4)' }}>· {datumLabel(pt.wanneer)}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Eén openstaande PT: naam + mail-status, en een inline inplan-formulier. */
function TeDoenRij({ pt, onGepland }: { pt: PtStatus; onGepland: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [datum, setDatum] = useState(standaardDatum)
  const [tijd, setTijd] = useState('10:00')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function plan() {
    const start = new Date(`${datum}T${tijd}`)
    if (Number.isNaN(start.getTime())) {
      setFout('Kies een geldige datum en tijd.')
      return
    }
    setBezig(true)
    setFout(null)
    const eind = new Date(start.getTime() + GESPREK_DUUR_MIN * 60_000)
    const uitkomst = await haalJson('/api/lifeos/agenda/events', leesNiets, {
      method: 'POST',
      body: JSON.stringify({
        titel: coachgesprekTitel(pt.naam),
        startOp: start.toISOString(),
        eindOp: eind.toISOString(),
        genodigden: pt.email ? [pt.email] : [],
      }),
    })
    setBezig(false)
    if (!uitkomst.ok) {
      setFout(uitkomst.fout)
      return
    }
    await onGepland() // de kaart herlaadt; deze rij verdwijnt naar "geregeld"
  }

  return (
    <div style={{ display: 'grid', gap: 8, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{pt.naam}</p>
          <p style={{ margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-4)' }}>
            {pt.email ? (
              <>
                <Mail size={12} aria-hidden /> Nodigt {pt.email} uit
              </>
            ) : (
              <>
                <MailX size={12} aria-hidden /> Geen mailadres — plant in zonder uitnodiging
              </>
            )}
          </p>
        </div>
        {!open ? (
          <Knop variant="primair" onClick={() => setOpen(true)}>
            <CalendarPlus size={14} strokeWidth={2.2} aria-hidden />
            Inplannen
          </Knop>
        ) : null}
      </div>

      {open ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              aria-label={`Datum coachgesprek ${pt.naam}`}
              style={veldStijl}
            />
            <input
              type="time"
              value={tijd}
              onChange={(e) => setTijd(e.target.value)}
              aria-label={`Tijd coachgesprek ${pt.naam}`}
              style={veldStijl}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Knop variant="primair" onClick={() => void plan()} disabled={bezig}>
              {bezig ? 'Bezig…' : pt.email ? 'Inplannen + uitnodigen' : 'Inplannen'}
            </Knop>
            <Knop onClick={() => { setOpen(false); setFout(null) }} disabled={bezig}>
              Annuleren
            </Knop>
          </div>
          {fout ? <Foutmelding bericht={fout} /> : null}
        </div>
      ) : null}
    </div>
  )
}

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

/** Standaarddatum: overmorgen, als YYYY-MM-DD in lokale tijd. Een rustig startpunt. */
function standaardDatum(): string {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function datumLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Rustige placeholder in navy. Geen spinner-spektakel. */
function Skelet() {
  return (
    <div aria-hidden style={{ display: 'grid', gap: 9 }}>
      <div style={{ height: 34, width: '22%', borderRadius: 6, background: 'var(--bg-raised)' }} />
      <div style={{ height: 13, width: '52%', borderRadius: 4, background: 'var(--bg-raised)' }} />
      <div style={{ height: 40, width: '100%', borderRadius: 8, background: 'var(--bg-raised)' }} />
    </div>
  )
}
