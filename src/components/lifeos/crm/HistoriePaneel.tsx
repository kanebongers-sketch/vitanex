'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, CalendarClock, MessageSquarePlus, Phone, StickyNote } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { statusDef, MAX_NOTITIE, type Groep, type HistorieItem } from '@/lib/lifeos/crm/crm'
import type { HistorieStaat } from './useHistorie'

// De activiteiten-tijdlijn (nieuwste eerst) + een veld om een notitie toe te
// voegen. Presentationeel: de staat en de callbacks komen uit de drawer, die
// `useHistorie` bezit. Elke gebeurtenis krijgt een eigen icoon per soort en een
// relatieve tijd (met de precieze stempel als tooltip). Fout ≠ leeg: een laadfout
// krijgt een eigen staat met retry, geen valse "nog geen geschiedenis".

interface HistoriePaneelProps {
  groep: Groep
  /** "Nu"-snapshot uit de drawer: basis voor de relatieve tijden. */
  vandaag: Date
  staat: HistorieStaat
  actieFout: string | null
  bezig: boolean
  onOpnieuw: () => void
  onNotitie: (notitie: string) => Promise<boolean>
}

export function HistoriePaneel({ groep, vandaag, staat, actieFout, bezig, onOpnieuw, onNotitie }: HistoriePaneelProps) {
  const [notitie, setNotitie] = useState('')

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    const tekst = notitie.trim()
    if (tekst.length === 0 || bezig) return
    const gelukt = await onNotitie(tekst)
    if (gelukt) setNotitie('')
  }

  return (
    <section className="os-crm__sectie">
      <h3 className="os-crm__sectie-kop">Geschiedenis</h3>

      {staat.fase === 'laden' ? (
        <p className="os-crm__hint">Geschiedenis laden…</p>
      ) : staat.fase === 'fout' ? (
        <Foutmelding bericht={staat.bericht} opnieuw={onOpnieuw} />
      ) : staat.items.length === 0 ? (
        <p className="os-crm__hint">Nog niets vastgelegd. Voeg hieronder een notitie toe.</p>
      ) : (
        <ol className="os-crm__tijdlijn">
          {staat.items.map((item) => (
            <TijdlijnItem key={item.id} item={item} groep={groep} vandaag={vandaag} />
          ))}
        </ol>
      )}

      <form className="os-crm__notitie" onSubmit={(e) => void verstuur(e)}>
        <label htmlFor="crm-notitie" className="os-crm__label">
          Notitie of bijzonderheid toevoegen
        </label>
        <textarea
          id="crm-notitie"
          className="os-crm__invoer os-crm__textarea"
          value={notitie}
          onChange={(e) => setNotitie(e.target.value)}
          placeholder="Wat gebeurde er? Wat is de volgende stap?"
          maxLength={MAX_NOTITIE}
          rows={2}
        />
        <div className="os-crm__notitie-actie">
          <Knop type="submit" variant="primair" disabled={notitie.trim().length === 0 || bezig}>
            <MessageSquarePlus size={14} strokeWidth={2.2} aria-hidden="true" />
            {bezig ? 'Bezig…' : 'Toevoegen'}
          </Knop>
        </div>
        {actieFout ? <Foutmelding bericht={actieFout} /> : null}
      </form>
    </section>
  )
}

function TijdlijnItem({ item, groep, vandaag }: { item: HistorieItem; groep: Groep; vandaag: Date }) {
  return (
    <li className="os-crm__tijdlijn-item">
      <span className="os-crm__tijdlijn-punt" aria-hidden="true">
        <SoortIcoon item={item} />
      </span>
      <div className="os-crm__tijdlijn-lijf">
        <p className="os-crm__tijdlijn-tekst">{tekstVan(item, groep)}</p>
        {/* De losse extra-notitie bij een gebeurtenis. NIET bij 'notitie' (die
            staat al in de hoofdtekst) en NIET bij 'follow_up_gezet' (daar ís de
            notitie de dag, die al geformatteerd in de hoofdtekst staat — anders
            zag je de rauwe '2026-07-20' er dubbel onder). */}
        {item.soort !== 'notitie' && item.soort !== 'follow_up_gezet' && item.notitie ? (
          <p className="os-crm__tijdlijn-extra">{item.notitie}</p>
        ) : null}
        <time className="os-crm__tijdlijn-tijd" dateTime={item.aangemaaktOp} title={absoluutVan(item.aangemaaktOp)}>
          {relatieveTijd(item.aangemaaktOp, vandaag)}
        </time>
      </div>
    </li>
  )
}

/** Eén icoon per soort — de vier gebeurtenissen zijn zo in één oogopslag te lezen. */
function SoortIcoon({ item }: { item: HistorieItem }) {
  if (item.soort === 'status_wijziging') return <ArrowRight size={13} strokeWidth={2.4} />
  if (item.soort === 'contact_gelegd') return <Phone size={13} strokeWidth={2.4} />
  if (item.soort === 'follow_up_gezet') return <CalendarClock size={13} strokeWidth={2.4} />
  return <StickyNote size={13} strokeWidth={2.4} />
}

/** Menselijke zin per soort. Statuskeys → labels via de bron (`crm.ts`). */
function tekstVan(item: HistorieItem, groep: Groep): string {
  const label = (key: string | null): string =>
    key === null ? '' : statusDef(groep, key)?.label ?? key

  switch (item.soort) {
    case 'status_wijziging': {
      const naar = label(item.naarStatus)
      if (item.vanStatus === null) return `Gestart in "${naar}"`
      return `${label(item.vanStatus)} → ${naar}`
    }
    case 'contact_gelegd':
      return 'Contact gelegd'
    case 'follow_up_gezet': {
      // De gezette dag staat in `notitie` (zie opslag.ts) — niet in naarStatus,
      // dat is voor dit soort per DB-constraint altijd null.
      const dag = datumLabel(item.notitie)
      return dag === null ? 'Follow-up gezet' : `Follow-up gezet op ${dag}`
    }
    case 'notitie':
      return item.notitie ?? 'Notitie'
  }
}

/** 'vr 20 jul' uit een YYYY-MM-DD-sleutel, of null als het geen geldige dag is. */
function datumLabel(sleutel: string | null): string | null {
  if (sleutel === null || !/^\d{4}-\d{2}-\d{2}$/.test(sleutel)) return null
  const [jaar, maand, dag] = sleutel.split('-').map(Number)
  const d = new Date(jaar, maand - 1, dag)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** 'zojuist', '20 min geleden', 'gisteren', '3 dagen geleden' — en de datum zelf
 *  zodra het langer dan een maand geleden is. Kort; dit staat onder een regel. */
function relatieveTijd(iso: string, nu: Date): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const ms = nu.getTime() - d.getTime()
  if (ms < 60_000) return 'zojuist'

  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min} min geleden`

  const uur = Math.floor(min / 60)
  if (uur < 24) return `${uur} uur geleden`

  const dag = Math.floor(uur / 24)
  if (dag === 1) return 'gisteren'
  if (dag < 7) return `${dag} dagen geleden`
  if (dag < 31) {
    const weken = Math.floor(dag / 7)
    return weken === 1 ? '1 week geleden' : `${weken} weken geleden`
  }
  return absoluutVan(iso)
}

/** '18 jul 2026, 14:30' — de precieze stempel, voor de tooltip en lange perioden. */
function absoluutVan(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
