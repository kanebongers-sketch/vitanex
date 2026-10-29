'use client'

import { useState } from 'react'
import type { Lead } from '@/lib/club/leads/model'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
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

function standaardStap(lead: Lead): Stap | null {
  if (lead.status === 'nieuw' || lead.status === 'contact') return 'proefles'
  if (lead.status === 'proefles_geweest') return 'lid'
  return null
}

function Proefles({ lead, nu, bezig, doe }: Pick<PaneelStapProps, 'lead' | 'nu' | 'bezig' | 'doe'>) {
  const taal = useTaal()
  const t = useTekst(LEADS).stap
  if (!lead.proeflesOp) return null
  const voorbij = proeflesStand(lead, nu) === 'uitkomst_nodig'
  const url = `/api/club/leads/${lead.id}/proefles`
  return (
    <div className="club-leads-proefles" data-voorbij={voorbij || undefined}>
      <p>
        {t.proefles} <strong>{toonMoment(lead.proeflesOp, taal)}</strong>
      </p>
      {voorbij && (
        <div className="club-acties">
          <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => doe(url, 'POST', { actie: 'geweest' })}>
            {t.geweest}
          </button>
          <button type="button" className="club-knop" disabled={bezig} onClick={() => doe(url, 'POST', { actie: 'niet_gekomen' })}>
            {t.nietGekomen}
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
  const tekst = useTekst(LEADS)
  const t = tekst.stap

  if (lead.status === 'lid') {
    return (
      <section className="club-leads-blok club-leads-volgende" aria-label={t.label}>
        <h3>{t.lid}</h3>
        <p className="club-hint">{tekst.volgendeStap.lid}.</p>
      </section>
    )
  }
  if (lead.status === 'verloren') {
    return (
      <section className="club-leads-blok club-leads-volgende" aria-label={t.label}>
        <h3>{t.verloren}</h3>
        <p className="club-hint">{t.reden(lead.verlorenReden ?? t.onbekend)}</p>
        <button type="button" className="club-knop" disabled={bezig} onClick={() => doe(`/api/club/leads/${lead.id}`, 'PATCH', { status: 'contact' })}>
          {t.terugNaarContact}
        </button>
      </section>
    )
  }

  const keuzes: Stap[] = ['proefles', 'lid', 'verloren']
  return (
    <section className="club-leads-blok club-leads-volgende" aria-labelledby="paneel-stap">
      <h3 id="paneel-stap">{t.volgende(tekst.volgendeStap[lead.status].toLowerCase())}</h3>
      {lead.status === 'proefles' && <Proefles lead={lead} nu={nu} bezig={bezig} doe={doe} />}
      <div className="club-segment" role="group" aria-label={t.kies}>
        {keuzes.map((k) => (
          <button key={k} type="button" aria-pressed={gekozen === k} onClick={() => setGekozen(gekozen === k ? null : k)}>
            {k === 'proefles' && lead.status === 'proefles' ? t.verzetten : t.keuze[k]}
          </button>
        ))}
      </div>
      {gekozen === 'proefles' && <ProeflesKiezer lead={lead} lessen={lessen} vandaag={vandaag} bezig={bezig} doe={doe} onKlaar={sluitStap} />}
      {gekozen === 'lid' && <OmzettenBlok lead={lead} bezig={bezig} doe={doe} onGelukt={onLid} />}
      {gekozen === 'verloren' && <VerlorenBlok lead={lead} bezig={bezig} doe={doe} onKlaar={sluitStap} />}
    </section>
  )
}
