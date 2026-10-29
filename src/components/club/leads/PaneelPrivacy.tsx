'use client'

import { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import type { Lead } from '@/lib/club/leads/model'
import { leadNaamKlopt, wisBlokkadeSoort } from '@/lib/club/leads/avg'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
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
  const tekst = useTekst(LEADS)
  const t = tekst.privacy
  const soort = wisBlokkadeSoort(lead)
  const blokkade = soort ? tekst.blokkade[soort] : null
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
        <h3 id={kopId}>{t.titel}</h3>
        {lead.geanonimiseerdOp ? <span className="club-chip club-chip--uit">{t.gewist}</span> : null}
      </div>

      {lead.geanonimiseerdOp ? (
        <p className="club-hint">{t.gewistUitleg}</p>
      ) : (
        <>
          <p className="club-hint">{t.recht}</p>
          <div className="club-avg-knoppen">
            <a className="club-knop" href={`/api/club/leads/${encodeURIComponent(lead.id)}/gegevens`} download>
              <Download size={16} aria-hidden /> {t.downloaden}
            </a>
          </div>
        </>
      )}

      {magWissen && !lead.geanonimiseerdOp && blokkade ? <p className="club-hint">{blokkade}</p> : null}

      {magWissen && !blokkade ? (
        open ? (
          <div className="club-avg-bevestig">
            <p>
              <strong>{t.wordtGewist(lead.naam)}</strong> {t.wisUitleg}
            </p>
            <p className="club-hint">{t.tip}</p>
            <label className="club-veld">
              <span>{t.typNaam}</span>
              <input className="club-invoer" value={invoer} onChange={(e) => setInvoer(e.target.value)} placeholder={lead.naam} autoComplete="off" spellCheck={false} />
            </label>
            <div className="club-avg-knoppen">
              <button type="button" className="club-knop club-knop--gevaar" disabled={!klopt || bezig} onClick={() => void wis()}>
                <Trash2 size={16} aria-hidden /> {t.nuWissen}
              </button>
              <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => { setOpen(false); setInvoer('') }}>
                {t.annuleren}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="club-knop club-knop--gevaar club-avg-start" onClick={() => setOpen(true)}>
            <Trash2 size={16} aria-hidden /> {t.wissen}
          </button>
        )
      ) : null}
    </section>
  )
}
