'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LEAD_BRON_LABEL, LEAD_STATUS_LABEL, leadInitialen } from '@/lib/club/leads/model'
import type { ProeflesLes } from '@/lib/club/leads/lessen'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { ContactKnoppen } from './ContactKnoppen'
import { PaneelContact } from './PaneelContact'
import { PaneelGegevens } from './PaneelGegevens'
import { PaneelHistorie } from './PaneelHistorie'
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
  onSluit: () => void
}

// Het zijpaneel van een lead: wie het is, de volgende stap, contact vastleggen,
// gegevens en de historie. Alles inline, geen aparte pagina's.
export function LeadPaneel({ leadId, vestiging, stap, medewerkers, lessen, vandaag, nuIso, onSluit }: LeadPaneelProps) {
  const p = usePaneel(leadId)
  const [melding, setMelding] = useState<string | null>(null)
  const { lead } = p

  return (
    <ZijPaneel titelId="lead-paneel-titel" onSluit={onSluit}>
      {p.laadfout && <p className="club-melding club-melding--fout">{p.laadfout}</p>}
      {!lead && !p.laadfout && <div className="club-skelet" aria-label="Lead laden" />}
      {lead && (
        <>
          <header className="club-leads-paneelkop">
            <span className="club-avatar club-avatar--groot" aria-hidden>
              {leadInitialen(lead.naam)}
            </span>
            <div className="club-leads-paneeltitel">
              <p className="club-boventitel">{LEAD_STATUS_LABEL[lead.status]}</p>
              <h2 id="lead-paneel-titel">{lead.naam}</h2>
              <p className="club-zacht">
                Via {LEAD_BRON_LABEL[lead.bron].toLowerCase()}
                {lead.interesse ? ` · ${lead.interesse}` : ''}
              </p>
            </div>
          </header>
          <div className="club-acties">
            <ContactKnoppen naam={lead.naam} telefoon={lead.telefoon} email={lead.email} klein={false} />
          </div>
          {melding && (
            <div className="club-melding club-melding--ok" role="status">
              <strong>{melding}</strong>
              {lead.lidId && (
                <p>
                  <Link href={clubPad(`/leden/${lead.lidId}`, vestiging)}>Open de ledenkaart</Link>
                </p>
              )}
            </div>
          )}
          {p.fout && (
            <p className="club-melding club-melding--fout" role="alert">
              {p.fout}
            </p>
          )}
          <PaneelStap lead={lead} stap={stap} lessen={lessen} vandaag={vandaag} nu={new Date(nuIso)} bezig={p.bezig} doe={p.doe} onLid={setMelding} />
          <PaneelContact lead={lead} vandaag={vandaag} bezig={p.bezig} doe={p.doe} />
          <PaneelGegevens lead={lead} medewerkers={medewerkers} bezig={p.bezig} doe={p.doe} />
          <PaneelHistorie historie={p.historie} />
        </>
      )}
    </ZijPaneel>
  )
}
