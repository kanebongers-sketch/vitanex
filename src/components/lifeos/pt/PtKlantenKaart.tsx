'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CalendarPlus, Check, ChevronDown, Palmtree, Settings2 } from 'lucide-react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { Knop } from '@/components/lifeos/os/Knop'
import { useRefreshSignaal } from '@/components/lifeos/os/RefreshContext'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { PT_LOCATIES, type PtLocatie } from '@/lib/lifeos/crm/crm'
import {
  LOCATIE_LABEL,
  leesPtKlanten,
  ptSessieTitel,
  type PtKlantenAntwoord,
  type PtWeekStatus,
} from '@/lib/lifeos/pt-klant/pt-klant'

// Container: de wekelijkse PT-sessies. Per klant of er deze week genoeg gepland
// staat (1× of 2×), wie er nog moet, wie op vakantie is. Eén knop plant een
// sessie in (op de juiste locatie). Zo vergeet je nooit iemand.

const SESSIE_DUUR_MIN = 60

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; data: PtKlantenAntwoord }

export function PtKlantenKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const signaal = useRefreshSignaal()
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/pt-klanten', leesPtKlanten).then((u) => {
      if (mijn !== generatie.current) return
      setStaat(u.ok ? { fase: 'ok', data: u.waarde } : { fase: 'fout', bericht: u.fout })
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
    <Kaart titel="PT-klanten deze week" vervangt="Je geheugen">
      {staat.fase === 'laden' ? <Skelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' && !staat.data.gekoppeld ? (
        <NogNiets
          wat="Agenda niet gekoppeld"
          waarom="Koppel je Google Agenda, dan zie je hier per PT-klant of er deze week genoeg sessies gepland staan — en plan je ze met één knop in."
        />
      ) : null}
      {staat.fase === 'ok' && staat.data.gekoppeld ? (
        <Overzicht klanten={staat.data.klanten} onVernieuw={laad} />
      ) : null}
    </Kaart>
  )
}

function Overzicht({ klanten, onVernieuw }: { klanten: PtWeekStatus[]; onVernieuw: () => Promise<void> }) {
  const [toonRest, setToonRest] = useState(false)

  if (klanten.length === 0) {
    return (
      <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
        Nog geen PT-klanten in je mensen-bord. Voeg ze toe (groep PT-klant), dan verschijnen ze hier.
      </p>
    )
  }

  const teDoen = klanten.filter((k) => k.tekort > 0 && !k.opVakantie)
  const rest = klanten.filter((k) => !(k.tekort > 0 && !k.opVakantie))

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <p className="os-cijfer" style={{ fontSize: 34, lineHeight: 1, margin: '0 0 4px', color: 'var(--brand)' }}>
          {teDoen.length}
        </p>
        <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: 0, fontWeight: 600 }}>
          {teDoen.length === 1 ? 'klant moet nog ingepland' : 'klanten moeten nog ingepland'}
        </p>
      </div>

      {teDoen.length > 0 ? (
        <ul style={{ display: 'grid', gap: 4, listStyle: 'none', padding: 0, margin: 0 }}>
          {teDoen.map((k) => (
            <li key={k.id}>
              <KlantRij klant={k} onVernieuw={onVernieuw} />
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>
          <Check size={15} strokeWidth={2.2} aria-hidden style={{ color: 'var(--brand)' }} />
          Iedereen zit deze week op schema.
        </p>
      )}

      {rest.length > 0 ? (
        <div style={{ display: 'grid', gap: 6 }}>
          <button
            type="button"
            onClick={() => setToonRest((v) => !v)}
            aria-expanded={toonRest}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, justifySelf: 'start',
              fontSize: 12, fontWeight: 600, color: 'var(--text-3)',
              background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer',
            }}
          >
            <ChevronDown
              size={14} strokeWidth={2.2} aria-hidden
              style={{ transform: toonRest ? 'rotate(180deg)' : 'none', transition: 'transform 180ms var(--ease)' }}
            />
            {toonRest ? 'Verberg' : 'Toon'} op schema / op vakantie · {rest.length}
          </button>
          {toonRest ? (
            <ul style={{ display: 'grid', gap: 4, listStyle: 'none', padding: 0, margin: 0 }}>
              {rest.map((k) => (
                <li key={k.id}>
                  <KlantRij klant={k} onVernieuw={onVernieuw} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

type Modus = 'dicht' | 'inplannen' | 'instellen'

function KlantRij({ klant, onVernieuw }: { klant: PtWeekStatus; onVernieuw: () => Promise<void> }) {
  const [modus, setModus] = useState<Modus>('dicht')

  async function sluitEnVernieuw() {
    setModus('dicht')
    await onVernieuw()
  }

  const locLabel = klant.locatie ? LOCATIE_LABEL[klant.locatie] : 'geen locatie'

  return (
    <div style={{ display: 'grid', gap: 8, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{klant.naam}</p>
          <p style={{ margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-4)' }}>
            {klant.opVakantie ? (
              <>
                <Palmtree size={12} aria-hidden /> Op vakantie
              </>
            ) : (
              <>
                {locLabel} · {klant.ingepland}/{klant.sessiesPerWeek} deze week
              </>
            )}
          </p>
        </div>
        {modus === 'dicht' ? (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {klant.tekort > 0 && !klant.opVakantie ? (
              <Knop variant="primair" onClick={() => setModus('inplannen')}>
                <CalendarPlus size={14} strokeWidth={2.2} aria-hidden />
                Inplannen
              </Knop>
            ) : null}
            <Knop onClick={() => setModus('instellen')} aria-label={`Instellingen ${klant.naam}`}>
              <Settings2 size={14} strokeWidth={2.2} aria-hidden />
            </Knop>
          </div>
        ) : null}
      </div>

      {modus === 'inplannen' ? (
        <InplanForm klant={klant} onKlaar={sluitEnVernieuw} onAnnuleer={() => setModus('dicht')} />
      ) : null}
      {modus === 'instellen' ? (
        <InstelForm klant={klant} onKlaar={sluitEnVernieuw} onAnnuleer={() => setModus('dicht')} />
      ) : null}
    </div>
  )
}

function InplanForm({ klant, onKlaar, onAnnuleer }: { klant: PtWeekStatus; onKlaar: () => Promise<void>; onAnnuleer: () => void }) {
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
    const eind = new Date(start.getTime() + SESSIE_DUUR_MIN * 60_000)
    const uitkomst = await haalJson('/api/lifeos/agenda/events', leesNiets, {
      method: 'POST',
      body: JSON.stringify({
        titel: ptSessieTitel(klant.naam, klant.locatie),
        startOp: start.toISOString(),
        eindOp: eind.toISOString(),
        locatie: klant.locatie ? LOCATIE_LABEL[klant.locatie] : undefined,
      }),
    })
    setBezig(false)
    if (!uitkomst.ok) {
      setFout(uitkomst.fout)
      return
    }
    await onKlaar()
  }

  return (
    <div style={{ display: 'grid', gap: 8, paddingTop: 4 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} aria-label="Datum sessie" style={veld} />
        <input type="time" value={tijd} onChange={(e) => setTijd(e.target.value)} aria-label="Tijd sessie" style={veld} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Knop variant="primair" onClick={() => void plan()} disabled={bezig}>
          {bezig ? 'Bezig…' : `Inplannen${klant.locatie ? ` in ${LOCATIE_LABEL[klant.locatie]}` : ''}`}
        </Knop>
        <Knop onClick={onAnnuleer} disabled={bezig}>Annuleren</Knop>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </div>
  )
}

function InstelForm({ klant, onKlaar, onAnnuleer }: { klant: PtWeekStatus; onKlaar: () => Promise<void>; onAnnuleer: () => void }) {
  const [freq, setFreq] = useState<number>(klant.sessiesPerWeek)
  const [locatie, setLocatie] = useState<PtLocatie | ''>(klant.locatie ?? '')
  const [vakantie, setVakantie] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function bewaar(extra: Record<string, unknown>) {
    setBezig(true)
    setFout(null)
    const uitkomst = await haalJson(`/api/lifeos/crm/personen/${klant.id}`, leesNiets, {
      method: 'PATCH',
      body: JSON.stringify({ groep: 'pt_klant', ...extra }),
    })
    setBezig(false)
    if (!uitkomst.ok) {
      setFout(uitkomst.fout)
      return
    }
    await onKlaar()
  }

  return (
    <div style={{ display: 'grid', gap: 10, paddingTop: 4 }}>
      <div style={{ display: 'grid', gap: 4 }}>
        <span style={label}>Sessies per week</span>
        <div style={{ display: 'inline-flex', gap: 4 }}>
          {[1, 2].map((n) => {
            const actief = n === freq
            return (
              <button
                key={n}
                type="button"
                aria-pressed={actief}
                onClick={() => setFreq(n)}
                style={{
                  ...knopjeStijl,
                  border: `1px solid ${actief ? 'var(--brand)' : 'var(--line)'}`,
                  background: actief ? 'var(--brand-soft)' : 'transparent',
                  color: actief ? 'var(--brand)' : 'var(--text-3)',
                }}
              >
                {n}× per week
              </button>
            )
          })}
        </div>
      </div>

      <label style={{ display: 'grid', gap: 4 }}>
        <span style={label}>Locatie</span>
        <select value={locatie} onChange={(e) => setLocatie(e.target.value as PtLocatie | '')} style={veld}>
          <option value="">— kies —</option>
          {PT_LOCATIES.map((l) => (
            <option key={l} value={l}>{LOCATIE_LABEL[l]}</option>
          ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        <span style={label}>Op vakantie t/m (leeg = niet)</span>
        <input type="date" value={vakantie} onChange={(e) => setVakantie(e.target.value)} style={veld} />
      </label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Knop
          variant="primair"
          disabled={bezig}
          onClick={() => void bewaar({ sessiesPerWeek: freq, locatie: locatie || null, vakantieTot: vakantie || null })}
        >
          {bezig ? 'Bezig…' : 'Opslaan'}
        </Knop>
        {klant.opVakantie ? (
          <Knop disabled={bezig} onClick={() => void bewaar({ vakantieTot: null })}>Terug van vakantie</Knop>
        ) : null}
        <Knop onClick={onAnnuleer} disabled={bezig}>Annuleren</Knop>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </div>
  )
}

const veld: CSSProperties = {
  appearance: 'none',
  fontFamily: 'inherit',
  fontSize: 13,
  color: 'var(--text-1)',
  background: 'var(--bg-raised)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '7px 10px',
}
const label: CSSProperties = { fontSize: 11.5, fontWeight: 600, color: 'var(--text-4)' }
const knopjeStijl: CSSProperties = {
  cursor: 'pointer', borderRadius: 8, padding: '6px 12px', fontFamily: 'inherit',
  fontSize: 13, fontWeight: 600, transition: 'color 150ms, background 150ms, border-color 150ms',
}

function standaardDatum(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function Skelet() {
  return (
    <div aria-hidden style={{ display: 'grid', gap: 9 }}>
      <div style={{ height: 34, width: '22%', borderRadius: 6, background: 'var(--bg-raised)' }} />
      <div style={{ height: 13, width: '52%', borderRadius: 4, background: 'var(--bg-raised)' }} />
      <div style={{ height: 40, width: '100%', borderRadius: 8, background: 'var(--bg-raised)' }} />
    </div>
  )
}
