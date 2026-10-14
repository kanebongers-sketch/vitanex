'use client'

import { ArrowRight, UserRound } from 'lucide-react'
import { LEAD_BRON_LABEL, LEAD_STATUSSEN, LEAD_STATUS_LABEL, VOLGENDE_STAP, leadInitialen, type Lead, type LeadStatus } from '@/lib/club/leads/model'
import { opvolgStatus, proeflesStand, toonDag, toonMoment } from '@/lib/club/leads/regels'

interface LeadKaartProps {
  lead: Lead
  medewerker: string | null
  vandaag: string
  nu: Date
  isBezig: boolean
  onOpen: (id: string) => void
  onVerplaats: (lead: Lead, status: LeadStatus) => void
}

function Opvolging({ lead, vandaag, nu }: { lead: Lead; vandaag: string; nu: Date }) {
  const stand = proeflesStand(lead, nu)
  if (stand !== 'geen' && lead.proeflesOp) {
    const klasse = stand === 'uitkomst_nodig' ? 'club-chip--let-op' : 'club-chip--merk'
    return <span className={`club-chip ${klasse}`}>{stand === 'uitkomst_nodig' ? 'Uitkomst invullen' : toonMoment(lead.proeflesOp)}</span>
  }
  const opvolg = opvolgStatus(lead, vandaag)
  if (opvolg === 'geen' || !lead.opvolgenOp) return null
  const dag = toonDag(lead.opvolgenOp.slice(0, 10), vandaag)
  if (opvolg === 'te_laat') return <span className="club-chip club-chip--let-op">Te laat, {dag}</span>
  return <span className={`club-chip ${opvolg === 'vandaag' ? 'club-chip--info' : 'club-chip--uit'}`}>Bellen {dag}</span>
}

// Een kaart in de pijplijn: wie, waar vandaan, wat is de volgende stap. Slepen
// mag, maar de keuzelijst onderaan doet hetzelfde met toetsenbord of muis.
export function LeadKaart({ lead, medewerker, vandaag, nu, isBezig, onOpen, onVerplaats }: LeadKaartProps) {
  const keuzeId = `verplaats-${lead.id}`
  return (
    <article
      className="club-leads-kaart"
      draggable
      aria-busy={isBezig}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', lead.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      <header className="club-leads-kaartkop">
        <span className="club-avatar" aria-hidden>
          {leadInitialen(lead.naam)}
        </span>
        <div className="club-rij-hoofd">
          <button type="button" className="club-leads-naamknop club-rij-titel" onClick={() => onOpen(lead.id)}>
            {lead.naam}
          </button>
          <span className="club-rij-sub">
            {LEAD_BRON_LABEL[lead.bron]}
            {lead.interesse ? ` · ${lead.interesse}` : ''}
          </span>
        </div>
      </header>
      <div className="club-leads-kaartinfo">
        <Opvolging lead={lead} vandaag={vandaag} nu={nu} />
        {medewerker && (
          <span className="club-leads-mw">
            <UserRound size={13} aria-hidden /> {medewerker}
          </span>
        )}
      </div>
      {lead.status === 'verloren' && lead.verlorenReden ? (
        <p className="club-leads-stap club-zacht">{lead.verlorenReden}</p>
      ) : (
        <p className="club-leads-stap">
          <ArrowRight size={13} aria-hidden /> {VOLGENDE_STAP[lead.status]}
        </p>
      )}
      <div className="club-leads-verplaats">
        <label htmlFor={keuzeId} className="club-sr">
          Verplaats {lead.naam} naar
        </label>
        <select
          id={keuzeId}
          className="club-leads-keuze"
          value={lead.status}
          disabled={isBezig || lead.status === 'lid'}
          onChange={(e) => {
            const status = LEAD_STATUSSEN.find((s) => s === e.target.value)
            if (status) onVerplaats(lead, status)
          }}
        >
          {LEAD_STATUSSEN.map((s) => (
            <option key={s} value={s}>
              {s === lead.status ? `Staat in: ${LEAD_STATUS_LABEL[s]}` : `Naar ${LEAD_STATUS_LABEL[s]}`}
            </option>
          ))}
        </select>
      </div>
    </article>
  )
}
