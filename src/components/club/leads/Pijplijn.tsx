'use client'

import { useState } from 'react'
import { LEAD_STATUSSEN, LEAD_STATUS_LABEL, type Lead, type LeadStatus } from '@/lib/club/leads/model'
import { LeadKaart } from './LeadKaart'

interface PijplijnProps {
  leads: Lead[]
  medewerkers: Map<string, string>
  vandaag: string
  nu: Date
  bezig: string | null
  onOpen: (id: string) => void
  onVerplaats: (lead: Lead, status: LeadStatus) => void
}

// Zes kolommen, van eerste contact tot lid of verloren. Op de telefoon schuiven
// de kolommen horizontaal; op de pc staan ze naast elkaar over de volle breedte.
export function Pijplijn({ leads, medewerkers, vandaag, nu, bezig, onOpen, onVerplaats }: PijplijnProps) {
  const [doel, setDoel] = useState<LeadStatus | null>(null)

  function zetNeer(status: LeadStatus, id: string) {
    setDoel(null)
    const lead = leads.find((l) => l.id === id)
    if (lead) onVerplaats(lead, status)
  }

  return (
    <section className="club-leads-pijplijn" aria-label="Pijplijn">
      {LEAD_STATUSSEN.map((status) => {
        const inKolom = leads.filter((l) => l.status === status)
        const kopId = `kolom-${status}`
        return (
          <section
            key={status}
            className="club-leads-kolom"
            data-status={status}
            data-doel={doel === status || undefined}
            aria-labelledby={kopId}
            onDragOver={(e) => {
              e.preventDefault()
              if (doel !== status) setDoel(status)
            }}
            onDragLeave={(e) => {
              if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))) setDoel(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              zetNeer(status, e.dataTransfer.getData('text/plain'))
            }}
          >
            <h3 id={kopId} className="club-leads-kolomkop">
              <span>{LEAD_STATUS_LABEL[status]}</span>
              <span className="club-leads-aantal" aria-label={`${inKolom.length} leads`}>
                {inKolom.length}
              </span>
            </h3>
            {inKolom.length === 0 ? (
              <p className="club-leads-kolomleeg">Leeg</p>
            ) : (
              <div className="club-leads-kaarten">
                {inKolom.map((lead) => (
                  <LeadKaart
                    key={lead.id}
                    lead={lead}
                    medewerker={lead.medewerkerId ? (medewerkers.get(lead.medewerkerId) ?? null) : null}
                    vandaag={vandaag}
                    nu={nu}
                    isBezig={bezig === lead.id}
                    onOpen={onOpen}
                    onVerplaats={onVerplaats}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </section>
  )
}
