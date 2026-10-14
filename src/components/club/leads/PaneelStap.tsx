'use client'

import { useState } from 'react'
import { VOLGENDE_STAP, type Lead } from '@/lib/club/leads/model'
import type { ProeflesLes } from '@/lib/club/leads/lessen'
import { proeflesStand, toonMoment } from '@/lib/club/leads/regels'
import { OmzettenBlok } from './OmzettenBlok'
import { ProeflesKiezer } from './ProeflesKiezer'
import { VerlorenBlok } from './VerlorenBlok'
import type { PaneelStap as Stap } from '@/lib/club/leads/model'
import type { Doe } from './usePaneel'

interface PaneelStapProps {
  lead: Lead
  stap: Stap | null
  lessen: ProeflesLes[]
  vandaag: string
  nu: Date
  bezig: boolean
  doe: Doe
  onLid: (melding: string) => void
}

const STAP_LABEL: Record<Stap, string> = { proefles: 'Proefles inplannen', lid: 'Lid maken', verloren: 'Verloren' }

function standaardStap(lead: Lead): Stap | null {
  if (lead.status === 'nieuw' || lead.status === 'contact') return 'proefles'
  if (lead.status === 'proefles_geweest') return 'lid'
  return null
}

function Proefles({ lead, nu, bezig, doe }: Pick<PaneelStapProps, 'lead' | 'nu' | 'bezig' | 'doe'>) {
  if (!lead.proeflesOp) return null
  const voorbij = proeflesStand(lead, nu) === 'uitkomst_nodig'
  const url = `/api/club/leads/${lead.id}/proefles`
  return (
    <div className="club-leads-proefles" data-voorbij={voorbij || undefined}>
      <p>
        Proefles <strong>{toonMoment(lead.proeflesOp)}</strong>
      </p>
      {voorbij && (
        <div className="club-acties">
          <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => doe(url, 'POST', { actie: 'geweest' })}>
            Is geweest
          </button>
          <button type="button" className="club-knop" disabled={bezig} onClick={() => doe(url, 'POST', { actie: 'niet_gekomen' })}>
            Niet gekomen
          </button>
        </div>
      )}
    </div>
  )
}

// De volgende stap, prominent bovenin het paneel. Per status de logische keuzes;
// de stap uit de URL (bv. na kiezen in de pijplijn) staat meteen open.
export function PaneelStap({ lead, stap, lessen, vandaag, nu, bezig, doe, onLid }: PaneelStapProps) {
  const [gekozen, setGekozen] = useState<Stap | null>(stap ?? standaardStap(lead))
  const sluitStap = () => setGekozen(null)

  if (lead.status === 'lid') {
    return (
      <section className="club-leads-blok club-leads-volgende" aria-label="Volgende stap">
        <h3>Lid</h3>
        <p className="club-hint">{VOLGENDE_STAP.lid}.</p>
      </section>
    )
  }
  if (lead.status === 'verloren') {
    return (
      <section className="club-leads-blok club-leads-volgende" aria-label="Volgende stap">
        <h3>Verloren</h3>
        <p className="club-hint">Reden: {lead.verlorenReden ?? 'onbekend'}</p>
        <button type="button" className="club-knop" disabled={bezig} onClick={() => doe(`/api/club/leads/${lead.id}`, 'PATCH', { status: 'contact' })}>
          Terug naar Contact
        </button>
      </section>
    )
  }

  const keuzes: Stap[] = ['proefles', 'lid', 'verloren']
  return (
    <section className="club-leads-blok club-leads-volgende" aria-labelledby="paneel-stap">
      <h3 id="paneel-stap">Volgende stap: {VOLGENDE_STAP[lead.status].toLowerCase()}</h3>
      {lead.status === 'proefles' && <Proefles lead={lead} nu={nu} bezig={bezig} doe={doe} />}
      <div className="club-segment" role="group" aria-label="Kies een stap">
        {keuzes.map((k) => (
          <button key={k} type="button" aria-pressed={gekozen === k} onClick={() => setGekozen(gekozen === k ? null : k)}>
            {k === 'proefles' && lead.status === 'proefles' ? 'Verzetten' : STAP_LABEL[k]}
          </button>
        ))}
      </div>
      {gekozen === 'proefles' && <ProeflesKiezer lead={lead} lessen={lessen} vandaag={vandaag} bezig={bezig} doe={doe} onKlaar={sluitStap} />}
      {gekozen === 'lid' && <OmzettenBlok lead={lead} bezig={bezig} doe={doe} onGelukt={onLid} />}
      {gekozen === 'verloren' && <VerlorenBlok lead={lead} bezig={bezig} doe={doe} onKlaar={sluitStap} />}
    </section>
  )
}
