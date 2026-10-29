'use client'

import { useState } from 'react'
import Link from 'next/link'
import { leadInitialen } from '@/lib/club/leads/model'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
import type { ProeflesLes } from '@/lib/club/leads/lessen'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { lidKaartPad } from '@/lib/club/leden/hub/tabs'
import { ContactKnoppen } from './ContactKnoppen'
import { PaneelContact } from './PaneelContact'
import { PaneelGegevens } from './PaneelGegevens'
import { PaneelHistorie } from './PaneelHistorie'
import { PaneelPrivacy } from './PaneelPrivacy'
import { PaneelStap } from './PaneelStap'
import { ZijPaneel } from './ZijPaneel'
import { usePaneel } from './usePaneel'
import type { PaneelStap as Stap } from '@/lib/club/leads/model'

interface LeadPaneelProps {
  leadId: string
  vestiging: Vestiging
  stap: Stap | null
  medewerkers: { id: string; naam: string }[]
  lessen: ProeflesLes[]
  vandaag: string
  nuIso: string
  /** Kane, eigenaar of clubmanager: mag een lead wissen (AVG). */
  magWissen: boolean
  onSluit: () => void
}

// Het zijpaneel van een lead: wie het is, de volgende stap, contact vastleggen,
// gegevens, de historie en privacy (AVG). Alles inline, geen aparte pagina's.
// Een gewiste lead toont alleen nog wat er anoniem over is, zonder acties.
export function LeadPaneel({ leadId, vestiging, stap, medewerkers, lessen, vandaag, nuIso, magWissen, onSluit }: LeadPaneelProps) {
  const p = usePaneel(leadId)
  const tekst = useTekst(LEADS)
  const [melding, setMelding] = useState<string | null>(null)
  const { lead } = p

  return (
    <ZijPaneel titelId="lead-paneel-titel" onSluit={onSluit}>
      {p.laadfout && <p className="club-melding club-melding--fout">{p.laadfout}</p>}
      {!lead && !p.laadfout && <div className="club-skelet" aria-label={tekst.paneel.laden} />}
      {lead && (
        <>
          <header className="club-leads-paneelkop">
            <span className="club-avatar club-avatar--groot" aria-hidden>
              {leadInitialen(lead.naam)}
            </span>
            <div className="club-leads-paneeltitel">
              <p className="club-boventitel">{tekst.status[lead.status]}</p>
              <h2 id="lead-paneel-titel">{lead.naam}</h2>
              <p className="club-zacht">
                {tekst.paneel.via(tekst.bron[lead.bron].toLowerCase())}
                {lead.interesse ? ` · ${lead.interesse}` : ''}
              </p>
            </div>
          </header>
          {!lead.geanonimiseerdOp && (
            <div className="club-acties">
              <ContactKnoppen naam={lead.naam} telefoon={lead.telefoon} email={lead.email} klein={false} />
            </div>
          )}
          {melding && (
            <div className="club-melding club-melding--ok" role="status">
              <strong>{melding}</strong>
              {lead.lidId && (
                <p>
                  <Link href={lidKaartPad(lead.lidId, vestiging)}>{tekst.paneel.openKaart}</Link>
                </p>
              )}
            </div>
          )}
          {p.fout && (
            <p className="club-melding club-melding--fout" role="alert">
              {p.fout}
            </p>
          )}
          {!lead.geanonimiseerdOp && (
            <>
              <PaneelStap lead={lead} stap={stap} lessen={lessen} vandaag={vandaag} nu={new Date(nuIso)} bezig={p.bezig} doe={p.doe} onLid={setMelding} />
              <PaneelContact lead={lead} vandaag={vandaag} bezig={p.bezig} doe={p.doe} />
              <PaneelGegevens lead={lead} medewerkers={medewerkers} bezig={p.bezig} doe={p.doe} />
              <PaneelHistorie historie={p.historie} />
            </>
          )}
          <PaneelPrivacy lead={lead} magWissen={magWissen} bezig={p.bezig} doe={p.doe} />
        </>
      )}
    </ZijPaneel>
  )
}
