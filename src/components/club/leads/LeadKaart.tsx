'use client'

import { ArrowRight, UserRound } from 'lucide-react'
import { LEAD_STATUSSEN, leadInitialen, type Lead, type LeadStatus } from '@/lib/club/leads/model'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
import { opvolgStatus, proeflesStand, toonDag, toonMoment } from '@/lib/club/leads/regels'

interface LeadKaartProps {
  lead: Lead
  medewerker: string | null
  vandaag: string
  nu: Date
  isBezig: boolean
  onOpen: (id: string) => void
  onVerplaats: (lead: Lead, status: LeadStatus) => void
  /** Rollen v2, alleen zien: geen knoppen die iets wijzigen (kanBewerken). */
  alleenLezen?: boolean
}

function Opvolging({ lead, vandaag, nu }: { lead: Lead; vandaag: string; nu: Date }) {
  const taal = useTaal()
  const t = useTekst(LEADS).kaart
  const stand = proeflesStand(lead, nu)
  if (stand !== 'geen' && lead.proeflesOp) {
    const klasse = stand === 'uitkomst_nodig' ? 'club-chip--let-op' : 'club-chip--merk'
    return <span className={`club-chip ${klasse}`}>{stand === 'uitkomst_nodig' ? t.uitkomstInvullen : toonMoment(lead.proeflesOp, taal)}</span>
  }
  const opvolg = opvolgStatus(lead, vandaag)
  if (opvolg === 'geen' || !lead.opvolgenOp) return null
  const dag = toonDag(lead.opvolgenOp.slice(0, 10), vandaag, taal)
  if (opvolg === 'te_laat') return <span className="club-chip club-chip--let-op">{t.teLaat(dag)}</span>
  return <span className={`club-chip ${opvolg === 'vandaag' ? 'club-chip--info' : 'club-chip--uit'}`}>{t.bellen(dag)}</span>
}

// Een kaart in de pijplijn: wie, waar vandaan, wat is de volgende stap. Slepen
// mag, maar de keuzelijst onderaan doet hetzelfde met toetsenbord of muis.
export function LeadKaart({ lead, medewerker, vandaag, nu, isBezig, onOpen, onVerplaats, alleenLezen = false }: LeadKaartProps) {
  const keuzeId = `verplaats-${lead.id}`
  const tekst = useTekst(LEADS)
  return (
    <article
      className="club-leads-kaart"
      draggable={!alleenLezen}
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
            {tekst.bron[lead.bron]}
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
          <ArrowRight size={13} aria-hidden /> {tekst.volgendeStap[lead.status]}
        </p>
      )}
      {!alleenLezen && (
      <div className="club-leads-verplaats">
        <label htmlFor={keuzeId} className="club-sr">
          {tekst.kaart.verplaats(lead.naam)}
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
              {s === lead.status ? tekst.kaart.staatIn(tekst.status[s]) : tekst.kaart.naar(tekst.status[s])}
            </option>
          ))}
        </select>
      </div>
      )}
    </article>
  )
}
