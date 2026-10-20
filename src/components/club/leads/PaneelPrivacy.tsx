'use client'

import { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import type { Lead } from '@/lib/club/leads/model'
import { leadNaamKlopt, wisBlokkade } from '@/lib/club/leads/avg'
import type { Doe } from './usePaneel'
import '@/components/club/leden/avg.css'

// "Privacy (AVG)" in het zijpaneel van een lead. Inzage: alles wat Club over de
// belangstellende bewaart als JSON-bestand. Wissen (Kane, eigenaar, clubmanager):
// direct en onomkeerbaar, bevestigen door de naam te typen. Een lead die lid
// werd wis je via de ledenkaart.

interface PaneelPrivacyProps {
  lead: Lead
  magWissen: boolean
  bezig: boolean
  doe: Doe
}

export function PaneelPrivacy({ lead, magWissen, bezig, doe }: PaneelPrivacyProps) {
  const [open, setOpen] = useState(false)
  const [invoer, setInvoer] = useState('')
  const klopt = leadNaamKlopt(invoer, lead.naam)
  const blokkade = wisBlokkade(lead)
  const kopId = `lead-avg-kop-${lead.id}`

  async function wis() {
    if (!klopt) return
    const uit = await doe(`/api/club/leads/${encodeURIComponent(lead.id)}/wissen`, 'POST', { bevestiging: invoer })
    if (uit.ok) {
      setOpen(false)
      setInvoer('')
    }
  }

  return (
    <section className="club-leads-blok club-avg" aria-labelledby={kopId}>
      <div className="club-sectiekop">
        <h3 id={kopId}>Privacy (AVG)</h3>
        {lead.geanonimiseerdOp ? <span className="club-chip club-chip--uit">Gewist</span> : null}
      </div>

      {lead.geanonimiseerdOp ? (
        <p className="club-hint">Naam, contactgegevens en notities zijn gewist. Status, bron en datums tellen nog anoniem mee in de cijfers.</p>
      ) : (
        <>
          <p className="club-hint">Een belangstellende mag altijd vragen welke gegevens de sportschool bewaart, en vragen om ze te wissen.</p>
          <div className="club-avg-knoppen">
            <a className="club-knop" href={`/api/club/leads/${encodeURIComponent(lead.id)}/gegevens`} download>
              <Download size={16} aria-hidden /> Gegevens downloaden
            </a>
          </div>
        </>
      )}

      {magWissen && !lead.geanonimiseerdOp && blokkade ? <p className="club-hint">{blokkade}</p> : null}

      {magWissen && !blokkade ? (
        open ? (
          <div className="club-avg-bevestig">
            <p>
              <strong>De gegevens van {lead.naam} worden nu gewist.</strong> Naam, e-mail, telefoon, interesse, contactmomenten en notities bij afspraken gaan
              direct weg. Dit is niet terug te draaien. Status, bron en datums blijven alleen anoniem meetellen in de cijfers.
            </p>
            <p className="club-hint">Tip: download eerst de gegevens als de belangstellende daarom vraagt.</p>
            <label className="club-veld">
              <span>Typ de naam ter bevestiging</span>
              <input className="club-invoer" value={invoer} onChange={(e) => setInvoer(e.target.value)} placeholder={lead.naam} autoComplete="off" spellCheck={false} />
            </label>
            <div className="club-avg-knoppen">
              <button type="button" className="club-knop club-knop--gevaar" disabled={!klopt || bezig} onClick={() => void wis()}>
                <Trash2 size={16} aria-hidden /> Nu definitief wissen
              </button>
              <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => { setOpen(false); setInvoer('') }}>
                Annuleren
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="club-knop club-knop--gevaar club-avg-start" onClick={() => setOpen(true)}>
            <Trash2 size={16} aria-hidden /> Lead wissen (AVG)
          </button>
        )
      ) : null}
    </section>
  )
}
