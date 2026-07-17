'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, MessageSquarePlus, Phone, StickyNote } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { statusDef, type Groep, type HistorieItem } from '@/lib/lifeos/crm/crm'
import type { HistorieStaat } from './useHistorie'

// De status-geschiedenis als tijdlijn (nieuwste eerst) + een veld om een notitie
// toe te voegen. Presentationeel: de staat en de callbacks komen uit de popup,
// die `useHistorie` bezit. Fout ≠ leeg: een laadfout krijgt een eigen staat met
// retry, geen valse "nog geen geschiedenis".

interface HistoriePaneelProps {
  groep: Groep
  staat: HistorieStaat
  actieFout: string | null
  bezig: boolean
  onOpnieuw: () => void
  onNotitie: (notitie: string) => Promise<boolean>
}

export function HistoriePaneel({ groep, staat, actieFout, bezig, onOpnieuw, onNotitie }: HistoriePaneelProps) {
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
            <TijdlijnItem key={item.id} item={item} groep={groep} />
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
          maxLength={5000}
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

function TijdlijnItem({ item, groep }: { item: HistorieItem; groep: Groep }) {
  return (
    <li className="os-crm__tijdlijn-item">
      <span className="os-crm__tijdlijn-punt" aria-hidden="true">
        <SoortIcoon item={item} />
      </span>
      <div className="os-crm__tijdlijn-lijf">
        <p className="os-crm__tijdlijn-tekst">{tekstVan(item, groep)}</p>
        {item.soort !== 'notitie' && item.notitie ? (
          <p className="os-crm__tijdlijn-extra">{item.notitie}</p>
        ) : null}
        <time className="os-crm__tijdlijn-tijd">{tijdVan(item.aangemaaktOp)}</time>
      </div>
    </li>
  )
}

function SoortIcoon({ item }: { item: HistorieItem }) {
  if (item.soort === 'status_wijziging') return <ArrowRight size={13} strokeWidth={2.4} />
  if (item.soort === 'contact_gelegd') return <Phone size={13} strokeWidth={2.4} />
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
    case 'follow_up_gezet':
      return item.naarStatus ? `Follow-up gezet op ${item.naarStatus}` : 'Follow-up gezet'
    case 'notitie':
      return item.notitie ?? 'Notitie'
  }
}

/** '18 jul 14:30'. Compact — dit staat onder een regel tekst. */
function tijdVan(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
