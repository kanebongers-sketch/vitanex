'use client'

import { useState } from 'react'
import { Mail, NotebookPen, Phone } from 'lucide-react'
import type { Lead } from '@/lib/club/leads/model'
import { isDagSleutel, opvolgSnelkeuzes, opvolgStatus, toonDag } from '@/lib/club/leads/regels'
import type { Doe } from './usePaneel'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
import { BEHOUD_DATA } from '@/lib/aiyourgym/taal/woorden/club/behoud-data'
import { LEAD_UITKOMSTEN, isLeadUitkomst, type LeadUitkomst } from '@/lib/club/behoud/uitkomst'

interface PaneelContactProps {
  lead: Lead
  vandaag: string
  bezig: boolean
  doe: Doe
}

// Contact vastleggen in een klik (Gebeld, Gemaild, Notitie, met een optionele
// regel tekst) en meteen de volgende opvolgdatum kiezen. De uitkomst komt uit
// een vaste lijst (migratie 482): verplicht bij bellen, optioneel bij mailen.
export function PaneelContact({ lead, vandaag, bezig, doe }: PaneelContactProps) {
  const [tekst, setTekst] = useState('')
  const [datum, setDatum] = useState('')
  const [uitkomst, setUitkomst] = useState<LeadUitkomst | ''>('')
  const url = `/api/club/leads/${lead.id}`
  const afgesloten = lead.status === 'lid' || lead.status === 'verloren'
  const stand = opvolgStatus(lead, vandaag)
  const taal = useTaal()
  const t = useTekst(LEADS).contact
  const wu = useTekst(BEHOUD_DATA).uitkomst

  async function leg(soort: 'gebeld' | 'gemaild' | 'notitie') {
    const metUitkomst = soort !== 'notitie' && uitkomst !== '' ? { uitkomst } : {}
    const uit = await doe(`${url}/historie`, 'POST', { soort, tekst, ...metUitkomst })
    if (!uit.ok) return
    setTekst('')
    if (soort !== 'notitie') setUitkomst('')
  }

  async function opvolgen(dag: string | null) {
    const uit = await doe(url, 'PATCH', { opvolgenOp: dag })
    if (uit.ok) setDatum('')
  }

  return (
    <section className="club-leads-blok" aria-labelledby="paneel-contact">
      <h3 id="paneel-contact">{t.titel}</h3>
      <label className="club-veld">
        <span>{t.besproken}</span>
        <textarea className="club-invoer" rows={2} maxLength={1000} value={tekst} onChange={(e) => setTekst(e.target.value)} />
      </label>
      <label className="club-veld">
        <span>{wu.leadOptioneel}</span>
        <select className="club-invoer" value={uitkomst} onChange={(e) => setUitkomst(isLeadUitkomst(e.target.value) ? e.target.value : '')}>
          <option value="">{wu.kies}</option>
          {LEAD_UITKOMSTEN.map((u) => <option key={u} value={u}>{wu.lead[u]}</option>)}
        </select>
      </label>
      <div className="club-acties">
        <button type="button" className="club-knop" disabled={bezig || uitkomst === ''} onClick={() => leg('gebeld')}>
          <Phone size={15} aria-hidden /> {t.gebeld}
        </button>
        <button type="button" className="club-knop" disabled={bezig} onClick={() => leg('gemaild')}>
          <Mail size={15} aria-hidden /> {t.gemaild}
        </button>
        <button type="button" className="club-knop" disabled={bezig || tekst.trim() === ''} onClick={() => leg('notitie')}>
          <NotebookPen size={15} aria-hidden /> {t.notitie}
        </button>
      </div>
      {!afgesloten && (
        <div className="club-leads-opvolgen">
          <p className="club-label">
            {t.volgende}{' '}
            <strong className={stand === 'te_laat' ? 'club-leads-telaat' : undefined}>
              {lead.opvolgenOp ? toonDag(lead.opvolgenOp.slice(0, 10), vandaag, taal) : t.nietGepland}
            </strong>
          </p>
          <div className="club-acties">
            {opvolgSnelkeuzes(vandaag, taal).map((s) => (
              <button key={s.label} type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => opvolgen(s.dag)}>
                {s.label}
              </button>
            ))}
            {lead.opvolgenOp && (
              <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={() => opvolgen(null)}>
                {t.geen}
              </button>
            )}
          </div>
          <form
            className="club-leads-datumrij"
            onSubmit={(e) => {
              e.preventDefault()
              if (isDagSleutel(datum)) void opvolgen(datum)
            }}
          >
            <label className="club-veld">
              <span>{t.ofDatum}</span>
              <input type="date" className="club-invoer" min={vandaag} value={datum} onChange={(e) => setDatum(e.target.value)} />
            </label>
            <button type="submit" className="club-knop club-knop--klein" disabled={bezig || !isDagSleutel(datum)}>
              {t.zet}
            </button>
          </form>
        </div>
      )}
    </section>
  )
}
