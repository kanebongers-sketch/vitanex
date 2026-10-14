'use client'

import { useState } from 'react'
import { Mail, NotebookPen, Phone } from 'lucide-react'
import type { Lead } from '@/lib/club/leads/model'
import { isDagSleutel, opvolgSnelkeuzes, opvolgStatus, toonDag } from '@/lib/club/leads/regels'
import type { Doe } from './usePaneel'

interface PaneelContactProps {
  lead: Lead
  vandaag: string
  bezig: boolean
  doe: Doe
}

// Contact vastleggen in een klik (Gebeld, Gemaild, Notitie, met een optionele
// regel tekst) en meteen de volgende opvolgdatum kiezen.
export function PaneelContact({ lead, vandaag, bezig, doe }: PaneelContactProps) {
  const [tekst, setTekst] = useState('')
  const [datum, setDatum] = useState('')
  const url = `/api/club/leads/${lead.id}`
  const afgesloten = lead.status === 'lid' || lead.status === 'verloren'
  const stand = opvolgStatus(lead, vandaag)

  async function leg(soort: 'gebeld' | 'gemaild' | 'notitie') {
    const uit = await doe(`${url}/historie`, 'POST', { soort, tekst })
    if (uit.ok) setTekst('')
  }

  async function opvolgen(dag: string | null) {
    const uit = await doe(url, 'PATCH', { opvolgenOp: dag })
    if (uit.ok) setDatum('')
  }

  return (
    <section className="club-leads-blok" aria-labelledby="paneel-contact">
      <h3 id="paneel-contact">Contact</h3>
      <label className="club-veld">
        <span>Wat is er besproken? (optioneel bij bellen of mailen)</span>
        <textarea className="club-invoer" rows={2} maxLength={1000} value={tekst} onChange={(e) => setTekst(e.target.value)} />
      </label>
      <div className="club-acties">
        <button type="button" className="club-knop" disabled={bezig} onClick={() => leg('gebeld')}>
          <Phone size={15} aria-hidden /> Gebeld
        </button>
        <button type="button" className="club-knop" disabled={bezig} onClick={() => leg('gemaild')}>
          <Mail size={15} aria-hidden /> Gemaild
        </button>
        <button type="button" className="club-knop" disabled={bezig || tekst.trim() === ''} onClick={() => leg('notitie')}>
          <NotebookPen size={15} aria-hidden /> Notitie
        </button>
      </div>
      {!afgesloten && (
        <div className="club-leads-opvolgen">
          <p className="club-label">
            Volgende opvolging:{' '}
            <strong className={stand === 'te_laat' ? 'club-leads-telaat' : undefined}>
              {lead.opvolgenOp ? toonDag(lead.opvolgenOp.slice(0, 10), vandaag) : 'niet gepland'}
            </strong>
          </p>
          <div className="club-acties">
            {opvolgSnelkeuzes(vandaag).map((s) => (
              <button key={s.label} type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => opvolgen(s.dag)}>
                {s.label}
              </button>
            ))}
            {lead.opvolgenOp && (
              <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={() => opvolgen(null)}>
                Geen
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
              <span>Of kies een datum</span>
              <input type="date" className="club-invoer" min={vandaag} value={datum} onChange={(e) => setDatum(e.target.value)} />
            </label>
            <button type="submit" className="club-knop club-knop--klein" disabled={bezig || !isDagSleutel(datum)}>
              Zet
            </button>
          </form>
        </div>
      )}
    </section>
  )
}
